# cdss_django/pharmacy_service/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class PharmacySearchLog(models.Model):
    search_region = models.CharField(max_length=100)
    search_name = models.CharField(max_length=200, blank=True)
    result_count = models.IntegerField()
    search_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"약국 검색 - {self.search_region} ({self.result_count}건)"
