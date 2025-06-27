from django.contrib import admin
from .models import OmicsRequest, OmicsResult, TumorSegmentationResult, OmicsDataFile
from django.utils.html import format_html

# 1. OmicsRequest (오믹스 분석 요청) 관리자 설정
@admin.register(OmicsRequest)
class OmicsRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'status', 'request_timestamp', 'requester')
    list_filter = ('status', 'cancer_type', 'request_timestamp')
    search_fields = ('id', 'patient__patient_id', 'patient__korean_name')
    ordering = ('-request_timestamp',)
    readonly_fields = ('request_timestamp',)

# 2. OmicsResult (오믹스 분석 결과) 관리자 설정
@admin.register(OmicsResult)
class OmicsResultAdmin(admin.ModelAdmin):
    list_display = ('request_id', 'predicted_cancer_type_name', 'binary_cancer_prediction', 'binary_cancer_probability', 'last_updated')
    list_filter = ('predicted_cancer_type_name', 'binary_cancer_prediction')
    search_fields = ('request__id', 'predicted_cancer_type_name')
    ordering = ('-last_updated',)

    def request_id(self, obj):
        return obj.request.id
    request_id.short_description = "Request ID"

# 3. TumorSegmentationResult (종양 분할 결과) 관리자 설정 (기존 코드 수정)
@admin.register(TumorSegmentationResult)
class TumorSegmentationResultAdmin(admin.ModelAdmin):
    list_display = ('get_request_id', 'analysis_name', 'status', 'created_at')
    search_fields = ('request__id', 'analysis_name') # request__id로 검색 필드 수정

    def get_request_id(self, obj):
        if hasattr(obj, 'request') and obj.request:
            return obj.request.id
        return "N/A"
    get_request_id.short_description = "Request ID"

# 4. OmicsDataFile (업로드된 오믹스 파일) 관리자 설정 (선택 사항)
# 어떤 파일들이 업로드되었는지 확인하고 싶을 경우를 위해 추가
@admin.register(OmicsDataFile)
class OmicsDataFileAdmin(admin.ModelAdmin):
    list_display = ('request_id', 'omics_type', 'input_file', 'uploaded_at')
    list_filter = ('omics_type',)
    search_fields = ('request__id', 'input_file')

    def request_id(self, obj):
        return obj.request.id
    request_id.short_description = "Request ID"