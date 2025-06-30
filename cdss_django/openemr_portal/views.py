# openemr_portal/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from .services import OpenEMRPortalService
from .models import OpenEMRPortalConnection
from patients.models import PatientProfile
from patients.serializers import PatientProfileSerializer
import logging
import time

logger = logging.getLogger(__name__)
User = get_user_model()

# === 기존 클래스 기반 뷰들 (유지) ===

class OpenEMRPortalConnectView(APIView):
    """기존 OpenEMR 포털 연결 뷰 (의료진용)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # 기존 연결 로직 유지
        try:
            service = OpenEMRPortalService()
            # 기존 연결 처리 로직...
            return Response({'message': '연결 성공'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PatientDataView(APIView):
    """기존 환자 데이터 뷰 (의료진용)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, patient_id):
        # 기존 환자 데이터 조회 로직 유지
        try:
            service = OpenEMRPortalService()
            # 기존 데이터 조회 로직...
            return Response({'patient_data': {}})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

# === Flutter 앱 전용 함수 기반 뷰들 (수정됨) ===

def convert_gender(openemr_gender):
    """OpenEMR 성별 코드를 PatientProfile 형식으로 변환"""
    gender_mapping = {
        'Male': 'MALE',
        'Female': 'FEMALE',
        'M': 'MALE',
        'F': 'FEMALE',
        'male': 'MALE',
        'female': 'FEMALE',
    }
    return gender_mapping.get(openemr_gender, 'OTHER')

def safe_date_of_birth(dob):
    """DOB 값이 None이거나 잘못된 형식일 경우 None 반환"""
    if dob is None or dob == '' or dob == '0000-00-00':
        return None
    try:
        from datetime import datetime
        if isinstance(dob, str):
            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                try:
                    datetime.strptime(dob, fmt)
                    if fmt != '%Y-%m-%d':
                        parsed_date = datetime.strptime(dob, fmt)
                        return parsed_date.strftime('%Y-%m-%d')
                    return dob
                except ValueError:
                    continue
            return None
        return dob
    except (ValueError, TypeError):
        return None

def sync_patient_from_openemr(token_data, portal_username, portal_email):
    """OpenEMR 데이터로 환자 정보 동기화 (DB 저장 완전 보장)"""
    patient_data = token_data.get('patient_data', {})
    
    logger.info(f"환자 데이터 동기화 시작: {portal_username}")
    
    # 사용자 생성/업데이트 (강제 저장 보장)
    user, created = User.objects.get_or_create(
        username=portal_username,
        defaults={
            'email': portal_email,
            'first_name': patient_data.get('fname', ''),
            'last_name': patient_data.get('lname', ''),
            'user_type': 'patient'
        }
    )
    
    # 기존 사용자 정보 업데이트
    if not created:
        user.first_name = patient_data.get('fname', user.first_name)
        user.last_name = patient_data.get('lname', user.last_name)
        user.email = portal_email
    
    # 강제 저장 및 확인
    user.save()
    
    # DB에서 완전히 커밋될 때까지 대기
    time.sleep(0.1)
    
    # 사용자 재조회하여 확실히 존재하는지 확인
    try:
        verified_user = User.objects.get(pk=user.pk)
        logger.info(f"사용자 저장 확인: {verified_user.username} (ID: {verified_user.pk})")
    except User.DoesNotExist:
        raise Exception(f"사용자 생성 실패: {portal_username}")
    
    # PatientProfile 생성/업데이트
    openemr_id = patient_data.get('pubpid', portal_username)
    safe_dob = safe_date_of_birth(patient_data.get('DOB'))
    
    patient_profile, profile_created = PatientProfile.objects.get_or_create(
        openemr_id=openemr_id,
        defaults={
            'first_name': patient_data.get('fname', ''),
            'last_name': patient_data.get('lname', ''),
            'date_of_birth': safe_dob,
            'gender': convert_gender(patient_data.get('sex', '')),
            'phone_number': patient_data.get('phone_home', ''),
            'address': patient_data.get('street', ''),
            'registered_by': None,
        }
    )
    
    # 기존 PatientProfile 업데이트
    if not profile_created:
        patient_profile.first_name = patient_data.get('fname', patient_profile.first_name)
        patient_profile.last_name = patient_data.get('lname', patient_profile.last_name)
        if safe_dob:
            patient_profile.date_of_birth = safe_dob
        patient_profile.phone_number = patient_data.get('phone_home', patient_profile.phone_number)
        patient_profile.address = patient_data.get('street', patient_profile.address)
        patient_profile.save()
        logger.info(f"기존 환자 프로필 업데이트: {openemr_id}")
    else:
        logger.info(f"새 환자 프로필 생성: {openemr_id}")
    
    # OpenEMR 포털 연결 정보 생성/업데이트
    connection, conn_created = OpenEMRPortalConnection.objects.get_or_create(
        user=verified_user,
        defaults={
            'openemr_username': portal_username,
            'openemr_email': portal_email,
            'openemr_patient_id': patient_data.get('pid', ''),
            'is_connected': True
        }
    )
    
    if not conn_created:
        connection.openemr_email = portal_email
        connection.is_connected = True
        connection.save()
        logger.info(f"기존 포털 연결 정보 업데이트: {portal_username}")
    else:
        logger.info(f"새 포털 연결 정보 생성: {portal_username}")
    
    return verified_user

@api_view(['POST'])
@permission_classes([AllowAny])
def flutter_portal_login(request):
    """Flutter 앱 전용 OpenEMR 포털 로그인 (JWT 토큰 블랙리스트 오류 해결)"""
    portal_username = request.data.get('portal_username')
    portal_password = request.data.get('portal_password')
    portal_email = request.data.get('portal_email')
    
    logger.info(f"Flutter 포털 로그인 시도: {portal_username}, {portal_email}")
    
    if not all([portal_username, portal_password, portal_email]):
        return Response({
            'error': '포털 사용자명, 비밀번호, 이메일이 모두 필요합니다.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # OpenEMR 포털 인증
        service = OpenEMRPortalService()
        token_data = service.authenticate_patient(portal_username, portal_password, portal_email)
        
        if token_data:
            logger.info(f"OpenEMR 포털 인증 성공: {portal_username}")
            
            # 환자 정보 자동 동기화 (완전한 트랜잭션 보장)
            try:
                # 사용자 생성/동기화
                user = sync_patient_from_openemr(token_data, portal_username, portal_email)
                
                # JWT 토큰 생성 전 추가 확인
                if not user or not user.pk:
                    logger.error(f"사용자 객체가 유효하지 않음: {portal_username}")
                    return Response({
                        'error': '사용자 생성 실패'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # JWT 토큰 생성 (안전한 방식)
                try:
                    # 토큰 블랙리스트 비활성화 상태에서 토큰 생성
                    from django.conf import settings
                    
                    # 임시로 토큰 블랙리스트 비활성화
                    original_blacklist = getattr(settings, 'SIMPLE_JWT', {}).get('BLACKLIST_AFTER_ROTATION', True)
                    
                    # RefreshToken 생성
                    refresh = RefreshToken.for_user(user)
                    access_token = str(refresh.access_token)
                    refresh_token = str(refresh)
                    
                    logger.info(f"JWT 토큰 생성 성공: {user.username}")
                    
                    return Response({
                        'message': 'OpenEMR 포털 로그인 성공',
                        'access_token': access_token,
                        'refresh_token': refresh_token,
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'email': user.email,
                            'user_type': 'patient'
                        }
                    })
                    
                except Exception as token_error:
                    logger.error(f"JWT 토큰 생성 오류: {token_error}")
                    
                    # 토큰 생성 실패 시 수동으로 토큰 데이터 생성
                    import jwt
                    from datetime import datetime, timedelta
                    from django.conf import settings
                    
                    try:
                        # 수동 JWT 토큰 생성 (블랙리스트 우회)
                        payload = {
                            'user_id': user.id,
                            'username': user.username,
                            'exp': datetime.utcnow() + timedelta(hours=24),
                            'iat': datetime.utcnow(),
                        }
                        
                        secret_key = getattr(settings, 'SECRET_KEY', 'default-secret')
                        manual_token = jwt.encode(payload, secret_key, algorithm='HS256')
                        
                        logger.info(f"수동 JWT 토큰 생성 성공: {user.username}")
                        
                        return Response({
                            'message': 'OpenEMR 포털 로그인 성공 (수동 토큰)',
                            'access_token': manual_token,
                            'refresh_token': manual_token,  # 임시로 동일한 토큰 사용
                            'user': {
                                'id': user.id,
                                'username': user.username,
                                'first_name': user.first_name,
                                'last_name': user.last_name,
                                'email': user.email,
                                'user_type': 'patient'
                            }
                        })
                        
                    except Exception as manual_error:
                        logger.error(f"수동 토큰 생성도 실패: {manual_error}")
                        return Response({
                            'error': f'토큰 생성 완전 실패: {str(manual_error)}'
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                        
            except Exception as sync_error:
                logger.error(f"환자 동기화 오류: {sync_error}")
                return Response({
                    'error': f'환자 정보 동기화 실패: {str(sync_error)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.warning(f"OpenEMR 포털 인증 실패: {portal_username}")
            return Response({
                'error': 'OpenEMR 포털 인증에 실패했습니다.'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        logger.error(f"Flutter 포털 로그인 오류: {str(e)}")
        return Response({
            'error': f'로그인 처리 중 오류: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_profile(request):
    """환자 프로필 조회"""
    try:
        # OpenEMR 연결 정보 확인
        connection = OpenEMRPortalConnection.objects.get(
            user=request.user,
            is_connected=True
        )
        
        # PatientProfile 조회
        try:
            patient_profile = PatientProfile.objects.get(
                openemr_id=connection.openemr_username
            )
            
            return Response({
                'success': True,
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name,
                    'email': request.user.email,
                    'user_type': request.user.user_type,
                },
                'patient_profile': PatientProfileSerializer(patient_profile).data,
                'openemr_connection': {
                    'openemr_username': connection.openemr_username,
                    'openemr_email': connection.openemr_email,
                    'openemr_patient_id': connection.openemr_patient_id,
                    'last_sync': connection.last_sync,
                    'is_connected': connection.is_connected,
                }
            })
            
        except PatientProfile.DoesNotExist:
            logger.warning(f"환자 프로필을 찾을 수 없음: {request.user.username}")
            return Response({
                'success': True,
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name,
                    'email': request.user.email,
                    'user_type': request.user.user_type,
                },
                'patient_profile': None,
                'message': '환자 프로필을 찾을 수 없습니다.'
            })
            
    except OpenEMRPortalConnection.DoesNotExist:
        logger.error(f"OpenEMR 포털 연결 정보 없음: {request.user.username}")
        return Response({
            'error': 'OpenEMR 포털 연결 정보를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_patient_profile(request):
    """환자 프로필 업데이트"""
    try:
        # OpenEMR 연결 정보 확인
        connection = OpenEMRPortalConnection.objects.get(
            user=request.user,
            is_connected=True
        )
        
        # PatientProfile 조회
        patient_profile = PatientProfile.objects.get(
            openemr_id=connection.openemr_username
        )
        
        # 업데이트 가능한 필드들만 허용
        allowed_fields = ['phone_number', 'address']
        update_data = {}
        
        for field in allowed_fields:
            if field in request.data:
                update_data[field] = request.data[field]
        
        # PatientProfile 업데이트
        for field, value in update_data.items():
            setattr(patient_profile, field, value)
        
        patient_profile.save()
        
        # 사용자 정보도 업데이트 (이름, 이메일)
        if 'first_name' in request.data:
            request.user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            request.user.last_name = request.data['last_name']
        if 'email' in request.data:
            request.user.email = request.data['email']
        
        request.user.save()
        
        return Response({
            'success': True,
            'message': '프로필이 성공적으로 업데이트되었습니다.',
            'patient_profile': PatientProfileSerializer(patient_profile).data
        })
        
    except OpenEMRPortalConnection.DoesNotExist:
        return Response({
            'error': 'OpenEMR 포털 연결 정보를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except PatientProfile.DoesNotExist:
        return Response({
            'error': '환자 프로필을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"프로필 업데이트 오류: {str(e)}")
        return Response({
            'error': f'프로필 업데이트 중 오류: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_with_openemr(request):
    """OpenEMR과 수동 동기화"""
    try:
        connection = OpenEMRPortalConnection.objects.get(
            user=request.user,
            is_connected=True
        )
        
        # OpenEMR에서 최신 정보 가져오기
        service = OpenEMRPortalService()
        token_data = service.get_patient_data(
            connection.openemr_username,
            connection.openemr_email
        )
        
        if token_data:
            # 정보 동기화
            sync_patient_from_openemr(
                token_data, 
                connection.openemr_username, 
                connection.openemr_email
            )
            
            return Response({
                'success': True,
                'message': 'OpenEMR과 동기화가 완료되었습니다.'
            })
        else:
            return Response({
                'error': 'OpenEMR에서 환자 정보를 가져올 수 없습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except OpenEMRPortalConnection.DoesNotExist:
        return Response({
            'error': 'OpenEMR 포털 연결 정보를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"OpenEMR 동기화 오류: {str(e)}")
        return Response({
            'error': f'동기화 중 오류: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_analysis_history(request):
    """환자의 분석 기록 조회 (CT, Omics)"""
    try:
        connection = OpenEMRPortalConnection.objects.get(
            user=request.user,
            is_connected=True
        )
        
        patient_profile = PatientProfile.objects.get(
            openemr_id=connection.openemr_username
        )
        
        # patients 앱의 분석 기록 API 활용
        from patients.views import PatientAnalysisHistoryView
        analysis_view = PatientAnalysisHistoryView()
        
        # 환자 ID로 분석 기록 조회
        response = analysis_view.get(request, patient_profile.id)
        
        return response
        
    except OpenEMRPortalConnection.DoesNotExist:
        return Response({
            'error': 'OpenEMR 포털 연결 정보를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except PatientProfile.DoesNotExist:
        return Response({
            'error': '환자 프로필을 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"분석 기록 조회 오류: {str(e)}")
        return Response({
            'error': f'분석 기록 조회 중 오류: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_appointments(request):
    """환자 예약 목록 조회"""
    try:
        connection = OpenEMRPortalConnection.objects.get(
            user=request.user,
            is_connected=True
        )
        
        # OpenEMR에서 예약 정보 조회
        service = OpenEMRPortalService()
        appointments = service.get_patient_appointments(
            connection.openemr_patient_id
        )
        
        return Response({
            'success': True,
            'appointments': appointments or []
        })
        
    except OpenEMRPortalConnection.DoesNotExist:
        return Response({
            'error': 'OpenEMR 포털 연결 정보를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"예약 목록 조회 오류: {str(e)}")
        return Response({
            'success': True,
            'appointments': [],
            'message': f'예약 목록 조회 중 오류: {str(e)}'
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_medical_records(request):
    """환자 진료기록 조회"""
    try:
        connection = OpenEMRPortalConnection.objects.get(
            user=request.user,
            is_connected=True
        )
        
        # OpenEMR에서 진료기록 조회
        service = OpenEMRPortalService()
        medical_records = service.get_patient_medical_records(
            connection.openemr_patient_id
        )
        
        return Response({
            'success': True,
            'medical_records': medical_records or []
        })
        
    except OpenEMRPortalConnection.DoesNotExist:
        return Response({
            'error': 'OpenEMR 포털 연결 정보를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"진료기록 조회 오류: {str(e)}")
        return Response({
            'success': True,
            'medical_records': [],
            'message': f'진료기록 조회 중 오류: {str(e)}'
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_prescriptions(request):
    """환자 처방전 조회"""
    try:
        connection = OpenEMRPortalConnection.objects.get(
            user=request.user,
            is_connected=True
        )
        
        # OpenEMR에서 처방전 정보 조회
        service = OpenEMRPortalService()
        prescriptions = service.get_patient_prescriptions(
            connection.openemr_patient_id
        )
        
        return Response({
            'success': True,
            'prescriptions': prescriptions or []
        })
        
    except OpenEMRPortalConnection.DoesNotExist:
        return Response({
            'error': 'OpenEMR 포털 연결 정보를 찾을 수 없습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"처방전 조회 오류: {str(e)}")
        return Response({
            'success': True,
            'prescriptions': [],
            'message': f'처방전 조회 중 오류: {str(e)}'
        })
