# cdss_django/emergency_service/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class EmergencySearchLog(models.Model):
    search_region = models.CharField(max_length=100)
    result_count = models.IntegerField()
    search_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"응급실 검색 - {self.search_region} ({self.result_count}건)"
