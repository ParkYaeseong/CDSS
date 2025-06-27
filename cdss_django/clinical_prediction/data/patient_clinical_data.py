# clinical_prediction/data/patient_clinical_data.py
import pandas as pd

# 실제 PatientProfile UUID를 키로 사용하여 임상 데이터 매핑
PATIENT_CLINICAL_DATA = {
    # Jane Doe (OpenEMR ID: 2)
    "ed0a7175-c699-49a3-9880-955153f9fb4e": {
        "openemr_id": 2,
        "patient_name": "Jane Doe",
        # 생존 결과 변수
        "vital_status": "Alive",
        "days_to_death": None,
        "days_to_last_follow_up": 1200,
        # 인구학적 변수
        "age_at_diagnosis": 45,
        "gender": "female",
        "race": "white",
        "ethnicity": "not hispanic or latino",
        # 종양 병기
        "ajcc_pathologic_stage": "Stage I",
        "ajcc_pathologic_t": "T1",
        "ajcc_pathologic_n": "N0",
        "ajcc_pathologic_m": "M0",
        # 간암 특이적 지표
        "child_pugh_classification": "A",
        "ishak_fibrosis_score": 2,
        # 종양 특성
        "tumor_grade": "G1",
        "primary_diagnosis": "Hepatocellular carcinoma, NOS",
        "tissue_or_organ_of_origin": "Liver",
        "site_of_resection_or_biopsy": "Liver",
        "morphology": "8170/3",  # 위험도 분류용 추가
        # 질병 진행
        "residual_disease": "R0",
        "classification_of_tumor": "Primary",
        # 과거력
        "prior_malignancy": "no",
        "synchronous_malignancy": "No",
        "prior_treatment": "No",
        # 치료 관련
        "treatments_pharmaceutical_treatment_type": "Chemotherapy",
        "treatments_pharmaceutical_treatment_or_therapy": "yes",
        "treatments_pharmaceutical_treatment_intent_type": "Treatment",
        "treatments_radiation_treatment_type": None,
        "treatments_radiation_treatment_or_therapy": "no",
        "treatments_radiation_treatment_intent_type": None,
        # 시간 관련
        "year_of_diagnosis": 2022
    },
    
    # Park Yeaseng (OpenEMR ID: 3)
    "86820416-b4d6-4302-9dfd-6352ac422fa2": {
        "openemr_id": 3,
        "patient_name": "Park Yeaseng",
        "vital_status": "Alive",
        "days_to_death": None,
        "days_to_last_follow_up": 900,
        "age_at_diagnosis": 58,
        "gender": "male",
        "race": "asian",
        "ethnicity": "not hispanic or latino",
        "ajcc_pathologic_stage": "Stage II",
        "ajcc_pathologic_t": "T2",
        "ajcc_pathologic_n": "N0",
        "ajcc_pathologic_m": "M0",
        "child_pugh_classification": "A",
        "ishak_fibrosis_score": 3,
        "tumor_grade": "G2",
        "primary_diagnosis": "Hepatocellular carcinoma, NOS",
        "tissue_or_organ_of_origin": "Liver",
        "site_of_resection_or_biopsy": "Liver",
        "morphology": "8170/3",
        "residual_disease": "R0",
        "classification_of_tumor": "Primary",
        "prior_malignancy": "no",
        "synchronous_malignancy": "No",
        "prior_treatment": "No",
        "treatments_pharmaceutical_treatment_type": "Chemotherapy",
        "treatments_pharmaceutical_treatment_or_therapy": "yes",
        "treatments_pharmaceutical_treatment_intent_type": "Treatment",
        "treatments_radiation_treatment_type": None,
        "treatments_radiation_treatment_or_therapy": "no",
        "treatments_radiation_treatment_intent_type": None,
        "year_of_diagnosis": 2021
    },
    
    # 강 경화 (OpenEMR ID: 4) - 주요 예측 대상 환자
    "0fe66661-247e-47ba-ba6f-60d04b28f128": {
        "openemr_id": 4,
        "patient_name": "강 경화",
        "vital_status": "Alive",
        "days_to_death": None,
        "days_to_last_follow_up": 211.0,
        "age_at_diagnosis": 20157.0,
        "gender": "female",
        "race": "asian",
        "ethnicity": "not hispanic or latino",
        "ajcc_pathologic_stage": "Stage II",
        "ajcc_pathologic_t": "T2",
        "ajcc_pathologic_n": "N0",
        "ajcc_pathologic_m": "M0",
        "child_pugh_classification": "Unknown",
        "ishak_fibrosis_score": "None",
        "tumor_grade": "G2",
        "primary_diagnosis": "Hepatocellular carcinoma, NOS",
        "tissue_or_organ_of_origin": "Liver",
        "site_of_resection_or_biopsy": "Liver",
        "morphology": "8170/3",
        "residual_disease": "R0",
        "classification_of_tumor": "Primary",
        "prior_malignancy": "no",
        "synchronous_malignancy": "No",
        "prior_treatment": "No",
        "treatments_pharmaceutical_treatment_type": "Pharmaceutical Therapy, NOS",
        "treatments_pharmaceutical_treatment_or_therapy": "unknown",
        "treatments_pharmaceutical_treatment_intent_type": "Adjuvant",
        "treatments_radiation_treatment_type": "Radiation Therapy, NOS",
        "treatments_radiation_treatment_or_therapy": "unknown",
        "treatments_radiation_treatment_intent_type": "Adjuvant",
        "year_of_diagnosis": 2013.0
    },
    
    # 김 이박 (OpenEMR ID: 1)
    "9cc12984-5a3d-4e39-8435-46ddd69d4be7": {
        "openemr_id": 1,
        "patient_name": "김 이박",
        "vital_status": "Alive",
        "days_to_death": None,
        "days_to_last_follow_up": 800,
        "age_at_diagnosis": 58,
        "gender": "male",
        "race": "asian",
        "ethnicity": "not hispanic or latino",
        "ajcc_pathologic_stage": "Stage I",
        "ajcc_pathologic_t": "T1",
        "ajcc_pathologic_n": "N0",
        "ajcc_pathologic_m": "M0",
        "child_pugh_classification": "A",
        "ishak_fibrosis_score": 2,
        "tumor_grade": "G1",
        "primary_diagnosis": "Hepatocellular carcinoma, NOS",
        "tissue_or_organ_of_origin": "Liver",
        "site_of_resection_or_biopsy": "Liver",
        "morphology": "8170/3",
        "residual_disease": "R0",
        "classification_of_tumor": "Primary",
        "prior_malignancy": "no",
        "synchronous_malignancy": "No",
        "prior_treatment": "No",
        "treatments_pharmaceutical_treatment_type": "Chemotherapy",
        "treatments_pharmaceutical_treatment_or_therapy": "yes",
        "treatments_pharmaceutical_treatment_intent_type": "Treatment",
        "treatments_radiation_treatment_type": None,
        "treatments_radiation_treatment_or_therapy": "no",
        "treatments_radiation_treatment_intent_type": None,
        "year_of_diagnosis": 2022
    }
}

def get_patient_clinical_data_by_uuid(patient_uuid):
    """PatientProfile UUID로 임상 데이터 반환"""
    return PATIENT_CLINICAL_DATA.get(str(patient_uuid), None)

def get_patient_clinical_data_by_name(patient_name):
    """환자 이름으로 임상 데이터 반환"""
    for uuid, data in PATIENT_CLINICAL_DATA.items():
        if data.get('patient_name') == patient_name:
            return data
    return None

def prepare_prediction_data_for_survival(patient_id=None, patient_name=None):
    """생존율 예측을 위한 데이터 전처리"""
    print(f"생존율 예측 - 요청된 환자: ID={patient_id}, 이름={patient_name}")
    
    if patient_id:
        data = get_patient_clinical_data_by_uuid(patient_id)
    elif patient_name:
        data = get_patient_clinical_data_by_name(patient_name)
    else:
        return None
    
    if not data:
        print(f"환자 데이터를 찾을 수 없습니다: ID={patient_id}, 이름={patient_name}")
        return None
    
    # 생존율 예측에 필요한 29개 컬럼
    survival_prediction_columns = [
        # 생존 결과 변수
        'vital_status', 'days_to_death', 'days_to_last_follow_up',
        # 인구학적 변수
        'age_at_diagnosis', 'gender', 'race', 'ethnicity',
        # 종양 병기
        'ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m',
        # 간암 특이적 지표
        'child_pugh_classification', 'ishak_fibrosis_score',
        # 종양 특성
        'tumor_grade', 'primary_diagnosis', 'tissue_or_organ_of_origin', 'site_of_resection_or_biopsy',
        # 질병 진행
        'residual_disease', 'classification_of_tumor',
        # 과거력
        'prior_malignancy', 'synchronous_malignancy', 'prior_treatment',
        # 치료 관련
        'treatments_pharmaceutical_treatment_type', 'treatments_pharmaceutical_treatment_or_therapy',
        'treatments_pharmaceutical_treatment_intent_type',
        'treatments_radiation_treatment_type', 'treatments_radiation_treatment_or_therapy',
        'treatments_radiation_treatment_intent_type',
        # 시간 관련
        'year_of_diagnosis'
    ]
    
    # 생존율 예측용 데이터만 추출
    prediction_data = {col: data.get(col) for col in survival_prediction_columns}
    
    # DataFrame으로 변환
    df = pd.DataFrame([prediction_data])
    
    return df

def prepare_prediction_data_for_risk(patient_id=None, patient_name=None):
    """암 위험도 분류를 위한 데이터 전처리"""
    print(f"위험도 분류 - 요청된 환자: ID={patient_id}, 이름={patient_name}")
    
    if patient_id:
        data = get_patient_clinical_data_by_uuid(patient_id)
    elif patient_name:
        data = get_patient_clinical_data_by_name(patient_name)
    else:
        return None
    
    if not data:
        print(f"환자 데이터를 찾을 수 없습니다: ID={patient_id}, 이름={patient_name}")
        return None
    
    # 암 위험도 분류에 필요한 16개 컬럼
    risk_classification_columns = [
        # 생존 결과 변수
        'vital_status', 'days_to_death', 'days_to_last_follow_up',
        # 간기능 평가 (가장 중요)
        'child_pugh_classification', 'ishak_fibrosis_score',
        # 종양 특성 및 병기
        'ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m',
        'tumor_grade', 'morphology',
        # 환자 기본 특성
        'age_at_diagnosis', 'gender', 'race', 'ethnicity',
        # 치료 이력
        'prior_treatment', 'prior_malignancy', 'synchronous_malignancy',
        # 핵심 변수들
        'residual_disease', 'classification_of_tumor', 'primary_diagnosis', 'year_of_diagnosis'
    ]
    
    # 위험도 분류용 데이터만 추출
    prediction_data = {col: data.get(col) for col in risk_classification_columns}
    
    # DataFrame으로 변환
    df = pd.DataFrame([prediction_data])
    
    return df

# 하위 호환성을 위한 기본 함수 (생존율 예측용)
def prepare_prediction_data(patient_id=None, patient_name=None):
    """기본 예측 데이터 준비 (생존율 예측용)"""
    return prepare_prediction_data_for_survival(patient_id=patient_id, patient_name=patient_name)

def prepare_prediction_data_for_treatment(patient_id=None, patient_name=None):
    """치료 효과 예측을 위한 데이터 전처리"""
    print(f"치료 효과 예측 - 요청된 환자: ID={patient_id}, 이름={patient_name}")
    
    if patient_id:
        data = get_patient_clinical_data_by_uuid(patient_id)
    elif patient_name:
        data = get_patient_clinical_data_by_name(patient_name)
    else:
        return None
    
    if not data:
        print(f"환자 데이터를 찾을 수 없습니다: ID={patient_id}, 이름={patient_name}")
        return None
    
    # 치료 효과 예측에 사용되는 정확한 컬럼들 (사용자 제공 목록과 일치)
    treatment_prediction_columns = [
        # 생존 결과 변수
        'vital_status', 'days_to_death', 'days_to_last_follow_up',
        # 간기능 평가 (핵심 예측 인자)
        'child_pugh_classification', 'ishak_fibrosis_score',
        # 병기 및 종양 특성
        'ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m',
        'tumor_grade', 'morphology',
        # 환자 기본 특성
        'age_at_diagnosis', 'gender', 'race', 'ethnicity',
        # 치료 관련 변수
        'treatments_pharmaceutical_treatment_intent_type', 
        'treatments_pharmaceutical_treatment_type',
        'prior_treatment',
        # 추가 임상 변수
        'primary_diagnosis', 'year_of_diagnosis'
    ]
    
    # 치료 효과 예측용 데이터만 추출
    prediction_data = {col: data.get(col) for col in treatment_prediction_columns}
    
    # DataFrame으로 변환
    df = pd.DataFrame([prediction_data])
    
    return df
