# appointment_service/admin.py
from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'patient_name', 'get_doctor_name', 'appointment_datetime', 
        'appointment_type', 'status', 'department', 'created_at'
    ]
    list_filter = ['status', 'appointment_type', 'department', 'created_at']
    search_fields = [
        'flutter_patient__user__first_name', 'flutter_patient__user__last_name',
        'patient__first_name', 'patient__last_name',
        'doctor__user__first_name', 'doctor__user__last_name',
        'reason', 'chief_complaint'
    ]
    date_hierarchy = 'appointment_datetime'
    ordering = ['-appointment_datetime']
    
    fieldsets = (
        ('환자 정보', {
            'fields': ('flutter_patient', 'patient')
        }),
        ('예약 정보', {
            'fields': ('doctor', 'appointment_datetime', 'duration', 'appointment_type', 'department')
        }),
        ('진료 내용', {
            'fields': ('reason', 'chief_complaint', 'status', 'notes')
        }),
        ('시스템 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def get_doctor_name(self, obj):
        return obj.doctor.user.get_full_name()
    get_doctor_name.short_description = '담당 의사'
    
    def patient_name(self, obj):
        return obj.patient_name
    patient_name.short_description = '환자명'
    
    actions = ['mark_as_confirmed', 'mark_as_cancelled', 'mark_as_completed']
    
    def mark_as_confirmed(self, request, queryset):
        queryset.update(status='confirmed')
        self.message_user(request, f'{queryset.count()}개의 예약이 확정되었습니다.')
    mark_as_confirmed.short_description = '선택된 예약을 확정으로 변경'
    
    def mark_as_cancelled(self, request, queryset):
        queryset.update(status='cancelled')
        self.message_user(request, f'{queryset.count()}개의 예약이 취소되었습니다.')
    mark_as_cancelled.short_description = '선택된 예약을 취소로 변경'
    
    def mark_as_completed(self, request, queryset):
        queryset.update(status='completed')
        self.message_user(request, f'{queryset.count()}개의 예약이 완료되었습니다.')
    mark_as_completed.short_description = '선택된 예약을 완료로 변경'
