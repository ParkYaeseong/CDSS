# Generated by Django 5.2.2 on 2025-06-22 11:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_alter_medicalstaff_staff_type_alter_user_user_type'),
        ('appointment_service', '0002_alter_appointment_options_and_more'),
        ('patients', '0008_allow_null_date_of_birth'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='appointment',
            options={'ordering': ['appointment_datetime'], 'verbose_name': '예약', 'verbose_name_plural': '예약 목록'},
        ),
        migrations.RenameField(
            model_name='appointment',
            old_name='appointment_date',
            new_name='appointment_datetime',
        ),
        migrations.AddField(
            model_name='appointment',
            name='appointment_type',
            field=models.CharField(choices=[('consultation', '진료'), ('checkup', '검진'), ('surgery', '수술'), ('emergency', '응급'), ('follow_up', '재진')], default='consultation', help_text='예약 유형', max_length=20),
        ),
        migrations.AddField(
            model_name='appointment',
            name='chief_complaint',
            field=models.TextField(blank=True, help_text='주호소 증상'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='department',
            field=models.CharField(blank=True, help_text='진료과', max_length=100),
        ),
        migrations.AddField(
            model_name='appointment',
            name='patient',
            field=models.ForeignKey(blank=True, help_text='기존 시스템 환자', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='patients.patientprofile'),
        ),
        migrations.AlterField(
            model_name='appointment',
            name='doctor',
            field=models.ForeignKey(help_text='담당 의료진을 선택하세요', on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='accounts.medicalstaff'),
        ),
        migrations.AlterField(
            model_name='appointment',
            name='flutter_patient',
            field=models.ForeignKey(blank=True, help_text='Flutter 앱 환자', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='accounts.flutterpatient'),
        ),
        migrations.AlterField(
            model_name='appointment',
            name='status',
            field=models.CharField(choices=[('pending', '대기중'), ('confirmed', '확정'), ('cancelled', '취소'), ('completed', '완료'), ('in_progress', '진료중')], default='pending', help_text='예약 상태', max_length=20),
        ),
        migrations.AlterModelTable(
            name='appointment',
            table='appointments',
        ),
    ]
