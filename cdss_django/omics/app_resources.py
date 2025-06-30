# omics/app_resources.py

import os
import logging
import joblib
from django.conf import settings

logger = logging.getLogger(__name__)

# --- 자원 캐시를 위한 전역 변수 ---

# 1. GTF 파일 캐시
GENCODE_GTF_DF = None

# 2. 모든 모델 및 관련 데이터를 담을 "빈 상자"들
BINARY_MODELS = {}
BINARY_LABEL_ENCODERS = {}
BINARY_FEATURE_LISTS = {}

OMICS_MODELS = {}
OMICS_SCALERS = {}
LABEL_ENCODERS = {}
FEATURE_LISTS = {}

META_MODEL = None
META_LABEL_ENCODER = None
META_FEATURE_NAMES = []
OMICS_FINAL_IMPUTER = None


def load_gtf_resource():
    """서버 시작 시 최적화된 GTF 캐시 파일(.pkl)을 읽어 메모리에 저장합니다."""
    global GENCODE_GTF_DF
    
    if GENCODE_GTF_DF is not None:
        logger.info("GTF resource already cached.")
        return

    try:
        cache_path = os.path.join(settings.BASE_DIR, 'resources', 'gencode_v22_processed.pkl')
        
        if os.path.exists(cache_path):
            logger.info(f"Loading OPTIMIZED GTF cache from: {cache_path}...")
            GENCODE_GTF_DF = joblib.load(cache_path)
            logger.info("Optimized GTF cache successfully loaded into memory.")
        else:
            logger.error(f"GTF cache file not found at {cache_path}.")
            
    except Exception as e:
        logger.error(f"Failed to load GTF cache file: {e}", exc_info=True)