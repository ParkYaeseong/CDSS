# pacs_integration/admin.py
from django.contrib import admin
from .models import OpenEMRPatientOrthancLink, OrthancStudyLog

@admin.register(OpenEMRPatientOrthancLink)
class OpenEMRPatientOrthancLinkAdmin(admin.ModelAdmin):
    list_display = ('openemr_patient_id', 'openemr_patient_name', 'orthanc_patient_id', 'last_known_study_uid', 'updated_at', 'created_at')
    search_fields = ('openemr_patient_id', 'openemr_patient_name', 'orthanc_patient_id')
    list_filter = ('updated_at', 'created_at')

@admin.register(OrthancStudyLog)
class OrthancStudyLogAdmin(admin.ModelAdmin):
    list_display = ('orthanc_study_instance_uid', 'patient_link_display', 'study_date', 'modality', 'upload_timestamp')
    search_fields = ('orthanc_study_instance_uid', 'patient_link__openemr_patient_id', 'accession_number')
    list_filter = ('modality', 'study_date', 'upload_timestamp')
    raw_id_fields = ('patient_link',) # ForeignKey 필드를 검색 가능한 입력 필드로 변경 (데이터가 많을 때 유용)

    def patient_link_display(self, obj):
        return obj.patient_link.openemr_patient_id if obj.patient_link else None
    patient_link_display.short_description = "EMR Patient ID"