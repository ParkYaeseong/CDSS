# lis_integration/models.py

import uuid
from django.db import models
from django.conf import settings
from patients.models import PatientProfile # 환자 프로필 모델을 직접 참조
from omics.models import OmicsRequest       
from diagnosis.models import DiagnosisRequest

# --- LIS 시스템과 환자 ID를 연결하는 모델 (기존 모델 유지) ---
class LISPatientLink(models.Model):
    """OpenEMR 환자와 LIS 환자를 연결하는 모델"""
    # [개선] 문자열 ID 대신 PatientProfile 모델과 직접 1대1로 연결합니다.
    # 이렇게 하면 데이터 무결성이 보장됩니다.
    patient = models.OneToOneField(
        PatientProfile,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='lis_link'
    )
    # 기존 openemr_patient_id와 name은 patient 객체를 통해 접근 가능하므로 중복 저장할 필요가 없습니다.
    # 예: link.patient.openemr_id, link.patient.name
    
    lis_patient_id = models.CharField(max_length=100, null=True, blank=True, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "LIS Patient Link"
        verbose_name_plural = "LIS Patient Links"

    def __str__(self):
        return f"EMR: {self.patient.openemr_id} <-> LIS: {self.lis_patient_id or 'N/A'}"

# --- 검사 오더 정보를 저장하는 메인 모델 ---
# [개선] 기존 LabOrderSync를 대체하고 확장하는 새로운 모델입니다.
class LabOrder(models.Model):
    class StatusChoices(models.TextChoices):
        ORDERED = 'ordered', '주문됨'
        COLLECTED = 'collected', '채취완료'
        PROCESSING = 'processing', '처리중'
        COMPLETED = 'completed', '완료'
        CANCELLED = 'cancelled', '취소됨'

    class PriorityChoices(models.TextChoices):
        ROUTINE = 'routine', '일반'
        URGENT = 'urgent', '긴급'
        STAT = 'stat', '즉시'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # 환자 및 담당 의사 정보
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='lab_orders')
    omics_request = models.ForeignKey(OmicsRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='lab_orders')
    diagnosis_request = models.ForeignKey(DiagnosisRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='lab_orders')
    
    ordering_physician = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='ordered_lab_tests'
    )
    
    # 검사 정보
    test_name = models.CharField(max_length=200, help_text="검사 항목 이름 (예: Complete Blood Count)")
    test_codes = models.JSONField(default=list, help_text="관련 검사 코드 목록 (예: ['CBC', 'B001'])")
    
    # 상태 및 우선순위
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ORDERED, db_index=True)
    priority = models.CharField(max_length=20, choices=PriorityChoices.choices, default=PriorityChoices.ROUTINE)
    
    # 결과 및 메모
    result_value = models.CharField(max_length=200, blank=True, null=True)
    result_unit = models.CharField(max_length=50, blank=True, null=True)
    reference_range = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # 외부 시스템 연동 정보
    lis_order_id = models.CharField(max_length=100, blank=True, null=True, unique=True, help_text="외부 LIS 시스템의 오더 ID")
    
    # 시간 정보
    ordered_at = models.DateTimeField(auto_now_add=True)
    sample_collected_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Lab Order for {self.patient.name} - {self.test_name}"

    class Meta:
        ordering = ['-ordered_at']
        verbose_name = "Lab Order"
        verbose_name_plural = "Lab Orders"