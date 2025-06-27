# lis_integration/urls.py
from django.urls import path
from . import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabOrderViewSet, LabResultListView

# ViewSet을 위한 라우터를 생성합니다.
router = DefaultRouter()
router.register(r'orders', LabOrderViewSet, basename='lab-order')

urlpatterns = [
    path('', include(router.urls)), # 라우터
    path('patients/<str:patient_id>/', views.IntegratedPatientView.as_view(), name='integrated-patient'),
    path('lab-orders/', views.LabOrderCreateView.as_view(), name='lab-order-create'),
    path('test-connection/', views.ConnectionTestView.as_view(), name='connection-test'),
    # [추가] GET /api/laboratory/results/?patient_id=<uuid>
    path('results/', LabResultListView.as_view(), name='lab-results-list'),
    path('patients/<int:openemr_id>/results/', views.PatientLabResultListView.as_view(), name='patient-lab-results-list'),
]