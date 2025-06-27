import os
from celery import Celery
from django.conf import settings

# Django의 settings 모듈을 Celery의 기본으로 설정합니다.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cdss_config.settings')

app = Celery('cdss_config')

# 여기서 사용된 문자열 'CELERY'는 모든 Celery 관련 설정 키의 접두사(prefix)를 의미합니다.
# 예: CELERY_BROKER_URL
app.config_from_object('django.conf:settings', namespace='CELERY')

# Django INSTALLED_APPS에 등록된 모든 앱의 tasks.py 파일을 자동으로 로드합니다.
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')