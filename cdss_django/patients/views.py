# patients/views.py
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from django.db import models
import secrets
import string
import random
import uuid
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import (
    PatientProfile, ClinicalData, LiverCancerClinicalData,
    FlutterPatientProfile, PatientVerificationCode, RegistrationCode
)
from .serializers import (
    PatientProfileSerializer, ClinicalDataSerializer, 
    FlutterPatientProfileSerializer, PatientVerificationCodeSerializer,
    RegistrationCodeSerializer
)
from .permissions import IsClinicalStaffUser
from .utils import UnifiedPatientManager
from django.contrib.auth import get_user_model

from omics.models import OmicsRequest
from omics.serializers import OmicsRequestListSerializer

User = get_user_model()

logger = logging.getLogger(__name__)

class PatientProfileViewSet(viewsets.ModelViewSet):
    """환자 프로필에 대한 기본적인 CRUD API"""
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """사용자 역할에 관계없이 모든 환자 목록을 반환"""
        return PatientProfile.objects.all().order_by('last_name', 'first_name')

# === 통합 환자 조회 API ===
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_integrated_patients(request):
    """Django + Flutter 통합 환자 목록 조회"""
    try:
        print(f"[DEBUG] 통합 환자 조회 요청 - 사용자: {request.user.username}")
        
        # Django 환자 (PatientProfile)
        django_patients = PatientProfile.objects.select_related('registered_by').all()
        
        # Flutter 환자 가져오기 (patients 앱에서 관리)
        flutter_patients = FlutterPatientProfile.objects.select_related('user', 'linked_patient').all()
        
        integrated_data = {
            'django_patients': [],
            'flutter_patients': [],
            'total_count': 0,
            'stats': {
                'django_count': 0,
                'flutter_count': 0,
                'linked_count': 0
            }
        }
        
        # Django 환자 데이터 정규화
        for patient in django_patients:
            patient_data = {
                'id': str(patient.id),
                'openemr_id': patient.openemr_id,
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'name': f"{patient.first_name} {patient.last_name}".strip(),
                'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                'gender': patient.gender,
                'phone_number': patient.phone_number,
                'address': patient.address,
                'source': 'django',
                'patient_type': 'regular',
                'is_linked': False,
                'created_at': patient.created_at.isoformat() if hasattr(patient, 'created_at') else None,
                'registered_by': patient.registered_by.username if patient.registered_by else None
            }
            integrated_data['django_patients'].append(patient_data)
        
        # Flutter 환자 데이터 정규화
        linked_count = 0
        for patient in flutter_patients:
            is_linked = patient.linked_patient is not None
            if is_linked:
                linked_count += 1
                
            patient_data = {
                'id': str(patient.id),
                'flutter_patient_id': patient.patient_id,
                'first_name': patient.user.first_name,
                'last_name': patient.user.last_name,
                'name': patient.user.get_full_name() or patient.user.username,
                'username': patient.user.username,
                'email': patient.user.email,
                'phone_number': patient.phone_number,
                'date_of_birth': patient.birth_date.isoformat() if patient.birth_date else None,
                'address': patient.address,
                'blood_type': patient.blood_type,
                'allergies': patient.allergies,
                'source': 'flutter',
                'patient_type': 'flutter',
                'is_linked': is_linked,
                'linked_patient_id': patient.linked_patient.openemr_id if patient.linked_patient else None,
                'created_at': patient.created_at.isoformat() if hasattr(patient, 'created_at') else None
            }
            integrated_data['flutter_patients'].append(patient_data)
        
        # 통계 업데이트
        integrated_data['stats'] = {
            'django_count': len(integrated_data['django_patients']),
            'flutter_count': len(integrated_data['flutter_patients']),
            'linked_count': linked_count
        }
        integrated_data['total_count'] = integrated_data['stats']['django_count'] + integrated_data['stats']['flutter_count']
        
        print(f"[DEBUG] 통합 환자 조회 완료 - Django: {integrated_data['stats']['django_count']}명, Flutter: {integrated_data['stats']['flutter_count']}명")
        
        return Response({
            'success': True,
            'data': integrated_data,
            'message': f'총 {integrated_data["total_count"]}명의 환자 데이터를 조회했습니다.'
        })
        
    except Exception as e:
        print(f"[ERROR] 통합 환자 조회 오류: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e),
            'data': {
                'django_patients': [],
                'flutter_patients': [],
                'total_count': 0,
                'stats': {'django_count': 0, 'flutter_count': 0, 'linked_count': 0}
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_patient_by_id(request, patient_id):
    """다양한 ID 형태로 환자 검색"""
    try:
        print(f"[DEBUG] 환자 ID 검색 요청: {patient_id}")
        
        found_patients = []
        
        # Django 환자에서 검색
        try:
            django_patient = PatientProfile.objects.filter(
                models.Q(openemr_id=patient_id) | models.Q(id=patient_id)
            ).first()
            
            if django_patient:
                found_patients.append({
                    'source': 'django',
                    'patient_type': 'regular',
                    'id': str(django_patient.id),
                    'openemr_id': django_patient.openemr_id,
                    'name': f"{django_patient.first_name} {django_patient.last_name}".strip(),
                    'match_type': 'openemr_id' if django_patient.openemr_id == patient_id else 'id'
                })
        except Exception as e:
            print(f"[WARNING] Django 환자 검색 오류: {e}")
        
        # Flutter 환자에서 검색
        try:
            flutter_patient = FlutterPatientProfile.objects.select_related('user').filter(
                models.Q(patient_id=patient_id) | models.Q(id=patient_id)
            ).first()
            
            if flutter_patient:
                found_patients.append({
                    'source': 'flutter',
                    'patient_type': 'flutter',
                    'id': str(flutter_patient.id),
                    'flutter_patient_id': flutter_patient.patient_id,
                    'name': flutter_patient.user.get_full_name() or flutter_patient.user.username,
                    'is_linked': flutter_patient.linked_patient is not None,
                    'match_type': 'flutter_patient_id' if flutter_patient.patient_id == patient_id else 'id'
                })
        except Exception as e:
            print(f"[WARNING] Flutter 환자 검색 오류: {e}")
        
        return Response({
            'success': True,
            'found_patients': found_patients,
            'total_found': len(found_patients),
            'search_id': patient_id
        })
        
    except Exception as e:
        print(f"[ERROR] 환자 ID 검색 오류: {e}")
        return Response({
            'success': False,
            'error': str(e),
            'found_patients': [],
            'total_found': 0
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# patients/views.py에서 get_flutter_patients 함수 수정

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_flutter_patients(request):
    """Flutter 환자 목록 조회"""
    try:
        print(f"[DEBUG] Flutter 환자 목록 조회 요청 - 사용자: {request.user.username}")
        
        flutter_patients = FlutterPatientProfile.objects.select_related(
            'user', 'linked_patient_profile'  # ✅ 필드명 수정
        ).all().order_by('-created_at')
        
        flutter_patients_data = []
        for patient in flutter_patients:
            # 연결된 병원 환자 정보
            linked_patient_info = None
            if patient.linked_patient_profile:  # ✅ 필드명 수정
                linked_patient_info = {
                    'id': str(patient.linked_patient_profile.id),
                    'openemr_id': patient.linked_patient_profile.openemr_id,
                    'name': patient.linked_patient_profile.name
                }
            
            patient_data = {
                'flutter_patient_id': patient.patient_id,
                'id': str(patient.id),
                'name': patient.user.get_full_name() or patient.user.username,
                'email': patient.user.email,
                'phone': patient.phone_number,
                'birth_date': patient.birth_date.isoformat() if patient.birth_date else None,
                'address': patient.address,
                'blood_type': patient.blood_type,
                'allergies': patient.allergies,
                'medical_history': patient.medical_history,
                'emergency_contact': patient.emergency_contact,  # ✅ 추가
                'insurance_number': patient.insurance_number,  # ✅ 추가
                'is_linked': patient.is_linked,
                'is_verified': patient.is_verified,
                'verification_method': patient.verification_method,
                'verified_at': patient.verified_at.isoformat() if patient.verified_at else None,
                'hospital_patient_id': patient.linked_patient_profile.openemr_id if patient.linked_patient_profile else None,  # ✅ 필드명 수정
                'linked_patient_name': patient.linked_patient_profile.name if patient.linked_patient_profile else None,  # ✅ 필드명 수정
                'linked_patient_info': linked_patient_info,
                'linked_at': patient.linked_at.isoformat() if patient.linked_at else None,
                'created_at': patient.created_at.isoformat(),
                'user_info': {
                    'id': patient.user.id,  # ✅ 추가
                    'username': patient.user.username,
                    'email': patient.user.email,
                    'full_name': patient.user.get_full_name(),
                    'first_name': patient.user.first_name,
                    'last_name': patient.user.last_name
                },
                'medical_info': {
                    'phone_number': patient.phone_number,
                    'birth_date': patient.birth_date.isoformat() if patient.birth_date else None,
                    'address': patient.address,
                    'blood_type': patient.blood_type,
                    'allergies': patient.allergies,
                    'medical_history': patient.medical_history,
                    'emergency_contact': patient.emergency_contact,  # ✅ 추가
                    'insurance_number': patient.insurance_number,  # ✅ 추가
                },
                'link_info': {
                    'is_linked': patient.is_linked,
                    'linked_patient_name': patient.linked_patient_profile.name if patient.linked_patient_profile else None,  # ✅ 필드명 수정
                    'hospital_patient_id': patient.linked_patient_profile.openemr_id if patient.linked_patient_profile else None,  # ✅ 필드명 수정
                    'linked_at': patient.linked_at.isoformat() if patient.linked_at else None
                },
                'verification_info': {
                    'is_verified': patient.is_verified,
                    'verification_method': patient.verification_method,
                    'verified_at': patient.verified_at.isoformat() if patient.verified_at else None
                }
            }
            flutter_patients_data.append(patient_data)
        
        print(f"[DEBUG] Flutter 환자 조회 완료 - {len(flutter_patients_data)}명")
        
        return Response({
            'success': True,
            'flutter_patients': flutter_patients_data,
            'total_count': len(flutter_patients_data),
            'message': f'Flutter 환자 {len(flutter_patients_data)}명을 조회했습니다.'
        })
        
    except Exception as e:
        print(f"[ERROR] Flutter 환자 조회 오류: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e),
            'flutter_patients': [],
            'total_count': 0
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_flutter_patient_detail(request, patient_id):
    """Flutter 환자 상세 정보 조회"""
    try:
        print(f"[DEBUG] Flutter 환자 상세 조회 요청: {patient_id}")
        
        try:
            patient = FlutterPatientProfile.objects.select_related(
                'user', 'linked_patient'
            ).get(patient_id=patient_id)
        except FlutterPatientProfile.DoesNotExist:
            return Response({
                'success': False,
                'error': '해당 Flutter 환자를 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 상세 정보 구성
        patient_detail = {
            'flutter_patient_id': patient.patient_id,
            'hospital_patient_id': patient.linked_patient.openemr_id if patient.linked_patient else None,
            'user_info': {
                'username': patient.user.username,
                'email': patient.user.email,
                'full_name': patient.user.get_full_name(),
                'first_name': patient.user.first_name,
                'last_name': patient.user.last_name
            },
            'medical_info': {
                'phone_number': patient.phone_number,
                'birth_date': patient.birth_date.isoformat() if patient.birth_date else None,
                'address': patient.address,
                'blood_type': patient.blood_type,
                'allergies': patient.allergies,
                'medical_history': patient.medical_history
            },
            'link_info': {
                'is_linked': patient.is_linked,
                'linked_patient_name': patient.linked_patient.name if patient.linked_patient else None,
                'hospital_patient_id': patient.linked_patient.openemr_id if patient.linked_patient else None,
                'linked_at': patient.linked_at.isoformat() if patient.linked_at else None
            },
            'verification_info': {
                'is_verified': patient.is_verified,
                'verification_method': patient.verification_method,
                'verified_at': patient.verified_at.isoformat() if patient.verified_at else None
            },
            'created_at': patient.created_at.isoformat()
        }
        
        return Response({
            'success': True,
            'patient': patient_detail
        })
        
    except Exception as e:
        print(f"[ERROR] Flutter 환자 상세 조회 오류: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_flutter_patient(request):
    """Flutter 환자 생성"""
    try:
        user_data = request.data.get('user_data', {})
        patient_data = request.data.get('patient_data', {})
        
        # 사용자 생성 또는 기존 사용자 사용
        if 'user_id' in request.data:
            # 기존 사용자와 연결
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=request.data['user_id'])
        else:
            # 새 사용자 생성
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.create_user(
                username=user_data.get('username'),
                email=user_data.get('email'),
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                user_type='patient'
            )
            if 'password' in user_data:
                user.set_password(user_data['password'])
                user.save()
        
        # Flutter 환자 프로필 생성
        flutter_patient = FlutterPatientProfile.objects.create(
            user=user,
            phone_number=patient_data.get('phone_number', ''),
            birth_date=patient_data.get('birth_date'),
            address=patient_data.get('address', ''),
            blood_type=patient_data.get('blood_type', ''),
            allergies=patient_data.get('allergies', ''),
            medical_history=patient_data.get('medical_history', '')
        )
        
        return Response({
            'success': True,
            'message': 'Flutter 환자가 성공적으로 생성되었습니다.',
            'flutter_patient': {
                'id': str(flutter_patient.id),
                'patient_id': flutter_patient.patient_id,
                'user_id': user.id
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"[ERROR] Flutter 환자 생성 오류: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# === 회원가입 인증 코드 관리 ===
# 기존 generate_registration_code 함수에도 디버깅 추가
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_registration_code(request):
    """일반 회원가입 인증 코드 생성 (디버깅 추가)"""
    try:
        print(f"[DEBUG] 일반 인증 코드 생성 요청 - 사용자: {request.user.username}")
        print(f"[DEBUG] 사용자 타입: {getattr(request.user, 'user_type', 'unknown')}")
        
        # 권한 확인 (의료진만 생성 가능)
        if request.user.user_type not in ['doctor', 'nurse', 'admin', 'staff']:
            print(f"[ERROR] 권한 없음 - 사용자 타입: {request.user.user_type}")
            return Response({
                'success': False,
                'error': '인증 코드 생성 권한이 없습니다.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 인증 코드 생성 (6자리 숫자)
        while True:
            code = str(random.randint(100000, 999999))
            if not RegistrationCode.objects.filter(code=code, is_used=False).exists():
                break
        
        expires_at = timezone.now() + timezone.timedelta(hours=24)  # 24시간 유효
        
        registration_code = RegistrationCode.objects.create(
            code=code,
            purpose='registration',
            expires_at=expires_at,
            created_by=request.user,
            metadata={
                'created_for': 'general'
            }
        )
        
        print(f"[DEBUG] 일반 인증 코드 생성 완료: {code}")
        
        return Response({
            'success': True,
            'code': registration_code.code,
            'expires_at': registration_code.expires_at.isoformat(),
            'message': '회원가입 인증 코드가 생성되었습니다.'
        })
        
    except Exception as e:
        print(f"[ERROR] 인증 코드 생성 오류: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# verify_registration_code 함수에도 디버깅 추가
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_registration_code(request):
    """인증 코드 검증 (디버깅 추가)"""
    try:
        code = request.data.get('code')
        
        print(f"[DEBUG] 인증 코드 검증 요청: {code}")
        
        if not code:
            print(f"[ERROR] 인증 코드가 누락됨")
            return Response({
                'success': False,
                'error': '인증 코드가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            registration_code = RegistrationCode.objects.get(
                code=code,
                purpose='registration',
                is_used=False,
                expires_at__gt=timezone.now()
            )
            
            print(f"[DEBUG] 유효한 인증 코드 확인: {code}")
            print(f"[DEBUG] 코드 메타데이터: {registration_code.metadata}")
            
            return Response({
                'success': True,
                'message': '유효한 인증 코드입니다.',
                'expires_at': registration_code.expires_at.isoformat(),
                'metadata': registration_code.metadata
            })
            
        except RegistrationCode.DoesNotExist:
            print(f"[ERROR] 유효하지 않은 인증 코드: {code}")
            
            # 디버깅을 위해 관련 코드들 조회
            all_codes = RegistrationCode.objects.filter(code=code)
            if all_codes.exists():
                for existing_code in all_codes:
                    print(f"[DEBUG] 기존 코드 상태 - 사용됨: {existing_code.is_used}, 만료시간: {existing_code.expires_at}")
            else:
                print(f"[DEBUG] 해당 코드가 존재하지 않음: {code}")
            
            return Response({
                'success': False,
                'error': '유효하지 않거나 만료된 인증 코드입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"[ERROR] 인증 코드 검증 오류: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# patients/views.py에서 flutter_register_with_code 함수 수정

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def flutter_register_with_code(request):
    """인증 코드를 사용한 Flutter 앱 회원가입 (연결 상태 처리 추가)"""
    try:
        registration_code = request.data.get('registration_code')
        username = request.data.get('username')
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        email = request.data.get('email', '')
        
        # 추가 환자 정보
        phone_number = request.data.get('phone_number', '')
        birth_date = request.data.get('birth_date')
        address = request.data.get('address', '')
        emergency_contact = request.data.get('emergency_contact', '')  # ✅ 추가
        blood_type = request.data.get('blood_type', '')
        allergies = request.data.get('allergies', '')
        medical_history = request.data.get('medical_history', '')
        insurance_number = request.data.get('insurance_number', '')  # ✅ 추가
        
        print(f"[DEBUG] Flutter 회원가입 요청: {username}, 코드: {registration_code}")
        
        # 필수 필드 검증
        if not all([registration_code, username, password, password_confirm]):
            return Response({
                'success': False,
                'error': '필수 정보가 누락되었습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 비밀번호 확인
        if password != password_confirm:
            return Response({
                'success': False,
                'error': '비밀번호가 일치하지 않습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 인증 코드 검증
        try:
            code_obj = RegistrationCode.objects.get(
                code=registration_code,
                purpose='registration',
                is_used=False,
                expires_at__gt=timezone.now()
            )
            print(f"[DEBUG] 유효한 인증 코드 확인: {registration_code}")
        except RegistrationCode.DoesNotExist:
            print(f"[ERROR] 유효하지 않은 인증 코드: {registration_code}")
            return Response({
                'success': False,
                'error': '유효하지 않거나 만료된 인증 코드입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 사용자명 중복 검사
        if User.objects.filter(username=username).exists():
            return Response({
                'success': False,
                'error': '이미 사용 중인 사용자명입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 사용자 생성
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                user_type='patient'
            )
            user.set_password(password)
            user.save()
            
            # ✅ Flutter 환자 프로필 생성 (연결 상태 설정)
            flutter_patient = FlutterPatientProfile.objects.create(
                user=user,
                phone_number=phone_number,
                birth_date=birth_date if birth_date else None,
                address=address,
                emergency_contact=emergency_contact,  # ✅ 추가
                blood_type=blood_type,
                allergies=allergies,
                medical_history=medical_history,
                insurance_number=insurance_number,  # ✅ 추가
                is_verified=True,  # 인증 코드로 가입했으므로 인증됨
                is_linked=True,    # ✅ 연결 상태로 설정
                verification_method='registration_code',
                verified_at=timezone.now()
            )
            
            # 인증 코드 사용 처리
            code_obj.use_code(user)
            
            print(f"[DEBUG] Flutter 회원가입 완료: {user.username}, 환자 ID: {flutter_patient.patient_id}")
        
        # JWT 토큰 생성
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'Flutter 앱 회원가입이 완료되었습니다.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.user_type
            },
            'flutter_patient': {
                'id': str(flutter_patient.id),
                'patient_id': flutter_patient.patient_id,
                'is_verified': flutter_patient.is_verified,
                'is_linked': flutter_patient.is_linked  # ✅ 연결 상태 반환
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"[ERROR] Flutter 회원가입 오류: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_verification_code_for_profile(request):
    """환자 프로필 연결을 위한 인증 코드 생성"""
    try:
        flutter_patient_id = request.data.get('flutter_patient_id')
        purpose = request.data.get('purpose', 'profile_link')
        
        if not flutter_patient_id:
            return Response({
                'success': False,
                'error': 'flutter_patient_id가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            flutter_patient = FlutterPatientProfile.objects.get(patient_id=flutter_patient_id)
        except FlutterPatientProfile.DoesNotExist:
            return Response({
                'success': False,
                'error': '해당 Flutter 환자를 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 기존 인증 코드가 있다면 삭제
        PatientVerificationCode.objects.filter(
            flutter_patient=flutter_patient,
            purpose=purpose,
            is_used=False,
            expires_at__gt=timezone.now()
        ).delete()
        
        # 새 인증 코드 생성 (6자리 숫자)
        verification_code = ''.join(secrets.choice(string.digits) for _ in range(6))
        expires_at = timezone.now() + timezone.timedelta(hours=24)  # 24시간 유효
        
        # 인증 코드 저장
        code_obj = PatientVerificationCode.objects.create(
            flutter_patient=flutter_patient,
            code=verification_code,
            purpose=purpose,
            expires_at=expires_at,
            created_by=request.user
        )
        
        print(f"[DEBUG] 인증 코드 생성 완료: {verification_code} (Flutter 환자: {flutter_patient_id})")
        
        return Response({
            'success': True,
            'verification_code': verification_code,
            'expires_at': expires_at.isoformat(),
            'flutter_patient_id': flutter_patient_id,
            'purpose': purpose,
            'message': '인증 코드가 생성되었습니다. 24시간 동안 유효합니다.'
        })
        
    except Exception as e:
        print(f"[ERROR] 인증 코드 생성 오류: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_and_link_profile(request):
    """인증 코드로 환자 프로필 연결 (Flutter 앱에서 사용)"""
    try:
        verification_code = request.data.get('verification_code')
        hospital_patient_id = request.data.get('hospital_patient_id')
        
        if not verification_code or not hospital_patient_id:
            return Response({
                'success': False,
                'error': '인증 코드와 병원 환자 ID가 모두 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 인증 코드 확인
            code_obj = PatientVerificationCode.objects.get(
                code=verification_code,
                is_used=False,
                expires_at__gt=timezone.now(),
                purpose='profile_link'
            )
            flutter_patient = code_obj.flutter_patient
            
        except PatientVerificationCode.DoesNotExist:
            return Response({
                'success': False,
                'error': '유효하지 않거나 만료된 인증 코드입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 병원 환자 프로필 찾기
        try:
            hospital_patient = PatientProfile.objects.get(openemr_id=hospital_patient_id)
        except PatientProfile.DoesNotExist:
            return Response({
                'success': False,
                'error': '해당 병원 환자를 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 연결 수행
        with transaction.atomic():
            flutter_patient.link_to_hospital_patient(hospital_patient)
            
            # 인증 코드 사용 처리
            code_obj.use_code()
        
        print(f"[DEBUG] 인증 코드로 환자 프로필 연결 완료: {verification_code}")
        
        return Response({
            'success': True,
            'message': '인증 코드 검증 및 환자 프로필 연결이 완료되었습니다.',
            'linked_patient': {
                'flutter_patient_id': flutter_patient.patient_id,
                'hospital_patient_id': hospital_patient_id,
                'hospital_patient_name': hospital_patient.name,
                'linked_at': flutter_patient.linked_at.isoformat()
            }
        })
        
    except Exception as e:
        print(f"[ERROR] 인증 코드 검증 및 연결 오류: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# patients/views.py에서 link_to_patient_profile 함수 수정
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def link_to_patient_profile(request):
    """Flutter 환자를 병원 환자 프로필과 연결 (디버깅 추가)"""
    try:
        # ✅ 요청 정보 디버깅
        logger.info(f"[LINK_PROFILE] 요청 시작 - 메서드: {request.method}")
        logger.info(f"[LINK_PROFILE] 요청 사용자: {request.user.username} ({request.user.user_type})")
        logger.info(f"[LINK_PROFILE] 요청 헤더: {dict(request.headers)}")
        logger.info(f"[LINK_PROFILE] 요청 데이터: {request.data}")
        
        print(f"[DEBUG] === 환자 프로필 연결 요청 시작 ===")
        print(f"[DEBUG] HTTP 메서드: {request.method}")
        print(f"[DEBUG] 요청 URL: {request.get_full_path()}")
        print(f"[DEBUG] 요청 사용자: {request.user.username}")
        print(f"[DEBUG] 사용자 타입: {request.user.user_type}")
        print(f"[DEBUG] 인증 상태: {request.user.is_authenticated}")
        print(f"[DEBUG] 요청 데이터: {request.data}")
        print(f"[DEBUG] Content-Type: {request.content_type}")
        
        flutter_patient_id = request.data.get('flutter_patient_id')
        hospital_patient_id = request.data.get('hospital_patient_id')
        
        logger.info(f"[LINK_PROFILE] Flutter 환자 ID: {flutter_patient_id}")
        logger.info(f"[LINK_PROFILE] 병원 환자 ID: {hospital_patient_id}")
        
        print(f"[DEBUG] Flutter 환자 ID: {flutter_patient_id}")
        print(f"[DEBUG] 병원 환자 ID: {hospital_patient_id}")
        
        # 필수 파라미터 검증
        if not flutter_patient_id:
            error_msg = 'Flutter 환자 ID가 필요합니다.'
            logger.error(f"[LINK_PROFILE] {error_msg}")
            print(f"[ERROR] {error_msg}")
            return Response({
                'success': False,
                'error': error_msg
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if not hospital_patient_id:
            error_msg = '병원 환자 ID가 필요합니다.'
            logger.error(f"[LINK_PROFILE] {error_msg}")
            print(f"[ERROR] {error_msg}")
            return Response({
                'success': False,
                'error': error_msg
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Flutter 환자 찾기
        flutter_patient = None
        try:
            # 먼저 patient_id로 검색
            flutter_patient = FlutterPatientProfile.objects.get(patient_id=flutter_patient_id)
            logger.info(f"[LINK_PROFILE] Flutter 환자 찾음 (patient_id): {flutter_patient.patient_id}")
            print(f"[DEBUG] Flutter 환자 찾음 (patient_id): {flutter_patient.patient_id}")
        except FlutterPatientProfile.DoesNotExist:
            try:
                # UUID로 검색
                flutter_patient = FlutterPatientProfile.objects.get(id=flutter_patient_id)
                logger.info(f"[LINK_PROFILE] Flutter 환자 찾음 (UUID): {flutter_patient.patient_id}")
                print(f"[DEBUG] Flutter 환자 찾음 (UUID): {flutter_patient.patient_id}")
            except FlutterPatientProfile.DoesNotExist:
                error_msg = f'Flutter 환자를 찾을 수 없습니다: {flutter_patient_id}'
                logger.error(f"[LINK_PROFILE] {error_msg}")
                print(f"[ERROR] {error_msg}")
                
                # 디버깅을 위해 전체 Flutter 환자 목록 출력
                all_flutter_patients = FlutterPatientProfile.objects.all()[:5]
                print(f"[DEBUG] 전체 Flutter 환자 목록 (처음 5개):")
                for fp in all_flutter_patients:
                    print(f"  - ID: {fp.id}, Patient ID: {fp.patient_id}, User: {fp.user.username}")
                
                return Response({
                    'success': False,
                    'error': error_msg
                }, status=status.HTTP_404_NOT_FOUND)
        
        # 병원 환자 찾기
        try:
            hospital_patient = PatientProfile.objects.get(openemr_id=hospital_patient_id)
            logger.info(f"[LINK_PROFILE] 병원 환자 찾음: {hospital_patient.name} (OpenEMR ID: {hospital_patient_id})")
            print(f"[DEBUG] 병원 환자 찾음: {hospital_patient.name} (OpenEMR ID: {hospital_patient_id})")
        except PatientProfile.DoesNotExist:
            error_msg = f'OpenEMR ID {hospital_patient_id}에 해당하는 병원 환자를 찾을 수 없습니다.'
            logger.error(f"[LINK_PROFILE] {error_msg}")
            print(f"[ERROR] {error_msg}")
            
            # 디버깅을 위해 전체 병원 환자 목록 출력
            all_hospital_patients = PatientProfile.objects.all()[:5]
            print(f"[DEBUG] 전체 병원 환자 목록 (처음 5개):")
            for hp in all_hospital_patients:
                print(f"  - ID: {hp.id}, OpenEMR ID: {hp.openemr_id}, Name: {hp.name}")
            
            return Response({
                'success': False,
                'error': error_msg
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 이미 연결된 환자인지 확인
        if flutter_patient.linked_patient_profile:
            error_msg = f'이미 다른 병원 환자와 연결되어 있습니다: {flutter_patient.linked_patient_profile.name}'
            logger.warning(f"[LINK_PROFILE] {error_msg}")
            print(f"[WARNING] {error_msg}")
            return Response({
                'success': False,
                'error': '이미 다른 병원 환자와 연결되어 있습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 연결 설정
        flutter_patient.linked_patient_profile = hospital_patient
        #flutter_patient.is_linked = True
        flutter_patient.linked_at = timezone.now()
        flutter_patient.save()
        
        logger.info(f"[LINK_PROFILE] 환자 프로필 연결 완료")
        logger.info(f"[LINK_PROFILE] Flutter 환자: {flutter_patient.patient_id}")
        logger.info(f"[LINK_PROFILE] 병원 환자: {hospital_patient.name}")
        
        # ✅ is_linked는 property로 자동 계산됨
        print(f"[DEBUG] === 환자 프로필 연결 완료 ===")
        print(f"[DEBUG] Flutter 환자: {flutter_patient.patient_id}")
        print(f"[DEBUG] 병원 환자: {hospital_patient.name}")
        print(f"[DEBUG] 연결 시간: {flutter_patient.linked_at}")
        print(f"[DEBUG] 연결 상태: {flutter_patient.is_linked}")  # property 값 확인
        
        response_data = {
            'success': True,
            'message': '환자 프로필이 성공적으로 연결되었습니다.',
            'flutter_patient': {
                'id': str(flutter_patient.id),
                'patient_id': flutter_patient.patient_id,
                'is_linked': flutter_patient.is_linked,
                'linked_at': flutter_patient.linked_at.isoformat() if flutter_patient.linked_at else None
            },
            'hospital_patient': {
                'id': str(hospital_patient.id),
                'name': hospital_patient.name,
                'openemr_id': hospital_patient.openemr_id
            }
        }
        
        logger.info(f"[LINK_PROFILE] 응답 데이터: {response_data}")
        print(f"[DEBUG] 응답 데이터: {response_data}")
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        error_msg = f"환자 프로필 연결 오류: {str(e)}"
        logger.error(f"[LINK_PROFILE] {error_msg}")
        print(f"[ERROR] {error_msg}")
        
        import traceback
        traceback.print_exc()
        
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# === 기존 임상 데이터 관리 API (그대로 유지) ===
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_clinical_data(request, patient_id):
    """환자의 임상 데이터를 저장하는 API"""
    try:
        with transaction.atomic():
            patient = get_object_or_404(PatientProfile, id=patient_id)
            
            # 요청 데이터에서 cancer_type과 clinical_data 추출
            cancer_type = request.data.get('cancer_type')
            clinical_data = request.data.get('clinical_data', {})
            
            if not cancer_type:
                return Response(
                    {'error': 'cancer_type is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 유효한 cancer_type인지 확인
            valid_cancer_types = [choice[0] for choice in ClinicalData.CANCER_TYPE_CHOICES]
            if cancer_type not in valid_cancer_types:
                return Response(
                    {'error': f'Invalid cancer_type. Must be one of: {valid_cancer_types}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # ClinicalData 인스턴스 생성
            clinical_instance = ClinicalData(
                patient=patient,
                cancer_type=cancer_type,
                created_by=request.user
            )
            
            # 필드별로 데이터 매핑 (모든 새로 추가된 필드 포함)
            field_mapping = {
                # 생존 정보
                'vital_status': 'vital_status',
                'days_to_death': 'days_to_death',
                'days_to_last_follow_up': 'days_to_last_follow_up',
                
                # 환자 기본 정보
                'age_at_diagnosis': 'age_at_diagnosis',
                'gender': 'gender',
                'race': 'race',
                'ethnicity': 'ethnicity',
                'submitter_id': 'submitter_id',
                'year_of_diagnosis': 'year_of_diagnosis',
                'age_at_index': 'age_at_index',
                'days_to_birth': 'days_to_birth',
                'year_of_birth': 'year_of_birth',
                'year_of_death': 'year_of_death',
                
                # 병기 정보 (Pathologic)
                'ajcc_pathologic_stage': 'ajcc_pathologic_stage',
                'ajcc_pathologic_t': 'ajcc_pathologic_t',
                'ajcc_pathologic_n': 'ajcc_pathologic_n',
                'ajcc_pathologic_m': 'ajcc_pathologic_m',
                'ajcc_staging_system_edition': 'ajcc_staging_system_edition',
                
                # 병기 정보 (Clinical) - 신장암
                'ajcc_clinical_stage': 'ajcc_clinical_stage',
                'ajcc_clinical_t': 'ajcc_clinical_t',
                'ajcc_clinical_n': 'ajcc_clinical_n',
                'ajcc_clinical_m': 'ajcc_clinical_m',
                
                # 종양 특성
                'tumor_grade': 'tumor_grade',
                'morphology': 'morphology',
                'primary_diagnosis': 'primary_diagnosis',
                'classification_of_tumor': 'classification_of_tumor',
                'residual_disease': 'residual_disease',
                'icd_10_code': 'icd_10_code',
                'tumor_of_origin': 'tumor_of_origin',
                
                # 치료 정보 (기본)
                'prior_treatment': 'prior_treatment',
                'prior_malignancy': 'prior_malignancy',
                'synchronous_malignancy': 'synchronous_malignancy',
                'treatments_pharmaceutical_treatment_type': 'treatments_pharmaceutical_treatment_type',
                'treatments_pharmaceutical_treatment_intent_type': 'treatments_pharmaceutical_treatment_intent_type',
                'treatments_pharmaceutical_treatment_or_therapy': 'treatments_pharmaceutical_treatment_or_therapy',
                'treatments_pharmaceutical_treatment_outcome': 'treatments_pharmaceutical_treatment_outcome',
                'treatments_radiation_treatment_type': 'treatments_radiation_treatment_type',
                'treatments_radiation_treatment_or_therapy': 'treatments_radiation_treatment_or_therapy',
                'treatments_radiation_treatment_intent_type': 'treatments_radiation_treatment_intent_type',
                'treatments_radiation_treatment_outcome': 'treatments_radiation_treatment_outcome',
                
                # 간암 특이적
                'child_pugh_classification': 'child_pugh_classification',
                'ishak_fibrosis_score': 'ishak_fibrosis_score',
                
                # 신장암/위암 특이적
                'tobacco_smoking_status': 'tobacco_smoking_status',
                'pack_years_smoked': 'pack_years_smoked',
                'tobacco_smoking_quit_year': 'tobacco_smoking_quit_year',
                'tobacco_smoking_onset_year': 'tobacco_smoking_onset_year',
                'laterality': 'laterality',
                'site_of_resection_or_biopsy': 'site_of_resection_or_biopsy',
                'tissue_or_organ_of_origin': 'tissue_or_organ_of_origin',
                'days_to_diagnosis': 'days_to_diagnosis',
                
                # 위암 특이적
                'last_known_disease_status': 'last_known_disease_status',
                'days_to_recurrence': 'days_to_recurrence',
                'progression_or_recurrence': 'progression_or_recurrence',
                'days_to_last_known_disease_status': 'days_to_last_known_disease_status',
                'cause_of_death': 'cause_of_death',
                
                # 치료 세부 정보 (약물)
                'treatments_pharmaceutical_regimen_or_line_of_therapy': 'treatments_pharmaceutical_regimen_or_line_of_therapy',
                'treatments_pharmaceutical_number_of_cycles': 'treatments_pharmaceutical_number_of_cycles',
                'treatments_pharmaceutical_days_to_treatment_start': 'treatments_pharmaceutical_days_to_treatment_start',
                'treatments_pharmaceutical_initial_disease_status': 'treatments_pharmaceutical_initial_disease_status',
                'treatments_pharmaceutical_therapeutic_agents': 'treatments_pharmaceutical_therapeutic_agents',
                'treatments_pharmaceutical_treatment_dose': 'treatments_pharmaceutical_treatment_dose',
                'treatments_pharmaceutical_treatment_dose_units': 'treatments_pharmaceutical_treatment_dose_units',
                'treatments_pharmaceutical_prescribed_dose_units': 'treatments_pharmaceutical_prescribed_dose_units',
                'treatments_pharmaceutical_number_of_fractions': 'treatments_pharmaceutical_number_of_fractions',
                'treatments_pharmaceutical_treatment_anatomic_sites': 'treatments_pharmaceutical_treatment_anatomic_sites',
                'treatments_pharmaceutical_prescribed_dose': 'treatments_pharmaceutical_prescribed_dose',
                'treatments_pharmaceutical_clinical_trial_indicator': 'treatments_pharmaceutical_clinical_trial_indicator',
                'treatments_pharmaceutical_route_of_administration': 'treatments_pharmaceutical_route_of_administration',
                'treatments_pharmaceutical_course_number': 'treatments_pharmaceutical_course_number',
                
                # 치료 세부 정보 (방사선)
                'treatments_radiation_days_to_treatment_start': 'treatments_radiation_days_to_treatment_start',
                'treatments_radiation_number_of_cycles': 'treatments_radiation_number_of_cycles',
                'treatments_radiation_treatment_dose': 'treatments_radiation_treatment_dose',
                'treatments_radiation_treatment_dose_units': 'treatments_radiation_treatment_dose_units',
                'treatments_radiation_therapeutic_agents': 'treatments_radiation_therapeutic_agents',
                'treatments_radiation_days_to_treatment_end': 'treatments_radiation_days_to_treatment_end',
                'treatments_radiation_clinical_trial_indicator': 'treatments_radiation_clinical_trial_indicator',
                'treatments_radiation_number_of_fractions': 'treatments_radiation_number_of_fractions',
                'treatments_radiation_treatment_anatomic_sites': 'treatments_radiation_treatment_anatomic_sites',
                'treatments_radiation_prescribed_dose_units': 'treatments_radiation_prescribed_dose_units',
                'treatments_radiation_prescribed_dose': 'treatments_radiation_prescribed_dose',
                'treatments_radiation_route_of_administration': 'treatments_radiation_route_of_administration',
                'treatments_radiation_course_number': 'treatments_radiation_course_number',
            }
            
            # 숫자 필드 목록 (확장)
            integer_fields = [
                'days_to_death', 'days_to_last_follow_up', 'age_at_diagnosis', 
                'pack_years_smoked', 'days_to_recurrence', 'year_of_diagnosis',
                'age_at_index', 'days_to_birth', 'year_of_birth', 'year_of_death',
                'tobacco_smoking_quit_year', 'tobacco_smoking_onset_year', 'days_to_diagnosis',
                'days_to_last_known_disease_status', 'treatments_pharmaceutical_number_of_cycles',
                'treatments_pharmaceutical_days_to_treatment_start', 'treatments_pharmaceutical_number_of_fractions',
                'treatments_pharmaceutical_course_number', 'treatments_radiation_days_to_treatment_start',
                'treatments_radiation_number_of_cycles', 'treatments_radiation_days_to_treatment_end',
                'treatments_radiation_number_of_fractions', 'treatments_radiation_course_number'
            ]
            
            # 필드 값 설정
            additional_data = {}
            for field_key, model_field in field_mapping.items():
                if field_key in clinical_data:
                    value = clinical_data[field_key]
                    if value:  # 빈 문자열이 아닌 경우만
                        if hasattr(clinical_instance, model_field):
                            # 숫자 필드 처리
                            if model_field in integer_fields:
                                try:
                                    setattr(clinical_instance, model_field, int(value))
                                except (ValueError, TypeError):
                                    logger.warning(f"Invalid integer value for {model_field}: {value}")
                                    pass
                            else:
                                setattr(clinical_instance, model_field, str(value))
                        else:
                            # 모델에 없는 필드는 additional_data에 저장
                            additional_data[field_key] = value
            
            # 추가 데이터가 있으면 JSON 필드에 저장
            if additional_data:
                clinical_instance.additional_data = additional_data
            
            # 데이터베이스에 저장
            clinical_instance.save()
            
            logger.info(f"Clinical data saved for patient {patient.name} (ID: {patient.id})")
            
            return Response({
                'message': 'Clinical data saved successfully',
                'id': clinical_instance.id,
                'patient': patient.name,
                'cancer_type': clinical_instance.get_cancer_type_display(),
                'form_date': clinical_instance.form_date.isoformat()
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Error saving clinical data: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_clinical_data(request, patient_id):
    """환자의 임상 데이터 목록을 조회하는 API"""
    try:
        patient = get_object_or_404(PatientProfile, id=patient_id)
        clinical_data = ClinicalData.objects.filter(patient=patient).order_by('-form_date')
        
        data = []
        for record in clinical_data:
            data.append({
                'id': record.id,
                'cancer_type': record.cancer_type,
                'cancer_type_display': record.get_cancer_type_display(),
                'form_date': record.form_date.isoformat(),
                'vital_status': record.vital_status,
                'ajcc_pathologic_stage': record.ajcc_pathologic_stage,
                'child_pugh_classification': record.child_pugh_classification,
                'age_at_diagnosis': record.calculated_age_at_diagnosis,
                'created_by': record.created_by.username if record.created_by else None,
                'created_at': record.created_at.isoformat(),
                'updated_at': record.updated_at.isoformat()
            })
        
        return Response({
            'patient': {
                'id': patient.id,
                'name': patient.name,
                'openemr_id': patient.openemr_id
            },
            'clinical_data': data,
            'total_count': len(data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving clinical data: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_clinical_data_detail(request, patient_id, clinical_data_id):
    """특정 임상 데이터의 상세 정보를 조회하는 API"""
    try:
        patient = get_object_or_404(PatientProfile, id=patient_id)
        clinical_data = get_object_or_404(ClinicalData, id=clinical_data_id, patient=patient)
        
        # 모든 필드 데이터 수집 (새로 추가된 필드들 포함)
        data = {
            'id': clinical_data.id,
            'patient': {
                'id': patient.id,
                'name': patient.name,
                'openemr_id': patient.openemr_id
            },
            'cancer_type': clinical_data.cancer_type,
            'cancer_type_display': clinical_data.get_cancer_type_display(),
            'form_date': clinical_data.form_date.isoformat(),
            
            # 생존 정보
            'vital_status': clinical_data.vital_status,
            'days_to_death': clinical_data.days_to_death,
            'days_to_last_follow_up': clinical_data.days_to_last_follow_up,
            'cause_of_death': clinical_data.cause_of_death,
            
            # 환자 기본 정보
            'age_at_diagnosis': clinical_data.calculated_age_at_diagnosis,
            'gender': clinical_data.gender,
            'race': clinical_data.race,
            'ethnicity': clinical_data.ethnicity,
            'submitter_id': clinical_data.submitter_id,
            'year_of_diagnosis': clinical_data.year_of_diagnosis,
            'age_at_index': clinical_data.age_at_index,
            'days_to_birth': clinical_data.days_to_birth,
            'year_of_birth': clinical_data.year_of_birth,
            'year_of_death': clinical_data.year_of_death,
            
            # 병기 정보 (Pathologic)
            'ajcc_pathologic_stage': clinical_data.ajcc_pathologic_stage,
            'ajcc_pathologic_t': clinical_data.ajcc_pathologic_t,
            'ajcc_pathologic_n': clinical_data.ajcc_pathologic_n,
            'ajcc_pathologic_m': clinical_data.ajcc_pathologic_m,
            'ajcc_staging_system_edition': clinical_data.ajcc_staging_system_edition,
            
            # 병기 정보 (Clinical)
            'ajcc_clinical_stage': clinical_data.ajcc_clinical_stage,
            'ajcc_clinical_t': clinical_data.ajcc_clinical_t,
            'ajcc_clinical_n': clinical_data.ajcc_clinical_n,
            'ajcc_clinical_m': clinical_data.ajcc_clinical_m,
            
            # 종양 특성
            'tumor_grade': clinical_data.tumor_grade,
            'morphology': clinical_data.morphology,
            'primary_diagnosis': clinical_data.primary_diagnosis,
            'classification_of_tumor': clinical_data.classification_of_tumor,
            'residual_disease': clinical_data.residual_disease,
            'icd_10_code': clinical_data.icd_10_code,
            'tumor_of_origin': clinical_data.tumor_of_origin,
            
            # 치료 정보 (기본)
            'prior_treatment': clinical_data.prior_treatment,
            'prior_malignancy': clinical_data.prior_malignancy,
            'synchronous_malignancy': clinical_data.synchronous_malignancy,
            'treatments_pharmaceutical_treatment_type': clinical_data.treatments_pharmaceutical_treatment_type,
            'treatments_pharmaceutical_treatment_intent_type': clinical_data.treatments_pharmaceutical_treatment_intent_type,
            'treatments_pharmaceutical_treatment_or_therapy': clinical_data.treatments_pharmaceutical_treatment_or_therapy,
            'treatments_pharmaceutical_treatment_outcome': clinical_data.treatments_pharmaceutical_treatment_outcome,
            'treatments_radiation_treatment_type': clinical_data.treatments_radiation_treatment_type,
            'treatments_radiation_treatment_or_therapy': clinical_data.treatments_radiation_treatment_or_therapy,
            'treatments_radiation_treatment_intent_type': clinical_data.treatments_radiation_treatment_intent_type,
            'treatments_radiation_treatment_outcome': clinical_data.treatments_radiation_treatment_outcome,
            
            # 간암 특이적
            'child_pugh_classification': clinical_data.child_pugh_classification,
            'ishak_fibrosis_score': clinical_data.ishak_fibrosis_score,
            
            # 신장암/위암 특이적
            'tobacco_smoking_status': clinical_data.tobacco_smoking_status,
            'pack_years_smoked': clinical_data.pack_years_smoked,
            'tobacco_smoking_quit_year': clinical_data.tobacco_smoking_quit_year,
            'tobacco_smoking_onset_year': clinical_data.tobacco_smoking_onset_year,
            'laterality': clinical_data.laterality,
            'site_of_resection_or_biopsy': clinical_data.site_of_resection_or_biopsy,
            'tissue_or_organ_of_origin': clinical_data.tissue_or_organ_of_origin,
            'days_to_diagnosis': clinical_data.days_to_diagnosis,
            
            # 위암 특이적
            'last_known_disease_status': clinical_data.last_known_disease_status,
            'days_to_recurrence': clinical_data.days_to_recurrence,
            'progression_or_recurrence': clinical_data.progression_or_recurrence,
            'days_to_last_known_disease_status': clinical_data.days_to_last_known_disease_status,
            
            # 치료 세부 정보 (약물)
            'treatments_pharmaceutical_regimen_or_line_of_therapy': clinical_data.treatments_pharmaceutical_regimen_or_line_of_therapy,
            'treatments_pharmaceutical_number_of_cycles': clinical_data.treatments_pharmaceutical_number_of_cycles,
            'treatments_pharmaceutical_days_to_treatment_start': clinical_data.treatments_pharmaceutical_days_to_treatment_start,
            'treatments_pharmaceutical_initial_disease_status': clinical_data.treatments_pharmaceutical_initial_disease_status,
            'treatments_pharmaceutical_therapeutic_agents': clinical_data.treatments_pharmaceutical_therapeutic_agents,
            'treatments_pharmaceutical_treatment_dose': clinical_data.treatments_pharmaceutical_treatment_dose,
            'treatments_pharmaceutical_treatment_dose_units': clinical_data.treatments_pharmaceutical_treatment_dose_units,
            'treatments_pharmaceutical_prescribed_dose_units': clinical_data.treatments_pharmaceutical_prescribed_dose_units,
            'treatments_pharmaceutical_number_of_fractions': clinical_data.treatments_pharmaceutical_number_of_fractions,
            'treatments_pharmaceutical_treatment_anatomic_sites': clinical_data.treatments_pharmaceutical_treatment_anatomic_sites,
            'treatments_pharmaceutical_prescribed_dose': clinical_data.treatments_pharmaceutical_prescribed_dose,
            'treatments_pharmaceutical_clinical_trial_indicator': clinical_data.treatments_pharmaceutical_clinical_trial_indicator,
            'treatments_pharmaceutical_route_of_administration': clinical_data.treatments_pharmaceutical_route_of_administration,
            'treatments_pharmaceutical_course_number': clinical_data.treatments_pharmaceutical_course_number,
            
            # 치료 세부 정보 (방사선)
            'treatments_radiation_days_to_treatment_start': clinical_data.treatments_radiation_days_to_treatment_start,
            'treatments_radiation_number_of_cycles': clinical_data.treatments_radiation_number_of_cycles,
            'treatments_radiation_treatment_dose': clinical_data.treatments_radiation_treatment_dose,
            'treatments_radiation_treatment_dose_units': clinical_data.treatments_radiation_treatment_dose_units,
            'treatments_radiation_therapeutic_agents': clinical_data.treatments_radiation_therapeutic_agents,
            'treatments_radiation_days_to_treatment_end': clinical_data.treatments_radiation_days_to_treatment_end,
            'treatments_radiation_clinical_trial_indicator': clinical_data.treatments_radiation_clinical_trial_indicator,
            'treatments_radiation_number_of_fractions': clinical_data.treatments_radiation_number_of_fractions,
            'treatments_radiation_treatment_anatomic_sites': clinical_data.treatments_radiation_treatment_anatomic_sites,
            'treatments_radiation_prescribed_dose_units': clinical_data.treatments_radiation_prescribed_dose_units,
            'treatments_radiation_prescribed_dose': clinical_data.treatments_radiation_prescribed_dose,
            'treatments_radiation_route_of_administration': clinical_data.treatments_radiation_route_of_administration,
            'treatments_radiation_course_number': clinical_data.treatments_radiation_course_number,
            
            # 추가 데이터
            'additional_data': clinical_data.additional_data,
            
            # 메타데이터
            'created_by': clinical_data.created_by.username if clinical_data.created_by else None,
            'created_at': clinical_data.created_at.isoformat(),
            'updated_at': clinical_data.updated_at.isoformat()
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving clinical data detail: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_clinical_data(request, patient_id, clinical_data_id):
    """임상 데이터를 삭제하는 API"""
    try:
        patient = get_object_or_404(PatientProfile, id=patient_id)
        clinical_data = get_object_or_404(ClinicalData, id=clinical_data_id, patient=patient)
        
        clinical_data.delete()
        
        logger.info(f"Clinical data deleted for patient {patient.name} (ID: {patient.id})")
        
        return Response({
            'message': 'Clinical data deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error deleting clinical data: {str(e)}")
        return Response(
            {'error': f'Internal server error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# patients/views.py의 generate_registration_code_for_patient 함수 수정

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_registration_code_for_patient(request):
    """특정 병원 환자를 위한 회원가입 인증 코드 생성 (다양한 ID 형식 지원)"""
    try:
        hospital_patient_id = request.data.get('hospital_patient_id')
        
        print(f"[DEBUG] 환자별 인증 코드 생성 요청 - 사용자: {request.user.username}")
        print(f"[DEBUG] 요청 데이터: {request.data}")
        print(f"[DEBUG] 병원 환자 ID: {hospital_patient_id} (타입: {type(hospital_patient_id)})")
        
        if not hospital_patient_id:
            print(f"[ERROR] 병원 환자 ID가 누락됨")
            return Response({
                'success': False,
                'error': '병원 환자 ID가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 병원 환자 확인 - 다양한 필드로 검색
        hospital_patient = None
        
        # 1. UUID 형식인지 확인하고 ID로 검색
        try:
            import uuid
            if isinstance(hospital_patient_id, str) and len(hospital_patient_id) == 36:
                uuid.UUID(hospital_patient_id)  # UUID 형식 검증
                hospital_patient = PatientProfile.objects.get(id=hospital_patient_id)
                print(f"[DEBUG] UUID로 병원 환자 찾음: {hospital_patient.name}")
        except (ValueError, PatientProfile.DoesNotExist):
            print(f"[DEBUG] UUID 검색 실패, 다른 방법으로 시도")
        
        # 2. OpenEMR ID로 검색
        if not hospital_patient:
            try:
                hospital_patient = PatientProfile.objects.get(openemr_id=str(hospital_patient_id))
                print(f"[DEBUG] OpenEMR ID로 병원 환자 찾음: {hospital_patient.name}")
            except PatientProfile.DoesNotExist:
                print(f"[DEBUG] OpenEMR ID 검색 실패")
        
        # 3. 정수 ID를 문자열로 변환해서 OpenEMR ID로 검색
        if not hospital_patient:
            try:
                hospital_patient = PatientProfile.objects.get(openemr_id=str(hospital_patient_id))
                print(f"[DEBUG] 문자열 변환 후 OpenEMR ID로 병원 환자 찾음: {hospital_patient.name}")
            except PatientProfile.DoesNotExist:
                print(f"[DEBUG] 문자열 변환 후 OpenEMR ID 검색 실패")
        
        # 4. 이름으로 부분 검색 (마지막 시도)
        if not hospital_patient:
            try:
                patients = PatientProfile.objects.filter(
                    models.Q(name__icontains=str(hospital_patient_id)) |
                    models.Q(first_name__icontains=str(hospital_patient_id)) |
                    models.Q(last_name__icontains=str(hospital_patient_id))
                )
                if patients.exists():
                    hospital_patient = patients.first()
                    print(f"[DEBUG] 이름으로 병원 환자 찾음: {hospital_patient.name}")
            except Exception as e:
                print(f"[DEBUG] 이름 검색 중 오류: {e}")
        
        if not hospital_patient:
            print(f"[ERROR] 병원 환자를 찾을 수 없음: {hospital_patient_id}")
            
            # 디버깅을 위해 전체 환자 목록 출력 (처음 5개만)
            all_patients = PatientProfile.objects.all()[:5]
            print(f"[DEBUG] 전체 환자 목록 (처음 5개):")
            for patient in all_patients:
                print(f"  - ID: {patient.id}, OpenEMR ID: {patient.openemr_id}, 이름: {patient.name}")
            
            return Response({
                'success': False,
                'error': '해당 병원 환자를 찾을 수 없습니다.',
                'debug_info': f'검색한 ID: {hospital_patient_id} (타입: {type(hospital_patient_id)})'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 인증 코드 생성
        import random
        while True:
            code = str(random.randint(100000, 999999))
            if not RegistrationCode.objects.filter(code=code, is_used=False).exists():
                break
        
        from django.utils import timezone
        expires_at = timezone.now() + timezone.timedelta(hours=24)  # 24시간 유효
        
        registration_code = RegistrationCode.objects.create(
            code=code,
            purpose='registration',
            expires_at=expires_at,
            created_by=request.user,
            metadata={
                'hospital_patient_id': str(hospital_patient.id),
                'hospital_patient_name': hospital_patient.name,
                'hospital_patient_openemr_id': hospital_patient.openemr_id,
                'created_for': 'specific_patient',
                'search_key': str(hospital_patient_id)  # 원래 검색에 사용된 키
            }
        )
        
        print(f"[DEBUG] 환자별 인증 코드 생성 완료: {code} (환자: {hospital_patient.name})")
        
        return Response({
            'success': True,
            'code': registration_code.code,
            'expires_at': registration_code.expires_at.isoformat(),
            'hospital_patient': {
                'id': str(hospital_patient.id),
                'name': hospital_patient.name,
                'openemr_id': hospital_patient.openemr_id
            },
            'message': f'{hospital_patient.name} 환자를 위한 회원가입 인증 코드가 생성되었습니다.'
        })
        
    except Exception as e:
        print(f"[ERROR] 환자별 인증 코드 생성 오류: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PatientOmicsRequestListView(APIView):
    """
    특정 환자의 모든 오믹스 분석 '요청' 목록을 가져오는 API
    (이제 patients 앱에 속합니다)
    """
    def get(self, request, patient_id, format=None):
        # 이 코드의 내용은 수정할 필요가 없습니다.
        requests = OmicsRequest.objects.filter(patient__id=patient_id, status=OmicsRequest.StatusChoices.COMPLETED).order_by('-request_timestamp')
        serializer = OmicsRequestListSerializer(requests, many=True)
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_latest_clinical_data(request, patient_id):
    """
    특정 환자의 가장 최신 임상 데이터를 가져오는 API.
    암 종류에 따라 다른 모델을 조회하도록 확장할 수 있습니다.
    """
    try:
        # 현재는 LiverCancerClinicalData만 있다고 가정합니다.
        # 최신 데이터를 가져오기 위해 order_by와 first()를 사용합니다.
        clinical_data = LiverCancerClinicalData.objects.filter(patient_id=patient_id).order_by('-created_at').first()
        if clinical_data:
            serializer = LiverCancerClinicalDataSerializer(clinical_data)
            return Response(serializer.data)
        else:
            return Response({"message": "해당 환자의 임상 데이터가 없습니다."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# patients/views.py에 추가
@api_view(['POST'])
@permission_classes([AllowAny])
def flutter_register_with_code_v2(request):
    """Flutter 앱 전용 회원가입 (is_linked 필드 제외)"""
    try:
        data = request.data
        username = data.get('username')
        password = data.get('password')
        password_confirm = data.get('password_confirm')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        registration_code = data.get('registration_code')
        
        # 선택적 필드들
        phone_number = data.get('phone_number', '')
        birth_date = data.get('birth_date', '')
        address = data.get('address', '')
        emergency_contact = data.get('emergency_contact', '')
        blood_type = data.get('blood_type', '')
        allergies = data.get('allergies', '')
        medical_history = data.get('medical_history', '')
        insurance_number = data.get('insurance_number', '')
        
        logger.debug(f"Flutter 회원가입 V2 요청: {username}, 코드: {registration_code}")
        
        # 기존 검증 로직들...
        if not all([username, password, password_confirm, first_name, last_name, email, registration_code]):
            return Response({
                'success': False,
                'error': '필수 필드가 누락되었습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if password != password_confirm:
            return Response({
                'success': False,
                'error': '비밀번호가 일치하지 않습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 인증 코드 검증
        try:
            reg_code = RegistrationCode.objects.get(
                code=registration_code,
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except RegistrationCode.DoesNotExist:
            return Response({
                'success': False,
                'error': '유효하지 않거나 만료된 인증 코드입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 사용자명, 이메일 중복 확인
        if User.objects.filter(username=username).exists():
            return Response({
                'success': False,
                'error': '이미 존재하는 사용자명입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'error': '이미 존재하는 이메일입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 사용자 생성
        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email,
            user_type='patient'
        )
        
        # 병원 환자 프로필과 연결 시도
        hospital_patient = None
        if reg_code.linked_patient_profile:
            hospital_patient = reg_code.linked_patient_profile
        
        # ✅ Flutter 환자 프로필 생성 (is_linked 필드 완전 제외)
        flutter_patient_data = {
            'user': user,
            'phone_number': phone_number,
            'address': address,
            'emergency_contact': emergency_contact,
            'blood_type': blood_type,
            'allergies': allergies,
            'medical_history': medical_history,
            'insurance_number': insurance_number,
        }
        
        # birth_date 처리
        if birth_date:
            flutter_patient_data['birth_date'] = birth_date
        
        # 병원 환자와 연결 정보
        if hospital_patient:
            flutter_patient_data['linked_patient_profile'] = hospital_patient
            flutter_patient_data['linked_at'] = timezone.now()
            flutter_patient_data['is_verified'] = True
            flutter_patient_data['verification_method'] = 'registration_code'
            flutter_patient_data['verified_at'] = timezone.now()
        
        flutter_patient = FlutterPatientProfile.objects.create(**flutter_patient_data)
        
        # 인증 코드 사용 처리
        reg_code.is_used = True
        reg_code.used_at = timezone.now()
        reg_code.used_by = user
        reg_code.save()
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # ✅ 응답 데이터 구성
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name(),
            'user_type': user.user_type,
            'flutter_patient_id': flutter_patient.patient_id,
            'is_linked': hospital_patient is not None,  # ✅ 직접 계산
            'linked_patient_id': hospital_patient.id if hospital_patient else None,
        }
        
        return Response({
            'success': True,
            'message': '회원가입이 완료되었습니다.',
            'user': user_data,
            'tokens': {
                'access': str(access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Flutter 회원가입 V2 오류: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
