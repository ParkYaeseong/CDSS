# patients/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    PatientProfile, LiverCancerClinicalData, ClinicalData,
    FlutterPatientProfile, PatientVerificationCode, RegistrationCode
)

@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'openemr_id', 'date_of_birth', 'gender', 'registered_by')
    search_fields = ('first_name', 'last_name', 'openemr_id')
    list_filter = ('gender', 'registered_by')
    ordering = ('last_name', 'first_name')
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('openemr_id', 'first_name', 'last_name')
        }),
        ('개인 정보', {
            'fields': ('date_of_birth', 'gender', 'phone_number', 'address')
        }),
        ('시스템 정보', {
            'fields': ('registered_by', 'study_uid', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(LiverCancerClinicalData)
class LiverCancerClinicalDataAdmin(admin.ModelAdmin):
    list_display = (
        'patient', 'form_date', 'cancer_stage', 'child_pugh_classification', 
        'received_chemotherapy', 'vital_status', 'created_at'
    )
    search_fields = ('patient__first_name', 'patient__last_name', 'patient__openemr_id')
    list_filter = (
        'cancer_stage', 'child_pugh_classification', 'vital_status', 
        'received_chemotherapy', 'received_radiation', 'form_date'
    )
    ordering = ('-form_date',)
    readonly_fields = ['id', 'age_at_diagnosis', 'created_at', 'updated_at']
    
    fieldsets = (
        ('환자 정보', {
            'fields': ('patient', 'openemr_encounter_id', 'form_date')
        }),
        ('진단 정보', {
            'fields': (
                'primary_diagnosis', 'cancer_stage', 
                'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m',
                'tumor_grade', 'year_of_diagnosis'
            )
        }),
        ('간기능 평가', {
            'fields': ('child_pugh_classification', 'fibrosis_score')
        }),
        ('치료 정보 (기존)', {
            'fields': (
                'received_chemotherapy', 'chemotherapy_type', 'treatment_intent',
                'received_radiation', 'radiation_type', 'radiation_intent'
            )
        }),
        ('치료 정보 (OpenEMR 약자)', {
            'fields': (
                'pharm_tx_type', 'pharm_tx_therapy', 'pharm_tx_intent',
                'radiation_tx_type', 'radiation_tx_therapy', 'radiation_tx_intent'
            ),
            'classes': ('collapse',)
        }),
        ('병력', {
            'fields': ('prior_treatment', 'prior_cancer', 'synchronous_cancer')
        }),
        ('수술/조직 정보', {
            'fields': ('biopsy_site', 'residual_disease', 'morphology_code')
        }),
        ('생존 정보', {
            'fields': ('vital_status', 'days_to_death', 'follow_up_days')
        }),
        ('메타데이터', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # 수정 시
            return ['patient', 'openemr_encounter_id', 'age_at_diagnosis', 'created_at', 'updated_at']
        return ['age_at_diagnosis', 'created_at', 'updated_at']

class ClinicalDataInline(admin.TabularInline):
    model = ClinicalData
    extra = 0
    fields = (
        'cancer_type', 'form_date', 'vital_status', 'ajcc_pathologic_stage', 
        'child_pugh_classification', 'tumor_grade', 'primary_diagnosis',
        'treatments_pharmaceutical_treatment_type', 'prior_treatment'
    )
    readonly_fields = ('form_date',)
    
    def has_add_permission(self, request, obj=None):
        return True

@admin.register(ClinicalData)
class ClinicalDataAdmin(admin.ModelAdmin):
    list_display = (
        'patient_name', 'cancer_type_display', 'form_date_display', 
        'vital_status_display', 'cancer_stage', 'child_pugh_classification', 
        'age_at_diagnosis', 'created_at_display'
    )
    list_filter = (
        'cancer_type', 'vital_status', 'form_date', 'child_pugh_classification',
        'ajcc_pathologic_stage', 'tumor_grade', 'treatments_pharmaceutical_treatment_type',
        'treatments_radiation_treatment_type', 'prior_malignancy', 'synchronous_malignancy'
    )
    search_fields = ('patient__first_name', 'patient__last_name', 'patient__openemr_id')
    date_hierarchy = 'form_date'
    ordering = ['-form_date']
    readonly_fields = ['id', 'calculated_age_at_diagnosis', 'created_at', 'updated_at']
    
    fieldsets = (
        ('환자 및 기본 정보', {
            'fields': ('patient', 'cancer_type', 'created_by', 'submitter_id')
        }),
        ('생존 정보', {
            'fields': ('vital_status', 'days_to_death', 'days_to_last_follow_up', 'cause_of_death')
        }),
        ('환자 기본 정보', {
            'fields': ('age_at_diagnosis', 'gender', 'race', 'ethnicity', 'year_of_diagnosis', 'age_at_index', 'days_to_birth', 'year_of_birth', 'year_of_death')
        }),
        ('병기 정보 (Pathologic)', {
            'fields': ('ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m', 'ajcc_staging_system_edition')
        }),
        ('병기 정보 (Clinical) - 신장암', {
            'fields': ('ajcc_clinical_stage', 'ajcc_clinical_t', 'ajcc_clinical_n', 'ajcc_clinical_m'),
            'classes': ('collapse',),
            'description': '주로 신장암 환자에게 해당되는 필드입니다.'
        }),
        ('종양 특성', {
            'fields': ('tumor_grade', 'morphology', 'primary_diagnosis', 'classification_of_tumor', 'residual_disease', 'icd_10_code', 'tumor_of_origin')
        }),
        ('간암 특이적 정보', {
            'fields': ('child_pugh_classification', 'ishak_fibrosis_score'),
            'classes': ('collapse',),
            'description': '간암 환자에게만 해당되는 필드입니다.'
        }),
        ('치료 정보 (기본)', {
            'fields': (
                'prior_treatment', 'prior_malignancy', 'synchronous_malignancy',
                'treatments_pharmaceutical_treatment_type', 
                'treatments_pharmaceutical_treatment_intent_type',
                'treatments_pharmaceutical_treatment_or_therapy',
                'treatments_pharmaceutical_treatment_outcome',
                'treatments_radiation_treatment_type',
                'treatments_radiation_treatment_or_therapy',
                'treatments_radiation_treatment_intent_type',
                'treatments_radiation_treatment_outcome'
            )
        }),
        ('치료 세부 정보 (약물)', {
            'fields': (
                'treatments_pharmaceutical_regimen_or_line_of_therapy',
                'treatments_pharmaceutical_number_of_cycles',
                'treatments_pharmaceutical_days_to_treatment_start',
                'treatments_pharmaceutical_initial_disease_status',
                'treatments_pharmaceutical_therapeutic_agents',
                'treatments_pharmaceutical_treatment_dose',
                'treatments_pharmaceutical_treatment_dose_units',
                'treatments_pharmaceutical_prescribed_dose_units',
                'treatments_pharmaceutical_number_of_fractions',
                'treatments_pharmaceutical_treatment_anatomic_sites',
                'treatments_pharmaceutical_prescribed_dose',
                'treatments_pharmaceutical_clinical_trial_indicator',
                'treatments_pharmaceutical_route_of_administration',
                'treatments_pharmaceutical_course_number'
            ),
            'classes': ('collapse',),
            'description': '주로 위암 환자의 약물 치료 세부 정보입니다.'
        }),
        ('치료 세부 정보 (방사선)', {
            'fields': (
                'treatments_radiation_days_to_treatment_start',
                'treatments_radiation_number_of_cycles',
                'treatments_radiation_treatment_dose',
                'treatments_radiation_treatment_dose_units',
                'treatments_radiation_therapeutic_agents',
                'treatments_radiation_days_to_treatment_end',
                'treatments_radiation_clinical_trial_indicator',
                'treatments_radiation_number_of_fractions',
                'treatments_radiation_treatment_anatomic_sites',
                'treatments_radiation_prescribed_dose_units',
                'treatments_radiation_prescribed_dose',
                'treatments_radiation_route_of_administration',
                'treatments_radiation_course_number'
            ),
            'classes': ('collapse',),
            'description': '주로 위암 환자의 방사선 치료 세부 정보입니다.'
        }),
        ('생활습관 정보 (신장암/위암)', {
            'fields': ('tobacco_smoking_status', 'pack_years_smoked', 'tobacco_smoking_quit_year', 'tobacco_smoking_onset_year'),
            'classes': ('collapse',),
            'description': '주로 신장암, 위암 환자에게 해당되는 필드입니다.'
        }),
        ('해부학적 정보', {
            'fields': ('laterality', 'site_of_resection_or_biopsy', 'tissue_or_organ_of_origin')
        }),
        ('예후 정보 (위암)', {
            'fields': (
                'last_known_disease_status', 'days_to_recurrence', 
                'progression_or_recurrence', 'days_to_last_known_disease_status'
            ),
            'classes': ('collapse',),
            'description': '주로 위암 환자에게 해당되는 필드입니다.'
        }),
        ('시간 관련 정보', {
            'fields': ('days_to_diagnosis',),
            'description': '진단 관련 시간 정보입니다.'
        }),
        ('추가 데이터', {
            'fields': ('additional_data',),
            'classes': ('collapse',),
            'description': 'JSON 형태로 저장되는 추가 임상 데이터입니다.'
        }),
        ('메타데이터', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def patient_name(self, obj):
        url = reverse('admin:patients_clinicaldata_change', args=[obj.id])
        return format_html('<a href="{}">{}</a>', url, obj.patient.name)
    patient_name.short_description = 'Patient'
    patient_name.admin_order_field = 'patient__last_name'
    
    def cancer_type_display(self, obj):
        colors = {
            'liver': '#ff9800',
            'kidney': '#2196f3', 
            'stomach': '#4caf50'
        }
        color = colors.get(obj.cancer_type, '#757575')
        return format_html(
            '<span style="color: {}; font-weight: bold; padding: 2px 6px; border-radius: 3px; background-color: {}20;">{}</span>',
            color, color, obj.get_cancer_type_display()
        )
    cancer_type_display.short_description = 'Cancer Type'
    cancer_type_display.admin_order_field = 'cancer_type'
    
    def form_date_display(self, obj):
        return obj.form_date.strftime('%Y년 %m월 %d일')
    form_date_display.short_description = 'Form Date'
    form_date_display.admin_order_field = 'form_date'
    
    def vital_status_display(self, obj):
        if obj.vital_status:
            if obj.vital_status.lower() == 'alive':
                return format_html(
                    '<span style="color: #4caf50; font-weight: bold;">● {}</span>',
                    obj.vital_status
                )
            elif obj.vital_status.lower() == 'dead':
                return format_html(
                    '<span style="color: #f44336; font-weight: bold;">● {}</span>',
                    obj.vital_status
                )
            else:
                return format_html(
                    '<span style="color: #ff9800; font-weight: bold;">● {}</span>',
                    obj.vital_status
                )
        return '-'
    vital_status_display.short_description = 'Vital Status'
    vital_status_display.admin_order_field = 'vital_status'
    
    def cancer_stage(self, obj):
        if obj.ajcc_pathologic_stage:
            return format_html(
                '<span style="background-color: #e3f2fd; padding: 2px 6px; border-radius: 3px; font-weight: bold;">{}</span>',
                obj.ajcc_pathologic_stage
            )
        return '-'
    cancer_stage.short_description = 'Cancer Stage'
    cancer_stage.admin_order_field = 'ajcc_pathologic_stage'
    
    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y년 %m월 %d일 %H:%M')
    created_at_display.short_description = 'Created At'
    created_at_display.admin_order_field = 'created_at'

# ✅ Flutter 환자 관리 Admin 수정 (필드명 수정)
@admin.register(FlutterPatientProfile)
class FlutterPatientProfileAdmin(admin.ModelAdmin):
    list_display = [
        'patient_id_display', 'user_display', 'phone_number', 'is_linked_display', 
        'is_verified_display', 'verification_method', 'created_at_display'
    ]
    # ✅ 필드명 수정: linked_patient → linked_patient_profile
    list_filter = ['linked_patient_profile', 'is_verified', 'verification_method', 'created_at']
    search_fields = [
        'patient_id', 'user__username', 'user__first_name', 
        'user__last_name', 'phone_number',
        'linked_patient_profile__name',  # ✅ 필드명 수정
        'linked_patient_profile__openemr_id'  # ✅ 필드명 수정
    ]
    readonly_fields = ['patient_id', 'created_at', 'updated_at', 'verified_at', 'linked_at']
    
    fieldsets = (
        ('기본 정보', {
            'fields': ('user', 'patient_id', 'phone_number', 'birth_date', 'address')
        }),
        ('의료 정보', {
            'fields': ('blood_type', 'allergies', 'medical_history', 'emergency_contact', 'insurance_number')
        }),
        ('연결 정보', {
            'fields': ('linked_patient_profile', 'is_linked', 'linked_at'),  # ✅ 필드명 수정
            'description': '병원 환자 프로필과의 연결 정보입니다.'
        }),
        ('인증 정보', {
            'fields': ('is_verified', 'verification_method', 'verified_at'),
            'description': '환자 인증 상태 정보입니다.'
        }),
        ('메타데이터', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def patient_id_display(self, obj):
        return format_html(
            '<span style="font-family: monospace; background-color: #e3f2fd; padding: 2px 6px; border-radius: 3px; font-weight: bold;">{}</span>',
            obj.patient_id
        )
    patient_id_display.short_description = 'Flutter Patient ID'
    patient_id_display.admin_order_field = 'patient_id'
    
    def user_display(self, obj):
        full_name = obj.user.get_full_name()
        if full_name:
            return format_html(
                '<strong>{}</strong><br><small style="color: #666;">@{}</small>',
                full_name, obj.user.username
            )
        return obj.user.username
    user_display.short_description = 'User'
    user_display.admin_order_field = 'user__username'
    
    def is_linked_display(self, obj):
        if obj.linked_patient_profile:  # ✅ 필드명 수정
            return format_html(
                '<span style="color: #4caf50; font-weight: bold;">● 연결됨</span><br><small>{}</small>',
                obj.linked_patient_profile.name  # ✅ 필드명 수정
            )
        else:
            return format_html('<span style="color: #ff9800; font-weight: bold;">○ 미연결</span>')
    is_linked_display.short_description = 'Link Status'
    is_linked_display.admin_order_field = 'linked_patient_profile'  # ✅ 필드명 수정
    
    def is_verified_display(self, obj):
        if obj.is_verified:
            return format_html(
                '<span style="color: #4caf50; font-weight: bold;">✓ 인증됨</span>'
            )
        else:
            return format_html('<span style="color: #f44336; font-weight: bold;">✗ 미인증</span>')
    is_verified_display.short_description = 'Verification'
    is_verified_display.admin_order_field = 'is_verified'
    
    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y년 %m월 %d일')
    created_at_display.short_description = 'Created'
    created_at_display.admin_order_field = 'created_at'
    
    def get_queryset(self, request):
        """쿼리셋 최적화"""
        return super().get_queryset(request).select_related(
            'user', 'linked_patient_profile'  # ✅ 필드명 수정
        )

@admin.register(PatientVerificationCode)
class PatientVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ['flutter_patient_display', 'code_display', 'purpose', 'is_used_display', 'expires_at_display', 'created_at_display']
    list_filter = ['purpose', 'is_used', 'created_at', 'expires_at']
    search_fields = ['flutter_patient__user__username', 'code', 'flutter_patient__patient_id']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('인증 코드 정보', {
            'fields': ('flutter_patient', 'code', 'purpose')
        }),
        ('유효성 정보', {
            'fields': ('expires_at', 'is_used', 'used_at')
        }),
        ('메타데이터', {
            'fields': ('created_by', 'created_at'),
            'classes': ('collapse',)
        })
    )
    
    def flutter_patient_display(self, obj):
        return format_html(
            '<strong>{}</strong><br><small style="color: #666;">{}</small>',
            obj.flutter_patient.user.get_full_name() or obj.flutter_patient.user.username,
            obj.flutter_patient.patient_id
        )
    flutter_patient_display.short_description = 'Flutter Patient'
    flutter_patient_display.admin_order_field = 'flutter_patient__user__username'
    
    def code_display(self, obj):
        return format_html(
            '<span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #2196f3;">{}</span>',
            obj.code
        )
    code_display.short_description = 'Code'
    code_display.admin_order_field = 'code'
    
    def is_used_display(self, obj):
        from django.utils import timezone
        if obj.is_used:
            return format_html(
                '<span style="color: #f44336; font-weight: bold;">● 사용됨</span><br><small>{}</small>',
                obj.used_at.strftime('%m월 %d일 %H:%M') if obj.used_at else ''
            )
        elif obj.expires_at and obj.expires_at < timezone.now():
            return format_html('<span style="color: #ff9800; font-weight: bold;">● 만료됨</span>')
        else:
            return format_html('<span style="color: #4caf50; font-weight: bold;">● 사용 가능</span>')
    is_used_display.short_description = 'Status'
    is_used_display.admin_order_field = 'is_used'
    
    def expires_at_display(self, obj):
        return obj.expires_at.strftime('%Y년 %m월 %d일 %H:%M')
    expires_at_display.short_description = 'Expires At'
    expires_at_display.admin_order_field = 'expires_at'
    
    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y년 %m월 %d일 %H:%M')
    created_at_display.short_description = 'Created At'
    created_at_display.admin_order_field = 'created_at'

@admin.register(RegistrationCode)
class RegistrationCodeAdmin(admin.ModelAdmin):
    list_display = ['code_display', 'purpose', 'is_used_display', 'used_by_display', 'expires_at_display', 'created_at_display']
    list_filter = ['purpose', 'is_used', 'created_at', 'expires_at']
    search_fields = ['code', 'used_by__username', 'created_by__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('회원가입 코드 정보', {
            'fields': ('code', 'purpose')
        }),
        ('유효성 정보', {
            'fields': ('expires_at', 'is_used', 'used_at', 'used_by')
        }),
        ('메타데이터', {
            'fields': ('created_by', 'created_at', 'metadata'),
            'classes': ('collapse',)
        })
    )
    
    def code_display(self, obj):
        return format_html(
            '<span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #4caf50; background-color: #e8f5e8; padding: 4px 8px; border-radius: 4px;">{}</span>',
            obj.code
        )
    code_display.short_description = 'Registration Code'
    code_display.admin_order_field = 'code'
    
    def is_used_display(self, obj):
        from django.utils import timezone
        if obj.is_used:
            return format_html(
                '<span style="color: #f44336; font-weight: bold;">● 사용됨</span><br><small>{}</small>',
                obj.used_at.strftime('%m월 %d일 %H:%M') if obj.used_at else ''
            )
        elif obj.expires_at and obj.expires_at < timezone.now():
            return format_html('<span style="color: #ff9800; font-weight: bold;">● 만료됨</span>')
        else:
            return format_html('<span style="color: #4caf50; font-weight: bold;">● 사용 가능</span>')
    is_used_display.short_description = 'Status'
    is_used_display.admin_order_field = 'is_used'
    
    def used_by_display(self, obj):
        if obj.used_by:
            return format_html(
                '<strong>{}</strong><br><small style="color: #666;">@{}</small>',
                obj.used_by.get_full_name() or obj.used_by.username,
                obj.used_by.username
            )
        return '-'
    used_by_display.short_description = 'Used By'
    used_by_display.admin_order_field = 'used_by__username'
    
    def expires_at_display(self, obj):
        return obj.expires_at.strftime('%Y년 %m월 %d일 %H:%M')
    expires_at_display.short_description = 'Expires At'
    expires_at_display.admin_order_field = 'expires_at'
    
    def created_at_display(self, obj):
        return obj.created_at.strftime('%Y년 %m월 %d일 %H:%M')
    created_at_display.short_description = 'Created At'
    created_at_display.admin_order_field = 'created_at'

# PatientProfile에 ClinicalData 인라인 추가
PatientProfileAdmin.inlines = [ClinicalDataInline]
