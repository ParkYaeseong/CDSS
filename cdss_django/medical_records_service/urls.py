from django.urls import path
from . import views

app_name = 'medical_records_service'

urlpatterns = [
    path('', views.MedicalRecordsView.as_view(), name='medical_records'),
    path('<int:record_id>/', views.MedicalRecordDetailView.as_view(), name='medical_record_detail'),
]
