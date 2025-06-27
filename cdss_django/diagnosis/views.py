# cdss_django/diagnosis/views.py

from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
import logging

from .models import DiagnosisRequest
from .serializers import (
    DiagnosisRequestListSerializer,
    DiagnosisRequestDetailSerializer,
)

logger = logging.getLogger(__name__)

class DiagnosisRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """
    진단 요청의 목록(list)과 상세 정보(retrieve)를 조회하는 ViewSet.
    생성은 pacs_integration 앱에서 담당하므로, 여기서는 조회만 가능합니다.
    """
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient'] 

    def get_serializer_class(self):
        """요청의 종류에 따라 다른 Serializer를 반환합니다."""
        if self.action == 'list':
            return DiagnosisRequestListSerializer
        return DiagnosisRequestDetailSerializer

    def get_queryset(self):
        """
        사용자 역할에 따라 접근 가능한 데이터 범위를 필터링합니다.
        """
        user = self.request.user
        if not user.is_authenticated:
            return DiagnosisRequest.objects.none()

        base_queryset = DiagnosisRequest.objects.select_related('patient', 'result')

        # 슈퍼유저 또는 관리자는 모든 요청 조회 가능
        if user.is_superuser or getattr(user, 'user_type', None) == 'admin':
            return base_queryset.order_by('-request_timestamp')

        # 그 외 모든 의료진(의사, 간호사, 영상의학과)은 모든 요청을 볼 수 있도록 허용 (기존 정책 유지)
        allowed_roles = ['doctor', 'nurse', 'radio']
        if getattr(user, 'user_type', None) in allowed_roles:
             return base_queryset.order_by('-request_timestamp')

        # 그 외 사용자는 조회 불가
        return base_queryset.none()
