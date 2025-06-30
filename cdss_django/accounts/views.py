# accounts/views.py
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .models import Patient, FlutterPatient, MedicalStaff  # ✅ 추가된 import
from .serializers import (
    UserRegistrationSerializer, 
    FlutterPatientRegistrationSerializer,  # ✅ 추가된 import
    MedicalStaffRegistrationSerializer,    # ✅ 추가된 import
    UserSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer

# 로거 설정
import logging
logger = logging.getLogger(__name__)

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def register_patient(request):
    print(f"[DEBUG] 기존 환자 회원가입 시도 - 데이터: {request.data}")
    
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # 환자 프로필 생성
        patient = Patient.objects.create(
            user=user,
            patient_id=f"P{user.id:06d}",
            blood_type=request.data.get('blood_type', ''),
            allergies=request.data.get('allergies', ''),
            insurance_number=request.data.get('insurance_number', ''),
        )
        
        print(f"[DEBUG] 기존 환자 생성 성공: {patient.patient_id}")
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': '회원가입이 완료되었습니다.',
            'user_id': user.id,
            'patient_id': patient.patient_id,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        }, status=status.HTTP_201_CREATED)
    
    print(f"[ERROR] 기존 환자 회원가입 검증 실패: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_flutter_patient(request):
    """Flutter 앱 전용 환자 회원가입"""
    print(f"[DEBUG] ===== Flutter 환자 회원가입 시작 =====")
    print(f"[DEBUG] 요청 메서드: {request.method}")
    print(f"[DEBUG] Content-Type: {request.content_type}")
    print(f"[DEBUG] 받은 데이터: {request.data}")
    print(f"[DEBUG] 요청 헤더: {dict(request.headers)}")
    
    logger.info(f"Flutter 환자 회원가입 시도 - IP: {request.META.get('REMOTE_ADDR')}")
    
    try:
        # 데이터 검증 전 로깅
        required_fields = ['username', 'password', 'password_confirm', 'first_name', 'email', 'hospital_patient_id', 'verification_code']
        for field in required_fields:
            if field in request.data:
                print(f"[DEBUG] {field}: {request.data[field]}")
            else:
                print(f"[WARNING] 필수 필드 누락: {field}")
        
        # ✅ 데이터 전처리 - None을 빈 문자열로 변환
        processed_data = {}
        for key, value in request.data.items():
            if value is None:
                processed_data[key] = ''
                print(f"[DEBUG] {key}: None -> '' 변환")
            elif value == 'null':  # 문자열 'null' 처리
                processed_data[key] = ''
                print(f"[DEBUG] {key}: 'null' -> '' 변환")
            else:
                processed_data[key] = value
        
        print(f"[DEBUG] 전처리된 데이터: {processed_data}")
        
        serializer = FlutterPatientRegistrationSerializer(data=processed_data)
        print(f"[DEBUG] Serializer 생성 완료")
        
        if serializer.is_valid():
            print(f"[DEBUG] Serializer 검증 성공")
            
            flutter_patient = serializer.save()
            user = flutter_patient.user
            
            print(f"[DEBUG] Flutter 환자 생성 성공:")
            print(f"[DEBUG] - 사용자 ID: {user.id}")
            print(f"[DEBUG] - 사용자명: {user.username}")
            print(f"[DEBUG] - 환자 ID: {flutter_patient.patient_id}")
            print(f"[DEBUG] - 연결된 병원 환자 ID: {flutter_patient.linked_patient.patient_id if flutter_patient.linked_patient else 'None'}")

            # ✅ JWT 토큰 생성 (블랙리스트 오류 방지)
            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                print(f"[DEBUG] JWT 토큰 생성 완료")
            except Exception as token_error:
                print(f"[WARNING] JWT 토큰 생성 실패: {token_error}")
                # 기본 토큰 사용
                from rest_framework.authtoken.models import Token
                token, created = Token.objects.get_or_create(user=user)
                access_token = token.key
                refresh_token = token.key
                print(f"[DEBUG] 기본 토큰 생성 완료")

            response_data = {
                'success': True,
                'message': 'Flutter 환자 회원가입이 완료되었습니다.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'patient_id': flutter_patient.patient_id,
                    'hospital_patient_id': flutter_patient.linked_patient.patient_id if flutter_patient.linked_patient else None,
                    'user_type': user.user_type
                },
                'tokens': {
                    'access': access_token,
                    'refresh': refresh_token,
                }
            }
            
            print(f"[DEBUG] 응답 데이터: {response_data}")
            logger.info(f"Flutter 환자 회원가입 성공: {user.username}")
            
            return Response(response_data, status=status.HTTP_201_CREATED)

        print(f"[ERROR] Serializer 검증 실패:")
        print(f"[ERROR] 오류 상세: {serializer.errors}")
        
        # 각 필드별 오류 상세 출력
        for field, errors in serializer.errors.items():
            print(f"[ERROR] {field}: {errors}")
        
        logger.error(f"Flutter 환자 회원가입 검증 실패: {serializer.errors}")
        
        return Response({
            'success': False,
            'errors': serializer.errors,
            'message': '입력 데이터 검증에 실패했습니다.',
            'debug_info': {
                'received_data': dict(request.data),
                'processed_data': processed_data
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"[CRITICAL] register_flutter_patient 예외 발생: {str(e)}")
        print(f"[CRITICAL] 예외 타입: {type(e).__name__}")
        
        import traceback
        print(f"[CRITICAL] 스택 트레이스:")
        traceback.print_exc()
        
        logger.error(f"Flutter 환자 회원가입 예외: {str(e)}", exc_info=True)
        
        return Response({
            'success': False,
            'error': f'회원가입 처리 중 오류: {str(e)}',
            'error_type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ✅ 의료진용 환자 인증 코드 생성 API - 더 유연한 환자 검색으로 수정
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_patient_verification_code(request):
    """의료진이 환자에게 모바일 앱 가입 코드 발급 - 유연한 환자 검색"""
    print(f"[DEBUG] 환자 인증 코드 생성 요청 - 의료진: {request.user.username}")
    print(f"[DEBUG] 받은 데이터: {request.data}")
    
    user = request.user
    
    # 의료진만 접근 가능
    if user.user_type not in ['doctor', 'nurse', 'admin','staff']:
        return Response({
            'success': False,
            'error': '의료진만 환자 인증 코드를 생성할 수 있습니다.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    patient_id = request.data.get('patient_id')
    
    if not patient_id:
        return Response({
            'success': False,
            'error': '환자 ID를 입력해주세요.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # 여러 방법으로 환자 검색 시도
        patient = None
        patient_name = "Unknown"
        search_method = ""
        
        print(f"[DEBUG] 환자 검색 시작 - 검색어: {patient_id}")
        
        # 1. Patient 모델에서 patient_id로 검색
        try:
            patient = Patient.objects.select_related('user').get(patient_id=patient_id)
            patient_name = patient.user.get_full_name() or patient.user.username
            search_method = "Patient.patient_id"
            print(f"[DEBUG] Patient.patient_id로 환자 찾음: {patient.patient_id}")
        except Patient.DoesNotExist:
            print(f"[DEBUG] Patient.patient_id로 환자 못 찾음")
            pass
        
        # 2. PatientProfile 모델에서 openemr_id로 검색
        if not patient:
            try:
                from patients.models import PatientProfile
                patient_profile = PatientProfile.objects.select_related('registered_by').get(openemr_id=patient_id)
                
                # PatientProfile을 Patient처럼 사용하기 위한 래퍼 객체 생성
                class PatientWrapper:
                    def __init__(self, profile):
                        self.patient_id = profile.openemr_id
                        self.profile = profile
                        self.mobile_verification_code = None
                        self.verification_code_created_at = None
                    
                    def save(self):
                        # PatientProfile에는 verification_code 필드가 없을 수 있으므로 로그만 남김
                        print(f"[DEBUG] PatientProfile 저장 시뮬레이션: {self.patient_id}")
                        pass
                
                patient = PatientWrapper(patient_profile)
                patient_name = f"{patient_profile.first_name} {patient_profile.last_name}".strip()
                search_method = "PatientProfile.openemr_id"
                print(f"[DEBUG] PatientProfile.openemr_id로 환자 찾음: {patient_profile.openemr_id}")
            except Exception as e:
                print(f"[DEBUG] PatientProfile.openemr_id로 환자 못 찾음: {e}")
                pass
        
        # 3. Patient 모델에서 숫자 ID로 검색
        if not patient:
            try:
                patient = Patient.objects.select_related('user').get(id=patient_id)
                patient_name = patient.user.get_full_name() or patient.user.username
                search_method = "Patient.id"
                print(f"[DEBUG] Patient.id로 환자 찾음: {patient.id}")
            except (Patient.DoesNotExist, ValueError):
                print(f"[DEBUG] Patient.id로 환자 못 찾음")
                pass
        
        # 4. User 모델에서 username으로 검색 후 연결된 Patient 찾기
        if not patient:
            try:
                user_obj = User.objects.get(username=patient_id)
                if hasattr(user_obj, 'patient'):
                    patient = user_obj.patient
                    patient_name = user_obj.get_full_name() or user_obj.username
                    search_method = "User.username->Patient"
                    print(f"[DEBUG] User.username으로 환자 찾음: {user_obj.username}")
            except User.DoesNotExist:
                print(f"[DEBUG] User.username으로 환자 못 찾음")
                pass
        
        if not patient:
            print(f"[ERROR] 모든 검색 방법으로 환자를 찾을 수 없음: {patient_id}")
            return Response({
                'success': False,
                'error': f'환자 ID "{patient_id}"를 찾을 수 없습니다. 환자 ID를 다시 확인해주세요.',
                'searched_methods': ['Patient.patient_id', 'PatientProfile.openemr_id', 'Patient.id', 'User.username']
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 6자리 랜덤 코드 생성
        import random
        import string
        from django.utils import timezone
        
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        # 코드를 환자 레코드에 저장 (24시간 유효)
        try:
            if hasattr(patient, 'mobile_verification_code'):
                patient.mobile_verification_code = verification_code
                patient.verification_code_created_at = timezone.now()
                patient.save()
                print(f"[DEBUG] 인증 코드 저장 완료")
            else:
                print(f"[DEBUG] 환자 모델에 verification_code 필드 없음 - 메모리에만 저장")
        except Exception as save_error:
            print(f"[WARNING] 인증 코드 저장 실패: {save_error}")
        
        print(f"[DEBUG] 환자 {patient.patient_id}에게 인증 코드 {verification_code} 생성 ({search_method})")
        
        return Response({
            'success': True,
            'patient_id': patient.patient_id,
            'patient_name': patient_name,
            'verification_code': verification_code,
            'search_method': search_method,
            'message': f'환자 {patient_name}님의 모바일 앱 가입 코드가 생성되었습니다.',
            'expires_in': '24시간',
            'instructions': '이 코드를 환자에게 전달하여 모바일 앱 회원가입 시 사용하도록 안내해주세요.'
        })
        
    except Exception as e:
        print(f"[ERROR] 인증 코드 생성 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': f'인증 코드 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ✅ React에서 Flutter 환자 목록 조회 API 추가
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_flutter_patients(request):
    """React에서 Flutter 환자 목록 조회"""
    print(f"[DEBUG] Flutter 환자 목록 조회 요청 - 의료진: {request.user.username}")
    
    user = request.user
    
    # 의료진만 접근 가능
    if user.user_type not in ['doctor', 'nurse', 'admin','staff']:
        return Response({
            'success': False,
            'error': '의료진만 Flutter 환자 목록을 조회할 수 있습니다.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Flutter 환자 목록 조회 (관련 데이터 포함)
        flutter_patients = FlutterPatient.objects.select_related('user', 'linked_patient__user').all()
        
        patients_data = []
        for fp in flutter_patients:
            patient_info = {
                'flutter_patient_id': fp.patient_id,
                'hospital_patient_id': fp.linked_patient.patient_id if fp.linked_patient else None,
                'name': fp.user.get_full_name(),
                'username': fp.user.username,
                'email': fp.user.email,
                'phone': fp.phone_number,
                'birth_date': fp.birth_date.strftime('%Y-%m-%d') if fp.birth_date else None,
                'address': fp.address,
                'blood_type': fp.blood_type,
                'allergies': fp.allergies,
                'medical_history': fp.medical_history,
                'insurance_number': fp.insurance_number,
                'created_at': fp.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': fp.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
                'is_linked': fp.linked_patient is not None,
                'linked_patient_name': fp.linked_patient.user.get_full_name() if fp.linked_patient else None,
                'user_type': fp.user.user_type
            }
            patients_data.append(patient_info)
        
        print(f"[DEBUG] Flutter 환자 {len(patients_data)}명 조회 완료")
        
        return Response({
            'success': True,
            'flutter_patients': patients_data,
            'total_count': len(patients_data),
            'message': f'{len(patients_data)}명의 Flutter 환자를 조회했습니다.'
        })
        
    except Exception as e:
        print(f"[ERROR] Flutter 환자 목록 조회 오류: {str(e)}")
        return Response({
            'success': False,
            'error': f'Flutter 환자 목록 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ✅ 특정 Flutter 환자 상세 정보 조회 API 추가
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_flutter_patient_detail(request, patient_id):
    """특정 Flutter 환자 상세 정보 조회"""
    print(f"[DEBUG] Flutter 환자 상세 조회 요청 - 환자 ID: {patient_id}, 의료진: {request.user.username}")
    
    user = request.user
    
    # 의료진만 접근 가능
    if user.user_type not in ['doctor', 'nurse', 'admin','staff']:
        return Response({
            'success': False,
            'error': '권한이 없습니다.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        flutter_patient = FlutterPatient.objects.select_related('user', 'linked_patient__user').get(patient_id=patient_id)
        
        patient_detail = {
            'flutter_patient_id': flutter_patient.patient_id,
            'hospital_patient_id': flutter_patient.linked_patient.patient_id if flutter_patient.linked_patient else None,
            'user_info': {
                'id': flutter_patient.user.id,
                'username': flutter_patient.user.username,
                'email': flutter_patient.user.email,
                'first_name': flutter_patient.user.first_name,
                'last_name': flutter_patient.user.last_name,
                'full_name': flutter_patient.user.get_full_name(),
                'user_type': flutter_patient.user.user_type,
                'is_active': flutter_patient.user.is_active,
                'date_joined': flutter_patient.user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
            },
            'medical_info': {
                'phone_number': flutter_patient.phone_number,
                'birth_date': flutter_patient.birth_date.strftime('%Y-%m-%d') if flutter_patient.birth_date else None,
                'address': flutter_patient.address,
                'emergency_contact': flutter_patient.emergency_contact,
                'blood_type': flutter_patient.blood_type,
                'allergies': flutter_patient.allergies,
                'medical_history': flutter_patient.medical_history,
                'insurance_number': flutter_patient.insurance_number
            },
            'link_info': {
                'is_linked': flutter_patient.linked_patient is not None,
                'linked_patient_id': flutter_patient.linked_patient.patient_id if flutter_patient.linked_patient else None,
                'linked_patient_name': flutter_patient.linked_patient.user.get_full_name() if flutter_patient.linked_patient else None
            },
            'timestamps': {
                'created_at': flutter_patient.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': flutter_patient.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }
        
        print(f"[DEBUG] Flutter 환자 상세 정보 조회 완료: {flutter_patient.patient_id}")
        
        return Response({
            'success': True,
            'patient': patient_detail
        })
        
    except FlutterPatient.DoesNotExist:
        return Response({
            'success': False,
            'error': f'Flutter 환자 ID "{patient_id}"를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"[ERROR] Flutter 환자 상세 조회 오류: {str(e)}")
        return Response({
            'success': False,
            'error': f'Flutter 환자 상세 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_medical_staff(request):
    """React 의료진 회원가입"""
    print(f"[DEBUG] ===== 의료진 회원가입 시작 =====")
    print(f"[DEBUG] 받은 데이터: {request.data}")
    
    try:
        serializer = MedicalStaffRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            print(f"[DEBUG] 의료진 Serializer 검증 성공")
            
            medical_staff = serializer.save()
            user = medical_staff.user
            
            print(f"[DEBUG] 의료진 생성 성공: {user.username}, {medical_staff.staff_id}")

            # JWT 토큰 생성
            refresh = RefreshToken.for_user(user)

            return Response({
                'success': True,
                'message': '의료진 등록이 완료되었습니다.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'staff_id': medical_staff.staff_id,
                    'staff_type': medical_staff.staff_type,
                    'user_type': user.user_type
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)

        print(f"[ERROR] 의료진 Serializer 검증 실패: {serializer.errors}")
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"[CRITICAL] register_medical_staff 예외 발생: {str(e)}")
        return Response({
            'success': False,
            'error': f'의료진 등록 처리 중 오류: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    print(f"[DEBUG] 로그인 시도 - 사용자명: {request.data.get('username')}")
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if username and password:
        user = authenticate(username=username, password=password)
        if user:
            print(f"[DEBUG] 로그인 성공: {username}")
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            
            return Response({
                'message': '로그인 성공',
                'user': user_data,
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
            }, status=status.HTTP_200_OK)
        else:
            print(f"[ERROR] 로그인 실패 - 잘못된 인증정보: {username}")
            return Response({
                'error': '아이디 또는 비밀번호가 올바르지 않습니다.'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    print(f"[ERROR] 로그인 실패 - 필수 필드 누락")
    return Response({
        'error': '아이디와 비밀번호를 입력해주세요.'
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    print(f"[DEBUG] 프로필 조회 - 사용자: {request.user.username}")
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """사용자 프로필 수정"""
    print(f"[DEBUG] 프로필 업데이트 - 사용자: {request.user.username}")
    print(f"[DEBUG] 업데이트 데이터: {request.data}")
    
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        print(f"[DEBUG] 사용자 프로필 업데이트 성공")
        
        # 환자 정보도 함께 업데이트
        if hasattr(user, 'patient'):
            patient = user.patient
            patient_data = request.data
            
            if 'blood_type' in patient_data:
                patient.blood_type = patient_data['blood_type']
            if 'allergies' in patient_data:
                patient.allergies = patient_data['allergies']
            if 'medical_history' in patient_data:
                patient.medical_history = patient_data['medical_history']
            if 'insurance_number' in patient_data:
                patient.insurance_number = patient_data['insurance_number']
            
            patient.save()
            print(f"[DEBUG] 기존 환자 프로필 업데이트 완료")
        
        # ✅ Flutter 환자 정보도 함께 업데이트 (추가됨)
        if hasattr(user, 'flutter_patient'):
            flutter_patient = user.flutter_patient
            patient_data = request.data

            for field in ['phone_number', 'birth_date', 'address', 'emergency_contact',
                         'blood_type', 'allergies', 'medical_history', 'insurance_number']:
                if field in patient_data:
                    setattr(flutter_patient, field, patient_data[field])

            flutter_patient.save()
            print(f"[DEBUG] Flutter 환자 프로필 업데이트 완료")
        
        return Response({
            'message': '프로필이 성공적으로 업데이트되었습니다.',
            'user': UserSerializer(user).data
        })
    else:
        print(f"[ERROR] 프로필 업데이트 검증 실패: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """로그아웃 (토큰 무효화)"""
    print(f"[DEBUG] 로그아웃 시도 - 사용자: {request.user.username}")
    
    try:
        refresh_token = request.data.get("refresh_token")
        if refresh_token:
            # ✅ 블랙리스트 오류 방지
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                print(f"[DEBUG] 토큰 블랙리스트 처리 완료")
            except Exception as blacklist_error:
                print(f"[WARNING] 블랙리스트 처리 실패: {blacklist_error}")
                # 블랙리스트 실패해도 로그아웃은 성공으로 처리
                pass
            
        return Response({
            'message': '성공적으로 로그아웃되었습니다.'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"[ERROR] 로그아웃 처리 오류: {str(e)}")
        return Response({
            'error': '로그아웃 처리 중 오류가 발생했습니다.'
        }, status=status.HTTP_400_BAD_REQUEST)

class MyTokenObtainPairView(TokenObtainPairView):
    """로그인 시 토큰과 함께 사용자 정보를 반환하는 커스텀 뷰"""
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        print(f"[DEBUG] MyTokenObtainPairView 호출됨")
        print(f"[DEBUG] 로그인 데이터: {request.data}")
        
        response = super().post(request, *args, **kwargs)
        
        if (response.status_code == 200):
            print(f"[DEBUG] 토큰 발급 성공")
        else:
            print(f"[ERROR] 토큰 발급 실패: {response.status_code}")
            
        return response

# accounts/views.py 맨 아래에 추가 (기존 코드는 그대로 두고)
# accounts/views.py에서 해당 함수만 수정
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_doctors_for_appointment(request):
    """예약 시스템용 의사 목록 조회 - MedicalStaff 기반"""
    try:
        from .models import MedicalStaff
        
        # ✅ MedicalStaff 테이블에서 의사 조회
        doctors = MedicalStaff.objects.filter(
            staff_type__in=['doctor'],  # doctor만 조회
            user__is_active=True
        ).select_related('user')
        
        doctor_list = []
        for doctor in doctors:
            # 이름에서 '의사' 직함 제거
            full_name = doctor.user.get_full_name() or doctor.user.username
            if full_name.endswith(' 의사'):
                full_name = full_name[:-3]
            elif full_name.endswith('의사'):
                full_name = full_name[:-2]
            
            doctor_list.append({
                'id': doctor.id,  # ✅ MedicalStaff ID 사용
                'name': full_name,
                'username': doctor.user.username,
                'email': doctor.user.email,
                'first_name': doctor.user.first_name,
                'last_name': doctor.user.last_name,
                'user_type': doctor.user.user_type,
                'department': doctor.department,
                'specialization': doctor.specialization,
                'staff_id': doctor.staff_id,
                'user_id': doctor.user.id  # 참고용
            })
        
        print(f"[DEBUG] MedicalStaff 기반 의사 목록: {len(doctor_list)}명")
        
        return Response({
            'success': True,
            'doctors': doctor_list,
            'count': len(doctor_list)
        })
        
    except Exception as e:
        print(f"[ERROR] 의사 목록 조회 오류: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'doctors': [],
            'count': 0
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
