# core_api/urls.py
from django.urls import path, include
from django.conf import settings
from .views import (
    UserStatusView,
    TestAPIView,
)
from omics.views import OmicsResultDetailView
urlpatterns = [
        # ✅ accounts URL 연결 주석 해제
    path('accounts/', include('accounts.urls')),
    path('simple-auth/', include('simple_auth.urls')),
    path('diagnosis/', include('diagnosis.urls')),
    path('patients/', include('patients.urls')),
    path('omics/', include('omics.urls')),
    path('pacs/', include('pacs_integration.urls')),
    path('laboratory/', include('lis_integration.urls')),
    path('paper-search/', include('paper_search.urls')),
    path('chatbot/', include('ai_chatbot.urls')),
    path('drug-checker/', include('drug_checker.urls')),
    path('clinical-prediction/', include('clinical_prediction.urls')),
    
    # Flutter 앱 기본 서비스들
    path('hospital-search/', include('hospital_search.urls')),
    path('emergency-service/', include('emergency_service.urls')),
    path('pharmacy-service/', include('pharmacy_service.urls')),
    path('flutter/', include('flutter_api.urls')),
    
    # Flutter/React 통합 서비스들
    path('appointments/', include('appointment_service.urls')),
    path('messages/', include('message_service.urls')),
    path('medical-records/', include('medical_records_service.urls')),
    
    # 기타
    path('auth/status/', UserStatusView.as_view(), name='user-status'),
    path('test/', TestAPIView.as_view(), name='test-api'),
    path('omics-results/<uuid:request_id>/', OmicsResultDetailView.as_view(), name='core-api-omics-result-detail'),
   
]

# OpenEMR 관련 URL들을 조건부로 추가
if getattr(settings, 'OPENEMR_INTEGRATION_ENABLED', True):
    from .views import OpenELISLabResultsView, OpenEMRPatientAPIView
    
    urlpatterns.extend([
        path('openemr-portal/', include('openemr_portal.urls')),
        path('openelis/patient/<str:patient_id_in_elis>/lab_results/', 
             OpenELISLabResultsView.as_view(), name='openelis-lab-results'),
        path('openemr/patients/', OpenEMRPatientAPIView.as_view(), name='openemr-patients'),
    ])
