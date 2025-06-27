# debug_prediction.py
import joblib
import pandas as pd
import numpy as np
import time

print("--- 예측 디버깅 스크립트 시작 ---")

try:
    # 1. 실제 사용할 모델 중 하나만 로드 (gene, fold 1)
    #    경로는 서버의 실제 경로로 정확하게 수정해야 합니다.
    MODEL_PATH = '/home/rsa-key-20250604/cdss_django/ml_models/cancer_type_classification/Gene_pkl/gene_lgbm_model_fold_1.pkl'
    print(f"모델 로드 시도: {MODEL_PATH}")
    model = joblib.load(MODEL_PATH)
    print("모델 로드 성공.")

    # 2. 실제 사용할 특징 리스트 로드
    FEATURES_PATH = '/home/rsa-key-20250604/cdss_django/ml_models/cancer_type_classification/gene_features.txt'
    print(f"특징 리스트 로드 시도: {FEATURES_PATH}")
    with open(FEATURES_PATH, 'r') as f:
        features = [line.strip() for line in f]
    print(f"{len(features)}개 특징 로드 성공.")

    # 3. 모델 예측에 사용할 가상 데이터 생성 (실제 데이터와 동일한 형태)
    print("가상 입력 데이터 생성 중...")
    # (1, 60660) 형태의 DataFrame 생성
    dummy_data = np.random.rand(1, len(features))
    input_df = pd.DataFrame(dummy_data, columns=features)
    print(f"데이터 생성 완료. Shape: {input_df.shape}")

    # 4. 예측 실행 및 시간 측정
    print("\n>>> model.predict_proba() 실행 시작...")
    start_time = time.time()
    
    # 바로 이 부분에서 멈추는지 확인하는 것이 핵심
    probabilities = model.predict_proba(input_df)
    
    end_time = time.time()
    print(f">>> model.predict_proba() 실행 완료! (소요 시간: {end_time - start_time:.2f}초)")
    print(f"예측 결과 (일부): {probabilities[0][:5]}")

    print("\n--- 스크립트 정상 종료 ---")

except Exception as e:
    print(f"\n!!! 스크립트 실행 중 오류 발생: {e}")
    import traceback
    traceback.print_exc()