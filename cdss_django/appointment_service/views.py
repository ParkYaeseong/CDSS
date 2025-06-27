# appointment_service/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q
from .models import Appointment
from .serializers import AppointmentSerializer, AppointmentCreateSerializer, DoctorSerializer
from patients.models import FlutterPatientProfile, PatientProfile
from accounts.models import MedicalStaff

class AppointmentViewSet(viewsets.ModelViewSet):
    """예약 관리 ViewSet (CRUD 모든 기능) - Flutter 환자 지원"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'patient':
            # Flutter 환자인지 확인
            try:
                flutter_patient = FlutterPatientProfile.objects.get(user=user)
                return Appointment.objects.filter(flutter_patient=flutter_patient)
            except FlutterPatientProfile.DoesNotExist:
                return Appointment.objects.none()
        
        elif user.user_type in ['doctor', 'nurse']:
            try:
                medical_staff = user.medical_staff
                return Appointment.objects.filter(doctor=medical_staff)
            except MedicalStaff.DoesNotExist:
                return Appointment.objects.none()
        
        elif user.user_type in ['admin', 'staff']:
            return Appointment.objects.all()
        
        return Appointment.objects.none()
    
    def create(self, request, *args, **kwargs):
        """예약 생성 - Flutter 환자 자동 설정"""
        try:
            data = request.data.copy()
            
            print(f"[DEBUG] 받은 예약 데이터: {data}")
            print(f"[DEBUG] 요청 사용자: {request.user}")
            print(f"[DEBUG] 사용자 타입: {request.user.user_type}")
            
            # ✅ Flutter 환자인 경우 자동으로 flutter_patient 설정
            if request.user.user_type == 'patient':
                try:
                    from patients.models import FlutterPatientProfile
                    flutter_patient = FlutterPatientProfile.objects.get(user=request.user)
                    data['flutter_patient'] = flutter_patient.id
                    print(f"[DEBUG] Flutter 환자 자동 설정: {flutter_patient.id} ({flutter_patient.patient_id})")
                except FlutterPatientProfile.DoesNotExist:
                    print(f"[ERROR] Flutter 환자 프로필을 찾을 수 없음: {request.user.username}")
                    return Response({
                        'success': False,
                        'error': 'Flutter 환자 프로필을 찾을 수 없습니다.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"[DEBUG] 처리된 예약 데이터: {data}")
            
            serializer = self.get_serializer(data=data)
            if serializer.is_valid():
                appointment = serializer.save()
                
                return Response({
                    'success': True,
                    'message': '예약이 성공적으로 생성되었습니다',
                    'appointment': AppointmentSerializer(appointment).data
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"[ERROR] 시리얼라이저 오류: {serializer.errors}")
                return Response({
                    'success': False,
                    'error': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:  # ✅ 수정: 콜론 추가
            print(f"[ERROR] 예약 생성 오류: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def list(self, request, *args, **kwargs):
        """예약 목록 조회"""
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            
            return Response({
                'success': True,
                'appointments': serializer.data,
                'total_count': queryset.count()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        """예약 수정"""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                appointment = serializer.save()
                
                return Response({
                    'success': True,
                    'message': '예약이 수정되었습니다',
                    'appointment': AppointmentSerializer(appointment).data
                })
            else:
                return Response({
                    'success': False,
                    'error': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        """예약 삭제"""
        try:
            instance = self.get_object()
            instance.delete()
            
            return Response({
                'success': True,
                'message': '예약이 삭제되었습니다'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """예약 상태 업데이트"""
        try:
            user = request.user
            
            if user.user_type not in ['doctor', 'nurse', 'admin', 'staff']:
                return Response({
                    'success': False,
                    'error': '권한이 없습니다'
                }, status=status.HTTP_403_FORBIDDEN)
            
            appointment = self.get_object()
            new_status = request.data.get('status')
            
            if new_status in ['confirmed', 'cancelled', 'completed', 'in_progress']:
                appointment.status = new_status
                if 'notes' in request.data:
                    appointment.notes = request.data['notes']
                appointment.save()
                
                return Response({
                    'success': True,
                    'message': '예약 상태가 업데이트되었습니다',
                    'appointment': AppointmentSerializer(appointment).data
                })
            else:
                return Response({
                    'success': False,
                    'error': '유효하지 않은 상태입니다'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def doctor_appointments(self, request):
        """특정 의사의 예약 조회"""
        try:
            doctor_id = request.query_params.get('doctor_id')
            if not doctor_id:
                return Response({
                    'success': False,
                    'error': 'doctor_id가 필요합니다'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                doctor = MedicalStaff.objects.get(id=doctor_id)
            except MedicalStaff.DoesNotExist:
                return Response({
                    'success': False,
                    'error': '의료진을 찾을 수 없습니다'
                }, status=status.HTTP_404_NOT_FOUND)
            
            appointments = Appointment.objects.filter(doctor=doctor)
            serializer = AppointmentSerializer(appointments, many=True)
            
            return Response({
                'success': True,
                'appointments': serializer.data,
                'doctor_name': doctor.user.get_full_name()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DoctorListView(APIView):
    """의료진 목록 조회 (예약용)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            doctors = MedicalStaff.objects.filter(staff_type='doctor')
            serializer = DoctorSerializer(doctors, many=True)
            
            return Response({
                'success': True,
                'doctors': serializer.data,
                'total_count': doctors.count()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
