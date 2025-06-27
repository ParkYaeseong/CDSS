# medical_records_service/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from accounts.models import FlutterPatient, MedicalStaff
from appointment_service.models import Appointment
from .models import MedicalRecord

class MedicalRecordsView(APIView):
    """Flutter 앱 전용 진료기록 조회 (OpenEMR 독립적)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # OpenEMR 연동이 활성화된 경우 (기존 기능 유지)
            if getattr(settings, 'OPENEMR_INTEGRATION_ENABLED', False):
                return self._get_openemr_records(request)
            
            # OpenEMR 없이 자체 데이터베이스에서 조회 (새 기능)
            return self._get_local_records(request)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_openemr_records(self, request):
        """OpenEMR에서 진료기록 조회 (기존 기능 유지)"""
        from openemr_portal.services import OpenEMRPortalService
        from openemr_portal.models import OpenEMRPortalConnection
        
        user = request.user
        connection = OpenEMRPortalConnection.objects.filter(
            user=user, 
            is_connected=True
        ).first()
        
        if not connection:
            return Response({
                'error': 'OpenEMR 포털에 연결되지 않았습니다'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        service = OpenEMRPortalService()
        cache_key = f"portal_token_{connection.openemr_username}"
        token_data = service.cache.get(cache_key)
        
        if not token_data:
            return Response({
                'error': '토큰이 만료되었습니다. 다시 로그인해주세요'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        patient_id = connection.openemr_patient_id or "1"
        encounters = service.get_patient_encounters(
            patient_id, 
            token_data['access_token']
        )
        
        return Response({
            'medical_records': encounters,
            'message': '진료기록 조회 성공',
            'source': 'openemr'
        })
        
    def _get_local_records(self, request):
        """로컬 데이터베이스에서 진료기록 조회 (새 기능)"""
        user = request.user
        
        try:
            if user.user_type == 'patient':
                # Flutter 환자의 진료기록 조회
                try:
                    flutter_patient = user.flutter_patient
                    records = MedicalRecord.objects.filter(
                        flutter_patient=flutter_patient
                    ).order_by('-record_date')
                except FlutterPatient.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': 'Flutter 환자 프로필이 없습니다'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
            else:
                # 의료진의 경우 담당 환자들의 기록
                try:
                    medical_staff = user.medical_staff
                    records = MedicalRecord.objects.filter(
                        doctor=medical_staff
                    ).order_by('-record_date')
                except MedicalStaff.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': '의료진 프로필이 없습니다'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            records_data = []
            for record in records:
                records_data.append({
                    'id': record.id,
                    'patient_name': record.flutter_patient.user.get_full_name(),
                    'patient_id': record.flutter_patient.patient_id,
                    'doctor_name': record.doctor.user.get_full_name(),
                    'record_date': record.record_date,
                    'chief_complaint': record.chief_complaint,
                    'present_illness': record.present_illness,
                    'physical_examination': record.physical_examination,
                    'diagnosis': record.diagnosis,
                    'treatment_plan': record.treatment_plan,
                    'prescription': record.prescription,
                    'follow_up_notes': record.follow_up_notes,
                    'created_at': record.created_at
                })
            
            return Response({
                'success': True,
                'medical_records': records_data,
                'message': '진료기록 조회 성공',
                'source': 'flutter_database'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'진료기록 조회 실패: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MedicalRecordDetailView(APIView):
    """특정 진료기록 상세 조회"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, record_id):
        try:
            user = request.user
            
            try:
                if user.user_type == 'patient':
                    # 환자는 자신의 기록만 조회 가능
                    flutter_patient = user.flutter_patient
                    record = MedicalRecord.objects.get(
                        id=record_id, 
                        flutter_patient=flutter_patient
                    )
                else:
                    # 의료진은 모든 기록 조회 가능
                    record = MedicalRecord.objects.get(id=record_id)
                
                record_data = {
                    'id': record.id,
                    'patient_name': record.flutter_patient.user.get_full_name(),
                    'patient_id': record.flutter_patient.patient_id,
                    'doctor_name': record.doctor.user.get_full_name(),
                    'record_date': record.record_date,
                    'chief_complaint': record.chief_complaint,
                    'present_illness': record.present_illness,
                    'physical_examination': record.physical_examination,
                    'diagnosis': record.diagnosis,
                    'treatment_plan': record.treatment_plan,
                    'prescription': record.prescription,
                    'follow_up_notes': record.follow_up_notes,
                    'created_at': record.created_at,
                    'updated_at': record.updated_at
                }
                
                return Response({
                    'success': True,
                    'record': record_data,
                    'message': '진료기록 상세 조회 성공'
                })
                
            except MedicalRecord.DoesNotExist:
                return Response({
                    'success': False,
                    'error': '진료기록을 찾을 수 없습니다'
                }, status=status.HTTP_404_NOT_FOUND)
            except FlutterPatient.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Flutter 환자 프로필이 없습니다'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MedicalRecordCreateView(APIView):
    """진료기록 생성 (의료진용)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            
            # 의료진만 진료기록 생성 가능
            if user.user_type not in ['doctor', 'nurse']:
                return Response({
                    'success': False,
                    'error': '권한이 없습니다'
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                medical_staff = user.medical_staff
            except MedicalStaff.DoesNotExist:
                return Response({
                    'success': False,
                    'error': '의료진 프로필이 없습니다'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Flutter 환자 확인
            patient_id = request.data.get('patient_id')
            try:
                flutter_patient = FlutterPatient.objects.get(id=patient_id)
            except FlutterPatient.DoesNotExist:
                return Response({
                    'success': False,
                    'error': '환자를 찾을 수 없습니다'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 진료기록 생성
            record = MedicalRecord.objects.create(
                flutter_patient=flutter_patient,
                doctor=medical_staff,
                record_date=request.data.get('record_date'),
                chief_complaint=request.data.get('chief_complaint', ''),
                present_illness=request.data.get('present_illness', ''),
                physical_examination=request.data.get('physical_examination', ''),
                diagnosis=request.data.get('diagnosis', ''),
                treatment_plan=request.data.get('treatment_plan', ''),
                prescription=request.data.get('prescription', ''),
                follow_up_notes=request.data.get('follow_up_notes', '')
            )
            
            return Response({
                'success': True,
                'message': '진료기록이 생성되었습니다',
                'record_id': record.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
