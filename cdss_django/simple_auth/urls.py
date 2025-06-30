# simple_auth/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('generate-code/', views.generate_verification_code, name='generate_code'),
]
