from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
import logging
import requests

from patients.models import PatientProfile
from pacs_integration.openemr_client import OpenEMRClient
from pacs_integration.orthanc_client import OrthancClient
from .lis_client import LISAPIClient
from .services import create_lab_order_and_log
from .models import LabOrder, PatientProfile
from .serializers import LabOrderSerializer
from .permissions import IsAuthenticatedViaOpenEMR  # 인증 클래스
from rest_framework import permissions

logger = logging.getLogger(__name__)


class IntegratedPatientView(APIView):
    """OpenEMR, PACS, LIS 통합 환자 정보 API"""
    permission_classes = [IsAuthenticatedViaOpenEMR]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.openemr_client = OpenEMRClient()
        self.orthanc_client = OrthancClient()
        self.lis_client = LISAPIClient()

    def get(self, request, patient_id):
        try:
            patient_data = self.openemr_client.get_patient_details_by_id(patient_id)
            if not patient_data:
                return Response({"error": f"Patient {patient_id} not found in OpenEMR"}, status=status.HTTP_404_NOT_FOUND)

            pacs_studies = self.orthanc_client.find_studies_by_dicom_patient_id(patient_id)

            try:
                lab_results = self.lis_client.get_patient_results(patient_id)
            except Exception as e:
                logger.warning(f"LIS 조회 실패: {e}")
                lab_results = []

            return Response({
                'patient_info': patient_data,
                'imaging_studies': pacs_studies or [],
                'laboratory_results': lab_results or [],
                'last_updated': timezone.now().isoformat()
            })

        except Exception as e:
            logger.error(f"통합 환자 정보 조회 실패: {e}", exc_info=True)
            return Response({"error": f"환자 정보 조회 중 오류 발생: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LabOrderCreateView(APIView):
    """검사 오더 생성 API"""
    permission_classes = [IsAuthenticatedViaOpenEMR]

    def post(self, request):
        patient_id = request.data.get('patient_id')
        test_codes = request.data.get('test_codes', [])
        user_info = getattr(request, "user_info_from_openemr", {})

        if not patient_id or not test_codes:
            return Response({"error": "patient_id와 test_codes가 필요합니다"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = create_lab_order_and_log(
                patient_id=patient_id,
                test_codes=test_codes,
                requesting_user=user_info.get("username", "unknown")
            )
            return Response({'success': True, **result}, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"검사 오더 생성 실패: {e}", exc_info=True)
            return Response({"error": f"검사 오더 생성 중 오류 발생: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConnectionTestView(APIView):
    """연결 테스트 API"""
    permission_classes = [IsAuthenticatedViaOpenEMR]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.openemr_client = OpenEMRClient()

    def get(self, request):
        return Response({"status": "ok", "source": "LIS Integration"})


class LabOrderViewSet(viewsets.ModelViewSet):
    """검사 오더 API"""
    queryset = LabOrder.objects.select_related('patient', 'ordering_physician').all()
    serializer_class = LabOrderSerializer
    permission_classes = [IsAuthenticatedViaOpenEMR]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'patient', 'priority']

    @action(detail=True, methods=['post'])
    def collect_sample(self, request, pk=None):
        order = self.get_object()

        if order.status != LabOrder.StatusChoices.ORDERED:
            return Response(
                {"error": "주문(ordered) 상태의 검사만 채취할 수 있습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = LabOrder.StatusChoices.COLLECTED
        order.sample_collected_at = timezone.now()
        order.notes = request.data.get('notes', order.notes)
        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_result(self, request, pk=None):
        order = self.get_object()

        if order.status not in [LabOrder.StatusChoices.COLLECTED, LabOrder.StatusChoices.PROCESSING]:
            return Response(
                {"error": "채취완료 또는 처리중 상태의 검사만 결과를 입력할 수 있습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.result_value = request.data.get('result_value')
        order.result_unit = request.data.get('unit')
        order.reference_range = request.data.get('reference_range')
        order.status = LabOrder.StatusChoices.COMPLETED
        order.completed_at = timezone.now()
        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data)


class LabResultListView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # 내부 사용자용 API이면 유지 가능

    def get(self, request, *args, **kwargs):
        patient_uuid = request.query_params.get('patient_id')
        if not patient_uuid:
            return Response({"error": "patient_id 쿼리 파라미터가 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            patient = PatientProfile.objects.get(id=patient_uuid)
            openemr_id = patient.openemr_id

            lis_client = LISAPIClient()
            results = lis_client.get_patient_results(openemr_id)
            return Response(results)

        except PatientProfile.DoesNotExist:
            return Response({"error": "해당 환자를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                raise PermissionDenied("LIS 서버 접근 권한이 없습니다.")
            raise
        except Exception as e:
            logger.error(f"검사 결과 조회 중 오류 발생: {e}", exc_info=True)
            return Response({"error": "서버 내부 오류가 발생했습니다."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PatientLabResultListView(APIView):
    """
    특정 환자의 완료된 모든 검사 결과를 LIS 내부 DB에서 조회합니다.
    GET /api/patients/{openemr_id}/results/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, openemr_id):
        try:
            # openemr_id를 사용하여 PatientProfile을 찾습니다.
            patient = PatientProfile.objects.get(openemr_id=openemr_id)
            
            # 해당 환자의 완료된(COMPLETED) 검사 오더들을 최신순으로 조회합니다.
            completed_orders = LabOrder.objects.filter(
                patient=patient,
                status=LabOrder.StatusChoices.COMPLETED
            ).order_by('-completed_at')
            
            serializer = LabOrderSerializer(completed_orders, many=True)
            return Response(serializer.data)
        
        except PatientProfile.DoesNotExist:
            return Response({"error": f"OpenEMR ID {openemr_id}를 가진 환자를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            logger.error(f"환자 검사 결과 조회 중 오류 발생 (openemr_id: {openemr_id}): {e}", exc_info=True)
            return Response({"error": "서버 내부 오류가 발생했습니다."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
