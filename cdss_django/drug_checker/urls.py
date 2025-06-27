# drug_checker/urls.py 수정

from django.urls import path
from .views import (
    DrugInteractionCheckAPIView, 
    drug_search_view, 
    PrescriptionSaveAPIView, 
    PrescriptionListAPIView
)

urlpatterns = [
    path('interaction-check/', DrugInteractionCheckAPIView.as_view(), name='interaction-check'),
    path('drugs/search/', drug_search_view, name='drug-search'),
    path('prescription/save/', PrescriptionSaveAPIView.as_view(), name='prescription-save'),
    path('prescription/list/', PrescriptionListAPIView.as_view(), name='prescription-list'),
]
