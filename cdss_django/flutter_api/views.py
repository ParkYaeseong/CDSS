# flutter_api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Q
from datetime import datetime, timedelta
import json

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Flutter 앱용 사용자 프로필 조회"""
    try:
        user = request.user
        
        profile_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}".strip(),
            'user_type': getattr(user, 'user_type', 'patient'),
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
        }
        
        # 추가 사용자 정보 (User 모델에 따라 조정)
        if hasattr(user, 'phone_number'):
            profile_data['phone_number'] = user.phone_number
        if hasattr(user, 'birth_date'):
            profile_data['birth_date'] = user.birth_date.isoformat() if user.birth_date else None
        if hasattr(user, 'gender'):
            profile_data['gender'] = user.gender
        if hasattr(user, 'address'):
            profile_data['address'] = user.address
        
        return Response({
            'success': True,
            'user': profile_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'사용자 프로필 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Flutter 앱용 사용자 프로필 업데이트"""
    try:
        user = request.user
        
        # 업데이트 가능한 필드들
        updatable_fields = ['first_name', 'last_name', 'email']
        
        for field in updatable_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        # 추가 필드들 (User 모델에 따라 조정)
        if hasattr(user, 'phone_number') and 'phone_number' in request.data:
            user.phone_number = request.data['phone_number']
        if hasattr(user, 'birth_date') and 'birth_date' in request.data:
            user.birth_date = request.data['birth_date']
        if hasattr(user, 'gender') and 'gender' in request.data:
            user.gender = request.data['gender']
        if hasattr(user, 'address') and 'address' in request.data:
            user.address = request.data['address']
        
        user.save()
        
        return Response({
            'success': True,
            'message': '프로필이 성공적으로 업데이트되었습니다'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'프로필 업데이트 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_app_settings(request):
    """Flutter 앱 설정 조회"""
    try:
        user = request.user
        
        # 기본 앱 설정
        app_settings = {
            'theme': 'light',  # light, dark, system
            'language': 'ko',  # ko, en
            'notifications': {
                'push_enabled': True,
                'emergency_alerts': True,
                'appointment_reminders': True,
                'medication_reminders': True,
                'health_tips': True
            },
            'privacy': {
                'location_sharing': True,
                'data_analytics': True,
                'crash_reporting': True
            },
            'features': {
                'biometric_login': False,
                'auto_backup': True,
                'offline_mode': True
            }
        }
        
        # 사용자별 설정이 있다면 덮어쓰기
        # (실제 구현에서는 UserSettings 모델을 만들어 관리)
        
        return Response({
            'success': True,
            'settings': app_settings
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'앱 설정 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_app_settings(request):
    """Flutter 앱 설정 업데이트"""
    try:
        user = request.user
        settings_data = request.data
        
        # 실제 구현에서는 UserSettings 모델에 저장
        # 현재는 성공 응답만 반환
        
        return Response({
            'success': True,
            'message': '설정이 성공적으로 저장되었습니다'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'설정 저장 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_app_notifications(request):
    """Flutter 앱 알림 목록 조회"""
    try:
        user = request.user
        
        # 실제 구현에서는 Notification 모델에서 조회
        notifications = []
        
        # 예시 알림 구조 (실제 데이터로 대체 필요)
        sample_notifications = [
            {
                'id': 1,
                'type': 'appointment',
                'title': '예약 알림',
                'message': '내일 오후 2시 진료 예약이 있습니다.',
                'is_read': False,
                'created_at': timezone.now().isoformat(),
                'data': {'appointment_id': 123}
            }
        ]
        
        return Response({
            'success': True,
            'notifications': notifications,
            'unread_count': len([n for n in notifications if not n['is_read']])
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'알림 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """알림 읽음 처리"""
    try:
        # 실제 구현에서는 Notification 모델 업데이트
        
        return Response({
            'success': True,
            'message': '알림이 읽음 처리되었습니다'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'알림 읽음 처리 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_app_version_info(request):
    """Flutter 앱 버전 정보 조회"""
    try:
        version_info = {
            'current_version': '1.0.0',
            'latest_version': '1.0.0',
            'update_required': False,
            'update_available': False,
            'update_url': '',
            'release_notes': '',
            'maintenance_mode': False,
            'maintenance_message': ''
        }
        
        return Response({
            'success': True,
            'version_info': version_info
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'버전 정보 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_app_error(request):
    """Flutter 앱 오류 로그 수집"""
    try:
        user = request.user
        error_data = request.data
        
        # 오류 로그 저장 (실제 구현에서는 ErrorLog 모델 사용)
        error_log = {
            'user_id': user.id,
            'error_type': error_data.get('error_type', 'unknown'),
            'error_message': error_data.get('error_message', ''),
            'stack_trace': error_data.get('stack_trace', ''),
            'device_info': error_data.get('device_info', {}),
            'app_version': error_data.get('app_version', ''),
            'timestamp': timezone.now().isoformat()
        }
        
        # 로그 저장 로직 (실제 구현 필요)
        
        return Response({
            'success': True,
            'message': '오류 로그가 저장되었습니다'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'오류 로그 저장 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_feedback(request):
    """Flutter 앱 피드백 전송"""
    try:
        user = request.user
        feedback_data = request.data
        
        # 피드백 저장 (실제 구현에서는 Feedback 모델 사용)
        feedback = {
            'user_id': user.id,
            'category': feedback_data.get('category', 'general'),
            'subject': feedback_data.get('subject', ''),
            'message': feedback_data.get('message', ''),
            'rating': feedback_data.get('rating', 0),
            'device_info': feedback_data.get('device_info', {}),
            'timestamp': timezone.now().isoformat()
        }
        
        # 피드백 저장 로직 (실제 구현 필요)
        
        return Response({
            'success': True,
            'message': '피드백이 성공적으로 전송되었습니다'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'피드백 전송 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Flutter 앱용 헬스 체크"""
    try:
        return Response({
            'success': True,
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'server_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_dashboard_summary(request):
    """Flutter 앱 대시보드 요약 정보"""
    try:
        user = request.user
        
        # 각 서비스별 요약 정보 수집
        summary = {
            'user_info': {
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'user_type': getattr(user, 'user_type', 'patient')
            },
            'quick_stats': {
                'total_searches': 0,
                'total_favorites': 0,
                'recent_activities': 0
            },
            'services': {
                'hospital_search': {'available': True, 'last_used': None},
                'emergency_service': {'available': True, 'last_used': None},
                'pharmacy_service': {'available': True, 'last_used': None},
                'appointment_service': {'available': True, 'last_used': None},
                'message_service': {'available': True, 'last_used': None},
                'medical_records': {'available': True, 'last_used': None}
            },
            'notifications': {
                'unread_count': 0,
                'latest': []
            }
        }
        
        return Response({
            'success': True,
            'dashboard': summary
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'대시보드 요약 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
