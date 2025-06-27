# ai_chatbot/models.py 예시 (이전에 논의한 내용 기반)
from django.db import models
from django.conf import settings

class ChatMessage(models.Model):
    session_key = models.CharField(max_length=40, db_index=True) # 사용자 구분 ID
    message = models.TextField()
    is_from_user = models.BooleanField(default=True) # True: 사용자, False: 챗봇
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user_type = "사용자" if self.is_from_user else "챗봇"
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M')} - {self.session_key} ({user_type}): {self.message[:30]}"

    class Meta:
        ordering = ['timestamp']