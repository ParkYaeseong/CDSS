# core_api/views.py

# 1. 라이브러리 임포트 정리
import requests
import logging
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

# 2. 다른 앱의 컴포넌트 임포트 (오류 처리 추가)
try:
    from .openemr_client import get_patients, create_patient, _make_openemr_api_request
    OPENEMR_AVAILABLE = True
except ImportError as e:
    print(f"OpenEMR client import failed: {e}")
    OPENEMR_AVAILABLE = False

from .serializers import UserSerializer

# 로거 설정
logger = logging.getLogger(__name__)


# 3. 헬퍼 함수 및 API 뷰 클래스 정의

# --- OpenELIS 연동을 위한 도우미 함수 ---
def get_openelis_patient_observations(patient_id_in_elis):
    """OpenELIS FHIR API를 호출하여 특정 환자의 Observation 리소스를 가져옵니다."""
    OPENELIS_FHIR_BASE_URL = getattr(settings, 'OPENELIS_FHIR_BASE_URL', '')
    if not OPENELIS_FHIR_BASE_URL:
        logger.error("OPENELIS_FHIR_BASE_URL is not configured in settings.")
        return None
        
    SSL_VERIFY = getattr(settings, 'SSL_VERIFY', False)
    
    if not patient_id_in_elis:
        logger.warning("get_openelis_patient_observations called without patient_id_in_elis.")
        return None
    
    search_url = f"{OPENELIS_FHIR_BASE_URL}/Observation?subject=Patient/{patient_id_in_elis}"
    headers = {'Accept': 'application/fhir+json'}
    
    logger.info(f"Requesting OpenELIS FHIR API: {search_url}")
    try:
        response = requests.get(search_url, headers=headers, verify=SSL_VERIFY, timeout=15)
        response.raise_for_status()
        fhir_bundle = response.json()
        observations = [entry["resource"] for entry in fhir_bundle.get("entry", []) if entry.get("resource", {}).get("resourceType") == "Observation"]
        logger.info(f"Found {len(observations)} Observation(s) for patient {patient_id_in_elis}.")
        return observations
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenELIS FHIR API request error: {e}", exc_info=True)
        return None


# --- API 뷰 클래스들 ---

class UserStatusView(APIView):
    """요청에 포함된 JWT 토큰을 기반으로 현재 로그인된 사용자의 정보를 반환합니다."""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        tags=["인증 API"], 
        operation_description="현재 로그인된 사용자의 정보를 반환합니다.", 
        responses={200: UserSerializer}
    )
    def get(self, request, format=None):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OpenELISLabResultsView(APIView):
    """특정 환자의 OpenELIS 검사 결과를 조회합니다."""
    permission_classes = [permissions.AllowAny] # 필요에 따라 IsAuthenticated로 변경

    @swagger_auto_schema(
        tags=["OpenELIS 연동 API"],
        operation_description="특정 환자의 OpenELIS 검사 결과를 조회합니다.",
        manual_parameters=[
            openapi.Parameter(
                'patient_id_in_elis',
                openapi.IN_PATH,
                description="OpenELIS에서의 환자 ID",
                type=openapi.TYPE_STRING,
                required=True
            )
        ],
        responses={
            200: openapi.Response(
                description="검사 결과 조회 성공",
                schema=openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(type=openapi.TYPE_OBJECT)
                )
            ),
            500: openapi.Response(description="서버 오류")
        }
    )
    def get(self, request, patient_id_in_elis, format=None):
        observations = get_openelis_patient_observations(patient_id_in_elis)
        if observations is None:
            return Response(
                {"error": "OpenELIS에서 결과를 가져오는 중 오류 발생"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        return Response(observations, status=status.HTTP_200_OK)


class OpenEMRPatientAPIView(APIView):
    """OpenEMR 환자 목록 조회(GET) 및 Django DB 환자 생성(POST)을 위한 API"""
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        tags=["OpenEMR 연동 API"], 
        operation_description="OpenEMR의 환자 목록을 조회합니다.",
        manual_parameters=[
            openapi.Parameter('fname', openapi.IN_QUERY, description="이름", type=openapi.TYPE_STRING),
            openapi.Parameter('lname', openapi.IN_QUERY, description="성", type=openapi.TYPE_STRING),
        ],
        responses={
            200: openapi.Response(
                description="환자 목록 조회 성공",
                schema=openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'id': openapi.Schema(type=openapi.TYPE_STRING),
                            'firstName': openapi.Schema(type=openapi.TYPE_STRING),
                            'lastName': openapi.Schema(type=openapi.TYPE_STRING),
                            'gender': openapi.Schema(type=openapi.TYPE_STRING),
                            'birthDate': openapi.Schema(type=openapi.TYPE_STRING),
                        }
                    )
                )
            ),
            500: openapi.Response(description="서버 오류"),
            503: openapi.Response(description="OpenEMR 서비스를 사용할 수 없음")
        }
    )
    def get(self, request, format=None):
        if not OPENEMR_AVAILABLE:
            return Response(
                {"error": "OpenEMR 클라이언트를 사용할 수 없습니다."}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        try:
            # OpenEMR 클라이언트 함수 사용
            patients = get_patients(params=request.query_params.dict())
            
            # 오류 응답인지 확인
            if isinstance(patients, dict) and 'error' in patients:
                return Response(patients, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response(patients, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching patient list from OpenEMR: {e}", exc_info=True)
            return Response(
                {"error": "Failed to fetch data from OpenEMR.", "detail": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @swagger_auto_schema(
        tags=["환자 관리 API"], 
        operation_description="Django DB에 새 환자를 생성하고, 이 환자에 대한 Omics 분석 요청을 함께 생성합니다.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'fname': openapi.Schema(type=openapi.TYPE_STRING, description='이름'),
                'lname': openapi.Schema(type=openapi.TYPE_STRING, description='성'),
                'DOB': openapi.Schema(type=openapi.TYPE_STRING, description='생년월일 (YYYY-MM-DD)'),
                'sex': openapi.Schema(type=openapi.TYPE_STRING, description='성별'),
                'phone_cell': openapi.Schema(type=openapi.TYPE_STRING, description='휴대폰 번호'),
                'street': openapi.Schema(type=openapi.TYPE_STRING, description='주소'),
            },
            required=['fname', 'lname', 'DOB']
        ),
        responses={
            201: openapi.Response(
                description="환자 및 분석 요청 생성 성공",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'success': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'patient_id': openapi.Schema(type=openapi.TYPE_STRING, description="생성된 환자의 DB ID"),
                        'omics_request_id': openapi.Schema(type=openapi.TYPE_STRING, description="생성된 Omics 분석 요청의 ID"),
                    }
                )
            ),
            500: openapi.Response(description="서버 오류")
        }
    )
    def post(self, request, format=None):
        try:
            from patients.models import PatientProfile
            from omics.models import OmicsRequest # OmicsRequest 모델 임포트
            from django.utils import timezone
            
            patient_data = request.data
            logger.info(f"Received patient creation request data: {patient_data}")
            
            # Step 1: Django DB에 환자(PatientProfile) 생성
            patient = PatientProfile.objects.create(
                first_name=patient_data.get('fname', ''),
                last_name=patient_data.get('lname', ''),
                date_of_birth=patient_data.get('DOB'),
                gender=patient_data.get('sex', 'OTHER'),
                phone_number=patient_data.get('phone_cell', ''),
                address=patient_data.get('street', ''),
                openemr_id=f"django_{timezone.now().strftime('%Y%m%d_%H%M%S')}",
                registered_by=request.user
            )
            logger.info(f"Successfully created PatientProfile with ID: {patient.id}")

            # Step 2: 생성된 환자에 연결된 OmicsRequest를 자동으로 생성합니다.
            omics_request = OmicsRequest.objects.create(
                patient=patient,
                requester=request.user,
                status='PENDING' # 초기 상태는 'PENDING'
            )
            logger.info(f"Automatically created OmicsRequest with ID: {omics_request.id} for the new patient.")
            
            # Step 3: 프론트엔드에 필요한 ID들을 반환합니다.
            # 분석 시작(Celery Task)은 사용자가 파일 업로드 후 "분석 시작" 버튼을 눌렀을 때
            # OmicsRequestViewSet의 start_analysis 액션이 담당합니다.
            # 따라서 여기서는 분석을 시작하지 않습니다.
            
            return Response({
                "success": True,
                "message": "환자가 성공적으로 생성되었으며, 오믹스 분석 요청이 준비되었습니다.",
                "patient_id": str(patient.id),
                "omics_request_id": str(omics_request.id)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating patient and omics request: {e}", exc_info=True)
            return Response(
                {"error": "환자 생성 또는 오믹스 요청 준비 중 오류 발생", "detail": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TestAPIView(APIView):
    """테스트용 API"""
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        tags=["테스트 API"], 
        operation_description="테스트용 GET API",
        responses={
            200: openapi.Response(
                description="테스트 성공",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'status': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            )
        }
    )
    def get(self, request, format=None):
        return Response(
            {"message": "CDSS API GET 테스트 성공", "status": "success"}, 
            status=status.HTTP_200_OK
        )

    @swagger_auto_schema(
        tags=["테스트 API"], 
        operation_description="테스트용 POST API",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'name': openapi.Schema(type=openapi.TYPE_STRING, description='이름')
            }
        ),
        responses={
            200: openapi.Response(
                description="테스트 성공",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            )
        }
    )
    def post(self, request, format=None):
        name = request.data.get('name', 'Guest')
        return Response({"message": f"{name}님, POST 테스트 성공"}, status=status.HTTP_200_OK)
