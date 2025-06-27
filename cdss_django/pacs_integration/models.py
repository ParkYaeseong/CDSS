# pacs_integration/models.py

from django.db import models
from django.conf import settings # Django 프로젝트의 사용자 모델을 가져오기 위함 (선택 사항)

class OpenEMRPatientOrthancLink(models.Model):
    """OpenEMR 환자와 Orthanc 환자/Study를 연결하는 모델"""
    # Django의 기본 User 모델 또는 커스텀 User 모델과 연결할 수 있습니다 (선택 사항)
    # user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, help_text="이 링크를 생성/관리하는 시스템 사용자")
    
    openemr_patient_id = models.CharField(
        max_length=100, 
        unique=True, 
        db_index=True, # 검색 성능을 위해 인덱스 추가
        help_text="OpenEMR 시스템의 환자 고유 ID"
    )
    # OpenEMR에서 가져올 수 있는 추가 식별 정보
    openemr_patient_name = models.CharField(max_length=255, null=True, blank=True, help_text="OpenEMR의 환자 이름 (동기화용)")
    openemr_patient_dob = models.DateField(null=True, blank=True, help_text="OpenEMR의 환자 생년월일 (동기화용)")

    # Orthanc 관련 정보
    orthanc_patient_id = models.CharField(
        max_length=255, 
        null=True, 
        blank=True, 
        db_index=True, # 검색 성능을 위해 인덱스 추가
        help_text="Orthanc 시스템의 환자 ID (DICOM PatientID 태그와 다를 수 있음, Orthanc 내부 ID)"
    )
    # 가장 최근 연관된 Study Instance UID (여러 개일 수 있으므로, 별도 모델이나 JSON 필드로 관리 고려)
    last_known_study_uid = models.CharField(max_length=255, null=True, blank=True, help_text="가장 최근 연관된 Orthanc Study Instance UID")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "OpenEMR-Orthanc Patient Link"
        verbose_name_plural = "OpenEMR-Orthanc Patient Links"
        ordering = ['-updated_at']

    def __str__(self):
        return f"EMR ID: {self.openemr_patient_id} ({self.openemr_patient_name or 'N/A'}) <-> Orthanc Patient ID: {self.orthanc_patient_id or 'N/A'}"

class OrthancStudyLog(models.Model):
    """Orthanc Study 관련 정보를 로깅하거나 관리하는 모델 (선택 사항)"""
    patient_link = models.ForeignKey(
        OpenEMRPatientOrthancLink, 
        on_delete=models.CASCADE, # 부모 PatientLink 삭제 시 함께 삭제
        related_name='study_logs',
        help_text="연관된 OpenEMR-Orthanc 환자 링크"
    )
    orthanc_study_instance_uid = models.CharField(max_length=255, unique=True, db_index=True, help_text="Orthanc Study Instance UID (DICOM Tag: 0020,000D)")
    study_description = models.TextField(null=True, blank=True, help_text="Study Description (DICOM Tag: 0008,1030)")
    study_date = models.DateField(null=True, blank=True, help_text="Study Date (DICOM Tag: 0008,0020)")
    study_time = models.TimeField(null=True, blank=True, help_text="Study Time (DICOM Tag: 0008,0030)")
    accession_number = models.CharField(max_length=100, null=True, blank=True, db_index=True, help_text="Accession Number (DICOM Tag: 0008,0050)")
    modality = models.CharField(max_length=50, null=True, blank=True, help_text="Modality (DICOM Tag: 0008,0060)")
    
    # Orthanc 내부 ID (Study Level)
    orthanc_study_internal_id = models.CharField(max_length=255, null=True, blank=True, help_text="Orthanc 내부 Study ID")
    
    dicom_file_path_or_url = models.URLField(max_length=1024, null=True, blank=True, help_text="업로드된 DICOM 파일의 경로 또는 접근 URL (필요시)")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, help_text="업로드한 시스템 사용자")
    upload_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Orthanc Study Log"
        verbose_name_plural = "Orthanc Study Logs"
        ordering = ['-upload_timestamp']

    def __str__(self):
        return f"Study UID: {self.orthanc_study_instance_uid} for Patient: {self.patient_link.openemr_patient_id}"