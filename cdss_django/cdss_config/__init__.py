# 이 파일이 Celery 앱을 임포트하도록 하여, Django 시작 시 항상 로드되게 합니다.
from .celery import app as celery_app

__all__ = ('celery_app',)