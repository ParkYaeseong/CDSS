from django.db import models
from django.contrib.auth.models import User

class Prescription(models.Model):
    patient_id = models.CharField(max_length=50)
    patient_name = models.CharField(max_length=100)
    patient_openemr_id = models.CharField(max_length=50)
    drugs = models.JSONField()  # 처방 약물 목록
    interactions = models.JSONField(default=list)  # 상호작용 정보
    contraindications = models.JSONField(default=dict)  # 병용금기 정보
    timestamp = models.DateTimeField(auto_now_add=True)
    doctor_id = models.CharField(max_length=50, default='current_doctor_id')
    
    class Meta:
        db_table = 'prescriptions'
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.patient_name} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
