# cdss_django/cdss_config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings              
from django.conf.urls.static import static

# API 문서(Swagger) 설정
schema_view = get_schema_view(
   openapi.Info(
      title="CDSS & Medical Services API",
      default_version='v1',
      description="임상 의사 결정 지원 시스템(CDSS) 및 의료 서비스 통합 API 문서입니다.",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@cdss.local"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

# --- 프로젝트의 전체 URL 패턴 ---
urlpatterns = [
    # 1. Django 관리자 페이지
    path('admin/', admin.site.urls),

    # 2. /api/ 로 시작하는 모든 요청은 core_api.urls 파일이 전담합니다.
    path('api/', include('core_api.urls')),

    # 3. API 문서(Swagger, ReDoc)를 위한 URL
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
