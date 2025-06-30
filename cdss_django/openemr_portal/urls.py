# openemr_portal/urls.py
from django.urls import path
from . import views

app_name = 'openemr_portal'

urlpatterns = [
    # === 기존 OpenEMR 포털 기능 (의료진용) ===
    path('connect/', views.OpenEMRPortalConnectView.as_view(), name='connect'),
    path('patient/<str:patient_id>/', views.PatientDataView.as_view(), name='patient_data'),
    
    # === Flutter 앱 전용 API (환자용) ===
    path('flutter/login/', views.flutter_portal_login, name='flutter_portal_login'),
    path('flutter/profile/', views.get_patient_profile, name='get_patient_profile'),
    path('flutter/profile/update/', views.update_patient_profile, name='update_patient_profile'),
    path('flutter/sync/', views.sync_with_openemr, name='sync_with_openemr'),
    path('flutter/analysis-history/', views.get_patient_analysis_history, name='get_patient_analysis_history'),
    
    # === 추가 환자 포털 기능 ===
    path('flutter/appointments/', views.get_patient_appointments, name='get_patient_appointments'),
    path('flutter/medical-records/', views.get_patient_medical_records, name='get_patient_medical_records'),
    path('flutter/prescriptions/', views.get_patient_prescriptions, name='get_patient_prescriptions'),
]
