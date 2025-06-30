# accounts/models.py
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class User(AbstractUser):
    # ✅ 의사, 간호사, 영상의학과, 환자, 관리자 역할을 모두 포함합니다.
    USER_TYPE_CHOICES = (
        ('patient', '환자'),
        ('doctor', '의사'),
        ('nurse', '간호사'),
        ('radio', '영상의학과'),
        ('staff', '원무과'),
        ('admin', '관리자'),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='patient')
    phone_number = models.CharField(max_length=15, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # related_name 충돌 해결
    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        related_query_name='custom_user',
        verbose_name='groups'
    )
    
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='custom_user',
        verbose_name='user permissions'
    )
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    patient_id = models.CharField(max_length=20, unique=True)
    blood_type = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)
    medical_history = models.TextField(blank=True)
    insurance_number = models.CharField(max_length=50, blank=True)
    
    # ✅ 모바일 앱 가입용 인증 코드 추가
    mobile_verification_code = models.CharField(max_length=6, blank=True, null=True)
    verification_code_created_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.patient_id})"
    
    def is_verification_code_valid(self, code):
        """인증 코드 유효성 검사 (24시간 유효)"""
        if not self.mobile_verification_code or not self.verification_code_created_at:
            return False
        
        from django.utils import timezone
        from datetime import timedelta
        
        # 24시간 후 만료
        expiry_time = self.verification_code_created_at + timedelta(hours=24)
        
        return (
            self.mobile_verification_code == code and 
            timezone.now() <= expiry_time
        )

# ✅ Flutter 전용 환자 모델 (null 허용으로 수정)
class FlutterPatient(models.Model):
    """Flutter 앱 전용 환자 프로필 (기존 Patient와 별도)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='flutter_patient')
    patient_id = models.CharField(max_length=20, unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)  # ✅ null=True 추가
    birth_date = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True, null=True)  # ✅ null=True 추가
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)  # ✅ null=True 추가
    blood_type = models.CharField(max_length=5, blank=True, null=True)  # ✅ null=True 추가
    allergies = models.TextField(blank=True, null=True)  # ✅ null=True 추가
    medical_history = models.TextField(blank=True, null=True)  # ✅ null=True 추가
    insurance_number = models.CharField(max_length=50, blank=True, null=True)  # ✅ null=True 추가
    
    # 기존 Patient와 연결 (선택사항)
    linked_patient = models.ForeignKey(
        Patient, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="기존 시스템의 환자 프로필과 연결"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'flutter_patients'
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.patient_id})"

class MedicalStaff(models.Model):
    """의료진 프로필 (React 전용)"""
    STAFF_TYPES = [
        ('doctor', '의사'),
        ('nurse', '간호사'),
        ('admin', '관리자'),
        ('staff', '원무과'),
        ('radio', '영상의학과'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='medical_staff')
    staff_id = models.CharField(max_length=20, unique=True)
    staff_type = models.CharField(max_length=20, choices=STAFF_TYPES)
    department = models.CharField(max_length=100, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_staff_type_display()}"
