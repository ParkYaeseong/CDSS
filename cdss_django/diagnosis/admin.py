from django.contrib import admin
from .models import DiagnosisRequest, DiagnosisResult

@admin.register(DiagnosisRequest)
class DiagnosisRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'status', 'request_timestamp')
    search_fields = ('patient__name',)
    list_filter = ('status',)

@admin.register(DiagnosisResult)
class DiagnosisResultAdmin(admin.ModelAdmin):
    list_display = ('get_request_id', 'result_summary', 'created_at')
    search_fields = ('request__id', 'result_summary')

    def get_request_id(self, obj):
        return obj.request.id
    get_request_id.short_description = "Request ID"
