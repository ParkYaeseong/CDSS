# medical_records_service/models.py
from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import FlutterPatient, MedicalStaff
from appointment_service.models import Appointment

User = get_user_model()

class MedicalRecord(models.Model):
    """Flutter 앱 전용 진료기록 (OpenEMR 독립적)"""
    flutter_patient = models.ForeignKey(
        FlutterPatient, 
        on_delete=models.CASCADE, 
        related_name='medical_records'
    )
    doctor = models.ForeignKey(
        MedicalStaff, 
        on_delete=models.CASCADE, 
        related_name='medical_records'
    )
    appointment = models.OneToOneField(
        Appointment, 
        on_delete=models.CASCADE, 
        related_name='medical_record',
        null=True, 
        blank=True
    )
    
    record_date = models.DateTimeField()
    chief_complaint = models.TextField(blank=True)
    present_illness = models.TextField(blank=True)
    physical_examination = models.TextField(blank=True)
    diagnosis = models.TextField(blank=True)
    treatment_plan = models.TextField(blank=True)
    prescription = models.TextField(blank=True)
    follow_up_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'flutter_medical_records'
        ordering = ['-record_date']
    
    def __str__(self):
        return f"{self.flutter_patient.user.get_full_name()} - {self.record_date.strftime('%Y-%m-%d')}"
