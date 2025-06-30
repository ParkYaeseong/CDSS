# cdss_django/omics/tasks.py

import logging
from celery import shared_task
from .models import OmicsRequest
# [수정] prediction_service에서 필요한 모든 함수를 가져옵니다.
from .prediction_service import run_sequential_diagnosis_pipeline, load_all_prediction_models
from .app_resources import META_MODEL # 모델 로드 여부를 확인하기 위해 import

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def run_analysis_pipeline(self, omics_request_id):
    """
    주어진 OmicsRequest ID에 대해 '순차 진단 파이프라인'을 실행하는 Celery Task.
    이 Task는 prediction_service.py의 메인 함수를 호출하는 역할만 합니다.
    """
    logger.info(f"Celery task '{self.request.id}' started for omics_request_id: {omics_request_id}")
    
    try:
        # --- [핵심] ---
        # 작업을 시작하기 전, 모델이 메모리에 로드되었는지 확인하고,
        # 로드되지 않았다면 즉시 로드합니다.
        if META_MODEL is None:
            logger.warning(f"[{omics_request_id}] Models not found in Celery worker memory. Forcing reload...")
            load_all_prediction_models()
            logger.info(f"[{omics_request_id}] Model loading complete for worker. Resuming pipeline.")
        else:
            logger.info(f"[{omics_request_id}] Models already loaded in worker memory. Proceeding.")
        # --- [수정 끝] ---

        # === 실제 모든 분석 로직이 담긴 함수를 호출합니다. ===
        # DB 업데이트를 포함한 모든 처리는 이 함수가 책임집니다.
        run_sequential_diagnosis_pipeline(omics_request_id, save_to_db=True)
        # ====================================================

        logger.info(f"Celery task for omics_request_id {omics_request_id} has successfully completed its pipeline via prediction_service.")

    except OmicsRequest.DoesNotExist:
        logger.error(f"OmicsRequest with ID {omics_request_id} not found.")
    except Exception as e:
        logger.error(f"A critical error occurred in the Celery task wrapper for {omics_request_id}: {e}", exc_info=True)
        try:
            failed_request = OmicsRequest.objects.get(id=omics_request_id)
            failed_request.status = 'FAILED'
            failed_request.error_message = f"파이프라인 실행 중 심각한 오류 발생: {str(e)}"
            failed_request.save(update_fields=['status', 'error_message'])
        except OmicsRequest.DoesNotExist:
            pass