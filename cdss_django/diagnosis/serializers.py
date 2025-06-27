from rest_framework import serializers
from .models import DiagnosisRequest, DiagnosisResult
from omics.models import TumorSegmentationResult
from patients.models import PatientProfile
from django.core.files.uploadedfile import InMemoryUploadedFile
import uuid
from patients.serializers import PatientListSerializer

# --- 추가 분석 결과 (nnU-Net 등) Serializer ---
class TumorSegmentationResultSerializer(serializers.ModelSerializer):
    """ nnU-Net 등으로 생성된 개별 종양 분할 결과 Serializer """
    # [수정] 파일이 없을 수도 있으므로 .url을 직접 쓰지 않고 SerializerMethodField 사용
    tumor_nifti_file_url = serializers.SerializerMethodField()

    class Meta:
        model = TumorSegmentationResult
        fields = [
            'id', 'analysis_name', 'status', 'tumor_nifti_file_url',
            'visualization_3d_html_path', 'error_message',
        ]
    
    def get_tumor_nifti_file_url(self, obj):
        # tumor_nifti_file 필드에 파일이 있으면 URL을, 없으면 None을 반환
        if obj.tumor_nifti_file:
            return obj.tumor_nifti_file.url
        return None

# --- 기본 진단 결과 (TotalSegmentator) Serializer ---
class DiagnosisResultSerializer(serializers.ModelSerializer):
    """ 기본 진단 결과(NIfTI 파일 경로, HTML 뷰어 경로 등)를 위한 Serializer """
    # [수정] 파일이 없을 수도 있으므로 .url을 직접 쓰지 않고 SerializerMethodField 사용
    original_ct_nifti_url = serializers.SerializerMethodField()
    segmentation_nifti_file_url = serializers.SerializerMethodField()
    # segmentation_results는 이미 다른 Serializer를 사용하므로 수정 필요 없음

    class Meta:
        model = DiagnosisResult
        fields = [
            'result_summary', 'visualization_3d_html_path', 'error_message',
            'original_ct_nifti_url', 'segmentation_nifti_file_url',
            'integrated_viewer_html_path', 'visualization_3d_html_path',
        ]
    
    def get_original_ct_nifti_url(self, obj):
        if obj.original_ct_nifti:
            return obj.original_ct_nifti.url
        return None
        
    def get_segmentation_nifti_file_url(self, obj):
        if obj.segmentation_nifti_file:
            return obj.segmentation_nifti_file.url
        return None

# --- 진단 요청 목록 Serializer ---
class DiagnosisRequestListSerializer(serializers.ModelSerializer):
    patient = PatientListSerializer(read_only=True)
    analysis_type = serializers.CharField(default="CT", read_only=True)

    class Meta:
        model = DiagnosisRequest
        fields = ['id', 'patient', 'status', 'request_timestamp', 'study_uid', 'analysis_type']

# --- 진단 요청 상세 정보 Serializer ---
class DiagnosisRequestDetailSerializer(serializers.ModelSerializer):
    patient = PatientListSerializer(read_only=True)
    result = serializers.SerializerMethodField()
    analysis_type = serializers.CharField(default="CT", read_only=True)

    class Meta:
        model = DiagnosisRequest
        fields = ['id', 'patient', 'status', 'request_timestamp', 'updated_at', 'study_uid', 'result', 'analysis_type']

    def get_result(self, obj):
        try:
            if hasattr(obj, 'result') and obj.result:
                # 여기서 DiagnosisResultSerializer를 호출할 때, 안전하게 처리된 URL이 반환됨
                return DiagnosisResultSerializer(obj.result).data
        except DiagnosisRequest.result.RelatedObjectDoesNotExist:
            return None
        return None

    
# --- 진단 요청 생성 Serializer ---
class DiagnosisRequestCreateSerializer(serializers.ModelSerializer):
    """
    진단 요청 생성을 위한 Serializer (파일 업로드 처리)
    """
    patient = serializers.PrimaryKeyRelatedField(
        queryset=PatientProfile.objects.all(),
        help_text="진단 대상 환자의 UUID"
    )
    dicom_file = serializers.FileField(
        write_only=True, 
        help_text="업로드할 단일 DICOM 파일 또는 DICOM 파일들을 포함한 ZIP 파일."
    )

    class Meta:
        model = DiagnosisRequest
        fields = ['patient', 'scan_type', 'dicom_file']

    def validate_dicom_file(self, value):
        # 파일 크기 제한을 500MB로 상향 조정한 것을 반영
        if value.size > 500 * 1024 * 1024:
            raise serializers.ValidationError("파일 크기는 500MB를 초과할 수 없습니다.")
        return value