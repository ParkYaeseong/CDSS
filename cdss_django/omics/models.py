# cdss_django/omics/models.py

import uuid
from django.db import models
from django.conf import settings
from patients.models import PatientProfile
from django.utils.translation import gettext_lazy as _
from diagnosis.models import DiagnosisRequest

class OmicsRequest(models.Model):
    """
    사용자의 오믹스 분석 요청 전체를 관리하는 모델.
    업로드된 파일들을 담는 컨테이너 역할을 합니다.
    """
    class StatusChoices(models.TextChoices):
        CREATED = 'CREATED', '요청 생성됨'
        QUEUED = 'QUEUED', '분석 대기 중'
        PROCESSING = 'PROCESSING', '분석 중'
        COMPLETED = 'COMPLETED', '분석 완료'
        FAILED = 'FAILED', '분석 실패'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.PROTECT,
        help_text="분석 대상 환자"
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        help_text="분석을 요청한 사용자"
    )
    
    cancer_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="[선택] 특정 모델을 지정하거나, 분석 후 결과가 저장될 필드"
    )
    
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.CREATED,
        help_text="분석 요청의 현재 상태"
    )
    
    request_timestamp = models.DateTimeField(auto_now_add=True)
    lis_test_id = models.CharField(max_length=100, blank=True, null=True)
    error_message = models.TextField(blank=True, null=True, help_text="분석 실패 시 에러 메시지 저장")

    def __str__(self):
        return f"Omics Request {self.id} for {self.patient.name}"


class OmicsDataFile(models.Model):
    """업로드된 개별 오믹스 데이터 파일을 나타내는 모델"""
    class OmicsTypes(models.TextChoices):
        RNA_SEQ = 'RNA-seq', '유전자 발현 데이터'
        METHYLATION = 'Methylation', '메틸레이션 데이터'
        MUTATION = 'Mutation', '유전자 변이 데이터'
        CNV = 'CNV', '유전자 복제수 변이 데이터'
        MIRNA = 'miRNA', '마이크로RNA 데이터'
        QUANTIFICATION = 'Quantification', '유전자 정량 데이터'
        CLINIC = 'Clinic', '임상 정보 파일'
        PROTEOME = 'Proteome', '단백질체 데이터'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(OmicsRequest, on_delete=models.CASCADE, related_name='data_files')
    omics_type = models.CharField(max_length=50, choices=OmicsTypes.choices)
    input_file = models.FileField(upload_to='omics_data/inputs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_omics_type_display()} file for Request {self.request.id}"


class OmicsResult(models.Model):
    """오믹스 분석의 최종 결과를 저장하는 모델"""
    request = models.OneToOneField(
        OmicsRequest,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='result'
    )
    
    # 1단계 이진 분류 (암 vs 정상) 결과 저장
    binary_cancer_prediction = models.IntegerField(
        null=True, blank=True,
        help_text="1단계 이진 분류 예측 결과 (0: 정상, 1: 암)"
    )
    binary_cancer_probability = models.FloatField(
        null=True, blank=True,
        help_text="1단계 이진 분류 암일 확률 (0.0 ~ 1.0)"
    )
    
    # 2단계 암종 세부 분류 결과 저장
    predicted_cancer_type_name = models.CharField(
        max_length=100,
        null=True, blank=True,
        help_text="최종 분류된 암종 이름 또는 '정상', '모호함' 등의 상태"
    )
    all_cancer_type_probabilities = models.JSONField(
        null=True, blank=True,
        help_text="최종 분류 모델의 모든 암종별 예측 확률 (JSON 딕셔너리)"
    )
    
    biomarkers = models.JSONField(
        null=True, blank=True,
        help_text="예측에 기여한 상위 바이오마커 목록 (SHAP 값 등)"
    )

    # [추가] 1차 분석 결과를 시각화하는 그래프
    stage1_signal_graph = models.ImageField(
        upload_to='omics_graphs/stage1/',
        null=True, blank=True,
        help_text="1차 분석: 암 신호 강도 그래프"
    )
    
    # [수정] 필드명은 shap_graph 그대로 사용하고, help_text를 명확하게 변경
    shap_graph = models.ImageField(
        upload_to='omics_graphs/stage2/', # 경로를 stage2로 명확히 함
        null=True, blank=True,
        help_text="2차 분석: 바이오마커 기여도 그래프 (SHAP 등)"
    )
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Result for request {self.request.id}"
    
class TumorSegmentationResult(models.Model):
    """
    nnU-Net을 이용한 종양 분할 결과물
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    
    request = models.ForeignKey(
        DiagnosisRequest, on_delete=models.CASCADE, related_name='segmentation_results'
    )
    analysis_name = models.CharField(
        _("Analysis Name"), max_length=100, default="Tumor Segmentation"
    )
    status = models.CharField(
        _("Status"), max_length=20, choices=STATUS_CHOICES, default='PENDING'
    )
    tumor_nifti_file = models.FileField(
        _("Result NIfTI File"),
        upload_to='tumor_segmentations/',
        max_length=512,
        blank=True,
        null=True
    )
    visualization_3d_html_path = models.CharField(
        _("Final 3D Visualization HTML Path"), max_length=512, blank=True, null=True
    )
    error_message = models.TextField(_("Error Message"), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.analysis_name} for Request {self.request.id}"