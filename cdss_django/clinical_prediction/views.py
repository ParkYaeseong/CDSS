from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .services.prediction_service import prediction_service
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def predict_survival(request):
    try:
        data = json.loads(request.body)
        patient_id = data.get('patient_id')
        patient_name = data.get('patient_name')
        
        if not patient_id and not patient_name:
            return JsonResponse({'error': '환자 ID 또는 이름이 필요합니다.'}, status=400)
        
        # 예측 수행
        result = prediction_service.predict_survival(
            patient_id=patient_id, 
            patient_name=patient_name
        )
        
        return JsonResponse({
            'success': True,
            'data': result
        })
        
    except ValueError as e:
        logger.error(f"생존 예측 오류: {str(e)}")
        return JsonResponse({'error': str(e)}, status=404)
    except Exception as e:
        logger.error(f"생존 예측 시스템 오류: {str(e)}")
        return JsonResponse({'error': f'예측 중 오류 발생: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def predict_risk_classification(request):
    try:
        data = json.loads(request.body)
        patient_id = data.get('patient_id')
        patient_name = data.get('patient_name')
        
        if not patient_id and not patient_name:
            return JsonResponse({'error': '환자 ID 또는 이름이 필요합니다.'}, status=400)
        
        # 위험도 분류 예측 수행
        result = prediction_service.predict_risk_classification(
            patient_id=patient_id, 
            patient_name=patient_name
        )
        
        return JsonResponse({
            'success': True,
            'data': result
        })
        
    except ValueError as e:
        logger.error(f"위험도 분류 예측 오류: {str(e)}")
        return JsonResponse({'error': str(e)}, status=404)
    except Exception as e:
        logger.error(f"위험도 분류 예측 시스템 오류: {str(e)}")
        return JsonResponse({'error': f'위험도 분류 예측 중 오류 발생: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def predict_treatment_effect(request):
    try:
        data = json.loads(request.body)
        patient_id = data.get('patient_id')
        patient_name = data.get('patient_name')
        
        if not patient_id and not patient_name:
            return JsonResponse({'error': '환자 ID 또는 이름이 필요합니다.'}, status=400)
        
        # 치료 효과 예측 수행
        result = prediction_service.predict_treatment_effect(
            patient_id=patient_id, 
            patient_name=patient_name
        )
        
        return JsonResponse({
            'success': True,
            'data': result
        })
        
    except ValueError as e:
        logger.error(f"치료 효과 예측 오류: {str(e)}")
        return JsonResponse({'error': str(e)}, status=404)
    except Exception as e:
        logger.error(f"치료 효과 예측 시스템 오류: {str(e)}")
        return JsonResponse({'error': f'치료 효과 예측 중 오류 발생: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_supported_cancer_types(request):
    """지원되는 암종 목록 반환"""
    cancer_types = {
        'liver': '간암 (LIHC)',
        'kidney': '신장암 (KIRC)', 
        'stomach': '위암 (STAD)'
    }
    
    return JsonResponse({
        'success': True,
        'data': {
            'supported_cancer_types': cancer_types,
            'available_predictions': ['survival', 'risk_classification', 'treatment_effect']
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def predict_all(request):
    """모든 예측을 한번에 수행"""
    try:
        data = json.loads(request.body)
        patient_id = data.get('patient_id')
        patient_name = data.get('patient_name')
        
        if not patient_id and not patient_name:
            return JsonResponse({'error': '환자 ID 또는 이름이 필요합니다.'}, status=400)
        
        results = {}
        
        # 생존 예측
        try:
            results['survival'] = prediction_service.predict_survival(
                patient_id=patient_id, patient_name=patient_name
            )
        except Exception as e:
            results['survival'] = {'error': str(e)}
        
        # 위험도 분류 예측
        try:
            results['risk_classification'] = prediction_service.predict_risk_classification(
                patient_id=patient_id, patient_name=patient_name
            )
        except Exception as e:
            results['risk_classification'] = {'error': str(e)}
        
        # 치료 효과 예측
        try:
            results['treatment_effect'] = prediction_service.predict_treatment_effect(
                patient_id=patient_id, patient_name=patient_name
            )
        except Exception as e:
            results['treatment_effect'] = {'error': str(e)}
        
        return JsonResponse({
            'success': True,
            'data': results
        })
        
    except Exception as e:
        logger.error(f"통합 예측 시스템 오류: {str(e)}")
        return JsonResponse({'error': f'통합 예측 중 오류 발생: {str(e)}'}, status=500)
