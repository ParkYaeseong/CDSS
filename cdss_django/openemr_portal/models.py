# openemr_portal/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class OpenEMRPortalConnection(models.Model):
    """OpenEMR 환자 포털 연결 정보"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='openemr_portal_connection'
    )
    openemr_username = models.CharField(max_length=100)
    openemr_email = models.EmailField()
    openemr_patient_id = models.CharField(max_length=50, blank=True)
    is_connected = models.BooleanField(default=False)
    last_sync = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'openemr_portal_connections'

class PatientPortalData(models.Model):
    """환자 포털 데이터 캐시"""
    connection = models.ForeignKey(OpenEMRPortalConnection, on_delete=models.CASCADE)
    patient_id = models.CharField(max_length=50)
    data_type = models.CharField(max_length=50)  # 'patient', 'encounters', etc.
    cached_data = models.JSONField()
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'openemr_portal_patient_data'
