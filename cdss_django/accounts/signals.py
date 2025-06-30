# accounts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import MedicalStaff
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def create_medical_staff_profile(sender, instance, created, **kwargs):
    """의료진 사용자 생성 시 자동으로 MedicalStaff 프로필 생성"""
    if created and instance.user_type in ['doctor', 'nurse', 'radio', 'radiologist']:
        try:
            # user_type이 'radio'인 경우 'radiologist'로 매핑
            staff_type = 'radiologist' if instance.user_type == 'radio' else instance.user_type
            
            # 부서 설정
            department_mapping = {
                'doctor': '내과',
                'nurse': '간호부',
                'radio': '영상의학과',
                'radiologist': '영상의학과',
                'staff': '원무과'  # ← 이 줄 추가
            }
            
            # 전문분야 설정
            specialization_mapping = {
                'doctor': '일반의',
                'nurse': '일반간호사',
                'radio': '영상의학과',
                'radiologist': '영상의학과',
                'staff': '원무과',  # ← 이 줄 추가
            }
            
            medical_staff = MedicalStaff.objects.create(
                user=instance,
                staff_id=f'MS{instance.id:06d}',
                staff_type=staff_type,
                department=department_mapping.get(instance.user_type, '일반'),
                specialization=specialization_mapping.get(instance.user_type, '일반')
            )
            
            logger.info(f"MedicalStaff 프로필 자동 생성: {instance.username} ({instance.user_type}) -> MedicalStaff ID {medical_staff.id}")
            
        except Exception as e:
            logger.error(f"MedicalStaff 프로필 생성 실패: {instance.username} - {str(e)}")

@receiver(post_save, sender=User)
def update_medical_staff_profile(sender, instance, created, **kwargs):
    """의료진 사용자 정보 업데이트 시 MedicalStaff 프로필도 업데이트"""
    if not created and instance.user_type in ['doctor', 'nurse', 'radio', 'radiologist', 'staff']:
        try:
            medical_staff = MedicalStaff.objects.get(user=instance)
            
            # user_type이 변경된 경우 staff_type도 업데이트
            new_staff_type = 'radiologist' if instance.user_type == 'radio' else instance.user_type
            if medical_staff.staff_type != new_staff_type:
                medical_staff.staff_type = new_staff_type
                medical_staff.save()
                logger.info(f"MedicalStaff 프로필 업데이트: {instance.username} - staff_type: {new_staff_type}")
                
        except MedicalStaff.DoesNotExist:
            # MedicalStaff 프로필이 없다면 생성
            create_medical_staff_profile(sender, instance, True, **kwargs)
        except Exception as e:
            logger.error(f"MedicalStaff 프로필 업데이트 실패: {instance.username} - {str(e)}")
