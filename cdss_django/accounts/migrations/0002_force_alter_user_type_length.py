# accounts/migrations/0002_force_alter_user_type_length.py

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'), # 이 부분은 이전 마이그레이션 파일 이름에 맞게 유지
    ]

    # ✅ operations 리스트를 아래 내용으로 교체합니다.
    operations = [
        migrations.AlterField(
            model_name='user',
            name='user_type',
            field=models.CharField(
                choices=[('patient', '환자'), ('doctor', '의사'), ('nurse', '간호사'), ('radiologist', '영상의학과'), ('admin', '관리자')], 
                default='patient', 
                max_length=20  # ❗️이 부분이 데이터베이스에 강제로 적용될 내용입니다.
            ),
        ),
    ]