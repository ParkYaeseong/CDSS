# appointment_service/serializers.py
from rest_framework import serializers
from django.db.models import Q
from .models import Appointment
from accounts.models import MedicalStaff
from patients.models import PatientProfile, FlutterPatientProfile  # ✅ 수정
import logging
import uuid

logger = logging.getLogger(__name__)

class AppointmentSerializer(serializers.ModelSerializer):
    """예약 조회용 시리얼라이저"""
    patient_name = serializers.ReadOnlyField()
    patient_id = serializers.ReadOnlyField()
    patient_phone = serializers.ReadOnlyField()
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    doctor_department = serializers.CharField(source='doctor.department', read_only=True)
    patient_source = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'flutter_patient', 'patient', 'doctor', 'appointment_datetime',
            'duration', 'appointment_type', 'reason', 'chief_complaint', 'status',
            'notes', 'department', 'created_at', 'updated_at',
            'patient_name', 'patient_id', 'patient_phone', 'doctor_name', 
            'doctor_department', 'patient_source'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_patient_source(self, obj):
        """환자 데이터 소스 반환"""
        if obj.flutter_patient:
            return 'flutter'
        elif obj.patient:
            return 'django'
        return 'unknown'

class AppointmentCreateSerializer(serializers.ModelSerializer):
    """예약 생성용 시리얼라이저 - Flutter 환자 지원"""
    
    class Meta:
        model = Appointment
        fields = [
            'flutter_patient', 'patient', 'doctor', 'appointment_datetime',
            'duration', 'appointment_type', 'reason', 'chief_complaint',
            'department', 'notes', 'status'
        ]
    
    def to_internal_value(self, data):
        """데이터 변환 시 객체 중복 변환 방지"""
        logger.info(f"[DEBUG] to_internal_value 시작: {data}")
        
        # 환자 ID 처리 - 문자열 ID를 객체로 변환하지 않고 ID만 유지
        if 'patient' in data and data['patient']:
            patient_id = data['patient']
            if isinstance(patient_id, str) and len(patient_id) == 36:
                try:
                    # UUID 형식 검증만 하고 객체로 변환하지 않음
                    uuid.UUID(patient_id)
                    logger.info(f"[DEBUG] 유효한 UUID 형식: {patient_id}")
                except ValueError:
                    logger.warning(f"[WARNING] 유효하지 않은 UUID 형식: {patient_id}")
        
        return super().to_internal_value(data)
    
    def validate(self, data):
        """환자 검증 - Flutter 환자 지원"""
        logger.info(f"[DEBUG] validate 시작: {data}")
        
        # Flutter 환자 처리
        flutter_patient_data = data.get('flutter_patient')
        if flutter_patient_data:
            if isinstance(flutter_patient_data, FlutterPatientProfile):
                logger.info(f"[DEBUG] 이미 Flutter 환자 객체임: {flutter_patient_data.patient_id}")
            else:
                try:
                    flutter_patient = FlutterPatientProfile.objects.get(id=flutter_patient_data)
                    data['flutter_patient'] = flutter_patient
                    logger.info(f"[DEBUG] Flutter 환자 찾음: {flutter_patient.patient_id}")
                except FlutterPatientProfile.DoesNotExist:
                    raise serializers.ValidationError({
                        'flutter_patient': f"Flutter 환자 ID {flutter_patient_data}를 찾을 수 없습니다."
                    })
        
        # 환자 ID 처리
        patient_data = data.get('patient')
        if patient_data:
            # ✅ 이미 PatientProfile 객체인 경우 그대로 사용
            if isinstance(patient_data, PatientProfile):
                logger.info(f"[DEBUG] 이미 환자 객체임: {patient_data.name}")
                # 객체가 이미 있으므로 추가 검증 불필요
            else:
                # 문자열 ID인 경우에만 검색
                patient_id = str(patient_data)
                logger.info(f"[DEBUG] 환자 ID로 검색 시작: {patient_id}")
                
                try:
                    # 1. UUID 형식으로 검색
                    if len(patient_id) == 36:
                        try:
                            uuid.UUID(patient_id)
                            patient = PatientProfile.objects.get(id=patient_id)
                            data['patient'] = patient
                            logger.info(f"[DEBUG] UUID로 환자 찾음: {patient.name}")
                        except ValueError:
                            logger.debug(f"[DEBUG] UUID 형식이 아님: {patient_id}")
                            raise serializers.ValidationError({
                                'patient': f"유효하지 않은 UUID 형식입니다: {patient_id}"
                            })
                    else:
                        # 2. 부분 UUID로 검색
                        patient = PatientProfile.objects.get(id__startswith=patient_id)
                        data['patient'] = patient
                        logger.info(f"[DEBUG] 부분 UUID로 환자 찾음: {patient.name}")
                        
                except PatientProfile.DoesNotExist:
                    # 3. OpenEMR ID로 마지막 시도
                    try:
                        patient = PatientProfile.objects.get(openemr_id=patient_id)
                        data['patient'] = patient
                        logger.info(f"[DEBUG] OpenEMR ID로 환자 찾음: {patient.name}")
                    except PatientProfile.DoesNotExist:
                        raise serializers.ValidationError({
                            'patient': f"환자 ID {patient_id}를 찾을 수 없습니다."
                        })
                except PatientProfile.MultipleObjectsReturned:
                    raise serializers.ValidationError({
                        'patient': f"ID {patient_id}로 시작하는 환자가 여러 명 있습니다."
                    })
        
        # Flutter 환자와 기존 환자 중 하나는 반드시 있어야 함
        if not data.get('flutter_patient') and not data.get('patient'):
            raise serializers.ValidationError({
                'non_field_errors': ['환자를 선택해야 합니다.']
            })
        
        if data.get('flutter_patient') and data.get('patient'):
            raise serializers.ValidationError({
                'non_field_errors': ['Flutter 환자와 기존 환자를 동시에 선택할 수 없습니다.']
            })
        
        # 의사 검증
        doctor_data = data.get('doctor')
        if doctor_data:
            # ✅ 이미 MedicalStaff 객체인 경우 그대로 사용
            if isinstance(doctor_data, MedicalStaff):
                logger.info(f"[DEBUG] 이미 의사 객체임: {doctor_data.user.get_full_name()}")
            else:
                try:
                    doctor = MedicalStaff.objects.get(id=doctor_data)
                    data['doctor'] = doctor
                    logger.info(f"[DEBUG] 의사 찾음: {doctor.user.get_full_name()}")
                except MedicalStaff.DoesNotExist:
                    raise serializers.ValidationError({
                        'doctor': f"의사 ID {doctor_data}를 찾을 수 없습니다."
                    })
        
        # 예약 시간 검증
        appointment_datetime = data.get('appointment_datetime')
        if appointment_datetime:
            from django.utils import timezone
            if appointment_datetime < timezone.now():
                raise serializers.ValidationError({
                    'appointment_datetime': '예약 시간은 현재 시간보다 이후여야 합니다.'
                })
        
        logger.info(f"[DEBUG] validate 완료")
        return data

class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """예약 수정용 시리얼라이저"""
    
    class Meta:
        model = Appointment
        fields = [
            'appointment_datetime', 'duration', 'appointment_type', 
            'reason', 'chief_complaint', 'department', 'notes', 'status'
        ]
    
    def validate_status(self, value):
        """상태 변경 검증"""
        valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed', 'in_progress']
        if value not in valid_statuses:
            raise serializers.ValidationError(f'유효하지 않은 상태입니다. 가능한 값: {valid_statuses}')
        return value
    
    def validate_appointment_datetime(self, value):
        """예약 시간 검증"""
        from django.utils import timezone
        if value < timezone.now():
            raise serializers.ValidationError('예약 시간은 현재 시간보다 이후여야 합니다.')
        return value

class DoctorSerializer(serializers.ModelSerializer):
    """의사 목록 조회용 시리얼라이저"""
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    
    class Meta:
        model = MedicalStaff
        fields = [
            'id', 'name', 'username', 'email', 'first_name', 'last_name',
            'department', 'specialization', 'staff_id', 'staff_type', 'user_type'
        ]

class PatientSearchSerializer(serializers.Serializer):
    """환자 검색용 시리얼라이저"""
    patient_id = serializers.CharField(required=True)
    patient_type = serializers.CharField(required=False)
    
    def validate_patient_type(self, value):
        """환자 타입 검증"""
        if value and value not in ['profile', 'flutter', 'django']:
            raise serializers.ValidationError('유효하지 않은 환자 타입입니다.')
        return value

class AppointmentStatusUpdateSerializer(serializers.Serializer):
    """예약 상태 업데이트용 시리얼라이저"""
    status = serializers.ChoiceField(
        choices=['pending', 'confirmed', 'cancelled', 'completed', 'in_progress'],
        required=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_status(self, value):
        """상태 값 검증"""
        valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed', 'in_progress']
        if value not in valid_statuses:
            raise serializers.ValidationError(f'유효하지 않은 상태입니다. 가능한 값: {valid_statuses}')
        return value
