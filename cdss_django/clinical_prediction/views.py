from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .services import prediction_service
import logging
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from patients.models import PatientProfile, LiverCancerClinicalData
from omics.models import OmicsResult
from diagnosis.models import DiagnosisResult
from ai_chatbot.bot_service import generate_text_from_prompt

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

class ComprehensiveReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id, format=None):
        try:
            patient = PatientProfile.objects.get(id=patient_id)
            
            # 1. 각 분석 결과의 최신 데이터를 가져옵니다.
            latest_omics_result = OmicsResult.objects.filter(request__patient_id=patient_id, request__status='COMPLETED').order_by('-last_updated').first()
            
            # [수정] 'last_updated'를 'updated_at'으로 변경합니다.
            latest_ct_result = DiagnosisResult.objects.filter(request__patient_id=patient_id, request__status='COMPLETED').order_by('-updated_at').first()
            
            latest_clinical_data = LiverCancerClinicalData.objects.filter(patient_id=patient_id).order_by('-created_at').first()

            # 2. Gemini AI에게 전달할 프롬프트를 생성합니다.
            prompt = self.create_prompt(patient, latest_omics_result, latest_ct_result, latest_clinical_data)
            
            if prompt is None:
                return Response({"report": "보고서 생성을 위한 분석 데이터(CT, 오믹스, 임상)가 부족합니다."}, status=status.HTTP_404_NOT_FOUND)

            # 3. AI로부터 보고서를 받아옵니다.
            ai_response = generate_text_from_prompt(prompt)

            if '오류:' in ai_response:
                 return Response({"report": ai_response}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({"report": ai_response})

        except PatientProfile.DoesNotExist:
            return Response({"error": "환자를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # 오류 메시지를 더 명확하게 반환하도록 수정
            return Response({"error": f"보고서 생성 중 오류 발생: {type(e).__name__} - {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create_prompt(self, patient, omics, ct, clinical):
        # 이 함수의 내용은 이전과 동일합니다.
        data_parts = []
        prompt_header = f"""
        당신은 환자의 복잡한 의료 데이터를 분석하여 의사에게 제출할 종합 소견서를 작성하는 전문 의료 AI입니다. 
        아래 제공된 CT 영상 분석, 다중 오믹스 분석, 임상 데이터를 바탕으로, 각 항목을 체계적으로 기술하고 최종적으로 명확한 요약 결론을 제시해주세요. 
        의학적 근거에 기반하여 논리적이고 전문적인 어조로 작성해야 합니다. Markdown 형식을 사용하여 가독성을 높여주세요. (예: **제목**, - 항목)

        # 환자 정보
        - 환자 ID: {patient.id}
        """
        if ct:
            ct_info = """
            # CT 영상 분석 결과
            - 분석 상태: 완료
            - 소견: 시스템에서 3D 시각화 데이터 및 장기/종양 분할이 성공적으로 완료되었습니다.
            """
            data_parts.append(ct_info)
        if omics:
            omics_info = f"""
            # 다중 오믹스 분석 결과
            - 1차 암 여부 예측: **{'암(Cancer)' if omics.binary_cancer_prediction == 1 else '정상(Normal)'}** (암일 확률: {omics.binary_cancer_probability:.2%})
            - 2차 암종 식별: **{omics.predicted_cancer_type_name}**
            - 주요 바이오마커 기여도 (JSON 형식): {json.dumps(omics.biomarkers, indent=2, ensure_ascii=False)}
            """
            data_parts.append(omics_info)
        if clinical:
            clinical_info = f"""
            # 주요 임상 데이터 (간암)
            - 나이: {clinical.age}세
            - 성별: {clinical.get_gender_display()}
            - Child-Pugh 등급: Class {clinical.child_pugh_class}
            - AFP 수치: {clinical.afp} ng/mL
            - AST 수치: {clinical.ast} U/L
            - ALT 수치: {clinical.alt} U/L
            - 혈소판 수: {clinical.platelet_count} /μL
            """
            data_parts.append(clinical_info)
        if not data_parts:
            return None
        prompt_footer = "\n---\n## 종합 소견 및 요약\n위 정보를 바탕으로 상세한 종합 소견 및 요약 보고서를 작성해주세요."
        return prompt_header + "".join(data_parts) + prompt_footer