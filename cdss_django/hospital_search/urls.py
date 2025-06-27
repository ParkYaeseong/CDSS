# cdss_django/hospital_search/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_hospitals, name='search_hospitals'),
    path('<str:hospital_id>/', views.get_hospital_detail, name='hospital_detail'),
    path('departments/', views.get_department_codes, name='department_codes'),
]