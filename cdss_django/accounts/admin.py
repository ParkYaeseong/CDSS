# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Patient, FlutterPatient, MedicalStaff

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type', 'is_staff')
    
    fieldsets = UserAdmin.fieldsets + (
        ('추가 정보', {'fields': ('user_type', 'phone_number', 'birth_date', 'address', 'emergency_contact')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('추가 정보', {'fields': ('user_type', 'phone_number', 'birth_date', 'address', 'emergency_contact')}),
    )

@admin.register(FlutterPatient)
class FlutterPatientAdmin(admin.ModelAdmin):
    list_display = ('patient_id', 'user', 'phone_number', 'birth_date', 'created_at')
    search_fields = ('patient_id', 'user__username', 'user__email')
    list_filter = ('blood_type', 'created_at')
    ordering = ('-created_at',)

@admin.register(MedicalStaff)
class MedicalStaffAdmin(admin.ModelAdmin):
    list_display = ('staff_id', 'user', 'staff_type', 'department', 'created_at')
    search_fields = ('staff_id', 'user__username', 'user__email')
    list_filter = ('staff_type', 'department', 'created_at')
    ordering = ('-created_at',)

admin.site.register(User, CustomUserAdmin)
admin.site.register(Patient)
