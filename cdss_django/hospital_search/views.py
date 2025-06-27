# cdss_django/hospital_search/views.py
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
def search_hospitals(request):
    max_retries = 2
    timeout_duration = 30
    
    for attempt in range(max_retries):
        try:
            # 파라미터 가져오기
            sido = request.GET.get('Q0', '서울특별시')
            sigungu = request.GET.get('Q1', '')
            institution_type = request.GET.get('QZ', '')
            department = request.GET.get('QD', '')
            hospital_name = request.GET.get('QN', '')
            
            print(f"병원 검색 시도 {attempt + 1}/{max_retries}")
            print(f"Q0: {sido}, Q1: {sigungu}, QZ: {institution_type}, QD: {department}, QN: {hospital_name}")
            print(f"API 키 확인: {settings.HOSPITAL_API_KEY[:20]}...")
            
            # 실제 공공 API 호출
            base_url = "http://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire"
            
            params = {
                'serviceKey': settings.HOSPITAL_API_KEY,  # 디코딩된 키 사용
                'Q0': sido,
                'pageNo': '1',
                'numOfRows': '50',
                '_type': 'json'
            }
            
            # 선택적 파라미터 추가
            if sigungu and sigungu.strip():
                params['Q1'] = sigungu.strip()
            if institution_type and institution_type.strip():
                params['QZ'] = institution_type.strip()
            if department and department.strip():
                params['QD'] = department.strip()
            if hospital_name and hospital_name.strip():
                params['QN'] = hospital_name.strip()
            
            print(f"실제 API 호출 URL: {base_url}")
            print(f"API 파라미터: {params}")
            
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
            print(f"API 응답 상태코드: {response.status_code}")
            print(f"API 응답 크기: {len(response.text)} bytes")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"JSON 파싱 성공")
                    
                    # 실제 API 응답 구조 파싱
                    hospitals = []
                    total_count = 0
                    
                    if 'response' in data:
                        response_data = data['response']
                        print(f"response 키 존재: {list(response_data.keys())}")
                        
                        if 'header' in response_data:
                            header = response_data['header']
                            result_code = header.get('resultCode', '')
                            result_msg = header.get('resultMsg', '')
                            print(f"API 결과 코드: {result_code}, 메시지: {result_msg}")
                            
                            # API 에러 체크
                            if result_code != '00':
                                print(f"API 에러 발생: {result_code} - {result_msg}")
                                return Response({
                                    'hospitals': [],
                                    'error': f'공공 API 에러: {result_code} - {result_msg}',
                                    'total_count': 0,
                                    'api_source': 'real_api_error'
                                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                        
                        if 'body' in response_data:
                            body = response_data['body']
                            total_count = int(body.get('totalCount', 0))
                            print(f"총 병원 수: {total_count}")
                            
                            if 'items' in body and body['items']:
                                items = body['items']
                                if isinstance(items, dict) and 'item' in items:
                                    hospitals = items['item']
                                    if not isinstance(hospitals, list):
                                        hospitals = [hospitals]
                                elif isinstance(items, list):
                                    hospitals = items
                                    
                                print(f"파싱된 병원 수: {len(hospitals)}")
                                if hospitals:
                                    print(f"첫 번째 병원: {hospitals[0].get('dutyName', 'Unknown')}")
                            else:
                                print("items가 비어있거나 없음")
                    
                    return Response({
                        'hospitals': hospitals,
                        'total_count': total_count,
                        'message': f'실제 공공 API에서 총 {total_count}개의 병원을 찾았습니다.',
                        'api_response_time': f"{end_time - start_time:.2f}초",
                        'api_source': 'real_government_api',  # 실제 API 표시
                        'success': True
                    })
                    
                except json.JSONDecodeError as e:
                    print(f"JSON 파싱 에러: {e}")
                    print(f"응답 내용: {response.text[:500]}")
                    if attempt == max_retries - 1:
                        return Response({
                            'hospitals': [],
                            'error': 'API 응답 JSON 파싱 실패',
                            'raw_response': response.text[:200],
                            'api_source': 'real_api_parse_error'
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                print(f"API 호출 실패: {response.status_code}")
                print(f"에러 응답: {response.text}")
                if attempt == max_retries - 1:
                    return Response({
                        'hospitals': [],
                        'error': f'공공 API 호출 실패: {response.status_code}',
                        'error_response': response.text[:200],
                        'api_source': 'real_api_http_error'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
        except requests.exceptions.Timeout:
            print(f"타임아웃 발생 (시도 {attempt + 1})")
            if attempt == max_retries - 1:
                return Response({
                    'hospitals': [],
                    'error': f'공공 API 호출 시간 초과 ({timeout_duration}초)',
                    'api_source': 'real_api_timeout'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"에러 발생 (시도 {attempt + 1}): {str(e)}")
            if attempt == max_retries - 1:
                return Response({
                    'hospitals': [],
                    'error': f'서버 오류: {str(e)}',
                    'api_source': 'real_api_server_error'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 재시도 전 대기
        if attempt < max_retries - 1:
            print(f"재시도 대기 중...")
            time.sleep(2)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_department_codes(request):
    """진료과목 코드 조회"""
    department_codes = {
        '01': '내과',
        '02': '신경과',
        '03': '정신건강의학과',
        '04': '외과',
        '05': '정형외과',
        '06': '신경외과',
        '07': '흉부외과',
        '08': '성형외과',
        '09': '마취통증의학과',
        '10': '산부인과',
        '11': '소아청소년과',
        '12': '안과',
        '13': '이비인후과',
        '14': '피부과',
        '15': '비뇨의학과',
        '16': '영상의학과',
        '17': '방사선종양학과',
        '18': '병리과',
        '19': '진단검사의학과',
        '20': '결핵과',
        '21': '재활의학과',
        '22': '예방의학과',
        '23': '가정의학과',
        '24': '응급의학과',
        '25': '핵의학과',
        '26': '치과',
        '27': '한의과'
    }
    
    return Response({'department_codes': department_codes})

@api_view(['GET'])
@permission_classes([AllowAny])
def get_hospital_detail(request, hospital_id):
    """병원 상세 정보 조회"""
    try:
        print(f"병원 상세 정보 조회: hospital_id={hospital_id}")
        
        # 실제 API 호출로 상세 정보 가져오기
        base_url = "http://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire"
        
        params = {
            'serviceKey': settings.HOSPITAL_API_KEY,
            'ykiho': hospital_id,
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
                        hospital_detail = items['item']
                        if isinstance(hospital_detail, list):
                            hospital_detail = hospital_detail[0]
                        return Response(hospital_detail)
        
        return Response({
            'error': '상세 정보를 가져올 수 없습니다.',
            'hospital_id': hospital_id
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'error': f'병원 상세 정보 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)