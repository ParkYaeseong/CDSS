from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

# 사용자 역할을 정의하는 선택지(Choices)
#class RoleChoices(models.TextChoices):
#    DOCTOR = 'doctor', _('Doctor')
#    NURSE = 'nurse', _('Nurse')
#    radiologist = 'radiologist', _('radiologist')
#    ADMIN = 'admin', _('Admin')

# Django의 기본 User 모델을 확장하기 위한 Profile 모델
#class Profile(models.Model):
    # User 모델과 1대1로 연결합니다. 사용자가 삭제되면 프로필도 함께 삭제됩니다.
#    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # 역할(Role) 필드를 추가합니다.
#    role = models.CharField(
#        _("Role"), 
#        max_length=20, 
#        choices=RoleChoices.choices, 
#        default=RoleChoices.DOCTOR # 기본값 설정
#    )

#    def __str__(self):
#        return f"{self.user.username}'s Profile"