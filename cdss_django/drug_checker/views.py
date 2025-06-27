# drug_checker/views.py (최종 전체 버전)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import Prescription
from .serializers import PrescriptionSerializer
from .services import check_interactions_for_list
from .clients import DURClient
import logging

logger = logging.getLogger(__name__)

class DrugInteractionCheckAPIView(APIView):
    permission_classes = [AllowAny]  # 인증 없이 접근 허용

    def post(self, request, *args, **kwargs):
        drug_list = request.data.get('drugs', [])

        # 프론트엔드 유효성 검사에 맞춰 1개 이상일 때만 처리
        if not isinstance(drug_list, list) or not drug_list:
            return Response(
                {"error": "drugs 필드에 최소 1개 이상의 약물 목록을 배열 형태로 보내야 합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- 분기 처리 로직 ---
        # CASE 1: 단일 약물에 대한 모든 병용금기 정보 조회
        if len(drug_list) == 1:
            drug_name = drug_list[0]
            client = DURClient()
            contra_items = client.get_contraindications(drug_name)

            if contra_items:
                # API 결과가 있을 경우, 프론트엔드 형식에 맞게 가공
                processed_results = []
                for item_wrapper in contra_items:
                    # API 응답 구조가 {'item': {...}} 형태로 중첩되어 있으므로 처리
                    item = item_wrapper.get('item', {})
                    processed_results.append({
                        "ingredient_name": item.get('MIXTURE_INGR_KOR_NAME', '알 수 없음'),
                        "reason": item.get('PROHBT_CONTENT', '상세 정보 없음')
                    })
                
                response_data = {
                    "drug_name": drug_name,
                    "total_count": len(processed_results),
                    "contraindicated_with": processed_results
                }
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                # API 결과가 없을 경우, 프론트엔드가 기다리는 404 에러와 메시지 반환
                return Response(
                    {"message": f"'{drug_name}'에 대한 병용금기 정보가 없습니다."},
                    status=status.HTTP_404_NOT_FOUND
                )

        # CASE 2: 다중 약물 간 상호작용 검사
        else: # len(drug_list) >= 2
            result = check_interactions_for_list(drug_list)
            return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def drug_search_view(request):
    query = request.GET.get('q', '')
    limit = int(request.GET.get('limit', 20))
    
    print(f"🔍 약물 검색 요청: query='{query}', limit={limit}")
    
    if len(query) < 1:
        return Response([])
    
    try:
        client = DURClient()
        results = client.get_contraindications(query)
        
        print(f"📊 DUR API 결과: {len(results)}개")
        
        formatted_results = []
        seen_codes = set()
        
        for i, item_wrapper in enumerate(results[:limit]):
            item = item_wrapper.get('item', {})
            
            # 실제 API 응답 구조에 맞게 필드명 수정
            code = item.get('INGR_CODE', '') or item.get('MIXTURE_INGR_CODE', '')
            name = item.get('INGR_KOR_NAME', '') or item.get('MIXTURE_INGR_KOR_NAME', '')
            
            print(f"📋 {i+1}번째 아이템: code='{code}', name='{name}'")
            
            if name and code not in seen_codes:  # name이 있고 중복이 아니면 추가
                formatted_results.append({
                    'code': code or f'TEMP_{i}',
                    'name': name,
                    'ingredient': item.get('INGR_ENG_NAME', '') or item.get('MIXTURE_INGR_ENG_NAME', ''),
                    'company': item.get('ENTP_NAME', ''),  # 이 필드는 없을 수 있음
                    'dosage': item.get('DOSAGE_FORM_NAME', ''),
                    'unit': '정'
                })
                seen_codes.add(code)
        
        # 검색어로 시작하는 것들을 우선순위로 정렬
        formatted_results.sort(key=lambda x: (
            not x['name'].lower().startswith(query.lower()),
            x['name']
        ))
        
        print(f"✅ 최종 결과: {len(formatted_results)}개")
        
        return Response(formatted_results)
        
    except Exception as e:
        print(f"❌ 검색 오류: {e}")
        logger.error(f"Drug search error for {query}: {e}")
        return Response([], status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([AllowAny])  # 인증 없이 접근 허용
def drug_list_view(request):
    """전체 약물 목록 조회 API (선택사항)"""
    try:
        # 자주 사용되는 약물들 (실제로는 DB에서 가져와야 함)
        common_drugs = [
            {
                'code': '653003300',
                'name': '파마염산수도에페드린정 60mg',
                'ingredient': 'pseudoephedrine hydrochloride',
                'company': '한국파마',
                'dosage': '60mg',
                'unit': '정'
            },
            {
                'code': '643900710',
                'name': '슈다페드정 60mg',
                'ingredient': 'pseudoephedrine hydrochloride',
                'company': '삼일제약',
                'dosage': '60mg',
                'unit': '정'
            },
            {
                'code': '645700880',
                'name': '세토펜정 80mg',
                'ingredient': 'acetaminophen',
                'company': '한국파마',
                'dosage': '80mg',
                'unit': '정'
            },
            {
                'code': '648801230',
                'name': '아스피린정 100mg',
                'ingredient': 'aspirin',
                'company': '바이엘코리아',
                'dosage': '100mg',
                'unit': '정'
            },
            {
                'code': '649902140',
                'name': '와파린정 5mg',
                'ingredient': 'warfarin sodium',
                'company': '대웅제약',
                'dosage': '5mg',
                'unit': '정'
            }
        ]
        
        return Response(common_drugs)
        
    except Exception as e:
        logger.error(f"Drug list error: {e}")
        return Response([], status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PrescriptionSaveAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = PrescriptionSerializer(data=request.data)
        if serializer.is_valid():
            prescription = serializer.save()
            return Response({
                'id': prescription.id,
                'message': '처방이 성공적으로 저장되었습니다.',
                'timestamp': prescription.timestamp
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PrescriptionListAPIView(APIView):
    def get(self, request, *args, **kwargs):
        patient_id = request.query_params.get('patient_id')
        if patient_id:
            prescriptions = Prescription.objects.filter(patient_id=patient_id)
        else:
            prescriptions = Prescription.objects.all()
        
        serializer = PrescriptionSerializer(prescriptions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)