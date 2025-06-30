# pacs_integration/serializers.py

from rest_framework import serializers
from .models import OpenEMRPatientOrthancLink, OrthancStudyLog
from patients.models import PatientProfile # [추가] PatientProfile 모델을 가져옵니다.

class OpenEMRPatientOrthancLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpenEMRPatientOrthancLink
        fields = '__all__'

class OrthancStudyLogSerializer(serializers.ModelSerializer):
    patient_link_id = serializers.PrimaryKeyRelatedField(
        queryset=OpenEMRPatientOrthancLink.objects.all(),
        source='patient_link'
    )

    class Meta:
        model = OrthancStudyLog
        fields = [
            'id', 'patient_link_id', 'orthanc_study_instance_uid', 
            'study_description', 'study_date', 'study_time', 
            'accession_number', 'modality', 'orthanc_study_internal_id',
            'upload_timestamp'
        ]
        read_only_fields = ['id', 'upload_timestamp']