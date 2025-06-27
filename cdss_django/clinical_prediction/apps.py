from django.apps import AppConfig

class ClinicalPredictionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'clinical_prediction'
    verbose_name = '임상 예측 분석'
    
    def ready(self):
        """앱 초기화 시 모델 로드"""
        try:
            from .services.prediction_service import prediction_service
            # 모델 로드 확인
            if prediction_service.models:
                print("임상 예측 모델이 성공적으로 로드되었습니다.")
        except Exception as e:
            print(f"임상 예측 모델 로드 실패: {e}")
