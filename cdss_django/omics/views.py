# cdss_django/omics/views.py

import logging
import os
import json
import traceback
from datetime import datetime

import pandas as pd

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
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
    OmicsRequestListSerializer
)
from .tasks import run_analysis_pipeline

logger = logging.getLogger(__name__)


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
        logger.debug("=== OmicsRequestViewSet.get_queryset() 시작 ===")
        
        # 기본 쿼리셋을 가져옵니다.
        queryset = super().get_queryset()
        logger.debug(f"기본 쿼리셋 개수: {queryset.count()}")

        # URL 파라미터에서 patient_id를 가져옵니다.
        patient_id = self.request.query_params.get('patient_id')
        logger.debug(f"요청된 patient_id: {patient_id}")

        if patient_id:
            logger.info(f"Filtering OmicsRequest list for patient_id: {patient_id}")
            try:
                # patient_id (UUID 문자열)로 정확하게 필터링합니다.
                queryset = queryset.filter(patient__id=patient_id)
                logger.debug(f"필터링 후 쿼리셋 개수: {queryset.count()}")
                
                # 디버깅: 실제 데이터 확인
                for req in queryset:
                    logger.debug(f"- Request ID: {req.id}, Status: {req.status}, Patient: {req.patient.name if req.patient else 'None'}")
                    
            except Exception as e:
                logger.error(f"환자별 필터링 중 오류 발생: {str(e)}")
                logger.error(traceback.format_exc())

        # 최종적으로 필터링된 쿼리셋을 반환합니다.
        final_queryset = queryset.prefetch_related('data_files')
        logger.debug(f"=== get_queryset() 완료, 최종 개수: {final_queryset.count()} ===")
        return final_queryset

    def get_serializer_class(self):
        logger.debug(f"get_serializer_class() - action: {self.action}")
        if self.action == 'list': 
            return OmicsRequestListSerializer
        if self.action == 'create': 
            return OmicsRequestCreateSerializer
        return OmicsRequestDetailSerializer

    def perform_create(self, serializer):
        logger.debug("=== perform_create() 시작 ===")
        logger.debug(f"요청 사용자: {self.request.user}")
        logger.debug(f"시리얼라이저 데이터: {serializer.validated_data}")
        
        try:
            instance = serializer.save(requester=self.request.user, status='PENDING')
            logger.info(f"OmicsRequest 생성 성공: ID={instance.id}, Patient={instance.patient}")
        except Exception as e:
            logger.error(f"OmicsRequest 생성 실패: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    def list(self, request, *args, **kwargs):
        """리스트 조회 시 상세 로깅"""
        logger.debug("=== OmicsRequestViewSet.list() 시작 ===")
        logger.debug(f"요청 파라미터: {request.query_params}")
        
        try:
            response = super().list(request, *args, **kwargs)
            logger.debug(f"응답 데이터 개수: {len(response.data.get('results', response.data))}")
            return response
        except Exception as e:
            logger.error(f"리스트 조회 중 오류: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    def retrieve(self, request, *args, **kwargs):
        """상세 조회 시 상세 로깅"""
        logger.debug(f"=== retrieve() 시작 - ID: {kwargs.get('pk')} ===")
        
        try:
            response = super().retrieve(request, *args, **kwargs)
            logger.debug(f"조회 성공: {response.data.get('id')}")
            return response
        except Exception as e:
            logger.error(f"상세 조회 중 오류: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    @action(detail=True, methods=['post'], url_path='start-analysis')
    def start_analysis(self, request, pk=None):
        logger.info(f"=== start_analysis() 시작 - Request ID: {pk} ===")
        
        try:
            omics_request = self.get_object()
            logger.debug(f"OmicsRequest 조회 성공: {omics_request.id}, 현재 상태: {omics_request.status}")
            
            # 상태 검증
            if omics_request.status not in ['PENDING', 'FAILED', 'CREATED']:
                logger.warning(f"분석 시작 불가 - 현재 상태: {omics_request.status}")
                return Response({
                    'error': 'Analysis has already been started or completed.',
                    'current_status': omics_request.status
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 파일 존재 여부 검증
            file_count = omics_request.data_files.count()
            logger.debug(f"업로드된 파일 개수: {file_count}")
            
            if file_count == 0:
                logger.warning("분석 시작 불가 - 업로드된 파일 없음")
                return Response({
                    'error': 'Files must be uploaded before starting analysis.',
                    'uploaded_files_count': file_count
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 파일 상세 정보 로깅
            for data_file in omics_request.data_files.all():
                logger.debug(f"- 파일: {data_file.input_file.name}, 타입: {data_file.omics_type}")
            
            # Celery 태스크 시작
            logger.info(f"Celery 태스크 시작: run_analysis_pipeline.delay({omics_request.id})")
            task = run_analysis_pipeline.delay(str(omics_request.id))
            logger.info(f"Celery 태스크 ID: {task.id}")
            
            # 상태 업데이트
            omics_request.status = 'QUEUED'
            omics_request.save(update_fields=['status'])
            logger.info(f"상태 업데이트 완료: {omics_request.status}")
            
            return Response({
                'status': 'Analysis task has been successfully queued.',
                'task_id': task.id,
                'request_status': omics_request.status
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            logger.error(f"start_analysis() 중 오류 발생: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({
                'error': f'분석 시작 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='formatted-result')
    def formatted_result(self, request, pk=None):
        """
        오믹스 분석 결과를 포맷된 형태로 반환합니다. (디버깅 강화 버전)
        """
        logger.info(f"=== formatted_result() 시작 - Request ID: {pk} ===")
        
        try:
            # OmicsRequest 조회
            omics_request = self.get_object()
            logger.info(f"OmicsRequest 조회 성공: ID={omics_request.id}, Status={omics_request.status}")
            
            # 상태별 처리
            if omics_request.status == 'PROCESSING':
                logger.info("분석이 진행 중입니다.")
                return Response({
                    'status': 'processing',
                    'message': '분석이 진행 중입니다. 잠시 후 다시 시도해주세요.',
                    'request_status': omics_request.status
                }, status=status.HTTP_202_ACCEPTED)
            
            if omics_request.status == 'FAILED':
                logger.info("분석이 실패했습니다.")
                return Response({
                    'status': 'failed',
                    'message': '분석이 실패했습니다.',
                    'error_message': omics_request.error_message,
                    'request_status': omics_request.status
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if omics_request.status != 'COMPLETED':
                logger.info(f"분석이 아직 완료되지 않음: {omics_request.status}")
                return Response({
                    'status': 'not_ready',
                    'message': f'분석 상태: {omics_request.status}',
                    'request_status': omics_request.status
                }, status=status.HTTP_202_ACCEPTED)
            
            # OmicsResult 조회 (여러 방법으로 시도)
            result = None
            
            # 방법 1: 역참조로 조회
            try:
                result = omics_request.result
                logger.info("방법 1 성공: 역참조로 조회")
            except AttributeError:
                logger.debug("방법 1 실패: 역참조 속성 없음")
                
                # 방법 2: request 필드로 조회
                try:
                    result = OmicsResult.objects.get(request=omics_request)
                    logger.info("방법 2 성공: request 필드로 조회")
                except OmicsResult.DoesNotExist:
                    logger.debug("방법 2 실패: request 필드로 조회 실패")
                    
                    # 방법 3: pk로 직접 조회
                    try:
                        result = OmicsResult.objects.get(pk=omics_request.pk)
                        logger.info("방법 3 성공: pk로 직접 조회")
                    except OmicsResult.DoesNotExist:
                        logger.debug("방법 3 실패: pk로 직접 조회 실패")
            
            if not result:
                logger.warning(f"OmicsResult를 찾을 수 없음 - Request ID: {pk}")
                
                # 디버깅: 모든 OmicsResult 확인
                all_results = OmicsResult.objects.all()
                logger.debug(f"전체 OmicsResult 개수: {all_results.count()}")
                
                # 해당 요청과 연관된 결과 찾기 시도
                for res in all_results:
                    if hasattr(res, 'request') and res.request and str(res.request.id) == str(pk):
                        result = res
                        logger.info(f"수동 검색으로 결과 발견: {result.id}")
                        break
                
                if not result:
                    return Response({
                        'error': '분석 결과를 찾을 수 없습니다.',
                        'message': '분석이 완료되었지만 결과 데이터가 없습니다. 관리자에게 문의하세요.',
                        'request_status': omics_request.status,
                        'debug_info': {
                            'request_id': str(omics_request.id),
                            'total_results_count': all_results.count(),
                            'timestamp': datetime.now().isoformat()
                        }
                    }, status=status.HTTP_404_NOT_FOUND)
            
            logger.info(f"OmicsResult 조회 성공: {result.id}")
            
            # 결과 데이터 구성
            formatted_data = {
                'request_id': str(omics_request.id),
                'status': 'success',
                'request_status': omics_request.status,
                'binary_cancer_prediction': getattr(result, 'binary_cancer_prediction', None),
                'binary_probability': getattr(result, 'binary_cancer_probability', None),
                'predicted_cancer_type': getattr(result, 'predicted_cancer_type_name', None),
                'probabilities': getattr(result, 'all_cancer_type_probabilities', None),
                'biomarkers': getattr(result, 'biomarkers', []),
                'completion_timestamp': getattr(result, 'updated_at', None),
                'created_at': getattr(result, 'created_at', None),
            }
            
            # 파일 URL 추가
            if hasattr(result, 'result_file') and result.result_file:
                try:
                    file_url = request.build_absolute_uri(result.result_file.url)
                    formatted_data['result_file_url'] = file_url
                    logger.info(f"결과 파일 URL: {file_url}")
                except Exception as e:
                    logger.warning(f"파일 URL 생성 실패: {str(e)}")
            
            # 그래프 URL 추가
            if hasattr(result, 'stage1_signal_graph') and result.stage1_signal_graph:
                try:
                    graph_url = request.build_absolute_uri(result.stage1_signal_graph.url)
                    formatted_data['stage1_graph_url'] = graph_url
                except Exception as e:
                    logger.warning(f"1단계 그래프 URL 생성 실패: {str(e)}")
            
            if hasattr(result, 'shap_graph') and result.shap_graph:
                try:
                    shap_url = request.build_absolute_uri(result.shap_graph.url)
                    formatted_data['shap_graph_url'] = shap_url
                except Exception as e:
                    logger.warning(f"SHAP 그래프 URL 생성 실패: {str(e)}")
            
            logger.info(f"포맷된 데이터 구성 완료")
            logger.info(f"formatted_result() 성공 - Request ID: {pk}")
            
            return Response(formatted_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"formatted_result() 중 예상치 못한 오류 - Request ID: {pk}")
            logger.error(f"오류 내용: {str(e)}")
            logger.error(traceback.format_exc())
            
            return Response({
                'error': f'결과를 가져오는 중 예측하지 못한 서버 오류가 발생했습니다.',
                'message': str(e),
                'debug_info': {
                    'request_id': pk,
                    'timestamp': datetime.now().isoformat(),
                    'error_type': type(e).__name__
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='download')
    def download_result_file(self, request, pk=None):
        """분석 결과 파일을 직접 다운로드하는 엔드포인트"""
        logger.info(f"=== download_result_file() 시작 - Request ID: {pk} ===")
        
        try:
            omics_request = self.get_object()
            logger.debug(f"OmicsRequest 조회 성공: {omics_request.id}")
            
            # OmicsResult 조회
            try:
                result = OmicsResult.objects.get(request=omics_request)
                logger.debug(f"OmicsResult 조회 성공")
            except OmicsResult.DoesNotExist:
                logger.error(f"OmicsResult를 찾을 수 없음 - Request ID: {pk}")
                raise Http404("분석 결과를 찾을 수 없습니다.")
            
            # 파일 존재 여부 확인
            if not hasattr(result, 'result_file') or not result.result_file:
                logger.error(f"결과 파일이 없음 - Request ID: {pk}")
                raise Http404("결과 파일이 없습니다.")
            
            file_path = result.result_file.path
            logger.debug(f"파일 경로: {file_path}")
            
            if not os.path.exists(file_path):
                logger.error(f"파일이 실제로 존재하지 않음: {file_path}")
                raise Http404("결과 파일을 찾을 수 없습니다.")
            
            logger.info(f"파일 다운로드 시작: {file_path}")
            
            return FileResponse(
                open(file_path, 'rb'),
                content_type='application/json',
                as_attachment=True,
                filename=f'omics_result_{omics_request.id}.json'
            )
            
        except Http404:
            raise
        except Exception as e:
            logger.error(f"download_result_file() 중 오류: {str(e)}")
            logger.error(traceback.format_exc())
            raise Http404(f"파일 다운로드 중 오류가 발생했습니다: {str(e)}")


class OmicsDataFileViewSet(viewsets.ModelViewSet):
    queryset = OmicsDataFile.objects.all()
    serializer_class = OmicsDataFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        logger.info("=== OmicsDataFile 생성 시작 ===")
        logger.debug(f"업로드 데이터: {serializer.validated_data}")
        
        try:
            instance = super().perform_create(serializer)
            logger.info(f"파일 업로드 성공: {instance}")
            
            # 파일 정보 로깅
            if hasattr(instance, 'input_file') and instance.input_file:
                logger.debug(f"업로드된 파일: {instance.input_file.name}")
                logger.debug(f"파일 크기: {instance.input_file.size} bytes")
                logger.debug(f"오믹스 타입: {instance.omics_type}")
                
        except Exception as e:
            logger.error(f"파일 업로드 실패: {str(e)}")
            logger.error(traceback.format_exc())
            raise


class OmicsModelRequirementsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, cancer_type, format=None):
        logger.debug(f"=== OmicsModelRequirementsView - cancer_type: {cancer_type} ===")
        
        try:
            # 이 View는 현재 직접 사용되지 않을 수 있습니다.
            requirements = getattr(settings, 'OMICS_MODEL_REQUIREMENTS', {}).get(cancer_type)
            logger.debug(f"요구사항 조회 결과: {requirements}")
            
            if not requirements:
                logger.warning(f"'{cancer_type}'에 대한 모델 요구사항을 찾을 수 없음")
                return Response(
                    {"error": f"'{cancer_type}'에 대한 모델 요구사항을 찾을 수 없습니다."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            response_data = {"cancer_type": cancer_type, **requirements}
            logger.debug(f"응답 데이터: {response_data}")
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"모델 요구사항 조회 중 오류: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": f"서버 오류가 발생했습니다: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
        logger.info("=== StartTumorSegmentationView 시작 ===")
        logger.debug(f"요청 데이터: {request.data}")
        
        diagnosis_request_id = request.data.get('diagnosis_request_id')
        target_organ = request.data.get('target_organ')
        
        logger.debug(f"diagnosis_request_id: {diagnosis_request_id}")
        logger.debug(f"target_organ: {target_organ}")

        if not diagnosis_request_id or not target_organ:
            logger.warning("필수 파라미터 누락")
            return Response({
                "error": "diagnosis_request_id and target_organ are required.",
                "received_data": request.data
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            diagnosis_request = DiagnosisRequest.objects.get(id=diagnosis_request_id)
            logger.debug(f"DiagnosisRequest 조회 성공: {diagnosis_request.id}")
        except DiagnosisRequest.DoesNotExist:
            logger.error(f"DiagnosisRequest를 찾을 수 없음: {diagnosis_request_id}")
            return Response({
                "error": "DiagnosisRequest not found.",
                "diagnosis_request_id": diagnosis_request_id
            }, status=status.HTTP_404_NOT_FOUND)

        # 각 `target_organ`에 맞는 Task와 인자(arguments)를 매핑합니다.
        task_map = {
            # 'liver':  {'task': run_nnunet_pipeline, 'args': [diagnosis_request_id, 'liver', 3]},
            # 'kidney': {'task': run_nnunet_pipeline, 'args': [diagnosis_request_id, 'kidney', 48]},
            # 'ovary':  {'task': run_ovarian_cancer_segmentation, 'args': [diagnosis_request_id]},
            # 'breast': {'task': run_breast_segmentation, 'args': [diagnosis_request_id]},
        }
        
        logger.debug(f"지원되는 장기: {list(task_map.keys())}")

        if target_organ in task_map:
            logger.info(f"'{target_organ}' 분석 태스크 설정됨 (현재 주석 처리됨)")
            return Response({
                "message": f"'{target_organ}' analysis is configured but the task import is commented out.",
                "target_organ": target_organ,
                "diagnosis_request_id": diagnosis_request_id
            })
        else:
            logger.warning(f"지원되지 않는 장기: {target_organ}")
            return Response({
                "error": "Unsupported target organ",
                "target_organ": target_organ,
                "supported_organs": list(task_map.keys())
            }, status=status.HTTP_400_BAD_REQUEST)


# ===================================================================
# 디버깅을 위한 추가 뷰들
# ===================================================================
class DebugOmicsDataView(APIView):
    """디버깅을 위한 오믹스 데이터 확인 뷰"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        logger.info("=== DebugOmicsDataView 시작 ===")
        
        try:
            # 전체 통계
            total_requests = OmicsRequest.objects.count()
            total_files = OmicsDataFile.objects.count()
            total_results = OmicsResult.objects.count()
            
            # 상태별 통계
            status_counts = {}
            for status_choice in ['PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']:
                count = OmicsRequest.objects.filter(status=status_choice).count()
                status_counts[status_choice] = count
            
            # 최근 요청들
            recent_requests = []
            for req in OmicsRequest.objects.order_by('-request_timestamp')[:5]:
                recent_requests.append({
                    'id': str(req.id),
                    'patient': req.patient.name if req.patient else 'None',
                    'status': req.status,
                    'created': req.request_timestamp.isoformat() if req.request_timestamp else None,
                    'files_count': req.data_files.count()
                })
            
            debug_data = {
                'timestamp': datetime.now().isoformat(),
                'statistics': {
                    'total_requests': total_requests,
                    'total_files': total_files,
                    'total_results': total_results,
                    'status_distribution': status_counts
                },
                'recent_requests': recent_requests
            }
            
            logger.debug(f"디버그 데이터: {debug_data}")
            return Response(debug_data)
            
        except Exception as e:
            logger.error(f"디버그 뷰 오류: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({
                'error': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
