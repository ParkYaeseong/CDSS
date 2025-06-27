# cdss_django/diagnosis/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiagnosisRequestViewSet

router = DefaultRouter()
# 'requests' 경로에 ViewSet을 등록하여 목록 및 상세조회 URL을 자동 생성합니다.
router.register(r'requests', DiagnosisRequestViewSet, basename='diagnosis-request')

urlpatterns = [
    path('', include(router.urls)),
]
