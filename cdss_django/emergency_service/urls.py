# cdss_django/emergency_service/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_emergency_hospitals, name='search_emergency_hospitals'),
    path('<str:hospital_id>/realtime/', views.get_emergency_realtime_info, name='emergency_realtime'),
    path('<str:hospital_id>/', views.get_emergency_detail, name='emergency_detail'),
    path('statistics/', views.get_emergency_statistics, name='emergency_statistics'),
    path('nearby/', views.find_nearby_emergency_hospitals, name='nearby_emergency_hospitals'),
]