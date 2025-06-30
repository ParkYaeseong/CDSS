# message_service/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.db.models import Q
from accounts.models import MedicalStaff
from patients.models import FlutterPatientProfile
from .models import Message

User = get_user_model()

class MessageListView(APIView):
    """메시지 목록 조회"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            print(f"메시지 목록 조회 요청 - 사용자: {user.username}")
            
            # ✅ timestamp -> created_at으로 수정
            received_messages = Message.objects.filter(recipient=user).select_related('sender').order_by('-created_at')
            sent_messages = Message.objects.filter(sender=user).select_related('recipient').order_by('-created_at')
            
            message_data = {
                'received': [],
                'sent': []
            }
            
            for message in received_messages:
                message_data['received'].append({
                    'id': message.id,
                    'sender_id': message.sender.id,
                    'sender_name': message.sender.get_full_name() or message.sender.username,
                    'sender_username': message.sender.username,
                    'sender_type': getattr(message.sender, 'user_type', 'unknown'),
                    'subject': message.subject,
                    'content': message.content,
                    'message_type': message.message_type,
                    'is_read': message.is_read,
                    'timestamp': message.created_at.isoformat(),  # ✅ created_at 사용
                })
            
            for message in sent_messages:
                message_data['sent'].append({
                    'id': message.id,
                    'recipient_id': message.recipient.id,
                    'recipient_name': message.recipient.get_full_name() or message.recipient.username,
                    'recipient_username': message.recipient.username,
                    'recipient_type': getattr(message.recipient, 'user_type', 'unknown'),
                    'subject': message.subject,
                    'content': message.content,
                    'message_type': message.message_type,
                    'timestamp': message.created_at.isoformat(),  # ✅ created_at 사용
                })
            
            unread_count = received_messages.filter(is_read=False).count()
            print(f"메시지 조회 완료 - 받은 메시지: {len(message_data['received'])}개, 보낸 메시지: {len(message_data['sent'])}개, 읽지 않음: {unread_count}개")
            
            return Response({
                'success': True,
                'messages': message_data,
                'unread_count': unread_count
            })
            
        except Exception as e:
            print(f"메시지 목록 조회 오류: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MessageSendView(APIView):
    """메시지 전송"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            sender = request.user
            recipient_id = request.data.get('recipient_id')
            subject = request.data.get('subject', '').strip()
            content = request.data.get('content', '').strip()
            message_type = request.data.get('message_type', 'general')
            
            print(f"메시지 전송 요청 - 보내는 사람: {sender.username}, 받는 사람 ID: {recipient_id}")
            print(f"제목: {subject}, 내용 길이: {len(content)}")
            
            # 입력 검증
            if not recipient_id:
                return Response({
                    'success': False,
                    'error': '받는 사람을 선택해주세요'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            if not content:
                return Response({
                    'success': False,
                    'error': '내용을 입력해주세요'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                recipient = User.objects.get(id=recipient_id, is_active=True)
                print(f"받는 사람 확인: {recipient.username} ({recipient.get_full_name()})")
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': '받는 사람을 찾을 수 없습니다'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 자기 자신에게 메시지 보내기 방지
            if sender.id == recipient.id:
                return Response({
                    'success': False,
                    'error': '자기 자신에게는 메시지를 보낼 수 없습니다'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            message = Message.objects.create(
                sender=sender,
                recipient=recipient,
                subject=subject,
                content=content,
                message_type=message_type
            )
            
            print(f"메시지 전송 성공: ID {message.id}, {sender.username} -> {recipient.username}")
            
            return Response({
                'success': True,
                'message': '메시지가 전송되었습니다',
                'sent_message': {
                    'id': message.id,
                    'subject': message.subject,
                    'content': message.content,
                    'recipient_name': recipient.get_full_name() or recipient.username,
                    'timestamp': message.created_at.isoformat()  # ✅ created_at 사용
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"메시지 전송 오류: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MessageReadView(APIView):
    """메시지 읽음 처리"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, message_id):
        try:
            user = request.user
            print(f"메시지 읽음 처리 요청 - 사용자: {user.username}, 메시지 ID: {message_id}")
            
            try:
                message = Message.objects.get(id=message_id, recipient=user)
                if not message.is_read:
                    message.is_read = True
                    message.save()
                    print(f"메시지 읽음 처리 완료: {message_id}")
                else:
                    print(f"이미 읽은 메시지: {message_id}")
                
                return Response({
                    'success': True,
                    'message': '메시지가 읽음 처리되었습니다'
                })
            except Message.DoesNotExist:
                print(f"메시지를 찾을 수 없음: {message_id}")
                return Response({
                    'success': False,
                    'error': '메시지를 찾을 수 없습니다'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            print(f"메시지 읽음 처리 오류: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserSearchView(APIView):
    """사용자 검색 - 의료진 + Flutter 환자 (간호사, 원무과 포함)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user_type = request.GET.get('user_type', '')
            search_term = request.GET.get('search', '')
            
            print(f"[DEBUG] 사용자 검색 - 타입: {user_type}, 검색어: {search_term}")
            
            users = []
            
            # ✅ 의료진 검색 (의사, 간호사, 원무과, 영상의학과 모두 포함)
            if not user_type or user_type in ['doctor', 'nurse', 'admin', 'staff', 'radio']:
                medical_staff_qs = MedicalStaff.objects.select_related('user')
                
                # 특정 타입 필터링
                if user_type:
                    medical_staff_qs = medical_staff_qs.filter(staff_type=user_type)
                
                # 검색어 필터링
                if search_term:
                    medical_staff_qs = medical_staff_qs.filter(
                        Q(user__username__icontains=search_term) |
                        Q(user__first_name__icontains=search_term) |
                        Q(user__last_name__icontains=search_term) |
                        Q(department__icontains=search_term)
                    )
                
                print(f"[DEBUG] MedicalStaff 쿼리셋 개수: {medical_staff_qs.count()}")
                
                for staff in medical_staff_qs:
                    print(f"[DEBUG] MedicalStaff: {staff.user.username}, staff_type: {staff.staff_type}, user_type: {staff.user.user_type}")
                    users.append({
                        'id': staff.user.id,  # User ID (메시지 전송용)
                        'medical_staff_id': staff.id,  # MedicalStaff ID (예약용)
                        'username': staff.user.username,
                        'name': staff.user.get_full_name() or staff.user.username,
                        'user_type': staff.user.user_type,  # ← 수정: User 모델의 user_type 사용
                        'staff_type': staff.staff_type,     # ← 추가: MedicalStaff의 staff_type도 포함
                        'email': staff.user.email or '',
                        'department': staff.department or '',
                        'specialization': staff.specialization or '',
                        'source': 'medical_staff'
                    })
            
            # ✅ User 모델에서 직접 원무과 사용자 추가 검색 (fallback)
            if not user_type or user_type == 'staff':
                direct_staff_users = User.objects.filter(
                    user_type='staff',
                    is_active=True
                ).exclude(id__in=[u['id'] for u in users])  # 중복 제거
                
                if search_term:
                    direct_staff_users = direct_staff_users.filter(
                        Q(username__icontains=search_term) |
                        Q(first_name__icontains=search_term) |
                        Q(last_name__icontains=search_term)
                    )
                
                print(f"[DEBUG] 직접 User 모델에서 staff 사용자: {direct_staff_users.count()}명")
                
                for user in direct_staff_users:
                    print(f"[DEBUG] 직접 User: {user.username}, user_type: {user.user_type}")
                    users.append({
                        'id': user.id,
                        'username': user.username,
                        'name': user.get_full_name() or user.username,
                        'user_type': user.user_type,
                        'email': user.email or '',
                        'department': '원무과',
                        'source': 'direct_user'
                    })
            
            # ✅ Flutter 환자 검색 (patient 타입일 때)
            if not user_type or user_type == 'patient':
                flutter_patients_qs = FlutterPatientProfile.objects.select_related('user')
                
                if search_term:
                    flutter_patients_qs = flutter_patients_qs.filter(
                        Q(user__username__icontains=search_term) |
                        Q(user__first_name__icontains=search_term) |
                        Q(user__last_name__icontains=search_term) |
                        Q(patient_id__icontains=search_term)
                    )
                
                for patient in flutter_patients_qs:
                    users.append({
                        'id': patient.user.id,  # User ID (메시지 전송용)
                        'flutter_patient_id': patient.id,
                        'username': patient.user.username,
                        'name': patient.user.get_full_name() or patient.user.username,
                        'user_type': 'patient',
                        'email': patient.user.email or '',
                        'patient_id': patient.patient_id,
                        'phone': patient.phone_number or '',
                        'source': 'flutter_patient'
                    })
            
            print(f"[DEBUG] 최종 검색 결과: {len(users)}명")
            for user in users:
                print(f"  - {user['name']} ({user['user_type']}) - ID: {user['id']} - Source: {user.get('source', 'unknown')}")
            
            return Response({
                'success': True,
                'users': users,
                'total_count': len(users),
                'search_term': search_term,
                'user_type_filter': user_type
            })
            
        except Exception as e:
            print(f"[ERROR] 사용자 검색 오류: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ✅ 함수 기반 뷰 (기존 호환성 유지)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """사용자 검색 함수 기반 뷰 (기존 호환성)"""
    view = UserSearchView()
    view.request = request
    return view.get(request)
