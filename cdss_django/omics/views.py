# cdss_django/omics/views.py

import logging
import os
import json

import pandas as pd

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView

# --- 모델, 서비스 및 유틸리티 임포트 ---
from .models import OmicsRequest, OmicsDataFile, OmicsResult
from diagnosis.models import DiagnosisRequest
from .serializers import (
    OmicsRequestCreateSerializer,
    OmicsRequestDetailSerializer,
    OmicsDataFileSerializer,
    OmicsRequestListSerializer,
    OmicsResultSerializer
)
from .tasks import run_analysis_pipeline

from omics.models import OmicsRequest
from omics.serializers import OmicsRequestListSerializer


logger = logging.getLogger(__name__)

class PatientOmicsRequestListView(APIView):
    """
    특정 환자의 모든 오믹스 분석 '요청' 목록을 가져오는 API
    """
    def get(self, request, patient_id, format=None):
        # [수정] OmicsRequest 모델의 patient 필드(ForeignKey)를 통해
        # 연결된 PatientProfile 모델의 id 필드(UUID)를 조회하도록 필터링 방식을 변경합니다.
        # patient_id -> patient__id (언더스코어 두 개)
        requests = OmicsRequest.objects.filter(patient__id=patient_id, status=OmicsRequest.StatusChoices.COMPLETED).order_by('-request_timestamp')
        
        serializer = OmicsRequestListSerializer(requests, many=True)
        return Response(serializer.data)

class OmicsResultDetailView(APIView):
    """
    특정 분석 '요청(Request)'에 대한 '결과(Result)'를 가져오는 API
    """
    def get(self, request, request_id, format=None):
        result = get_object_or_404(OmicsResult, pk=request_id)
        serializer = OmicsResultSerializer(result)
        return Response(serializer.data)
# ==============================================================================
# 실시간 암종 분류 API View (현재는 비활성화/재작성 필요 상태)
# ==============================================================================
class ClassifyCancerTypeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logger.error("ClassifyCancerTypeView: Real-time classification functionality is not fully implemented.")
        return Response(
            {"error": "Real-time classification functionality is temporarily unavailable."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


# ==============================================================================
# 비동기 파일 기반 분석을 위한 ViewSet
# ==============================================================================
class OmicsRequestViewSet(viewsets.ModelViewSet):
    queryset = OmicsRequest.objects.all().order_by('-request_timestamp')
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        URL 쿼리 파라미터에 patient_id가 있으면 해당 환자의 데이터만 필터링합니다.
        UUID도 완벽하게 지원합니다.
        """
        # 기본 쿼리셋을 가져옵니다.
        queryset = super().get_queryset()

        # URL 파라미터에서 patient_id를 가져옵니다. (예: /api/omics/requests/?patient_id=86820416-...)
        patient_id = self.request.query_params.get('patient_id')

        if patient_id:
            logger.info(f"Filtering OmicsRequest list for patient_id: {patient_id}")
            # patient_id (UUID 문자열)로 정확하게 필터링합니다.
            # patient__id는 Patient 모델의 id 필드를 의미합니다.
            queryset = queryset.filter(patient__id=patient_id)

        # 최종적으로 필터링된 쿼리셋을 반환합니다.
        return queryset.prefetch_related('data_files')

    def get_serializer_class(self):
        if self.action == 'list': return OmicsRequestListSerializer
        if self.action == 'create': return OmicsRequestCreateSerializer
        return OmicsRequestDetailSerializer

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user, status='PENDING')

    @action(detail=True, methods=['post'], url_path='start-analysis')
    def start_analysis(self, request, pk=None):
        omics_request = self.get_object()
        if omics_request.status not in ['PENDING', 'FAILED', 'CREATED']:
            return Response({'error': 'Analysis has already been started or completed.'}, status=status.HTTP_400_BAD_REQUEST)
        if not omics_request.data_files.exists():
            return Response({'error': 'Files must be uploaded before starting analysis.'}, status=status.HTTP_400_BAD_REQUEST)

        run_analysis_pipeline.delay(str(omics_request.id))
        omics_request.status = 'QUEUED'
        omics_request.save(update_fields=['status'])
        return Response({'status': 'Analysis task has been successfully queued.'}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['get'], url_path='formatted-result')
    def formatted_result(self, request, pk=None):
        logger.info(f"Formatted result requested for OmicsRequest ID: {pk}")
        try:
            omics_request = self.get_object()
            
            # --- [최종 수정] ---
            # 역참조 대신, OmicsResult 모델에서 직접 pk를 이용해 조회합니다.
            # 이것이 가장 확실하고 안정적인 방법입니다.
            result = OmicsResult.objects.get(pk=omics_request.pk)
            
            formatted_data = {
                'request_id': str(omics_request.id),
                'status': omics_request.status,
                'binary_prediction': result.binary_cancer_prediction,
                'binary_probability': result.binary_cancer_probability,
                'predicted_cancer_type': result.predicted_cancer_type_name,
                'probabilities': result.all_cancer_type_probabilities,
                'completed_at': result.last_updated,
                'biomarkers': result.biomarkers or []
            }
            logger.info(f"Successfully formatted result for OmicsRequest ID: {pk}")
            return Response(formatted_data, status=status.HTTP_200_OK)

        except OmicsResult.DoesNotExist:
            logger.warning(f"Result not found for OmicsRequest ID: {pk}")
            return Response({'error': '아직 분석 결과가 없습니다. 잠시 후 다시 시도해주세요.'}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"An unexpected error occurred while fetching result for {pk}: {e}", exc_info=True)
            return Response({'error': f'결과를 가져오는 중 예측하지 못한 서버 오류가 발생했습니다: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
    # --- [수정 끝] ---

class OmicsDataFileViewSet(viewsets.ModelViewSet):
    queryset = OmicsDataFile.objects.all()
    serializer_class = OmicsDataFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        super().perform_create(serializer)


class OmicsModelRequirementsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, cancer_type, format=None):
        # 이 View는 현재 직접 사용되지 않을 수 있습니다.
        requirements = settings.OMICS_MODEL_REQUIREMENTS.get(cancer_type)
        if not requirements:
            return Response(
                {"error": f"'{cancer_type}'에 대한 모델 요구사항을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND
            )
        response_data = {"cancer_type": cancer_type, **requirements}
        return Response(response_data)


# ===================================================================
# 다중 AI 영상 분석을 위한 라우터(Router) API View
# ===================================================================
class StartTumorSegmentationView(APIView):
    """
    다양한 종류의 AI 영상 분석 Task를 시작시키는 API 엔드포인트.
    'target_organ' 파라미터에 따라 적절한 Celery Task를 호출합니다.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        diagnosis_request_id = request.data.get('diagnosis_request_id')
        target_organ = request.data.get('target_organ')

        if not diagnosis_request_id or not target_organ:
            return Response({"error": "diagnosis_request_id and target_organ are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            diagnosis_request = DiagnosisRequest.objects.get(id=diagnosis_request_id)
        except DiagnosisRequest.DoesNotExist:
            return Response({"error": "DiagnosisRequest not found."}, status=status.HTTP_404_NOT_FOUND)

        # 각 `target_organ`에 맞는 Task와 인자(arguments)를 매핑합니다.
        # 실제 운영시에는 주석을 해제하고, pacs_integration.tasks에서 해당 task들을 import 해야 합니다.
        task_map = {
            # 'liver':  {'task': run_nnunet_pipeline, 'args': [diagnosis_request_id, 'liver', 3]},
            # 'kidney': {'task': run_nnunet_pipeline, 'args': [diagnosis_request_id, 'kidney', 48]},
            # 'ovary':  {'task': run_ovarian_cancer_segmentation, 'args': [diagnosis_request_id]},
            # 'breast': {'task': run_breast_segmentation, 'args': [diagnosis_request_id]},
        }

        if target_organ in task_map:
            # task_info = task_map[target_organ]
            # task = task_info['task'].delay(*task_info['args'])
            # return Response({"message": f"{target_organ} analysis task started.", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)
            
            # 현재는 task import가 주석 처리되어 있으므로, 아래와 같이 응답합니다.
            return Response({"message": f"'{target_organ}' analysis is configured but the task import is commented out."})
        else:
            return Response({"error": "Unsupported target organ"}, status=status.HTTP_400_BAD_REQUEST)