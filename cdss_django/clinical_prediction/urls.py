from django.urls import path
from . import views
from .views import ComprehensiveReportView 

urlpatterns = [
    path('predict/survival/', views.predict_survival, name='predict_survival'),
    path('predict/risk-classification/', views.predict_risk_classification, name='predict_risk_classification'),
    path('predict/treatment-effect/', views.predict_treatment_effect, name='predict_treatment_effect'),
    path('predict/all/', views.predict_all, name='predict_all'),
    path('cancer-types/', views.get_supported_cancer_types, name='supported_cancer_types'),
    path('reports/comprehensive/<uuid:patient_id>/', ComprehensiveReportView.as_view(), name='comprehensive-report'),
]

