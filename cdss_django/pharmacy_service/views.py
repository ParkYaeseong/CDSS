import requests
import time
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import json

@api_view(['GET'])
@permission_classes([AllowAny])
def search_pharmacies(request):
    max_retries = 2
    timeout_duration = 30
    
    for attempt in range(max_retries):
        try:
            # 파라미터 가져오기
            sido_name = request.GET.get('sidoCd', '')
            sggu_name = request.GET.get('sgguCd', '')
            yadm_nm = request.GET.get('yadmNm', '')
            
            print(f"약국 검색 시도 {attempt + 1}/{max_retries}")
            print(f"입력값 - sido: {sido_name}, yadmNm: {yadm_nm}")
            
            # ✅ 시도명을 시도코드로 변환
            sido_code_map = {
                '서울특별시': '110000',
                '부산광역시': '260000',
                '대구광역시': '270000',
                '인천광역시': '280000',
                '광주광역시': '290000',
                '대전광역시': '300000',
                '울산광역시': '310000',
                '세종특별자치시': '360000',
                '경기도': '410000',
                '강원도': '420000',
                '충청북도': '430000',
                '충청남도': '440000',
                '전라북도': '450000',
                '전라남도': '460000',
                '경상북도': '470000',
                '경상남도': '480000',
                '제주특별자치도': '490000'
            }
            
            sido_code = sido_code_map.get(sido_name, '110000')
            print(f"변환된 시도코드: {sido_name} → {sido_code}")
            
            # ✅ 올바른 정부 API 파라미터 구성
            base_url = "http://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList"
            
            params = {
                'serviceKey': settings.PHARMACY_API_KEY,
                'Q0': sido_code,        # ✅ 시도코드 사용
                'pageNo': '1',
                'numOfRows': '50',
                '_type': 'json'
            }
            
            # ✅ 약국명이 있으면 QN 파라미터 추가
            if yadm_nm and yadm_nm.strip():
                params['QN'] = yadm_nm.strip()
                print(f"약국명 검색 추가: QN={yadm_nm}")
            
            print(f"정부 API 요청 파라미터: {params}")
            
            # API 호출
            start_time = time.time()
            response = requests.get(
                base_url, 
                params=params, 
                timeout=timeout_duration,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Connection': 'keep-alive'
                }
            )
            
            end_time = time.time()
            print(f"API 호출 완료: {end_time - start_time:.2f}초")
            print(f"응답 상태코드: {response.status_code}")
            print(f"응답 내용 샘플: {response.text[:300]}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # ✅ 응답 구조 확인 및 파싱
                    all_pharmacies = []
                    total_count = 0
                    
                    if 'response' in data and 'body' in data['response']:
                        body = data['response']['body']
                        total_count = int(body.get('totalCount', 0))
                        
                        if 'items' in body and body['items']:
                            items = body['items']
                            if isinstance(items, dict) and 'item' in items:
                                all_pharmacies = items['item']
                                if not isinstance(all_pharmacies, list):
                                    all_pharmacies = [all_pharmacies]
                            elif isinstance(items, list):
                                all_pharmacies = items
                    
                    print(f"API에서 받은 약국 수: {len(all_pharmacies)}")
                    
                    # ✅ 클라이언트 측 필터링
                    filtered_pharmacies = []
                    
                    if yadm_nm and yadm_nm.strip():
                        search_term = yadm_nm.strip().lower()
                        print(f"필터링 검색어: '{search_term}'")
                        
                        for pharmacy in all_pharmacies:
                            pharmacy_name = pharmacy.get('yadmNm', '').lower()
                            
                            if search_term in pharmacy_name:
                                filtered_pharmacies.append(pharmacy)
                                print(f"매칭: '{search_term}' in '{pharmacy_name}'")
                        
                        pharmacies = filtered_pharmacies
                        print(f"필터링 결과: {len(all_pharmacies)}개 → {len(pharmacies)}개")
                        
                        # 필터링 결과가 없으면 부분 검색 시도
                        if len(pharmacies) == 0 and len(yadm_nm) > 1:
                            partial_search = yadm_nm[:2].lower()
                            print(f"부분 검색 시도: '{partial_search}'")
                            
                            for pharmacy in all_pharmacies:
                                pharmacy_name = pharmacy.get('yadmNm', '').lower()
                                if partial_search in pharmacy_name:
                                    filtered_pharmacies.append(pharmacy)
                            
                            pharmacies = filtered_pharmacies
                            print(f"부분 검색 결과: {len(pharmacies)}개")
                    else:
                        pharmacies = all_pharmacies
                    
                    return Response({
                        'pharmacies': pharmacies,
                        'total_count': len(pharmacies),
                        'original_count': total_count,
                        'message': f'총 {len(pharmacies)}개의 약국을 찾았습니다.' if len(pharmacies) > 0 else '검색 결과가 없습니다.',
                        'api_response_time': f"{end_time - start_time:.2f}초",
                        'filtered': yadm_nm is not None and yadm_nm.strip() != '',
                        'debug_info': {
                            'input_sido': sido_name,
                            'input_yadmNm': yadm_nm,
                            'api_sido_code': sido_code,
                            'api_params': params
                        }
                    })
                    
                except json.JSONDecodeError as e:
                    print(f"JSON 파싱 에러: {e}")
                    print(f"응답 내용: {response.text}")
            else:
                print(f"API 호출 실패: {response.status_code}")
                print(f"응답 내용: {response.text}")
                    
        except requests.exceptions.Timeout:
            print(f"타임아웃 발생 (시도 {attempt + 1})")
        except Exception as e:
            print(f"에러 발생 (시도 {attempt + 1}): {str(e)}")
        
        # 재시도 전 대기
        if attempt < max_retries - 1:
            time.sleep(2)
    
    # 모든 시도 실패
    return Response({
        'pharmacies': [],
        'total_count': 0,
        'error': 'API 호출 실패'
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_sido_codes(request):
    """시도 코드 조회"""
    sido_codes = {
        '110000': '서울특별시',
        '260000': '부산광역시',
        '270000': '대구광역시',
        '280000': '인천광역시',
        '290000': '광주광역시',
        '300000': '대전광역시',
        '310000': '울산광역시',
        '360000': '세종특별자치시',
        '410000': '경기도',
        '420000': '강원도',
        '430000': '충청북도',
        '440000': '충청남도',
        '450000': '전라북도',
        '460000': '전라남도',
        '470000': '경상북도',
        '480000': '경상남도',
        '490000': '제주특별자치도'
    }
    
    return Response({'sido_codes': sido_codes})

@api_view(['GET'])
@permission_classes([AllowAny])
def get_sigungu_codes(request, sido_code):
    """시군구 코드 조회"""
    if sido_code == '110000':  # 서울특별시
        sigungu_codes = {
            '110010': '종로구',
            '110020': '중구',
            '110030': '용산구',
            '110040': '성동구',
            '110050': '광진구',
            '110060': '동대문구',
            '110070': '중랑구',
            '110080': '성북구',
            '110090': '강북구',
            '110100': '도봉구',
            '110110': '노원구',
            '110120': '은평구',
            '110130': '서대문구',
            '110140': '마포구',
            '110150': '양천구',
            '110160': '강서구',
            '110170': '구로구',
            '110180': '금천구',
            '110190': '영등포구',
            '110200': '동작구',
            '110210': '관악구',
            '110220': '서초구',
            '110230': '강남구',
            '110240': '송파구',
            '110250': '강동구'
        }
    elif sido_code == '300000':  # 대전광역시
        sigungu_codes = {
            '300010': '동구',
            '300020': '중구',
            '300030': '서구',
            '300040': '유성구',
            '300050': '대덕구'
        }
    else:
        sigungu_codes = {}
    
    return Response({'sigungu_codes': sigungu_codes})

@api_view(['GET'])
@permission_classes([AllowAny])
def get_pharmacy_detail(request, pharmacy_id):
    """약국 상세 정보 조회"""
    try:
        print(f"약국 상세 정보 조회: pharmacy_id={pharmacy_id}")
        
        # 실제 API 호출로 상세 정보 가져오기
        base_url = "http://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList"
        
        params = {
            'serviceKey': settings.PHARMACY_API_KEY,
            'ykiho': pharmacy_id,
            'pageNo': '1',
            'numOfRows': '1',
            '_type': 'json'
        }
        
        response = requests.get(base_url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'response' in data and 'body' in data['response']:
                body = data['response']['body']
                if 'items' in body and body['items']:
                    items = body['items']
                    if isinstance(items, dict) and 'item' in items:
                        pharmacy_detail = items['item']
                        if isinstance(pharmacy_detail, list):
                            pharmacy_detail = pharmacy_detail[0]
                        return Response(pharmacy_detail)
        
        return Response({
            'error': '상세 정보를 가져올 수 없습니다.',
            'pharmacy_id': pharmacy_id
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'error': f'약국 상세 정보 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def find_nearby_pharmacies(request):
    """근처 약국 찾기"""
    try:
        lat = request.GET.get('lat')
        lng = request.GET.get('lng')
        radius = request.GET.get('radius', '3000')
        
        print(f"근처 약국 검색: lat={lat}, lng={lng}, radius={radius}")
        
        # 좌표 기반 검색은 별도 API가 필요하므로 일반 검색으로 대체
        return search_pharmacies(request)
        
    except Exception as e:
        return Response({
            'nearby_pharmacies': [],
            'error': f'근처 약국 검색 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def find_24hour_pharmacies(request):
    """24시간 약국 찾기"""
    try:
        sido_cd = request.GET.get('sidoCd', '110000')
        
        print(f"24시간 약국 검색: sido_cd={sido_cd}")
        
        # 24시간 약국 전용 API 호출
        base_url = "http://apis.data.go.kr/B551182/pharmacyInfoService/getParmacyBasisList"
        
        params = {
            'serviceKey': settings.PHARMACY_API_KEY,
            'sidoCd': sido_cd,
            'pageNo': '1',
            'numOfRows': '100',
            '_type': 'json'
        }
        
        response = requests.get(base_url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            # 24시간 운영 약국 필터링
            all_pharmacies = []
            if 'response' in data and 'body' in data['response']:
                body = data['response']['body']
                if 'items' in body and body['items']:
                    items = body['items']
                    if isinstance(items, dict) and 'item' in items:
                        all_pharmacies = items['item']
                        if not isinstance(all_pharmacies, list):
                            all_pharmacies = [all_pharmacies]
            
            # 24시간 약국 필터링 (운영시간 기반)
            night_pharmacies = []
            for pharmacy in all_pharmacies:
                # 24시간 운영 여부 확인 (실제 API 응답에 따라 조정 필요)
                open_hm = pharmacy.get('openHm', '')
                close_hm = pharmacy.get('closeHm', '')
                if open_hm == '0000' and close_hm == '2400':
                    night_pharmacies.append(pharmacy)
            
            return Response({
                'night_pharmacies': night_pharmacies,
                'total_count': len(night_pharmacies),
                'message': f'24시간 운영 약국 {len(night_pharmacies)}개를 찾았습니다.'
            })
        
        return Response({
            'night_pharmacies': [],
            'total_count': 0,
            'error': 'API 호출 실패'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        return Response({
            'night_pharmacies': [],
            'error': f'24시간 약국 검색 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
