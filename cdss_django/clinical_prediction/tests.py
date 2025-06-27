from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock
import json
from .models import ClinicalPredictionResult, PredictionModelInfo
from .services.prediction_service import prediction_service

class ClinicalPredictionTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # 테스트용 모델 정보 생성
        PredictionModelInfo.objects.create(
            cancer_type='liver',
            prediction_type='survival',
            model_name='Test Liver Survival Model',
            model_file='test_model.pkl',
            version='1.0',
            accuracy=0.85,
            is_active=True
        )
    
    def test_predict_survival_endpoint(self):
        """생존 예측 엔드포인트 테스트"""
        with patch.object(prediction_service, 'predict_survival') as mock_predict:
            mock_predict.return_value = {
                'patient_id': 'TEST001',
                'patient_name': '테스트환자',
                'cancer_type': 'liver',
                'prediction_type': 'survival',
                'survival_probabilities': {
                    '1_year': 0.85,
                    '3_year': 0.70,
                    '5_year': 0.55
                },
                'confidence': 0.87
            }
            
            response = self.client.post(
                reverse('clinical_prediction:predict_survival'),
                data=json.dumps({
                    'patient_id': 'TEST001',
                    'patient_name': '테스트환자'
                }),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertTrue(data['success'])
            self.assertIn('survival_probabilities', data['data'])
    
    def test_predict_risk_classification_endpoint(self):
        """위험도 분류 예측 엔드포인트 테스트"""
        with patch.object(prediction_service, 'predict_risk_classification') as mock_predict:
            mock_predict.return_value = {
                'patient_id': 'TEST001',
                'patient_name': '테스트환자',
                'cancer_type': 'liver',
                'prediction_type': 'risk_classification',
                'predicted_risk_class': 'High Risk',
                'confidence': 0.82
            }
            
            response = self.client.post(
                reverse('clinical_prediction:predict_risk_classification'),
                data=json.dumps({
                    'patient_id': 'TEST001'
                }),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertTrue(data['success'])
            self.assertEqual(data['data']['predicted_risk_class'], 'High Risk')
    
    def test_predict_treatment_effect_endpoint(self):
        """치료 효과 예측 엔드포인트 테스트"""
        with patch.object(prediction_service, 'predict_treatment_effect') as mock_predict:
            mock_predict.return_value = {
                'patient_id': 'TEST001',
                'patient_name': '테스트환자',
                'cancer_type': 'liver',
                'prediction_type': 'treatment_effect',
                'recommended_treatment': {
                    'primary': '수술',
                    'effectiveness': 75.5
                }
            }
            
            response = self.client.post(
                reverse('clinical_prediction:predict_treatment_effect'),
                data=json.dumps({
                    'patient_name': '테스트환자'
                }),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertTrue(data['success'])
            self.assertIn('recommended_treatment', data['data'])
    
    def test_predict_all_endpoint(self):
        """통합 예측 엔드포인트 테스트"""
        with patch.object(prediction_service, 'predict_survival') as mock_survival, \
             patch.object(prediction_service, 'predict_risk_classification') as mock_risk, \
             patch.object(prediction_service, 'predict_treatment_effect') as mock_treatment:
            
            mock_survival.return_value = {'prediction_type': 'survival'}
            mock_risk.return_value = {'prediction_type': 'risk'}
            mock_treatment.return_value = {'prediction_type': 'treatment'}
            
            response = self.client.post(
                reverse('clinical_prediction:predict_all'),
                data=json.dumps({
                    'patient_id': 'TEST001'
                }),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            self.assertTrue(data['success'])
            self.assertIn('survival', data['data'])
            self.assertIn('risk_classification', data['data'])
            self.assertIn('treatment_effect', data['data'])
    
    def test_get_supported_cancer_types(self):
        """지원 암종 목록 조회 테스트"""
        response = self.client.get(reverse('clinical_prediction:supported_cancer_types'))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertIn('supported_cancer_types', data['data'])
        self.assertIn('liver', data['data']['supported_cancer_types'])
    
    def test_invalid_request_data(self):
        """잘못된 요청 데이터 테스트"""
        response = self.client.post(
            reverse('clinical_prediction:predict_survival'),
            data=json.dumps({}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn('error', data)
    
    def test_model_creation(self):
        """모델 생성 테스트"""
        result = ClinicalPredictionResult.objects.create(
            patient_id='TEST001',
            patient_name='테스트환자',
            cancer_type='liver',
            prediction_type='survival',
            prediction_result={'test': 'data'},
            confidence_score=0.85
        )
        
        self.assertEqual(result.patient_id, 'TEST001')
        self.assertEqual(result.cancer_type, 'liver')
        self.assertTrue(result.prediction_result)


class PredictionServiceTestCase(TestCase):
    def setUp(self):
        self.service = prediction_service
    
    @patch('clinical_prediction.services.prediction_service.apps.get_model')
    def test_get_patient_clinical_data(self, mock_get_model):
        """환자 임상 데이터 조회 테스트"""
        mock_clinical_data = MagicMock()
        mock_clinical_data.patient_id = 'TEST001'
        mock_clinical_data.cancer_type = '간암 (LIHC)'
        
        mock_model = MagicMock()
        mock_model.objects.filter.return_value.first.return_value = mock_clinical_data
        mock_get_model.return_value = mock_model
        
        result = self.service._get_patient_clinical_data(patient_id='TEST001')
        self.assertEqual(result.patient_id, 'TEST001')
    
    def test_determine_cancer_type(self):
        """암종 판별 테스트"""
        mock_clinical_data = MagicMock()
        mock_clinical_data.cancer_type = '간암 (LIHC)'
        
        cancer_type = self.service._determine_cancer_type(mock_clinical_data)
        self.assertEqual(cancer_type, 'liver')
        
        mock_clinical_data.cancer_type = '신장암 (KIRC)'
        cancer_type = self.service._determine_cancer_type(mock_clinical_data)
        self.assertEqual(cancer_type, 'kidney')
        
        mock_clinical_data.cancer_type = '위암 (STAD)'
        cancer_type = self.service._determine_cancer_type(mock_clinical_data)
        self.assertEqual(cancer_type, 'stomach')
