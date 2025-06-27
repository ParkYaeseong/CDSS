# clinical_prediction/services/liver_cancer_data_service.py
from patients.models import PatientProfile, LiverCancerClinicalData
from datetime import date
import logging

logger = logging.getLogger(__name__)

class LiverCancerDataService:
    """Django DB에서 간암 임상 데이터를 조회하는 서비스"""
    
    # OpenEMR 필드명 → AI 모델 필드명 매핑
    OPENEMR_FIELD_MAPPING = {
        'pharm_tx_type': 'treatments_pharmaceutical_treatment_type',
        'pharm_tx_therapy': 'treatments_pharmaceutical_treatment_or_therapy',
        'pharm_tx_intent': 'treatments_pharmaceutical_treatment_intent_type',
        'radiation_tx_type': 'treatments_radiation_treatment_type',
        'radiation_tx_therapy': 'treatments_radiation_treatment_or_therapy',
        'radiation_tx_intent': 'treatments_radiation_treatment_intent_type'
    }
    
    def get_patient_clinical_data(self, patient_id=None, patient_name=None):
        """환자의 간암 임상 데이터를 Django DB에서 조회"""
        try:
            # 1. 환자 정보 조회
            patient = self._get_patient(patient_id, patient_name)
            if not patient:
                raise ValueError("환자를 찾을 수 없습니다.")
            
            # 2. 최신 간암 임상 데이터 조회
            clinical_data = self._get_latest_clinical_data(patient)
            if not clinical_data:
                raise ValueError("간암 임상 데이터를 찾을 수 없습니다.")
            
            # 3. 예측 모델용 형식으로 변환
            return self._transform_to_prediction_format(clinical_data, patient)
            
        except Exception as e:
            logger.error(f"임상 데이터 조회 오류: {e}")
            raise
    
    def _get_patient(self, patient_id, patient_name):
        """환자 조회"""
        try:
            if patient_id:
                return PatientProfile.objects.get(openemr_id=str(patient_id))
            elif patient_name:
                name_parts = patient_name.strip().split()
                if len(name_parts) >= 2:
                    return PatientProfile.objects.get(
                        first_name=name_parts[1], 
                        last_name=name_parts[0]
                    )
        except PatientProfile.DoesNotExist:
            return None
    
    def _get_latest_clinical_data(self, patient):
        """최신 간암 임상 데이터 조회"""
        try:
            return LiverCancerClinicalData.objects.filter(
                patient=patient
            ).order_by('-form_date').first()
        except Exception as e:
            logger.error(f"간암 임상 데이터 조회 오류: {e}")
            return None
    
    def _transform_to_prediction_format(self, clinical_data, patient):
        """Django 모델 데이터를 예측 모델용 형식으로 변환"""
        
        # 환자 기본 정보
        prediction_data = {
            'patient_name': patient.name,
            'openemr_id': patient.openemr_id,
            'age_at_diagnosis': clinical_data.age_at_diagnosis or self._calculate_age(patient.date_of_birth),
            'gender': patient.gender.lower() if patient.gender else 'unknown',
            'race': 'asian',
            'ethnicity': 'not hispanic or latino'
        }
        
        # 임상 데이터 매핑 (OpenEMR 약자 필드 우선 사용)
        clinical_mapping = {
            # 진단 관련
            'primary_diagnosis': clinical_data.primary_diagnosis,
            'ajcc_pathologic_stage': clinical_data.cancer_stage or 'Unknown',
            'ajcc_pathologic_t': clinical_data.ajcc_pathologic_t or 'Unknown',
            'ajcc_pathologic_n': clinical_data.ajcc_pathologic_n,
            'ajcc_pathologic_m': clinical_data.ajcc_pathologic_m,
            'tumor_grade': clinical_data.tumor_grade or 'Unknown',
            'classification_of_tumor': 'Primary',
            'year_of_diagnosis': clinical_data.year_of_diagnosis,
            
            # 간기능 관련
            'child_pugh_classification': clinical_data.child_pugh_classification or 'Unknown',
            'ishak_fibrosis_score': clinical_data.fibrosis_score or 'None',
            
            # 치료 관련 - OpenEMR 약자 필드 우선 사용, fallback으로 기존 필드 사용
            'treatments_pharmaceutical_treatment_type': (
                clinical_data.pharm_tx_type or 
                clinical_data.chemotherapy_type or 
                'Unknown'
            ),
            'treatments_pharmaceutical_treatment_or_therapy': (
                self._convert_to_yes_no(clinical_data.pharm_tx_therapy) or
                ('yes' if clinical_data.received_chemotherapy else 'no')
            ),
            'treatments_pharmaceutical_treatment_intent_type': (
                clinical_data.pharm_tx_intent or 
                clinical_data.treatment_intent or 
                'Unknown'
            ),
            'treatments_radiation_treatment_type': (
                clinical_data.radiation_tx_type or 
                clinical_data.radiation_type
            ),
            'treatments_radiation_treatment_intent_type': (
                clinical_data.radiation_tx_intent or 
                clinical_data.radiation_intent
            ),
            'treatments_radiation_treatment_or_therapy': (
                self._convert_to_yes_no(clinical_data.radiation_tx_therapy) or
                ('yes' if clinical_data.received_radiation else 'no')
            ),
            
            # 병력 관련 (AI 모델 컬럼명에 맞게 수정)
            'prior_treatment': 'Yes' if clinical_data.prior_treatment else 'No',
            'prior_malignancy': 'yes' if clinical_data.prior_cancer else 'no',
            'synchronous_malignancy': 'Yes' if clinical_data.synchronous_cancer else 'No',
            
            # 수술 관련 (AI 모델 컬럼명에 맞게 수정)
            'tissue_or_organ_of_origin': 'Liver',
            'site_of_resection_or_biopsy': clinical_data.biopsy_site,
            'residual_disease': clinical_data.residual_disease,
            'morphology': clinical_data.morphology_code,  # Django 필드명 → AI 모델 컬럼명
            
            # 생존 관련 (AI 모델 컬럼명에 맞게 수정)
            'vital_status': clinical_data.vital_status,
            'days_to_death': clinical_data.days_to_death,
            'days_to_last_follow_up': clinical_data.follow_up_days  # Django 필드명 → AI 모델 컬럼명
        }
        
        prediction_data.update(clinical_mapping)
        
        logger.info(f"변환된 임상 데이터: {prediction_data}")
        return prediction_data
    
    def _convert_to_yes_no(self, value):
        """OpenEMR 약자 필드 값을 yes/no로 변환"""
        if not value:
            return None
        value_str = str(value).lower()
        if value_str in ['y', 'yes', '1', 'true']:
            return 'yes'
        elif value_str in ['n', 'no', '0', 'false']:
            return 'no'
        return None
    
    def _calculate_age(self, birth_date):
        """나이 계산"""
        if not birth_date:
            return 50
        try:
            today = date.today()
            return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        except:
            return 50
    
    def get_field_mapping_info(self):
        """필드 매핑 정보 반환 (디버깅용)"""
        return {
            'openemr_to_ai_mapping': self.OPENEMR_FIELD_MAPPING,
            'django_to_ai_mapping': {
                'morphology_code': 'morphology',
                'synchronous_cancer': 'synchronous_malignancy',
                'follow_up_days': 'days_to_last_follow_up'
            }
        }
    
    def validate_clinical_data(self, clinical_data):
        """임상 데이터 유효성 검사"""
        required_fields = ['year_of_diagnosis', 'child_pugh_classification']
        missing_fields = []
        
        for field in required_fields:
            if not getattr(clinical_data, field, None):
                missing_fields.append(field)
        
        if missing_fields:
            logger.warning(f"누락된 필수 필드: {missing_fields}")
            
        return len(missing_fields) == 0, missing_fields
