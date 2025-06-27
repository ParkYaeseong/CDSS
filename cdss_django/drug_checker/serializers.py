# drug_checker/serializers.py
from rest_framework import serializers
from .models import Prescription

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = '__all__'
        
    def validate_drugs(self, value):
        """처방 약물 목록 유효성 검사"""
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("최소 1개 이상의 약물이 필요합니다.")
        return value
        
    def validate_patient_id(self, value):
        """환자 ID 유효성 검사"""
        if not value or not value.strip():
            raise serializers.ValidationError("환자 ID는 필수입니다.")
        return value.strip()

