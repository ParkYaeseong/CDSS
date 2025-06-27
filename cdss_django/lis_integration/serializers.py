# lis_integration/serializers.py
from rest_framework import serializers
from .models import LabOrder
from omics.serializers import OmicsRequestDetailSerializer
from diagnosis.serializers import DiagnosisRequestListSerializer

class LabOrderSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    ordering_physician_name = serializers.SerializerMethodField()
    omics_request = OmicsRequestDetailSerializer(read_only=True)
    diagnosis_request = DiagnosisRequestListSerializer(read_only=True)

    class Meta:
        model = LabOrder
        fields = [
            'id', 'patient', 'patient_name', 'ordering_physician', 'ordering_physician_name',
            'test_name', 'test_codes', 'status', 'priority', 'notes',
            'lis_order_id', 'ordered_at', 'sample_collected_at', 'completed_at',
            'result_value', 'result_unit', 'reference_range',
            'omics_request', 'diagnosis_request',
        ]

    def get_ordering_physician_name(self, obj):
        if obj.ordering_physician:
            return obj.ordering_physician.username
        return None