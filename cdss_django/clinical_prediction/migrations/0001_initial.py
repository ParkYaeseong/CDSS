from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PredictionModelInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cancer_type', models.CharField(choices=[('liver', '간암 (LIHC)'), ('kidney', '신장암 (KIRC)'), ('stomach', '위암 (STAD)')], max_length=20)),
                ('prediction_type', models.CharField(choices=[('survival', '생존 예측'), ('risk', '위험도 분류'), ('treatment', '치료 효과')], max_length=20)),
                ('model_name', models.CharField(max_length=100, verbose_name='모델명')),
                ('model_file', models.CharField(max_length=255, verbose_name='모델 파일명')),
                ('version', models.CharField(default='1.0', max_length=20, verbose_name='버전')),
                ('accuracy', models.FloatField(blank=True, null=True, verbose_name='정확도')),
                ('training_date', models.DateTimeField(blank=True, null=True, verbose_name='훈련일시')),
                ('is_active', models.BooleanField(default=True, verbose_name='활성화')),
                ('description', models.TextField(blank=True, verbose_name='설명')),
            ],
            options={
                'verbose_name': '예측 모델 정보',
                'verbose_name_plural': '예측 모델 정보들',
                'db_table': 'prediction_model_info',
            },
        ),
        migrations.CreateModel(
            name='ClinicalPredictionResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('patient_id', models.CharField(max_length=100, verbose_name='환자 ID')),
                ('patient_name', models.CharField(max_length=100, verbose_name='환자명')),
                ('cancer_type', models.CharField(choices=[('liver', '간암 (LIHC)'), ('kidney', '신장암 (KIRC)'), ('stomach', '위암 (STAD)')], max_length=20, verbose_name='암종')),
                ('prediction_type', models.CharField(choices=[('survival', '생존 예측'), ('risk', '위험도 분류'), ('treatment', '치료 효과')], max_length=20, verbose_name='예측 유형')),
                ('prediction_result', models.JSONField(verbose_name='예측 결과')),
                ('confidence_score', models.FloatField(default=0.0, verbose_name='신뢰도')),
                ('model_version', models.CharField(default='v1.0', max_length=50, verbose_name='모델 버전')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='생성일시')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='수정일시')),
                ('clinical_summary', models.JSONField(blank=True, null=True, verbose_name='임상 요약')),
                ('notes', models.TextField(blank=True, verbose_name='비고')),
                ('is_validated', models.BooleanField(default=False, verbose_name='검증 완료')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='생성자')),
            ],
            options={
                'verbose_name': '임상 예측 결과',
                'verbose_name_plural': '임상 예측 결과들',
                'db_table': 'clinical_prediction_results',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PredictionAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=50, verbose_name='액션')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('details', models.JSONField(blank=True, null=True)),
                ('prediction_result', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='clinical_prediction.clinicalpredictionresult')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': '예측 감사 로그',
                'verbose_name_plural': '예측 감사 로그들',
                'db_table': 'prediction_audit_log',
            },
        ),
        migrations.AddIndex(
            model_name='clinicalpredictionresult',
            index=models.Index(fields=['patient_id', 'cancer_type'], name='clinical_pr_patient_b8c8c1_idx'),
        ),
        migrations.AddIndex(
            model_name='clinicalpredictionresult',
            index=models.Index(fields=['created_at'], name='clinical_pr_created_4e5c8a_idx'),
        ),
        migrations.AddIndex(
            model_name='clinicalpredictionresult',
            index=models.Index(fields=['prediction_type', 'cancer_type'], name='clinical_pr_predict_c8a9f2_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='predictionmodelinfo',
            unique_together={('cancer_type', 'prediction_type', 'version')},
        ),
    ]
