# pacs_integration/urls.py
from django.urls import path
from .views import DicomUploadView, StartAnalysisView 

app_name = 'pacs_integration'

urlpatterns = [
    path('upload/', DicomUploadView.as_view(), name='dicom_upload'),
    path('start-analysis/', StartAnalysisView.as_view(), name='start_analysis'),
]