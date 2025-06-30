# patients/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientProfileViewSet, get_integrated_patients, search_patient_by_id, PatientOmicsRequestListView
from . import views
from .views import get_latest_clinical_data 
app_name = 'patients'

router = DefaultRouter()
router.register(r'profiles', PatientProfileViewSet, basename='patient-profile')

urlpatterns = [
    path('', include(router.urls)),
    path('integrated/', get_integrated_patients, name='integrated-patients'),
    path('search/<str:patient_id>/', search_patient_by_id, name='search-patient-by-id'),

    # === Flutter 환자 관리 API endpoints ===
    path('flutter-patients/', views.get_flutter_patients, name='flutter-patients'),
    path('flutter-patients/create/', views.create_flutter_patient, name='create-flutter-patient'),
    
    # ✅ 특정 경로들을 먼저 배치 (더 구체적인 패턴을 위에)
    path('flutter-patients/generate-verification-code/', views.generate_verification_code_for_profile, name='generate-verification-code'),
    path('flutter-patients/link-profile/', views.link_to_patient_profile, name='link-patient-profile'),
    path('flutter-patients/verify-and-link/', views.verify_and_link_profile, name='verify-and-link-profile'),
    
    # ✅ 동적 패턴은 맨 마지막에 배치
    path('flutter-patients/<str:patient_id>/', views.get_flutter_patient_detail, name='flutter-patient-detail'),
    
    # === Flutter 회원가입 인증 코드 관련 ===
    path('registration-codes/generate/', views.generate_registration_code, name='generate-registration-code'),
    path('registration-codes/generate-for-patient/', views.generate_registration_code_for_patient, name='generate-registration-code-for-patient'),
    path('registration-codes/verify/', views.verify_registration_code, name='verify-registration-code'),
    path('flutter-register/', views.flutter_register_with_code, name='flutter-register-with-code'),
    
    # === Clinical Data API endpoints ===
    path('<uuid:patient_id>/clinical-data/', views.save_clinical_data, name='save_clinical_data'),
    path('<uuid:patient_id>/clinical-data/list/', views.get_clinical_data, name='get_clinical_data'),
    path('<uuid:patient_id>/clinical-data/<int:clinical_data_id>/', views.get_clinical_data_detail, name='get_clinical_data_detail'),
    path('<uuid:patient_id>/clinical-data/<int:clinical_data_id>/delete/', views.delete_clinical_data, name='delete_clinical_data'),

    # 오믹스 목록
    path('<uuid:patient_id>/omics-requests/', PatientOmicsRequestListView.as_view(), name='patient-omics-requests'),

    # 임상
    path('<uuid:patient_id>/clinical-data/latest/', get_latest_clinical_data, name='get_latest_clinical_data'),
    
        # ✅ Flutter 전용 회원가입 엔드포인트 추가
    path('flutter-register-v2/', views.flutter_register_with_code_v2, name='flutter-register-v2'),
]

