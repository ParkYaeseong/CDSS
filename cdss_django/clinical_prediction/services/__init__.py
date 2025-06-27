"""
임상 예측 서비스 모듈

이 모듈은 간암, 신장암, 위암에 대한 생존 예측, 위험도 분류, 치료 효과 예측을 제공합니다.
"""

from .prediction_service import prediction_service

__all__ = ['prediction_service']
