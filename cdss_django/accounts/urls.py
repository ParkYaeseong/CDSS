# accounts/urls.py
from django.urls import path
from .views import (
    register_patient, 
    register_flutter_patient,
    register_medical_staff,
    generate_patient_verification_code,
    get_flutter_patients,  # ✅ 새로 추가
    get_flutter_patient_detail,  # ✅ 새로 추가
    get_doctors_for_appointment,
    MyTokenObtainPairView,
    update_user_profile, 
    get_user_profile,
)
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView

app_name = 'accounts'

urlpatterns = [
    # 기존 회원가입 API
    path('register/', register_patient, name='register'),
    path('register/flutter-patient/', register_flutter_patient, name='register_flutter_patient'),
    path('register/medical-staff/', register_medical_staff, name='register_medical_staff'),
    
    # 의료진용 환자 관리 API
    path('generate-verification-code/', generate_patient_verification_code, name='generate_verification_code'),
    path('flutter-patients/', get_flutter_patients, name='get_flutter_patients'),  # ✅ 새로 추가
    path('flutter-patients/<str:patient_id>/', get_flutter_patient_detail, name='get_flutter_patient_detail'),  # ✅ 새로 추가
    
    # 나머지 기존 URL들...
    path('login/', MyTokenObtainPairView.as_view(), name='login_token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('profile/', get_user_profile, name='get_user_profile'),
    path('profile/update/', update_user_profile, name='update_user_profile'),
        # 이 한 줄만 추가
    path('doctors/', get_doctors_for_appointment, name='doctors-for-appointment'),
]
