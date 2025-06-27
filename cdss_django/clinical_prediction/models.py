from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
import json

class ClinicalPredictionResult(models.Model):
    CANCER_TYPES = [
        ('liver', '간암 (LIHC)'),
        ('kidney', '신장암 (KIRC)'),
        ('stomach', '위암 (STAD)'),
    ]
    
    PREDICTION_TYPES = [
        ('survival', '생존 예측'),
        ('risk', '위험도 분류'),
        ('treatment', '치료 효과'),
    ]
    
    # 기본 정보models.ForeignKey
    patient_id = models.CharField(max_length=100, verbose_name='환자 ID')
    patient_name = models.CharField(max_length=100, verbose_name='환자명')
    cancer_type = models.CharField(max_length=20, choices=CANCER_TYPES, verbose_name='암종')
    prediction_type = models.CharField(max_length=20, choices=PREDICTION_TYPES, verbose_name='예측 유형')
    
    # 예측 결과
    prediction_result = models.JSONField(verbose_name='예측 결과')
    confidence_score = models.FloatField(default=0.0, verbose_name='신뢰도')
    model_version = models.CharField(max_length=50, default='v1.0', verbose_name='모델 버전')
    
    # 메타 정보
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='생성자')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')
    
    # 추가 정보
    clinical_summary = models.JSONField(null=True, blank=True, verbose_name='임상 요약')
    notes = models.TextField(blank=True, verbose_name='비고')
    is_validated = models.BooleanField(default=False, verbose_name='검증 완료')
    
    class Meta:
        db_table = 'clinical_prediction_results'
        verbose_name = '임상 예측 결과'
        verbose_name_plural = '임상 예측 결과들'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient_id', 'cancer_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['prediction_type', 'cancer_type']),
        ]
    
    def __str__(self):
        return f"{self.patient_name} - {self.get_cancer_type_display()} - {self.get_prediction_type_display()}"
    
    def get_prediction_summary(self):
        """예측 결과 요약 반환"""
        if self.prediction_type == 'survival':
            return self.prediction_result.get('survival_probabilities', {})
        elif self.prediction_type == 'risk':
            return {
                'risk_class': self.prediction_result.get('predicted_risk_class'),
                'confidence': self.prediction_result.get('confidence')
            }
        elif self.prediction_type == 'treatment':
            return self.prediction_result.get('recommended_treatment', {})
        return {}


class PredictionModelInfo(models.Model):
    """예측 모델 정보 관리"""
    cancer_type = models.CharField(max_length=20, choices=ClinicalPredictionResult.CANCER_TYPES)
    prediction_type = models.CharField(max_length=20, choices=ClinicalPredictionResult.PREDICTION_TYPES)
    model_name = models.CharField(max_length=100, verbose_name='모델명')
    model_file = models.CharField(max_length=255, verbose_name='모델 파일명')
    version = models.CharField(max_length=20, default='1.0', verbose_name='버전')
    accuracy = models.FloatField(null=True, blank=True, verbose_name='정확도')
    training_date = models.DateTimeField(null=True, blank=True, verbose_name='훈련일시')
    is_active = models.BooleanField(default=True, verbose_name='활성화')
    description = models.TextField(blank=True, verbose_name='설명')
    
    class Meta:
        db_table = 'prediction_model_info'
        verbose_name = '예측 모델 정보'
        verbose_name_plural = '예측 모델 정보들'
        unique_together = ['cancer_type', 'prediction_type', 'version']
    
    def __str__(self):
        return f"{self.model_name} v{self.version}"


class PredictionAuditLog(models.Model):
    """예측 수행 로그"""
    prediction_result = models.ForeignKey(ClinicalPredictionResult, on_delete=models.CASCADE)
    action = models.CharField(max_length=50, verbose_name='액션')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(null=True, blank=True)
    
    class Meta:
        db_table = 'prediction_audit_log'
        verbose_name = '예측 감사 로그'
        verbose_name_plural = '예측 감사 로그들'
