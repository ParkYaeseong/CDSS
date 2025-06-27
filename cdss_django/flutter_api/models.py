# flutter_api/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Favorite(models.Model):
    FAVORITE_TYPES = [
        ('hospital', '병원'),
        ('emergency', '응급실'),
        ('pharmacy', '약국'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    service_type = models.CharField(max_length=20, choices=FAVORITE_TYPES)
    item_id = models.CharField(max_length=100)
    item_name = models.CharField(max_length=200)
    item_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'service_type', 'item_id']
    
    def __str__(self):
        return f"{self.user.username} - {self.item_name}"

class NotificationSetting(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_setting')
    emergency_alerts = models.BooleanField(default=True)
    appointment_reminders = models.BooleanField(default=True)
    medication_reminders = models.BooleanField(default=True)
    health_tips = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} 알림 설정"

# 새로 추가: 앱 설정 모델
class AppSettings(models.Model):
    """Flutter 앱 사용자별 설정"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='app_settings')
    theme = models.CharField(max_length=20, default='light', choices=[
        ('light', '라이트'),
        ('dark', '다크'),
        ('system', '시스템')
    ])
    language = models.CharField(max_length=10, default='ko', choices=[
        ('ko', '한국어'),
        ('en', 'English')
    ])
    push_notifications = models.BooleanField(default=True)
    location_sharing = models.BooleanField(default=True)
    data_analytics = models.BooleanField(default=True)
    biometric_login = models.BooleanField(default=False)
    auto_backup = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} 앱 설정"

class AppNotification(models.Model):
    """Flutter 앱 알림"""
    NOTIFICATION_TYPES = [
        ('appointment', '예약'),
        ('medical', '의료'),
        ('system', '시스템'),
        ('promotion', '프로모션'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='app_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
