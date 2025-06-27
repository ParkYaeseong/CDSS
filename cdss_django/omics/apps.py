# cdss_django/omics/apps.py

from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class OmicsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'omics'

    def ready(self):
        """
        Django 앱이 준비될 때 호출됩니다.
        Celery 워커를 포함한 모든 프로세스에서 모델 로딩을 보장합니다.
        """
        # 순환 참조 오류를 피하기 위해, 함수 내부에서 import 합니다.
        from .app_resources import META_MODEL
        
        # 모델이 아직 로드되지 않았을 때만 로딩 함수를 호출합니다.
        if META_MODEL is None:
            logger.info("OmicsConfig.ready(): Models are not loaded. Initializing...")
            try:
                from .prediction_service import load_all_prediction_models
                load_all_prediction_models()
                logger.info("OmicsConfig.ready(): Successfully loaded all prediction models.")
            except Exception as e:
                # 모델 로딩 중 심각한 오류가 발생하면, 서버 로그에 기록을 남깁니다.
                logger.critical(f"OmicsConfig.ready(): CRITICAL ERROR during model loading - {e}", exc_info=True)
                # 여기서 프로그램을 종료시킬 수도 있습니다.
                # import sys
                # sys.exit(1)
        else:
            logger.info("OmicsConfig.ready(): Models appear to be already loaded. Skipping initialization.")