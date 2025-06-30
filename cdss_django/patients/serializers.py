# patients/serializers.py
from rest_framework import serializers
from .models import (
    PatientProfile, LiverCancerClinicalData, ClinicalData,
    FlutterPatientProfile, PatientVerificationCode, RegistrationCode
)
from django.contrib.auth import get_user_model

User = get_user_model()

class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = [
            'id', 'openemr_id', 'first_name', 'last_name', 'name',
            'date_of_birth', 'gender', 'phone_number', 'address',
            'registered_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'name', 'created_at', 'updated_at']

# Flutter 환자 관리 시리얼라이저 추가
class FlutterPatientProfileSerializer(serializers.ModelSerializer):
    """Flutter 환자 프로필 시리얼라이저"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    is_linked = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = FlutterPatientProfile
        fields = [
            'id', 'patient_id', 'user', 'user_name', 'phone_number', 
            'birth_date', 'address', 'blood_type', 'allergies', 'medical_history',
            'linked_patient', 'linked_at', 'is_linked', 'is_verified', 
            'verification_method', 'verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'patient_id', 'created_at', 'updated_at']

class PatientVerificationCodeSerializer(serializers.ModelSerializer):
    """환자 인증 코드 시리얼라이저"""
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = PatientVerificationCode
        fields = [
            'id', 'flutter_patient', 'code', 'purpose', 'expires_at',
            'is_used', 'used_at', 'created_by', 'created_at', 'is_valid'
        ]
        read_only_fields = ['id', 'created_at', 'is_valid']

class RegistrationCodeSerializer(serializers.ModelSerializer):
    """회원가입 인증 코드 시리얼라이저"""
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = RegistrationCode
        fields = [
            'id', 'code', 'purpose', 'expires_at', 'is_used', 'used_at',
            'used_by', 'created_by', 'created_at', 'is_valid'
        ]
        read_only_fields = ['id', 'created_at', 'is_valid']

# 기존 시리얼라이저들 유지
class UnifiedPatientSerializer(serializers.Serializer):
    """통합 환자 시리얼라이저 - 모든 환자 타입 지원"""
    id = serializers.CharField()
    type = serializers.CharField()
    source = serializers.CharField()
    name = serializers.CharField()
    display_name = serializers.CharField()
    
    # 선택적 필드들
    openemr_id = serializers.CharField(required=False, allow_null=True)
    flutter_patient_id = serializers.CharField(required=False, allow_null=True)
    patient_id = serializers.CharField(required=False, allow_null=True)
    
    first_name = serializers.CharField(required=False, allow_null=True)
    last_name = serializers.CharField(required=False, allow_null=True)
    username = serializers.CharField(required=False, allow_null=True)
    email = serializers.CharField(required=False, allow_null=True)
    
    date_of_birth = serializers.CharField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_null=True)
    phone_number = serializers.CharField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_null=True)
    blood_type = serializers.CharField(required=False, allow_null=True)
    
    created_at = serializers.CharField(required=False, allow_null=True)
    registered_by = serializers.CharField(required=False, allow_null=True)
    
    # 예약 시스템용 필드
    appointment_patient_id = serializers.CharField(required=False)
    appointment_patient_type = serializers.CharField(required=False)

class LiverCancerClinicalDataSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    age_at_diagnosis = serializers.ReadOnlyField()
    
    class Meta:
        model = LiverCancerClinicalData
        fields = '__all__'
        read_only_fields = ['id', 'patient_name', 'age_at_diagnosis', 'created_at', 'updated_at']

class ClinicalDataSerializer(serializers.ModelSerializer):
    """통합 임상 데이터 시리얼라이저"""
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    calculated_age_at_diagnosis = serializers.ReadOnlyField()
    cancer_type_display = serializers.CharField(source='get_cancer_type_display', read_only=True)
    
    class Meta:
        model = ClinicalData
        fields = '__all__'
        read_only_fields = ['id', 'patient_name', 'calculated_age_at_diagnosis', 'cancer_type_display', 'form_date', 'created_at', 'updated_at']

class PatientListSerializer(serializers.ModelSerializer):
    """다른 Serializer에서 환자 정보를 간단히 표시하기 위한 클래스"""
    class Meta:
        model = PatientProfile
        fields = ['id', 'name', 'openemr_id', 'date_of_birth']

class PatientSearchSerializer(serializers.Serializer):
    """환자 검색용 시리얼라이저"""
    search_term = serializers.CharField(required=False, allow_blank=True)
    patient_type = serializers.ChoiceField(
        choices=['all', 'profile', 'flutter', 'patient'],
        default='all'
    )
    source = serializers.ChoiceField(
        choices=['all', 'openemr', 'flutter', 'django'],
        default='all'
    )
