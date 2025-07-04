# Generated by Django 5.2.2 on 2025-06-16 00:49

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('diagnosis', '0003_remove_diagnosisrequest_input_data_reference_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='diagnosisresult',
            options={'ordering': ['-created_at'], 'verbose_name': 'CT Diagnosis Result', 'verbose_name_plural': 'CT Diagnosis Results'},
        ),
        migrations.RemoveField(
            model_name='diagnosisresult',
            name='classification_prediction',
        ),
        migrations.RemoveField(
            model_name='diagnosisresult',
            name='classification_probability',
        ),
        migrations.RemoveField(
            model_name='diagnosisresult',
            name='completion_timestamp',
        ),
        migrations.RemoveField(
            model_name='diagnosisresult',
            name='segmentation_metrics',
        ),
        migrations.AddField(
            model_name='diagnosisresult',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now, verbose_name='Created At'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='diagnosisresult',
            name='segmentation_nifti_file',
            field=models.FileField(blank=True, max_length=512, null=True, upload_to='segmentation_nifti/', verbose_name='Segmentation NIfTI File'),
        ),
        migrations.AddField(
            model_name='diagnosisresult',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, verbose_name='Updated At'),
        ),
        migrations.AlterField(
            model_name='diagnosisresult',
            name='error_message',
            field=models.TextField(blank=True, null=True, verbose_name='Error Message'),
        ),
    ]
