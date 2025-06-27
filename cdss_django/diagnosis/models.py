import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from patients.models import PatientProfile

# [수정] 실패 상태를 세분화하여 추적 용이성을 높임
class DiagnosisRequestStatus(models.TextChoices):
    PENDING = 'PENDING', _('대기 중') # 시스템이 아직 요청을 처리하지 않음
    RECEIVED = 'RECEIVED', _('요청 수신') # 파일 업로드 후 분석 대기열에 추가된 상태
    PROCESSING = 'PROCESSING', _('처리 중') # Celery 워커가 작업을 시작함
    COMPLETED = 'COMPLETED', _('완료') # 모든 분석 및 뷰어 생성이 성공적으로 끝남
    FAILED = 'FAILED', _('실패') # 일반적인 실패 상태
    NIFTI_CONVERSION_FAILED = 'NIFTI_CONVERSION_FAILED', _('NIfTI 변환 실패')
    SEGMENTATION_FAILED = 'SEGMENTATION_FAILED', _('AI 분할 실패')
    VIEWER_GENERATION_FAILED = 'VIEWER_GENERATION_FAILED', _('뷰어 생성 실패')


class DiagnosisRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='ct_diagnosis_requests',
        limit_choices_to={'is_staff': True},
        verbose_name=_("Requesting Clinician"),
        null=True, blank=True
    )
    patient = models.ForeignKey(
        PatientProfile, on_delete=models.PROTECT,
        related_name='ct_diagnosis_requests',
        verbose_name=_("Patient")
    )
    study_uid = models.CharField(
        _("Orthanc Study UID"), max_length=255, unique=True,
        null=True, blank=True,
        help_text=_("StudyInstanceUID of the uploaded DICOM series in Orthanc")
    )
    scan_type = models.CharField(
        _("Scan Type"), max_length=100, default='pancreas_ct', blank=True
    )
    # [수정] 확장된 Status Choices를 사용
    status = models.CharField(
        _('Status'), max_length=30, choices=DiagnosisRequestStatus.choices,
        default=DiagnosisRequestStatus.PENDING, db_index=True
    )
    celery_task_id = models.CharField(
        _("Celery Task ID"), max_length=255, null=True, blank=True, db_index=True
    )
    request_timestamp = models.DateTimeField(auto_now_add=True, verbose_name=_("Request Time"))
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"CT Request {self.id} for {self.patient}"

    class Meta:
        verbose_name = _("CT Diagnosis Request")
        verbose_name_plural = _("CT Diagnosis Requests")
        ordering = ['-request_timestamp']


class DiagnosisResult(models.Model):
    request = models.OneToOneField(
        DiagnosisRequest, on_delete=models.CASCADE, primary_key=True,
        related_name='result', verbose_name=_("CT Diagnosis Request")
    )
    
    result_summary = models.CharField(_("Result Summary"), max_length=100, blank=True)
    
    visualization_3d_html_path = models.CharField(
        _("3D Visualization HTML Path"), max_length=512, blank=True, null=True
    )
    
    # [정리] 중복 필드 제거
    segmentation_nifti_file = models.FileField(
        _("Segmentation NIfTI File"),
        upload_to='segmentation_nifti/', 
        max_length=512,
        blank=True, 
        null=True
    )
    
    original_ct_nifti = models.FileField(
        _("Original CT NIfTI File"),
        upload_to='original_nifti/', 
        max_length=512,
        blank=True, 
        null=True
    )
    
    integrated_viewer_html_path = models.CharField(
        _("Integrated Viewer HTML Path"), max_length=512, null=True, blank=True
    )

    error_message = models.TextField(_("Error Message"), blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))
    
    def __str__(self):
        return f"Result for CT Request {self.request.id}"

    class Meta:
        verbose_name = _("CT Diagnosis Result")
        verbose_name_plural = _("CT Diagnosis Results")
        ordering = ['-created_at']

    # --- [수정] --- save 로직은 classification_prediction 필드를 주석 처리했으므로,
    # 일단 함께 주석 처리하거나, 다른 로직으로 대체해야 합니다.
    # 현재는 CT 분석 결과의 성공/실패 여부만 판단하므로 이 로직이 없어도 무방합니다.
    # def save(self, *args, **kwargs):
    #     if self.classification_prediction == 1:
    #         self.result_summary = "암 의심"
    #     elif self.classification_prediction == 0:
    #         self.result_summary = "정상"
    #     else:
    #         self.result_summary = "판독 불가" if self.error_message else "분석 완료"
    #     super().save(*args, **kwargs)