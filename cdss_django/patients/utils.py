# patients/utils.py
from patients.models import PatientProfile, FlutterPatientProfile
from django.contrib.auth import get_user_model
from django.db.models import Q
import logging

# accounts.models import 시 오류 방지 (기존 코드와의 호환성)
try:
    from accounts.models import FlutterPatient, Patient
except ImportError:
    FlutterPatient = None
    Patient = None

User = get_user_model()
logger = logging.getLogger(__name__)

class UnifiedPatientManager:
    """통합 환자 관리 클래스 (Flutter 환자 포함)"""
    
    @staticmethod
    def get_all_patients():
        """모든 유형의 환자를 통합하여 반환"""
        unified_patients = []
        
        try:
            # 1. PatientProfile 환자들 (OpenEMR 연동)
            for patient in PatientProfile.objects.select_related('registered_by').all():
                unified_patients.append({
                    'id': str(patient.id),
                    'type': 'profile',
                    'source': 'OpenEMR',
                    'name': patient.name,
                    'display_name': f"{patient.name} (OpenEMR)",
                    'openemr_id': patient.openemr_id,
                    'first_name': patient.first_name,
                    'last_name': patient.last_name,
                    'date_of_birth': patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                    'gender': patient.gender,
                    'phone_number': patient.phone_number,
                    'address': patient.address,
                    'created_at': patient.created_at.isoformat() if hasattr(patient, 'created_at') else None,
                    'registered_by': patient.registered_by.username if patient.registered_by else None
                })
            
            # 2. FlutterPatientProfile 환자들 (patients 앱에서 관리)
            try:
                for patient in FlutterPatientProfile.objects.select_related('user', 'linked_patient').all():
                    unified_patients.append({
                        'id': str(patient.id),
                        'type': 'flutter',
                        'source': 'Flutter',
                        'name': patient.user.get_full_name() or patient.user.username,
                        'display_name': f"{patient.user.get_full_name() or patient.user.username} (Flutter)",
                        'flutter_patient_id': patient.patient_id,
                        'first_name': patient.user.first_name,
                        'last_name': patient.user.last_name,
                        'username': patient.user.username,
                        'email': patient.user.email,
                        'phone_number': patient.phone_number,
                        'date_of_birth': patient.birth_date.isoformat() if patient.birth_date else None,
                        'address': patient.address,
                        'blood_type': patient.blood_type,
                        'allergies': patient.allergies,
                        'is_linked': patient.is_linked,
                        'linked_patient_id': patient.linked_patient.openemr_id if patient.linked_patient else None,
                        'created_at': patient.created_at.isoformat() if hasattr(patient, 'created_at') else None
                    })
            except Exception as e:
                logger.warning(f"FlutterPatientProfile 조회 오류: {e}")
            
            # 3. 기존 FlutterPatient 환자들 (하위 호환성)
            if FlutterPatient:
                try:
                    for patient in FlutterPatient.objects.select_related('user').all():
                        unified_patients.append({
                            'id': str(patient.id),
                            'type': 'flutter_legacy',
                            'source': 'Flutter_Legacy',
                            'name': patient.user.get_full_name() or patient.user.username,
                            'display_name': f"{patient.user.get_full_name() or patient.user.username} (Flutter Legacy)",
                            'flutter_patient_id': patient.patient_id,
                            'first_name': patient.user.first_name,
                            'last_name': patient.user.last_name,
                            'username': patient.user.username,
                            'email': patient.user.email,
                            'phone_number': getattr(patient, 'phone_number', ''),
                            'date_of_birth': patient.birth_date.isoformat() if hasattr(patient, 'birth_date') and patient.birth_date else None,
                            'address': getattr(patient, 'address', ''),
                            'created_at': patient.created_at.isoformat() if hasattr(patient, 'created_at') else None
                        })
                except Exception as e:
                    logger.warning(f"FlutterPatient (Legacy) 조회 오류: {e}")
            
            # 4. Patient 환자들 (하위 호환성)
            if Patient:
                try:
                    for patient in Patient.objects.select_related('user').all():
                        unified_patients.append({
                            'id': str(patient.id),
                            'type': 'patient',
                            'source': 'Django',
                            'name': patient.user.get_full_name() or patient.user.username,
                            'display_name': f"{patient.user.get_full_name() or patient.user.username} (Django)",
                            'patient_id': patient.patient_id,
                            'first_name': patient.user.first_name,
                            'last_name': patient.user.last_name,
                            'username': patient.user.username,
                            'email': patient.user.email,
                            'phone_number': getattr(patient.user, 'phone_number', ''),
                            'date_of_birth': patient.user.birth_date.isoformat() if hasattr(patient.user, 'birth_date') and patient.user.birth_date else None,
                            'created_at': patient.created_at.isoformat() if hasattr(patient, 'created_at') else None
                        })
                except Exception as e:
                    logger.warning(f"Patient 조회 오류: {e}")
                    
        except Exception as e:
            logger.error(f"통합 환자 조회 오류: {e}")
        
        return unified_patients
    
    @staticmethod
    def find_patient_by_id(patient_id, patient_type=None):
        """ID와 타입으로 환자 찾기"""
        try:
            # PatientProfile에서 검색 (UUID 또는 openemr_id)
            if patient_type == 'profile' or not patient_type:
                try:
                    patient = PatientProfile.objects.get(
                        Q(id=patient_id) | Q(openemr_id=patient_id)
                    )
                    return patient, 'profile'
                except PatientProfile.DoesNotExist:
                    pass
            
            # FlutterPatientProfile에서 검색 (새로운 모델)
            if patient_type == 'flutter' or not patient_type:
                try:
                    patient = FlutterPatientProfile.objects.get(
                        Q(id=patient_id) | Q(patient_id=patient_id)
                    )
                    return patient, 'flutter'
                except FlutterPatientProfile.DoesNotExist:
                    pass
            
            # FlutterPatient에서 검색 (하위 호환성)
            if FlutterPatient and (patient_type == 'flutter_legacy' or not patient_type):
                try:
                    patient = FlutterPatient.objects.get(
                        Q(id=patient_id) | Q(patient_id=patient_id)
                    )
                    return patient, 'flutter_legacy'
                except FlutterPatient.DoesNotExist:
                    pass
            
            # Patient에서 검색 (하위 호환성)
            if Patient and (patient_type == 'patient' or not patient_type):
                try:
                    patient = Patient.objects.get(
                        Q(id=patient_id) | Q(patient_id=patient_id)
                    )
                    return patient, 'patient'
                except Patient.DoesNotExist:
                    pass
                    
        except Exception as e:
            logger.error(f"환자 검색 오류: {e}")
        
        return None, None
    
    @staticmethod
    def get_patient_for_appointment(patient_id, patient_type):
        """예약 시스템용 환자 객체 반환"""
        patient_obj, found_type = UnifiedPatientManager.find_patient_by_id(patient_id, patient_type)
        
        if not patient_obj:
            return None, None, None
        
        # 예약 시스템에서 사용할 수 있는 형태로 변환
        if found_type == 'profile':
            return patient_obj, None, 'profile'  # (patient, flutter_patient, type)
        elif found_type == 'flutter':
            return None, patient_obj, 'flutter'
        elif found_type == 'flutter_legacy':
            return None, patient_obj, 'flutter_legacy'
        elif found_type == 'patient':
            return patient_obj, None, 'patient'
        
        return None, None, None

# 하위 호환성을 위한 별칭
PatientUnificationService = UnifiedPatientManager
