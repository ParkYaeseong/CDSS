# appointment_service/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'appointment_service'

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
    path('doctors/', views.DoctorListView.as_view(), name='doctor_list'),
]
