# flutter_api/urls.py
from django.urls import path
from . import views

app_name = 'flutter_api'

urlpatterns = [
    # 사용자 관련
    path('user/profile/', views.get_user_profile, name='user_profile'),
    path('user/profile/update/', views.update_user_profile, name='update_user_profile'),
    path('user/dashboard/', views.get_user_dashboard_summary, name='user_dashboard'),
    
    # 앱 설정
    path('settings/', views.get_app_settings, name='app_settings'),
    path('settings/update/', views.update_app_settings, name='update_app_settings'),

    # 앱 관리
    path('version/', views.get_app_version_info, name='app_version'),
    path('health/', views.health_check, name='health_check'),
    
    # 피드백 및 로그
    path('error/log/', views.log_app_error, name='log_app_error'),
    path('feedback/', views.send_feedback, name='send_feedback'),
]
