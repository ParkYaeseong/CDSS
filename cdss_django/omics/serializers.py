# cdss_django/omics/serializers.py

from rest_framework import serializers
from .models import OmicsRequest, OmicsDataFile, OmicsResult, TumorSegmentationResult
from patients.models import PatientProfile
from patients.serializers import PatientProfileSerializer, PatientListSerializer

# [유지] 파일 업로드용 시리얼라이저 (기존과 동일)
class OmicsDataFileSerializer(serializers.ModelSerializer):
    input_file = serializers.FileField(use_url=True)

    class Meta:
        model = OmicsDataFile
        fields = ('id', 'request', 'omics_type', 'input_file', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


# [수정] OmicsResultSerializer: 그래프 URL 필드를 명시적으로 추가
class OmicsResultSerializer(serializers.ModelSerializer):
    # [추가] ImageField들이 파일 시스템 경로가 아닌, 웹에서 접근 가능한 전체 URL로 반환되도록 설정합니다.
    stage1_signal_graph = serializers.ImageField(max_length=None, use_url=True, required=False)
    shap_graph = serializers.ImageField(max_length=None, use_url=True, required=False)

    class Meta:
        model = OmicsResult
        # [수정] '__all__' 대신, URL로 변환할 필드를 포함하여 모든 필드를 명시적으로 나열합니다.
        fields = [
            'request',
            'binary_cancer_prediction',
            'binary_cancer_probability',
            'predicted_cancer_type_name',
            'all_cancer_type_probabilities',
            'biomarkers',
            'stage1_signal_graph', # 1차 분석 그래프 필드
            'shap_graph',          # 2차 분석 그래프 필드
            'last_updated',
        ]

# [수정] OmicsRequestDetailSerializer: 위에서 수정한 OmicsResultSerializer를 사용하도록 유지
class OmicsRequestDetailSerializer(serializers.ModelSerializer):
    # 이 시리얼라이저는 nested relationship을 통해 관련된 모든 정보를 한번에 제공합니다.
    data_files = OmicsDataFileSerializer(many=True, read_only=True)
    result = OmicsResultSerializer(read_only=True) # OmicsResultSerializer를 그대로 사용
    patient = PatientProfileSerializer(read_only=True) 
    requester_name = serializers.CharField(source='requester.get_full_name', read_only=True)

    class Meta:
        model = OmicsRequest
        fields = [
            'id', 
            'patient', 
            'requester_name',
            'cancer_type', 
            'status', 
            'request_timestamp',
            'lis_test_id',
            'error_message',
            'data_files',
            'result' 
        ]

# [유지] 분석 요청 생성을 위한 Serializer (기존과 동일)
class OmicsRequestCreateSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=PatientProfile.objects.all())
    
    class Meta:
        model = OmicsRequest
        fields = ('id', 'patient')

# [유지] 목록 조회를 위한 Serializer (기존과 동일)
class OmicsRequestListSerializer(serializers.ModelSerializer):
    patient = PatientListSerializer(read_only=True)
    analysis_type = serializers.CharField(default="Omics", read_only=True)

    class Meta:
        model = OmicsRequest
        fields = ['id', 'patient', 'status', 'request_timestamp', 'analysis_type']


# [유지] AI 영상 분석 결과를 위한 Serializer (기존과 동일)
class TumorSegmentationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TumorSegmentationResult
        fields = [
            'id',
            'analysis_name',
            'status',
            'visualization_3d_html_path',
            'created_at'
        ]
