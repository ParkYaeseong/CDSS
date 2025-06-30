import os
import gc
import json
import joblib
import pandas as pd
import numpy as np
import logging
import sys
import psutil

from concurrent.futures import ThreadPoolExecutor
from django.conf import settings
from .models import OmicsRequest, OmicsResult, OmicsDataFile
from . import preprocessing_utils as pp_utils
from .app_resources import GENCODE_GTF_DF, BINARY_MODELS, BINARY_LABEL_ENCODERS, BINARY_FEATURE_LISTS, \
    OMICS_MODELS, LABEL_ENCODERS, FEATURE_LISTS, OMICS_SCALERS, META_MODEL, META_LABEL_ENCODER, META_FEATURE_NAMES

# [그래프 추가] 그래프 생성을 위한 라이브러리 import
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
from django.core.files.base import ContentFile

from django.conf import settings
from .models import OmicsRequest, OmicsResult, OmicsDataFile
from . import preprocessing_utils as pp_utils
# [그래프 추가] app_resources를 직접 사용하지 않고, 로드된 전역 변수를 사용합니다.
from .app_resources import GENCODE_GTF_DF, BINARY_MODELS, BINARY_LABEL_ENCODERS, BINARY_FEATURE_LISTS, \
    OMICS_MODELS, LABEL_ENCODERS, FEATURE_LISTS, OMICS_SCALERS, META_MODEL, META_LABEL_ENCODER, META_FEATURE_NAMES, OMICS_FINAL_IMPUTER

logger = logging.getLogger(__name__)

MODEL_BASE_DIR = os.path.join(settings.BASE_DIR, 'ml_models', 'cancer_type_classification')

# --- Omics 타입 키 매핑 ---
# 내부 로직용 키 <-> 파일 이름용 키
INTERNAL_OMICS_KEY_MAP = {
    'RNA-seq': 'gene', 'miRNA': 'mirna', 'CNV': 'cnv', 
    'Methylation': 'meth', 'Mutation': 'mutation'
}
FILENAME_KEY_MAP = {
    'gene': 'GeneExp', 'mirna': 'miRNA', 'cnv': 'CNV', 
    'meth': 'Meth', 'mutation': 'Mut'
}

def load_all_prediction_models():
    """
    Celery 워커 시작 시 필요한 모든 모델과 전처리 도구를 로드하여 메모리에 캐싱합니다.
    """
    print(f"DEBUG: Attempting to load models from base directory: {MODEL_BASE_DIR}")
    global BINARY_MODELS, BINARY_LABEL_ENCODERS, BINARY_FEATURE_LISTS, \
           META_MODEL, META_LABEL_ENCODER, META_FEATURE_NAMES, OMICS_SCALERS, OMICS_FINAL_IMPUTER, \
           OMICS_MODELS, LABEL_ENCODERS, FEATURE_LISTS

    # OMICS_MODELS, LABEL_ENCODERS, FEATURE_LISTS가 로드되었는지 확인하는 조건
    if META_MODEL is not None and \
       all(model is not None for model in BINARY_MODELS.values()) and \
       bool(OMICS_MODELS): # OMICS_MODELS가 비어있지 않은지 확인
        print("DEBUG_PRINT: All prediction models already loaded and verified.", file=sys.stderr)
        logger.info("All prediction models already loaded and verified.")
        return

    print("DEBUG_PRINT: Attempting to load all prediction models for prediction_service...", file=sys.stderr)
    logger.info("Attempting to load all prediction models for prediction_service...")

    try:
        # --- 1. 메타 모델 관련 파일 로드 (2단계 최종 분류 모델) ---
        meta_model_dir = os.path.join(MODEL_BASE_DIR, 'Meta_analysis_pkl')

        meta_model_path = os.path.join(meta_model_dir, 'final_meta_model.pkl')
        if os.path.exists(meta_model_path):
            try:
                META_MODEL = joblib.load(meta_model_path)
                logger.info(f"Loaded Meta Model from {meta_model_path}")
            except Exception as e:
                logger.error(f"ERROR: Failed to load Meta Model from {meta_model_path}: {e}", exc_info=True)
                _reset_global_models()
                raise
        else:
            logger.error(f"ERROR: Meta Model file NOT FOUND at {meta_model_path}. Main classification will not work.")
            _reset_global_models()
            raise FileNotFoundError(f"Meta Model file not found: {meta_model_path}")

        # --- 메타 모델의 LabelEncoder 로드 ---
        # 경로 재확인: 'meta_label_encoder.pkl' 파일이 Meta_analysis_pkl 디렉토리 내에 없음을 확인했습니다.
        # 따라서 현재는 이 경고가 예상되며, 2단계 분류 결과 레이블링에 문제가 있을 수 있습니다.
        meta_label_encoder_path = os.path.join(meta_model_dir, 'meta_label_encoder.pkl')
        if os.path.exists(meta_label_encoder_path):
            try:
                META_LABEL_ENCODER = joblib.load(meta_label_encoder_path)
                logger.info(f"Loaded Meta LabelEncoder from {meta_label_encoder_path}")
            except Exception as e:
                logger.error(f"ERROR: Failed to load Meta LabelEncoder from {meta_label_encoder_path}: {e}", exc_info=True)
                _reset_global_models(meta_only=True)
                raise
        else:
            logger.warning(f"WARNING: Meta LabelEncoder file NOT FOUND at {meta_label_encoder_path}. 2nd stage class names might be incorrect.")

        # --- 메타 모델 특징 파일 로드 ---
        # 경로 재확인: 'meta_features_for_ensemble.json' 파일이 Meta_analysis_pkl 디렉토리 내에 없음을 확인했습니다.
        # 이는 SHAP 분석의 feature names에 영향을 미칩니다.
        meta_features_path = os.path.join(meta_model_dir, 'meta_features_for_ensemble.json')
        if os.path.exists(meta_features_path):
            try:
                with open(meta_features_path, 'r') as f:
                    META_FEATURE_NAMES = json.load(f)
                logger.info(f"Loaded Meta Feature Names from {meta_features_path} (Count: {len(META_FEATURE_NAMES)})")
            except Exception as e:
                logger.error(f"ERROR: Failed to load Meta Feature Names from {meta_features_path}: {e}", exc_info=True)
                _reset_global_models(meta_only=True)
                raise
        else:
            logger.warning(f"WARNING: Meta Feature Names file NOT FOUND at {meta_features_path}. 2nd stage feature alignment will be impacted.")

        # --- 메타 모델 최종 Imputer 로드 (현재 Meta_analysis_pkl에 없는 것으로 보임) ---
        # 이 imputer는 2단계 메타 모델 입력 데이터를 최종 전처리할 때 사용될 수 있습니다.
        meta_imputer_path = os.path.join(meta_model_dir, 'final_imputer.joblib') # 메타 모델용 final imputer 경로 가정
        if os.path.exists(meta_imputer_path):
            try:
                OMICS_FINAL_IMPUTER = joblib.load(meta_imputer_path)
                logger.info(f"Loaded Meta Imputer from {meta_imputer_path}")
            except Exception as e:
                logger.error(f"ERROR: Failed to load Meta Imputer from {meta_imputer_path}: {e}", exc_info=True)
                _reset_global_models(meta_only=True)
                raise
        else:
            logger.warning(f"WARNING: Meta Imputer file NOT FOUND at {meta_imputer_path}. Imputation for meta model input might be skipped.")


        # --- 2. 각 이진 분류 모델 (1단계: 암 vs 정상 분류) 로드 ---
        binary_cancer_types = ['ovarian_cancer', 'breast_cancer', 'stomach_cancer', 'kidney_cancer', 'lung_cancer', 'liver_cancer']

        for cancer_type in binary_cancer_types:
            binary_model_base_dir = os.path.join(settings.BASE_DIR, 'ml_models', cancer_type)

            # --- features.json 로드 ---
            features_path_json = os.path.join(binary_model_base_dir, 'feature_names.json')
            current_features = []
            if os.path.exists(features_path_json):
                try:
                    with open(features_path_json, 'r') as f:
                        current_features = json.load(f)
                    logger.info(f"Loaded features for {cancer_type} from {features_path_json} (Count: {len(current_features)})")
                except Exception as e:
                    logger.error(f"ERROR: Failed to load features (JSON) for {cancer_type} from {features_path_json}: {e}", exc_info=True)
                    BINARY_FEATURE_LISTS[cancer_type] = []
                    continue
            else:
                logger.error(f"ERROR: Feature list (feature_names.json) NOT FOUND for {cancer_type} at {features_path_json}. Binary prediction for this type will be skipped.")
                BINARY_FEATURE_LISTS[cancer_type] = []
                continue
            BINARY_FEATURE_LISTS[cancer_type] = current_features

            # --- final_model.joblib 로드 ---
            binary_model_path = os.path.join(binary_model_base_dir, 'final_model.joblib')
            current_binary_model = None
            if os.path.exists(binary_model_path):
                try:
                    current_binary_model = joblib.load(binary_model_path)
                    logger.info(f"Loaded binary model for {cancer_type} from {binary_model_path}")
                except Exception as e:
                    logger.error(f"ERROR: Failed to load binary model for {cancer_type} from {binary_model_path}: {e}", exc_info=True)
                    BINARY_MODELS[cancer_type] = None
                    continue
            else:
                logger.error(f"ERROR: Binary model (final_model.joblib) NOT FOUND for {cancer_type} at {binary_model_path}. Binary prediction for this type will be skipped.")
                BINARY_MODELS[cancer_type] = None
                continue
            BINARY_MODELS[cancer_type] = current_binary_model

            # --- binary_label_encoder.pkl 로드 (선택 사항이므로 CRITICAL_ERROR 아님) ---
            binary_le_path = os.path.join(binary_model_base_dir, 'binary_label_encoder.pkl')
            current_binary_le = None
            if os.path.exists(binary_le_path):
                try:
                    current_binary_le = joblib.load(binary_le_path)
                    logger.info(f"Binary LabelEncoder found and loaded for {cancer_type} at {binary_le_path}.")
                except Exception as e:
                    logger.error(f"ERROR: Failed to load binary LabelEncoder for {cancer_type} from {binary_le_path}: {e}", exc_info=True)
            else:
                logger.info(f"As expected, binary LabelEncoder NOT FOUND for {cancer_type} at {binary_le_path}. Will infer labels from proba.")
            BINARY_LABEL_ENCODERS[cancer_type] = current_binary_le


        # --- 3. 각 오믹스별 Expert 모델 (2단계 암종 분류의 하위 모델) 로드 ---
        # 이제 이 부분에 실제 로드 로직을 추가합니다.
        expert_omics_types = ['gene', 'mirna', 'cnv', 'meth', 'mutation'] # 'cnv'는 소문자 디렉토리로 확인됨

        for omics_type_key in expert_omics_types:
            expert_model_base_dir = os.path.join(MODEL_BASE_DIR, f"{omics_type_key.capitalize()}_pkl" if omics_type_key != 'cnv' else f"{omics_type_key}_pkl")

            current_expert_models = []
            current_expert_le = None
            current_expert_features = []

            # --- Expert Model Feature List 로드 (features.txt) ---
            expert_features_path = os.path.join(MODEL_BASE_DIR, f"{omics_type_key}_features.txt")
            if os.path.exists(expert_features_path):
                try:
                    current_expert_features = pp_utils.load_feature_list(expert_features_path)
                    logger.info(f"Loaded Expert features for {omics_type_key} from {expert_features_path} (Count: {len(current_expert_features)})")
                except Exception as e:
                    logger.error(f"ERROR: Failed to load Expert features for {omics_type_key} from {expert_features_path}: {e}", exc_info=True)
                    FEATURE_LISTS[omics_type_key] = []
                    continue
            else:
                logger.error(f"ERROR: Expert feature list ({omics_type_key}_features.txt) NOT FOUND for {omics_type_key} at {expert_features_path}. Expert model prediction will be skipped.")
                FEATURE_LISTS[omics_type_key] = []
                continue
            FEATURE_LISTS[omics_type_key] = current_expert_features

            # --- Expert Model Label Encoder 로드 ---
            expert_le_path = os.path.join(expert_model_base_dir, f"{omics_type_key}_label_encoder.pkl")
            if os.path.exists(expert_le_path):
                try:
                    current_expert_le = joblib.load(expert_le_path)
                    logger.info(f"Loaded Expert LabelEncoder for {omics_type_key} from {expert_le_path}.")
                except Exception as e:
                    logger.error(f"ERROR: Failed to load Expert LabelEncoder for {omics_type_key} from {expert_le_path}: {e}", exc_info=True)
                    LABEL_ENCODERS[omics_type_key] = None
                    continue
            else:
                logger.error(f"ERROR: Expert LabelEncoder ({omics_type_key}_label_encoder.pkl) NOT FOUND for {omics_type_key} at {expert_le_path}. Expert model prediction will be impacted.")
                LABEL_ENCODERS[omics_type_key] = None
                continue
            LABEL_ENCODERS[omics_type_key] = current_expert_le


            # --- Expert Fold Models 로드 ---
            for i in range(1, 6): # 5-fold 모델 로드
                fold_model_path = os.path.join(expert_model_base_dir, f"{omics_type_key}_lgbm_model_fold_{i}.pkl")
                if os.path.exists(fold_model_path):
                    try:
                        current_expert_models.append(joblib.load(fold_model_path))
                        logger.info(f"Loaded Expert Fold Model {i} for {omics_type_key} from {fold_model_path}.")
                    except Exception as e:
                        print(f"DEBUG_PRINT: CRITICAL_ERROR: Failed to load Expert Fold Model {i} for {omics_type_key} from {fold_model_path}: {e}", file=sys.stderr)
                        logger.error(f"ERROR: Failed to load Expert Fold Model {i} for {omics_type_key} from {fold_model_path}: {e}", exc_info=True)
                        # 개별 폴드 모델 로드 실패 시 해당 오믹스 타입의 모델 리스트를 비우고 다음 오믹스로 넘어감
                        current_expert_models = []
                        break # 현재 오믹스 타입의 다른 폴드 모델 로드 중단
                else:
                    print(f"DEBUG_PRINT: CRITICAL_ERROR: Expert Fold Model {i} ({omics_type_key}_lgbm_model_fold_{i}.pkl) NOT FOUND for {omics_type_key} at {os.path.abspath(fold_model_path)}. Expert model prediction will be skipped.", file=sys.stderr)
                    logger.error(f"ERROR: Expert Fold Model {i} ({omics_type_key}_lgbm_model_fold_{i}.pkl) NOT FOUND for {omics_type_key} at {fold_model_path}. Expert model prediction will be skipped.")
                    current_expert_models = []
                    break # 현재 오믹스 타입의 다른 폴드 모델 로드 중단
            
            # 모든 폴드 모델이 성공적으로 로드된 경우에만 OMICS_MODELS에 추가
            if current_expert_models and len(current_expert_models) == 5:
                OMICS_MODELS[omics_type_key] = current_expert_models
            else:
                OMICS_MODELS[omics_type_key] = [] # 로드 실패 시 빈 리스트로 설정하여 스킵되도록
                logger.error(f"ERROR: Not all 5 fold models loaded for {omics_type_key}. Expert prediction for this type will be skipped.")

    except Exception as e: # FileNotFoundError 포함한 모든 최상위 예외
        print(f"DEBUG_PRINT: CRITICAL_ERROR: An unexpected CRITICAL ERROR occurred during model loading process: {e}", file=sys.stderr)
        logger.critical(f"CRITICAL ERROR during model loading process: {e}", exc_info=True)
        _reset_global_models()
        raise


def _reset_global_models(meta_only=False):
    """모델 로드 실패 시 전역 모델 변수들을 초기화합니다."""
    global BINARY_MODELS, BINARY_LABEL_ENCODERS, BINARY_FEATURE_LISTS, \
           META_MODEL, META_LABEL_ENCODER, META_FEATURE_NAMES, OMICS_SCALERS, OMICS_FINAL_IMPUTER, \
           OMICS_MODELS, LABEL_ENCODERS, FEATURE_LISTS
    if not meta_only:
        BINARY_MODELS = {}
        BINARY_LABEL_ENCODERS = {}
        BINARY_FEATURE_LISTS = {}
        OMICS_SCALERS = {} # 여기서 초기화하는 것이 현재로서는 안전
        OMICS_FINAL_IMPUTER = None
        OMICS_MODELS = {}
        LABEL_ENCODERS = {}
        FEATURE_LISTS = {}

    META_MODEL = None
    META_LABEL_ENCODER = None
    META_FEATURE_NAMES = []

# [그래프 추가] 1차 분석: 암 신호 강도 그래프 생성 함수
def _generate_stage1_signal_graph(stage1_results: dict):
    """
    1차 분석 결과를 바탕으로 암 신호 강도 막대그래프를 생성합니다.
    stage1_results: {'cancer_type': {'label': 'Cancer', 'prob': 0.98}, ...} 형태의 딕셔너리
    """
    plt.style.use('seaborn-v0_8-whitegrid')
    
    prob_dict = {name: data['prob'] for name, data in stage1_results.items() if isinstance(data, dict) and 'prob' in data}
    if not prob_dict:
        return None

    sorted_results = sorted(prob_dict.items(), key=lambda item: item[1], reverse=True)
    labels = [item[0].replace('_cancer', '').capitalize() for item in sorted_results]
    probabilities = [item[1] for item in sorted_results]

    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(labels, probabilities, color='skyblue')

    ax.set_ylabel('Cancer Probability')
    ax.set_title('Stage 1: Cancer Signal Strength')
    ax.set_ylim(0, 1.05)
    # [수정] UserWarning을 피하기 위해 tick_params 사용
    ax.tick_params(axis='x', labelrotation=45)

    for bar in bars:
        yval = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2.0, yval + 0.02, f'{yval:.2f}', ha='center', va='bottom')

    plt.tight_layout()
    
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=100)
    plt.close(fig)
    return ContentFile(buf.getvalue())

# [그래프 추가] 2차 분석: 바이오마커 기여도 그래프 생성 함수
def _generate_stage2_feature_importance_graph(model, feature_names):
    """
    2차 분석 모델(메타 모델)의 특성 중요도를 바탕으로 바이오마커 기여도 그래프를 생성합니다.
    """
    if not hasattr(model, 'feature_importances_'):
        logger.warning("The meta model does not have 'feature_importances_'. Skipping feature importance graph.")
        return None

    plt.style.use('seaborn-v0_8-whitegrid')
    
    importances = model.feature_importances_
    if not isinstance(feature_names, (list, np.ndarray)):
        logger.error("Feature names for meta model is not a list. Cannot generate graph.")
        return None

    indices = np.argsort(importances)[-20:]
    top_features = np.array(feature_names)[indices]
    top_importances = importances[indices]

    fig, ax = plt.subplots(figsize=(12, 8))
    ax.barh(top_features, top_importances, color='mediumseagreen')
    ax.set_xlabel('Contribution Score (Feature Importance)')
    ax.set_title('Stage 2: Top 20 Biomarker Contributions')
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=100)
    plt.close(fig)
    return ContentFile(buf.getvalue())


# ==============================================================================
# "모델 1: 암 vs 정상" 파이프라인
# ==============================================================================

def _preprocess_for_binary_model(omics_file, pca_assets_dir):
    """'모델 1'을 위한 단일 오믹스 파일 전처리 (PCA 변환 포함)"""
    internal_key = INTERNAL_OMICS_KEY_MAP.get(omics_file.omics_type)
    file_path = omics_file.input_file.path
    
    filename_key = FILENAME_KEY_MAP.get(internal_key)
    if not filename_key: return pd.DataFrame()

    pca_model_path = os.path.join(pca_assets_dir, f"{filename_key}_pca_model.joblib")
    if not os.path.exists(pca_model_path):
        return pd.DataFrame()

    try:
        processed_df = pd.DataFrame()
        if internal_key == 'gene':
            raw_df = pd.read_csv(file_path, sep='\t', comment='#')
            processed_df = pp_utils.preprocess_long_format(raw_df, 'gene_name', 'tpm_unstranded')
        elif internal_key == 'mirna':
            raw_df = pd.read_csv(file_path, sep='\t')
            processed_df = pp_utils.preprocess_long_format(raw_df, 'miRNA_ID', 'reads_per_million_miRNA_mapped')
        elif internal_key == 'cnv':
            raw_df = pd.read_csv(file_path, sep='\t')
            if GENCODE_GTF_DF is not None:
                processed_df = pp_utils.map_cnv_segments_to_genes(raw_df, GENCODE_GTF_DF)
        elif internal_key == 'mutation':
            raw_df = pd.read_csv(file_path, sep='\t', comment='#')
            processed_df = pp_utils.preprocess_mutation_file(raw_df)
        elif internal_key == 'meth':
            raw_df = pd.read_csv(file_path, sep='\t', header=None, names=['feature', 'value'])
            raw_df['value'] = pd.to_numeric(raw_df['value'], errors='coerce').fillna(0)
            processed_df = raw_df.set_index('feature')['value'].to_frame().T
            processed_df.index = ['single_patient']

        if processed_df.empty: return pd.DataFrame()

        features_path = os.path.join(pca_assets_dir, f"{filename_key}_pre_pca_features.csv")
        pre_pca_features = pd.read_csv(features_path)['feature'].tolist()
        processed_df = processed_df.reindex(columns=pre_pca_features, fill_value=0)
        
        scaler_path = os.path.join(pca_assets_dir, f"{filename_key}_scaler.joblib")
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            processed_df = pd.DataFrame(scaler.transform(processed_df), columns=processed_df.columns, index=processed_df.index)

        imputer_path = os.path.join(pca_assets_dir, f"{filename_key}_pca_imputer.joblib")
        if os.path.exists(imputer_path):
            imputer = joblib.load(imputer_path)
            processed_df = pd.DataFrame(imputer.transform(processed_df), columns=processed_df.columns, index=processed_df.index)

        pca = joblib.load(pca_model_path)
        transformed_values = pca.transform(processed_df)
        pca_cols = [f"{filename_key}_PCA_PC{i+1}" for i in range(pca.n_components_)]
        return pd.DataFrame(transformed_values, columns=pca_cols, index=processed_df.index)

    except Exception as e:
        logger.error(f"'{internal_key}' 바이너리 모델 전처리(PCA 포함) 중 오류: {e}", exc_info=True)
        return pd.DataFrame()

def run_binary_cancer_prediction(omics_request):
    """'모델 1' 전체 파이프라인 실행"""
    patient_id = str(omics_request.id)
    all_binary_predictions = {}
    
    for cancer_type in BINARY_MODELS.keys():
        try:
            model = BINARY_MODELS.get(cancer_type)
            final_features = BINARY_FEATURE_LISTS.get(cancer_type)
            if not model or not final_features:
                all_binary_predictions[cancer_type] = {'label': 'SKIPPED', 'prob': 0.0, 'error': "Model or features not loaded."}
                continue

            pca_assets_dir = os.path.join(settings.BASE_DIR, 'ml_models', cancer_type, 'pca_models_and_features')
            combined_pca_df = pd.DataFrame(index=[patient_id])

            for omics_file in omics_request.data_files.all():
                processed_pca_df = _preprocess_for_binary_model(omics_file, pca_assets_dir)
                if not processed_pca_df.empty:
                    processed_pca_df.index = [patient_id]
                    combined_pca_df = combined_pca_df.merge(processed_pca_df, left_index=True, right_index=True, how='left')
            
            combined_pca_df.fillna(0, inplace=True)
            final_input_df = combined_pca_df.reindex(columns=final_features, fill_value=0.0)
            
            pred_proba = model.predict_proba(final_input_df)[0]
            
            label, prob = ('Cancer', pred_proba[1]) if pred_proba[1] > pred_proba[0] else ('Normal', pred_proba[0])
            logger.info(f"[{omics_request.id}] Binary Model '{cancer_type}' Result: Label='{label}', Probability={prob:.4f}, Proba_vector={pred_proba}")
            all_binary_predictions[cancer_type] = {'label': label, 'prob': float(prob)}

        except Exception as e:
            logger.error(f"'모델 1' {cancer_type} 예측 중 오류: {e}", exc_info=True)
            all_binary_predictions[cancer_type] = {'label': 'ERROR', 'prob': 0.0, 'error': str(e)}

    return all_binary_predictions

# ==============================================================================
# "모델 2: 암종 상세 분류" 파이프라인
# ==============================================================================

def _preprocess_for_expert_model(omics_file):
    """
    [데이터 파싱 강화 버전]
    파일을 처리하기 전, 파일의 내용(컬럼)이 omics_type과 일치하는지 먼저 검증하고,
    쉼표(csv) 또는 탭(tsv)으로 구분된 데이터를 모두 처리할 수 있도록 수정합니다.
    """
    internal_key = INTERNAL_OMICS_KEY_MAP.get(omics_file.omics_type)
    file_path = omics_file.input_file.path
    processed_df = pd.DataFrame()
    request_id = omics_file.request.id

    try:
        # [수정] 쉼표 또는 탭을 구분자로 자동으로 인식하도록 read_csv 수정
        # sep=None, engine='python'을 사용하면 구분자를 자동으로 감지합니다.
        # 만약 데이터가 복잡하면, sep='[,\t]' 정규식을 사용할 수도 있습니다.
        raw_df = pd.read_csv(file_path, sep=None, engine='python', comment='#', on_bad_lines='skip')

        if internal_key == 'gene':
            if 'tpm_unstranded' not in raw_df.columns:
                logger.error(f"[{request_id}] FILE VALIDATION FAILED for 'gene'. File '{os.path.basename(file_path)}' lacks 'tpm_unstranded'. Columns found: {raw_df.columns.tolist()}")
                return pd.DataFrame()
            raw_df['log_tpm'] = np.log2(pd.to_numeric(raw_df['tpm_unstranded'], errors='coerce').fillna(0) + 1)
            processed_df = pp_utils.preprocess_long_format(raw_df, 'gene_name', 'log_tpm')

        elif internal_key == 'mirna':
            if 'reads_per_million_miRNA_mapped' not in raw_df.columns:
                logger.error(f"[{request_id}] FILE VALIDATION FAILED for 'mirna'. File '{os.path.basename(file_path)}' lacks 'reads_per_million_miRNA_mapped'. Columns found: {raw_df.columns.tolist()}")
                return pd.DataFrame()
            raw_df['log_rpm'] = np.log2(pd.to_numeric(raw_df['reads_per_million_miRNA_mapped'], errors='coerce').fillna(0) + 1)
            processed_df = pp_utils.preprocess_long_format(raw_df, 'miRNA_ID', 'log_rpm')
        elif internal_key == 'cnv':
            raw_df = pd.read_csv(file_path, sep='\t')
            if GENCODE_GTF_DF is not None:
                processed_df = pp_utils.map_cnv_segments_to_genes(raw_df, GENCODE_GTF_DF)
        elif internal_key == 'mutation':
            raw_df = pd.read_csv(file_path, sep='\t', comment='#')
            processed_df = pp_utils.preprocess_mutation_file(raw_df)
        elif internal_key == 'meth':
            raw_df = pd.read_csv(file_path, sep='\t', header=None, names=['feature', 'value'])
            raw_df['value'] = pd.to_numeric(raw_df['value'], errors='coerce').fillna(0)
            processed_df = raw_df.set_index('feature')['value'].to_frame().T
            processed_df.index = ['single_patient']
        return processed_df
    except Exception as e:
        logger.error(f"'{internal_key}' 전문가 모델 전처리 중 오류: {e}", exc_info=True)
        return pd.DataFrame()

def run_cancer_type_classification_prediction(omics_request):
    logger.info(f"[{omics_request.id}] --- STAGE 2: Cancer Type Classification START ---")
    
    omics_files = omics_request.data_files.all()
    logger.info(f"[{omics_request.id}] STAGE 2: Successfully fetched {len(omics_files)} files. Starting expert model loop...")
    
    meta_model_input_features = {}
    
    for omics_type, expert_models in OMICS_MODELS.items():
        logger.info(f"[{omics_request.id}] >>>>> Loop Start for omics_type: [{omics_type}] <<<<<")
        
        if not expert_models:
            logger.warning(f"[{omics_request.id}] '{omics_type}' expert models not loaded, skipping.")
            continue
            
        target_file = next((f for f in omics_files if INTERNAL_OMICS_KEY_MAP.get(f.omics_type) == omics_type), None)
        if not target_file:
            logger.warning(f"[{omics_request.id}] '{omics_type}' file not found, skipping.")
            continue

        try:
            logger.info(f"[{omics_request.id}] PRE-PROCESSING START for [{omics_type}]...")
            processed_df = _preprocess_for_expert_model(target_file)
            logger.info(f"[{omics_request.id}] PRE-PROCESSING END for [{omics_type}]. DataFrame is empty: {processed_df.empty}")
            
            if processed_df.empty:
                logger.warning(f"[{omics_request.id}] '{omics_type}' processed data is empty, skipping.")
                continue

            features = FEATURE_LISTS.get(omics_type, [])
            if not features: continue
            
            logger.info(f"[{omics_request.id}] Loaded {len(features)} features for [{omics_type}]. Starting reindex...")
            input_df = processed_df.reindex(columns=features, fill_value=0)
            
            # [수정] 로깅 위치 변경: input_df가 정의된 이후로 이동
            logger.info(f"[{omics_request.id}] Input data shape for {omics_type}: {input_df.shape}")
            
            input_df = input_df.astype(np.float32)

            if omics_type in OMICS_SCALERS and OMICS_SCALERS[omics_type]:
                scaler = OMICS_SCALERS[omics_type]
                input_df = pd.DataFrame(scaler.transform(input_df), columns=input_df.columns, index=input_df.index)

            logger.info(f"[{omics_request.id}] Predicting with {len(expert_models)}-fold models for '{omics_type}'...")
            all_fold_preds = [model.predict_proba(input_df) for model in expert_models]
            avg_pred_proba = np.mean(all_fold_preds, axis=0)[0]

            le = LABEL_ENCODERS.get(omics_type)
            if not le:
                logger.warning(f"[{omics_request.id}] LabelEncoder for {omics_type} not found. Skipping meta feature generation.")
                continue

            for i, class_name in enumerate(le.classes_):
                meta_feature_name = f"pred_{omics_type}_{class_name}"
                meta_model_input_features[meta_feature_name] = avg_pred_proba[i]

        except Exception as e:
            logger.error(f"Error during '{omics_type}' expert model prediction: {e}", exc_info=True)

    if not meta_model_input_features:
        logger.error(f"[{omics_request.id}] No meta model input features collected. Returning failed prediction.")
        return {'predicted_cancer_type': 'Prediction Failed', 'prediction_probabilities': {}, 'biomarkers': []}

    meta_input_df = pd.DataFrame([meta_model_input_features]).reindex(columns=META_FEATURE_NAMES, fill_value=0)

    if OMICS_FINAL_IMPUTER and meta_input_df.isnull().values.any():
        meta_input_df = pd.DataFrame(OMICS_FINAL_IMPUTER.transform(meta_input_df), columns=meta_input_df.columns, index=meta_input_df.index)

    final_pred_proba = META_MODEL.predict_proba(meta_input_df)[0]
    predicted_class_index = np.argmax(final_pred_proba)
    predicted_cancer_type = META_LABEL_ENCODER.inverse_transform([predicted_class_index])[0]
    prediction_probabilities = dict(zip(META_LABEL_ENCODER.classes_, final_pred_proba.tolist()))
    
    biomarkers = []
    if not meta_input_df.empty:
        top_biomarkers = meta_input_df.iloc[0].nlargest(5)
        biomarkers = [{'name': name, 'value': f"{val:.4f}"} for name, val in top_biomarkers.items() if val > 0]

    return {'predicted_cancer_type': predicted_cancer_type, 'prediction_probabilities': prediction_probabilities, 'biomarkers': biomarkers}


# [수정] NameError 수정 및 그래프 저장 로직 통합 버전
def run_sequential_diagnosis_pipeline(omics_request_id, save_to_db=True):
    """
    [UI 표시 텍스트 수정 버전]
    2단계 분석을 모두 실행하여 그래프와 상세 정보를 생성하되,
    '가장 유력한 암 종류'로 표시될 텍스트는 1단계 분석의 최고 확률 암종으로 설정합니다.
    """
    try:
        omics_request = OmicsRequest.objects.get(id=omics_request_id)
        omics_request.status = 'PROCESSING'
        omics_request.save(update_fields=['status'])

        # --- 1단계: 암 vs 정상 분석 ---
        all_binary_predictions = run_binary_cancer_prediction(omics_request)
        stage1_graph_content = _generate_stage1_signal_graph(all_binary_predictions)

        # --- 변수 초기화 ---
        final_predicted_type_for_display = '정상'
        final_prediction_probabilities_from_stage2 = {}
        final_biomarkers_from_stage2 = []
        binary_pred_value_for_db = 0  # 0: 정상, 1: 암
        binary_pred_prob_for_db = 0.0
        stage2_graph_content = None

        # 1단계에서 'Cancer'로 예측된 결과들만 필터링
        cancer_predictions_stage1 = {ct: pred for ct, pred in all_binary_predictions.items() if isinstance(pred, dict) and pred.get('label') == 'Cancer'}

        if cancer_predictions_stage1:
            # --- 1단계 기반으로 최종 표시될 텍스트 결정 ---
            binary_pred_value_for_db = 1
            top_cancer_key_stage1 = max(cancer_predictions_stage1, key=lambda k: cancer_predictions_stage1[k]['prob'])
            binary_pred_prob_for_db = cancer_predictions_stage1[top_cancer_key_stage1]['prob']
            
            # UI에 표시될 암종 이름 설정
            name_map = {
                'ovarian_cancer': 'OV', 'breast_cancer': 'BRCA', 'stomach_cancer': 'STAD',
                'kidney_cancer': 'KIRC', 'lung_cancer': 'LUSC', 'liver_cancer': 'LIHC'
            }
            final_predicted_type_for_display = name_map.get(top_cancer_key_stage1, top_cancer_key_stage1.upper())
            logger.info(f"[{omics_request_id}] Stage 1 Top Result (for UI display): {final_predicted_type_for_display} with probability {binary_pred_prob_for_db:.4f}")

            # --- 2단계 분석 실행 (그래프, 바이오마커, 상세 확률 정보 생성 목적) ---
            logger.info(f"[{omics_request_id}] Running Stage 2 for graph and detailed data generation.")
            classification_result_stage2 = run_cancer_type_classification_prediction(omics_request)
            final_prediction_probabilities_from_stage2 = classification_result_stage2.get('prediction_probabilities', {})
            final_biomarkers_from_stage2 = classification_result_stage2.get('biomarkers', [])
            
            # 2단계 그래프 생성
            if META_MODEL and META_FEATURE_NAMES:
                stage2_graph_content = _generate_stage2_feature_importance_graph(META_MODEL, META_FEATURE_NAMES)
            
            logger.info(f"[{omics_request_id}] Stage 2 analysis completed. Meta-model prediction was '{classification_result_stage2.get('predicted_cancer_type', 'Unknown')}'")

        else:
            logger.info(f"[{omics_request_id}] No cancer signal from Stage 1. Final decision: Normal.")
            if META_LABEL_ENCODER:
                final_prediction_probabilities_from_stage2 = {cls: 0.0 for cls in META_LABEL_ENCODER.classes_}

        # --- DB 저장 ---
        if save_to_db:
            result_obj, created = OmicsResult.objects.update_or_create(
                request=omics_request,
                defaults={
                    'binary_cancer_prediction': binary_pred_value_for_db,
                    'binary_cancer_probability': float(binary_pred_prob_for_db),
                    'predicted_cancer_type_name': final_predicted_type_for_display,  # [핵심] UI 표시용 이름은 1단계 결과 사용
                    'all_cancer_type_probabilities': final_prediction_probabilities_from_stage2, # 상세 확률은 2단계 결과 저장 (참고용)
                    'biomarkers': final_biomarkers_from_stage2, # 바이오마커는 2단계 결과 저장
                }
            )
            
            if stage1_graph_content:
                result_obj.stage1_signal_graph.save(f'stage1_signal_{omics_request_id}.png', stage1_graph_content, save=False)
            
            if stage2_graph_content:
                result_obj.shap_graph.save(f'stage2_biomarker_{omics_request_id}.png', stage2_graph_content, save=False)
            else:
                if result_obj.shap_graph:
                    result_obj.shap_graph.delete(save=False)
            
            result_obj.save()

            omics_request.status = 'COMPLETED'
            omics_request.error_message = None
            omics_request.save(update_fields=['status', 'error_message'])
            logger.info(f"Hybrid prediction (UI: Stage 1, Data: Stage 2) COMPLETED for OmicsRequest ID: {omics_request_id}.")

    except Exception as e:
        logger.critical(f"Critical error in hybrid pipeline (Request ID: {omics_request_id}): {e}", exc_info=True)
        try:
            req_to_fail = OmicsRequest.objects.get(id=omics_request_id)
            req_to_fail.status = 'FAILED'
            req_to_fail.error_message = f"하이브리드 파이프라인 실행 중 심각한 오류 발생: {str(e)}"
            req_to_fail.save(update_fields=['status', 'error_message'])
        except OmicsRequest.DoesNotExist:
            logger.error(f"Failed to update status for non-existent OmicsRequest ID: {omics_request_id}")
