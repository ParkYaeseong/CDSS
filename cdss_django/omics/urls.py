# omics/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OmicsRequestViewSet,
    OmicsDataFileViewSet,
    OmicsModelRequirementsView,
    StartTumorSegmentationView,
    ClassifyCancerTypeView,DebugOmicsDataView
)


app_name = 'omics'

# --- 라우터 설정 ---
router = DefaultRouter()
# OmicsDataFileViewSet 등록 (기존과 동일)
router.register(r'data-files', OmicsDataFileViewSet, basename='omics-data-file')
# OmicsRequestViewSet 등록: 이제 'requests' 경로에 대한 모든 CRUD와 @action 데코레이터가 붙은 URL은
# 이 라우터에 의해 자동으로 처리됩니다.
router.register(r'requests', OmicsRequestViewSet, basename='omics-request')


# --- URL 패턴 ---
urlpatterns = [
    # 라우터가 관리하는 URL들을 포함합니다. (예: /api/omics/data-files/, /api/omics/requests/,
    # /api/omics/requests/<uuid:pk>/start-analysis/, /api/omics/requests/<uuid:pk>/formatted-result/ 등)
    path('', include(router.urls)),

    # --- 나머지 API 엔드포인트들은 그대로 유지합니다. ---
    path('models/<str:cancer_type>/requirements/',
              OmicsModelRequirementsView.as_view(),
              name='omics-model-requirements'),

    path('segmentation/start/',
              StartTumorSegmentationView.as_view(),
              name='start-tumor-segmentation'),

    path('classify_cancer_type/',
              ClassifyCancerTypeView.as_view(),
              name='classify-cancer-type'),
    
    path('debug/', DebugOmicsDataView.as_view(), name='debug-omics-data'),
]

