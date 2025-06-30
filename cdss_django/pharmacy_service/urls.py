from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_pharmacies, name='search_pharmacies'),
    path('<str:pharmacy_id>/', views.get_pharmacy_detail, name='pharmacy_detail'),
    path('sido-codes/', views.get_sido_codes, name='sido_codes'),
    path('sigungu-codes/<str:sido_code>/', views.get_sigungu_codes, name='sigungu_codes'),
    path('nearby/', views.find_nearby_pharmacies, name='nearby_pharmacies'),
    path('24hours/', views.find_24hour_pharmacies, name='24hour_pharmacies'),
]