# appointment_service/models.py
from django.db import models
from django.contrib.auth import get_user_model
from patients.models import PatientProfile, FlutterPatientProfile  # ✅ 수정
from accounts.models import MedicalStaff

User = get_user_model()

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', '대기중'),
        ('confirmed', '확정'),
        ('cancelled', '취소'),
        ('completed', '완료'),
        ('in_progress', '진료중'),
    ]
    
    TYPE_CHOICES = [
        ('consultation', '진료'),
        ('checkup', '검진'),
        ('surgery', '수술'),
        ('emergency', '응급'),
        ('follow_up', '재진'),
    ]
    
    # Flutter 환자 (nullable) - patients.models의 FlutterPatientProfile 사용
    flutter_patient = models.ForeignKey(
        FlutterPatientProfile,  # ✅ 수정
        on_delete=models.CASCADE, 
        related_name='appointments',
        null=True,
        blank=True,
        help_text="Flutter 앱 환자"
    )
    
    # 기존 환자 (nullable)
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='appointments',
        null=True,
        blank=True,
        help_text="기존 시스템 환자"
    )
    
    # 담당 의료진
    doctor = models.ForeignKey(
        MedicalStaff, 
        on_delete=models.CASCADE, 
        related_name='appointments',
        help_text="담당 의료진을 선택하세요"
    )
    
    appointment_datetime = models.DateTimeField(
        help_text="예약 날짜와 시간을 설정하세요"
    )
    duration = models.IntegerField(
        default=30,
        help_text="예약 소요시간 (분 단위)"
    )
    appointment_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='consultation',
        help_text="예약 유형"
    )
    reason = models.TextField(
        blank=True,
        help_text="진료 사유를 입력하세요"
    )
    chief_complaint = models.TextField(
        blank=True,
        help_text="주호소 증상"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        help_text="예약 상태"
    )
    notes = models.TextField(
        blank=True,
        help_text="추가 메모사항"
    )
    department = models.CharField(
        max_length=100,
        blank=True,
        help_text="진료과"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointments'
        ordering = ['appointment_datetime']
        verbose_name = "예약"
        verbose_name_plural = "예약 목록"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        # Flutter 환자와 기존 환자 중 하나는 반드시 있어야 함
        if not self.flutter_patient and not self.patient:
            raise ValidationError('Flutter 환자 또는 기존 환자 중 하나는 반드시 선택해야 합니다.')
        
        if self.flutter_patient and self.patient:
            raise ValidationError('Flutter 환자와 기존 환자를 동시에 선택할 수 없습니다.')
    
    @property
    def patient_name(self):
        if self.flutter_patient:
            return self.flutter_patient.user.get_full_name() or self.flutter_patient.user.username
        elif self.patient:
            return f"{self.patient.first_name} {self.patient.last_name}".strip()
        return "Unknown Patient"
    
    @property
    def patient_id(self):
        if self.flutter_patient:
            return self.flutter_patient.patient_id
        elif self.patient:
            return self.patient.openemr_id
        return None
    
    @property
    def patient_phone(self):
        if self.flutter_patient:
            return self.flutter_patient.phone_number
        elif self.patient:
            return self.patient.phone_number
        return None
    
    def __str__(self):
        return f"{self.patient_name} - {self.doctor.user.get_full_name()} ({self.appointment_datetime.strftime('%Y-%m-%d %H:%M')})"
