# patients/models.py
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.contrib.auth import get_user_model  # 이 줄 추가
import secrets
import string

User = get_user_model()

class PatientProfile(models.Model):
    class GenderChoices(models.TextChoices):
        MALE = 'MALE', _('Male')
        FEMALE = 'FEMALE', _('Female')
        OTHER = 'OTHER', _('Other')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    openemr_id = models.CharField(
        _("OpenEMR Patient ID"), max_length=100, unique=True, db_index=True,
        help_text=_("The public patient ID (pubpid) from the OpenEMR system.")
    )
    first_name = models.CharField(_("First Name"), max_length=100)
    last_name = models.CharField(_("Last Name"), max_length=100)
    date_of_birth = models.DateField(_("Date of Birth"), null=True, blank=True)
    gender = models.CharField(
        _("Gender"), max_length=10, choices=GenderChoices.choices, default=GenderChoices.OTHER
    )
    phone_number = models.CharField(_("Phone Number"), max_length=20, blank=True)
    address = models.TextField(_("Address"), blank=True)
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='registered_patients'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    study_uid = models.CharField(_("Latest Study UID"), max_length=255, blank=True, null=True,
                                 help_text=_("The Study Instance UID from the last uploaded DICOM file via Orthanc."))

    class Meta:
        verbose_name = _("Patient Profile")
        verbose_name_plural = _("Patient Profiles")
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.last_name}, {self.first_name} (EMR ID: {self.openemr_id})"

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"

# patients/models.py에서 FlutterPatientProfile 모델 수정

class FlutterPatientProfile(models.Model):
    """Flutter 앱 환자 프로필"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='flutter_patient_profile'
    )
    patient_id = models.CharField(
        _("Flutter Patient ID"),
        max_length=50,
        unique=True,
        help_text=_("Flutter 앱에서 사용하는 환자 고유 ID")
    )
    
    # 의료 정보
    phone_number = models.CharField(_("Phone Number"), max_length=20, blank=True)
    birth_date = models.DateField(_("Birth Date"), null=True, blank=True)
    address = models.TextField(_("Address"), blank=True)
    blood_type = models.CharField(_("Blood Type"), max_length=10, blank=True)
    allergies = models.TextField(_("Allergies"), blank=True)
    medical_history = models.TextField(_("Medical History"), blank=True)
    emergency_contact = models.CharField(_("Emergency Contact"), max_length=100, blank=True)  # ✅ 추가
    insurance_number = models.CharField(_("Insurance Number"), max_length=50, blank=True)  # ✅ 추가
    
    # 병원 환자 프로필과의 연결 (필드명 수정)
    linked_patient_profile = models.ForeignKey(  # ✅ 필드명 변경 (linked_patient → linked_patient_profile)
        'PatientProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_flutter_patients',
        help_text=_("연결된 병원 환자 프로필")
    )
    is_linked = models.BooleanField(_("Is Linked"), default=False)  # ✅ 추가
    linked_at = models.DateTimeField(_("Linked At"), null=True, blank=True)
    
    # 인증 관련
    is_verified = models.BooleanField(_("Is Verified"), default=False)
    verification_method = models.CharField(
        _("Verification Method"),
        max_length=50,
        blank=True,
        choices=[
            ('phone', '휴대폰 인증'),
            ('email', '이메일 인증'),
            ('hospital_code', '병원 인증 코드'),
            ('registration_code', '회원가입 코드')
        ]
    )
    verified_at = models.DateTimeField(_("Verified At"), null=True, blank=True)
    
    # 메타데이터
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("Flutter Patient Profile")
        verbose_name_plural = _("Flutter Patient Profiles")
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} (Flutter ID: {self.patient_id})"
    
    def save(self, *args, **kwargs):
        if not self.patient_id:
            self.patient_id = self.generate_patient_id()
        super().save(*args, **kwargs)
    
    def generate_patient_id(self):
        """Flutter 환자 ID 생성"""
        prefix = "FL"
        timestamp = timezone.now().strftime("%Y%m%d")
        random_suffix = ''.join(secrets.choice(string.digits) for _ in range(3))
        return f"{prefix}{timestamp}{random_suffix}"
    
    @property
    def is_linked(self):
        """병원 환자 프로필과 연결되어 있는지 확인"""
        return self.linked_patient_profile is not None
    
    def link_to_hospital_patient(self, hospital_patient):
        """병원 환자 프로필과 연결"""
        self.linked_patient_profile = hospital_patient  # ✅ 필드명 수정
        self.is_linked = True  # ✅ 추가
        self.linked_at = timezone.now()
        self.save()

class PatientVerificationCode(models.Model):
    """환자 인증 코드"""
    
    PURPOSE_CHOICES = [
        ('profile_link', '프로필 연결'),
        ('account_verify', '계정 인증'),
        ('password_reset', '비밀번호 재설정'),
        ('phone_verify', '휴대폰 인증'),
    ]
    
    flutter_patient = models.ForeignKey(
        FlutterPatientProfile,
        on_delete=models.CASCADE,
        related_name='verification_codes'
    )
    code = models.CharField(_("Verification Code"), max_length=10)
    purpose = models.CharField(_("Purpose"), max_length=20, choices=PURPOSE_CHOICES)
    expires_at = models.DateTimeField(_("Expires At"))
    is_used = models.BooleanField(_("Is Used"), default=False)
    used_at = models.DateTimeField(_("Used At"), null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_verification_codes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _("Patient Verification Code")
        verbose_name_plural = _("Patient Verification Codes")
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.flutter_patient.user.username} - {self.code} ({self.purpose})"
    
    def is_valid(self):
        """인증 코드가 유효한지 확인"""
        return not self.is_used and self.expires_at > timezone.now()
    
    def use_code(self):
        """인증 코드 사용 처리"""
        self.is_used = True
        self.used_at = timezone.now()
        self.save()

class RegistrationCode(models.Model):
    """Flutter 앱 회원가입용 인증 코드"""
    
    code = models.CharField(_("Registration Code"), max_length=6, unique=True)
    purpose = models.CharField(_("Purpose"), max_length=20, default='registration')
    expires_at = models.DateTimeField(_("Expires At"))
    is_used = models.BooleanField(_("Is Used"), default=False)
    used_at = models.DateTimeField(_("Used At"), null=True, blank=True)
    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='used_registration_codes'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_registration_codes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _("Registration Code")
        verbose_name_plural = _("Registration Codes")
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Code: {self.code} ({'Used' if self.is_used else 'Available'})"
    
    def is_valid(self):
        """코드가 유효한지 확인"""
        return not self.is_used and self.expires_at > timezone.now()
    
    def use_code(self, user=None):
        """코드 사용 처리"""
        self.is_used = True
        self.used_at = timezone.now()
        if user:
            self.used_by = user
        self.save()

# 나머지 기존 모델들 (LiverCancerClinicalData, ClinicalData 등)은 그대로 유지...


# LiverCancerClinicalData 모델 (기존 코드 그대로 유지)
class LiverCancerClinicalData(models.Model):
    """간암 임상 데이터 모델 - OpenEMR LBF 폼 데이터와 동기화"""

    # 기본 연결 정보
    patient = models.ForeignKey(
        PatientProfile, 
        on_delete=models.CASCADE, 
        related_name='liver_cancer_data',
        verbose_name=_("Patient")
    )
    openemr_encounter_id = models.CharField(
        _("OpenEMR Encounter ID"), 
        max_length=50, 
        help_text=_("The encounter ID from OpenEMR system.")
    )
    form_date = models.DateTimeField(_("Form Date"))

    # 진단 관련 필드
    primary_diagnosis = models.CharField(
        _("Primary Diagnosis"), 
        max_length=200, 
        default="Hepatocellular carcinoma, NOS"
    )
    cancer_stage = models.CharField(
        _("Cancer Stage"), 
        max_length=50, 
        blank=True, 
        null=True,
        help_text=_("AJCC Pathologic Stage")
    )
    ajcc_pathologic_t = models.CharField(
        _("AJCC Pathologic T"), 
        max_length=20, 
        blank=True, 
        null=True
    )
    ajcc_pathologic_n = models.CharField(
        _("AJCC Pathologic N"), 
        max_length=20, 
        default="N0"
    )
    ajcc_pathologic_m = models.CharField(
        _("AJCC Pathologic M"), 
        max_length=20, 
        default="M0"
    )
    tumor_grade = models.CharField(
        _("Tumor Grade"), 
        max_length=20, 
        blank=True, 
        null=True
    )

    # 간기능 관련 필드
    child_pugh_classification = models.CharField(
        _("Child-Pugh Classification"), 
        max_length=10, 
        blank=True, 
        null=True,
        choices=[
            ('A', 'Child-Pugh A'),
            ('B', 'Child-Pugh B'), 
            ('C', 'Child-Pugh C'),
            ('Unknown', 'Unknown')
        ]
    )
    fibrosis_score = models.CharField(
        _("Fibrosis Score"), 
        max_length=20, 
        blank=True, 
        null=True,
        help_text=_("Ishak Fibrosis Score")
    )

    # 치료 관련 필드 (AI 모델 컬럼명 + OpenEMR 약자 필드 함께 사용)
    received_chemotherapy = models.BooleanField(
        _("Received Chemotherapy"), 
        default=False
    )
    chemotherapy_type = models.CharField(
        _("Chemotherapy Type"), 
        max_length=100, 
        blank=True, 
        null=True
    )
    treatment_intent = models.CharField(
        _("Treatment Intent"), 
        max_length=50, 
        blank=True, 
        null=True,
        choices=[
            ('Curative', 'Curative'),
            ('Palliative', 'Palliative'),
            ('Unknown', 'Unknown')
        ]
    )
    received_radiation = models.BooleanField(
        _("Received Radiation"), 
        default=False
    )
    radiation_type = models.CharField(
        _("Radiation Type"), 
        max_length=100, 
        blank=True, 
        null=True
    )
    radiation_intent = models.CharField(
        _("Radiation Intent"), 
        max_length=50, 
        blank=True, 
        null=True
    )

    # OpenEMR 약자 필드 (실제 EMR DB 컬럼명과 일치)
    pharm_tx_type = models.CharField(
        _("Pharmaceutical Treatment Type (EMR 약자)"),
        max_length=100,
        blank=True,
        null=True
    )
    pharm_tx_therapy = models.CharField(
        _("Pharmaceutical Treatment Therapy (EMR 약자)"),
        max_length=10,
        blank=True,
        null=True
    )
    pharm_tx_intent = models.CharField(
        _("Pharmaceutical Treatment Intent (EMR 약자)"),
        max_length=50,
        blank=True,
        null=True
    )
    radiation_tx_type = models.CharField(
        _("Radiation Treatment Type (EMR 약자)"),
        max_length=100,
        blank=True,
        null=True
    )
    radiation_tx_therapy = models.CharField(
        _("Radiation Treatment Therapy (EMR 약자)"),
        max_length=10,
        blank=True,
        null=True
    )
    radiation_tx_intent = models.CharField(
        _("Radiation Treatment Intent (EMR 약자)"),
        max_length=50,
        blank=True,
        null=True
    )

    # 병력 관련 필드
    prior_treatment = models.BooleanField(
        _("Prior Treatment"), 
        default=False
    )
    prior_cancer = models.BooleanField(
        _("Prior Cancer"), 
        default=False
    )
    synchronous_cancer = models.BooleanField(
        _("Synchronous Cancer"), 
        default=False
    )

    # 수술 관련 필드
    biopsy_site = models.CharField(
        _("Biopsy Site"), 
        max_length=100, 
        default="Liver"
    )
    residual_disease = models.CharField(
        _("Residual Disease"), 
        max_length=20, 
        default="R0",
        choices=[
            ('R0', 'R0 - No residual disease'),
            ('R1', 'R1 - Microscopic residual'),
            ('R2', 'R2 - Macroscopic residual'),
            ('Unknown', 'Unknown')
        ]
    )
    morphology_code = models.CharField(
        _("Morphology Code"), 
        max_length=20, 
        default="8170/3"
    )

    # 생존 관련 필드
    vital_status = models.CharField(
        _("Vital Status"), 
        max_length=20, 
        default="Alive",
        choices=[
            ('Alive', 'Alive'),
            ('Dead', 'Dead'),
            ('Unknown', 'Unknown')
        ]
    )
    days_to_death = models.IntegerField(
        _("Days to Death"), 
        blank=True, 
        null=True
    )
    follow_up_days = models.IntegerField(
        _("Follow-up Days"), 
        default=211
    )

    year_of_diagnosis = models.IntegerField(
        _("Year of Diagnosis"), 
        blank=True, 
        null=True,
        help_text=_("Year when cancer was first diagnosed")
    )

    # 메타데이터
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_liver_cancer_data'
    )

    class Meta:
        verbose_name = _("Liver Cancer Clinical Data")
        verbose_name_plural = _("Liver Cancer Clinical Data")
        ordering = ['-form_date']
        unique_together = ['patient', 'openemr_encounter_id']

    def __str__(self):
        return f"{self.patient.name} - {self.form_date.strftime('%Y-%m-%d')}"

    @property
    def age_at_diagnosis(self):
        """진단 시 나이 계산 (date_of_birth가 None일 경우 처리)"""
        if self.patient.date_of_birth and self.form_date:
            age = self.form_date.year - self.patient.date_of_birth.year
            if (self.form_date.month, self.form_date.day) < (self.patient.date_of_birth.month, self.patient.date_of_birth.day):
                age -= 1
            return age
        return None

class ClinicalData(models.Model):
    """통합 임상 데이터 모델 - 간암, 신장암, 위암 지원"""
    
    CANCER_TYPE_CHOICES = [
        ('liver', '간암 (LIHC)'),
        ('kidney', '신장암 (KIRC)'),
        ('stomach', '위암 (STAD)'),
    ]
    
    # 기본 연결 정보
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='clinical_data',
        verbose_name=_('Patient')
    )
    cancer_type = models.CharField(
        _('Cancer Type'),
        max_length=20,
        choices=CANCER_TYPE_CHOICES
    )
    form_date = models.DateTimeField(_('Form Date'), auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_clinical_data'
    )
    
    # 생존 결과 변수 (공통)
    vital_status = models.CharField(
        _('Vital Status'),
        max_length=20,
        blank=True,
        null=True,
        choices=[
            ('Alive', 'Alive'),
            ('Dead', 'Dead'),
            ('Unknown', 'Unknown')
        ]
    )
    days_to_death = models.IntegerField(
        _('Days to Death'),
        blank=True,
        null=True
    )
    days_to_last_follow_up = models.IntegerField(
        _('Days to Last Follow Up'),
        blank=True,
        null=True
    )
    
    # 환자 기본 특성 (공통)
    age_at_diagnosis = models.IntegerField(
        _('Age at Diagnosis'),
        blank=True,
        null=True
    )
    gender = models.CharField(
        _('Gender'),
        max_length=50,
        blank=True,
        null=True
    )
    race = models.CharField(
        _('Race'),
        max_length=100,
        blank=True,
        null=True
    )
    ethnicity = models.CharField(
        _('Ethnicity'),
        max_length=100,
        blank=True,
        null=True
    )
    submitter_id = models.CharField(
        _('Submitter ID'),
        max_length=100,
        blank=True,
        null=True
    )
    
    # 병기 관련 (공통)
    ajcc_pathologic_stage = models.CharField(
        _('AJCC Pathologic Stage'),
        max_length=50,
        blank=True,
        null=True
    )
    ajcc_pathologic_t = models.CharField(
        _('AJCC Pathologic T'),
        max_length=50,
        blank=True,
        null=True
    )
    ajcc_pathologic_n = models.CharField(
        _('AJCC Pathologic N'),
        max_length=50,
        blank=True,
        null=True
    )
    ajcc_pathologic_m = models.CharField(
        _('AJCC Pathologic M'),
        max_length=50,
        blank=True,
        null=True
    )
    
    # 신장암 추가 병기 정보
    ajcc_clinical_stage = models.CharField(
        _('AJCC Clinical Stage'),
        max_length=50,
        blank=True,
        null=True
    )
    ajcc_clinical_t = models.CharField(
        _('AJCC Clinical T'),
        max_length=50,
        blank=True,
        null=True
    )
    ajcc_clinical_n = models.CharField(
        _('AJCC Clinical N'),
        max_length=50,
        blank=True,
        null=True
    )
    ajcc_clinical_m = models.CharField(
        _('AJCC Clinical M'),
        max_length=50,
        blank=True,
        null=True
    )
    
    # 위암 특이적 병기 정보
    ajcc_staging_system_edition = models.CharField(
        _('AJCC Staging System Edition'),
        max_length=50,
        blank=True,
        null=True
    )
    
    # 종양 특성 (공통)
    tumor_grade = models.CharField(
        _('Tumor Grade'),
        max_length=50,
        blank=True,
        null=True
    )
    morphology = models.CharField(
        _('Morphology'),
        max_length=100,
        blank=True,
        null=True
    )
    primary_diagnosis = models.CharField(
        _('Primary Diagnosis'),
        max_length=200,
        blank=True,
        null=True
    )
    
    # 치료 관련 (공통)
    prior_treatment = models.CharField(
        _('Prior Treatment'),
        max_length=200,
        blank=True,
        null=True
    )
    prior_malignancy = models.CharField(
        _('Prior Malignancy'),
        max_length=100,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_treatment_type = models.CharField(
        _('Pharmaceutical Treatment Type'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_treatment_intent_type = models.CharField(
        _('Pharmaceutical Treatment Intent Type'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_treatment_or_therapy = models.CharField(
        _('Pharmaceutical Treatment or Therapy'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_treatment_outcome = models.CharField(
        _('Pharmaceutical Treatment Outcome'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_radiation_treatment_type = models.CharField(
        _('Radiation Treatment Type'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_radiation_treatment_or_therapy = models.CharField(
        _('Radiation Treatment or Therapy'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_radiation_treatment_intent_type = models.CharField(
        _('Radiation Treatment Intent Type'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_radiation_treatment_outcome = models.CharField(
        _('Radiation Treatment Outcome'),
        max_length=200,
        blank=True,
        null=True
    )
    
    # 간암 특이적 필드
    child_pugh_classification = models.CharField(
        _('Child-Pugh Classification'),
        max_length=50,
        blank=True,
        null=True
    )
    ishak_fibrosis_score = models.CharField(
        _('Ishak Fibrosis Score'),
        max_length=50,
        blank=True,
        null=True
    )
    
    # 신장암/위암 특이적 필드
    tobacco_smoking_status = models.CharField(
        _('Tobacco Smoking Status'),
        max_length=100,
        blank=True,
        null=True
    )
    pack_years_smoked = models.IntegerField(
        _('Pack Years Smoked'),
        blank=True,
        null=True
    )
    tobacco_smoking_quit_year = models.IntegerField(
        _('Tobacco Smoking Quit Year'),
        blank=True,
        null=True
    )
    tobacco_smoking_onset_year = models.IntegerField(
        _('Tobacco Smoking Onset Year'),
        blank=True,
        null=True
    )
    laterality = models.CharField(
        _('Laterality'),
        max_length=50,
        blank=True,
        null=True
    )
    site_of_resection_or_biopsy = models.CharField(
        _('Site of Resection or Biopsy'),
        max_length=200,
        blank=True,
        null=True
    )
    tissue_or_organ_of_origin = models.CharField(
        _('Tissue or Organ of Origin'),
        max_length=200,
        blank=True,
        null=True
    )
    synchronous_malignancy = models.CharField(
        _('Synchronous Malignancy'),
        max_length=100,
        blank=True,
        null=True
    )
    
    # 위암 특이적 필드
    residual_disease = models.CharField(
        _('Residual Disease'),
        max_length=100,
        blank=True,
        null=True
    )
    classification_of_tumor = models.CharField(
        _('Classification of Tumor'),
        max_length=100,
        blank=True,
        null=True
    )
    last_known_disease_status = models.CharField(
        _('Last Known Disease Status'),
        max_length=100,
        blank=True,
        null=True
    )
    days_to_recurrence = models.IntegerField(
        _('Days to Recurrence'),
        blank=True,
        null=True
    )
    progression_or_recurrence = models.CharField(
        _('Progression or Recurrence'),
        max_length=100,
        blank=True,
        null=True
    )
    days_to_last_known_disease_status = models.IntegerField(
        _('Days to Last Known Disease Status'),
        blank=True,
        null=True
    )
    cause_of_death = models.CharField(
        _('Cause of Death'),
        max_length=200,
        blank=True,
        null=True
    )
    
    # 시간 관련 필드
    year_of_diagnosis = models.IntegerField(
        _('Year of Diagnosis'),
        blank=True,
        null=True
    )
    age_at_index = models.IntegerField(
        _('Age at Index'),
        blank=True,
        null=True
    )
    days_to_birth = models.IntegerField(
        _('Days to Birth'),
        blank=True,
        null=True
    )
    year_of_birth = models.IntegerField(
        _('Year of Birth'),
        blank=True,
        null=True
    )
    year_of_death = models.IntegerField(
        _('Year of Death'),
        blank=True,
        null=True
    )
    days_to_diagnosis = models.IntegerField(
        _('Days to Diagnosis'),
        blank=True,
        null=True
    )
    
    # 위암 치료 세부 정보
    treatments_pharmaceutical_regimen_or_line_of_therapy = models.CharField(
        _('Pharmaceutical Regimen or Line of Therapy'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_number_of_cycles = models.IntegerField(
        _('Pharmaceutical Number of Cycles'),
        blank=True,
        null=True
    )
    treatments_pharmaceutical_days_to_treatment_start = models.IntegerField(
        _('Pharmaceutical Days to Treatment Start'),
        blank=True,
        null=True
    )
    treatments_pharmaceutical_initial_disease_status = models.CharField(
        _('Pharmaceutical Initial Disease Status'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_therapeutic_agents = models.CharField(
        _('Pharmaceutical Therapeutic Agents'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_treatment_dose = models.CharField(
        _('Pharmaceutical Treatment Dose'),
        max_length=100,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_treatment_dose_units = models.CharField(
        _('Pharmaceutical Treatment Dose Units'),
        max_length=50,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_prescribed_dose_units = models.CharField(
        _('Pharmaceutical Prescribed Dose Units'),
        max_length=50,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_number_of_fractions = models.IntegerField(
        _('Pharmaceutical Number of Fractions'),
        blank=True,
        null=True
    )
    treatments_pharmaceutical_treatment_anatomic_sites = models.CharField(
        _('Pharmaceutical Treatment Anatomic Sites'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_prescribed_dose = models.CharField(
        _('Pharmaceutical Prescribed Dose'),
        max_length=100,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_clinical_trial_indicator = models.CharField(
        _('Pharmaceutical Clinical Trial Indicator'),
        max_length=50,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_route_of_administration = models.CharField(
        _('Pharmaceutical Route of Administration'),
        max_length=100,
        blank=True,
        null=True
    )
    treatments_pharmaceutical_course_number = models.IntegerField(
        _('Pharmaceutical Course Number'),
        blank=True,
        null=True
    )
    
    # 방사선 치료 세부 정보
    treatments_radiation_days_to_treatment_start = models.IntegerField(
        _('Radiation Days to Treatment Start'),
        blank=True,
        null=True
    )
    treatments_radiation_number_of_cycles = models.IntegerField(
        _('Radiation Number of Cycles'),
        blank=True,
        null=True
    )
    treatments_radiation_treatment_dose = models.CharField(
        _('Radiation Treatment Dose'),
        max_length=100,
        blank=True,
        null=True
    )
    treatments_radiation_treatment_dose_units = models.CharField(
        _('Radiation Treatment Dose Units'),
        max_length=50,
        blank=True,
        null=True
    )
    treatments_radiation_therapeutic_agents = models.CharField(
        _('Radiation Therapeutic Agents'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_radiation_days_to_treatment_end = models.IntegerField(
        _('Radiation Days to Treatment End'),
        blank=True,
        null=True
    )
    treatments_radiation_clinical_trial_indicator = models.CharField(
        _('Radiation Clinical Trial Indicator'),
        max_length=50,
        blank=True,
        null=True
    )
    treatments_radiation_number_of_fractions = models.IntegerField(
        _('Radiation Number of Fractions'),
        blank=True,
        null=True
    )
    treatments_radiation_treatment_anatomic_sites = models.CharField(
        _('Radiation Treatment Anatomic Sites'),
        max_length=200,
        blank=True,
        null=True
    )
    treatments_radiation_prescribed_dose_units = models.CharField(
        _('Radiation Prescribed Dose Units'),
        max_length=50,
        blank=True,
        null=True
    )
    treatments_radiation_prescribed_dose = models.CharField(
        _('Radiation Prescribed Dose'),
        max_length=100,
        blank=True,
        null=True
    )
    treatments_radiation_route_of_administration = models.CharField(
        _('Radiation Route of Administration'),
        max_length=100,
        blank=True,
        null=True
    )
    treatments_radiation_course_number = models.IntegerField(
        _('Radiation Course Number'),
        blank=True,
        null=True
    )
    
    # 위암 진단 관련
    icd_10_code = models.CharField(
        _('ICD-10 Code'),
        max_length=20,
        blank=True,
        null=True
    )
    tumor_of_origin = models.CharField(
        _('Tumor of Origin'),
        max_length=200,
        blank=True,
        null=True
    )
    
    # 추가 데이터를 위한 JSON 필드
    additional_data = models.JSONField(
        _('Additional Data'),
        default=dict,
        blank=True,
        help_text=_('Store additional clinical data fields as JSON')
    )
    
    # 메타데이터
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Clinical Data')
        verbose_name_plural = _('Clinical Data')
        ordering = ['-form_date']
    
    def __str__(self):
        return f"{self.patient.name} - {self.get_cancer_type_display()} - {self.form_date.strftime('%Y-%m-%d')}"
    
    @property
    def calculated_age_at_diagnosis(self):
        """진단 시 나이 계산 (입력된 값이 없을 경우)"""
        if self.age_at_diagnosis:
            return self.age_at_diagnosis
        
        if self.patient.date_of_birth and self.form_date:
            age = self.form_date.year - self.patient.date_of_birth.year
            if (self.form_date.month, self.form_date.day) < (self.patient.date_of_birth.month, self.patient.date_of_birth.day):
                age -= 1
            return age
        return None

class RegistrationCode(models.Model):
    """Flutter 앱 회원가입용 인증 코드"""
    
    code = models.CharField(_("Registration Code"), max_length=6, unique=True)
    purpose = models.CharField(_("Purpose"), max_length=20, default='registration')
    expires_at = models.DateTimeField(_("Expires At"))
    is_used = models.BooleanField(_("Is Used"), default=False)
    used_at = models.DateTimeField(_("Used At"), null=True, blank=True)
    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='used_registration_codes'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_registration_codes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True, help_text="추가 메타데이터")  # ✅ 이 줄만 추가
    
    class Meta:
        verbose_name = _("Registration Code")
        verbose_name_plural = _("Registration Codes")
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Code: {self.code} ({'Used' if self.is_used else 'Available'})"
    
    def is_valid(self):
        """코드가 유효한지 확인"""
        return not self.is_used and self.expires_at > timezone.now()
    
    def use_code(self, user=None):
        """코드 사용 처리"""
        self.is_used = True
        self.used_at = timezone.now()
        if user:
            self.used_by = user
        self.save()
