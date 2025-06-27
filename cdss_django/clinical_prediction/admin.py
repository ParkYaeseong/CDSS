from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
import json
from .models import ClinicalPredictionResult, PredictionModelInfo, PredictionAuditLog

@admin.register(ClinicalPredictionResult)
class ClinicalPredictionResultAdmin(admin.ModelAdmin):
    list_display = [
        'patient_name', 'patient_id', 'cancer_type', 'prediction_type', 
        'confidence_score', 'is_validated', 'created_at'
    ]
    list_filter = [
        'cancer_type', 'prediction_type', 'is_validated', 
        'created_at', 'confidence_score'
    ]
    search_fields = ['patient_name', 'patient_id', 'notes']
    readonly_fields = ['created_at', 'updated_at', 'prediction_result_display']
    fieldsets = (
        ('기본 정보', {
            'fields': ('patient_id', 'patient_name', 'cancer_type', 'prediction_type')
        }),
        ('예측 결과', {
            'fields': ('prediction_result_display', 'confidence_score', 'model_version')
        }),
        ('메타 정보', {
            'fields': ('created_by', 'created_at', 'updated_at', 'is_validated')
        }),
        ('추가 정보', {
            'fields': ('clinical_summary', 'notes'),
            'classes': ('collapse',)
        })
    )
    
    def prediction_result_display(self, obj):
        """예측 결과를 보기 좋게 표시"""
        if obj.prediction_result:
            formatted_json = json.dumps(obj.prediction_result, indent=2, ensure_ascii=False)
            return format_html('<pre>{}</pre>', formatted_json)
        return '-'
    prediction_result_display.short_description = '예측 결과'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by')
    
    actions = ['mark_as_validated', 'mark_as_unvalidated']
    
    def mark_as_validated(self, request, queryset):
        updated = queryset.update(is_validated=True)
        self.message_user(request, f'{updated}개의 예측 결과가 검증 완료로 표시되었습니다.')
    mark_as_validated.short_description = '선택된 예측 결과를 검증 완료로 표시'
    
    def mark_as_unvalidated(self, request, queryset):
        updated = queryset.update(is_validated=False)
        self.message_user(request, f'{updated}개의 예측 결과가 미검증으로 표시되었습니다.')
    mark_as_unvalidated.short_description = '선택된 예측 결과를 미검증으로 표시'


@admin.register(PredictionModelInfo)
class PredictionModelInfoAdmin(admin.ModelAdmin):
    list_display = [
        'model_name', 'cancer_type', 'prediction_type', 'version', 
        'accuracy', 'is_active', 'training_date'
    ]
    list_filter = ['cancer_type', 'prediction_type', 'is_active', 'training_date']
    search_fields = ['model_name', 'description']
    list_editable = ['is_active']
    
    fieldsets = (
        ('모델 정보', {
            'fields': ('model_name', 'cancer_type', 'prediction_type', 'version')
        }),
        ('파일 정보', {
            'fields': ('model_file',)
        }),
        ('성능 정보', {
            'fields': ('accuracy', 'training_date')
        }),
        ('상태', {
            'fields': ('is_active', 'description')
        })
    )


@admin.register(PredictionAuditLog)
class PredictionAuditLogAdmin(admin.ModelAdmin):
    list_display = ['prediction_result', 'action', 'user', 'timestamp']
    list_filter = ['action', 'timestamp']
    readonly_fields = ['prediction_result', 'action', 'user', 'timestamp', 'details']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
