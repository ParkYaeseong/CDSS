# cdss_django/emergency_service/views.py
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
def search_emergency_hospitals(request):
    max_retries = 2
    timeout_duration = 30
    
    for attempt in range(max_retries):
        try:
            # 파라미터 가져오기
            stage1 = request.GET.get('STAGE1', '서울특별시')
            stage2 = request.GET.get('STAGE2', '')
            
            print(f"응급실 검색 시도 {attempt + 1}/{max_retries}")
            print(f"STAGE1: {stage1}, STAGE2: {stage2}")
            print(f"API 키 확인: {settings.EMERGENCY_API_KEY[:20]}...")
            
            # 올바른 응급실 목록 API URL 사용
            base_url = "http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytListInfoInqire"
            
            params = {
                'serviceKey': settings.EMERGENCY_API_KEY,
                'Q0': stage1,  # STAGE1 대신 Q0 사용
                'pageNo': '1',
                'numOfRows': '50',
                '_type': 'json'
            }
            
            # 선택적 파라미터 추가
            if stage2 and stage2.strip():
                params['Q1'] = stage2.strip()  # STAGE2 대신 Q1 사용
            
            print(f"수정된 API 호출 URL: {base_url}")
            print(f"수정된 API 파라미터: {params}")
            
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
                    emergency_hospitals = []
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
                                    'emergency_hospitals': [],
                                    'error': f'공공 API 에러: {result_code} - {result_msg}',
                                    'total_count': 0,
                                    'api_source': 'real_api_error'
                                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                        
                        if 'body' in response_data:
                            body = response_data['body']
                            total_count = int(body.get('totalCount', 0))
                            print(f"총 응급실 수: {total_count}")
                            
                            if 'items' in body and body['items']:
                                items = body['items']
                                if isinstance(items, dict) and 'item' in items:
                                    emergency_hospitals = items['item']
                                    if not isinstance(emergency_hospitals, list):
                                        emergency_hospitals = [emergency_hospitals]
                                elif isinstance(items, list):
                                    emergency_hospitals = items
                                    
                                print(f"파싱된 응급실 수: {len(emergency_hospitals)}")
                                if emergency_hospitals:
                                    print(f"첫 번째 응급실: {emergency_hospitals[0].get('dutyName', 'Unknown')}")
                            else:
                                print("items가 비어있거나 없음")
                    
                    return Response({
                        'emergency_hospitals': emergency_hospitals,
                        'total_count': total_count,
                        'message': f'실제 공공 API에서 총 {total_count}개의 응급실을 찾았습니다.',
                        'api_response_time': f"{end_time - start_time:.2f}초",
                        'api_source': 'real_government_api',
                        'success': True
                    })
                    
                except json.JSONDecodeError as e:
                    print(f"JSON 파싱 에러: {e}")
                    print(f"응답 내용: {response.text[:500]}")
                    if attempt == max_retries - 1:
                        return Response({
                            'emergency_hospitals': [],
                            'error': 'API 응답 JSON 파싱 실패',
                            'raw_response': response.text[:200],
                            'api_source': 'real_api_parse_error'
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                print(f"API 호출 실패: {response.status_code}")
                print(f"에러 응답: {response.text}")
                if attempt == max_retries - 1:
                    return Response({
                        'emergency_hospitals': [],
                        'error': f'공공 API 호출 실패: {response.status_code}',
                        'error_response': response.text[:200],
                        'api_source': 'real_api_http_error'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
        except requests.exceptions.Timeout:
            print(f"타임아웃 발생 (시도 {attempt + 1})")
            if attempt == max_retries - 1:
                return Response({
                    'emergency_hospitals': [],
                    'error': f'공공 API 호출 시간 초과 ({timeout_duration}초)',
                    'api_source': 'real_api_timeout'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"에러 발생 (시도 {attempt + 1}): {str(e)}")
            if attempt == max_retries - 1:
                return Response({
                    'emergency_hospitals': [],
                    'error': f'서버 오류: {str(e)}',
                    'api_source': 'real_api_server_error'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 재시도 전 대기
        if attempt < max_retries - 1:
            print(f"재시도 대기 중...")
            time.sleep(2)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_emergency_realtime_info(request, hospital_id):
    """응급실 실시간 정보 조회"""
    try:
        print(f"실시간 정보 조회 요청: hospital_id={hospital_id}")
        
        # 실시간 정보 API 호출 (이건 기존 URL 사용)
        base_url = "http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulnessInqire"
        
        params = {
            'serviceKey': settings.EMERGENCY_API_KEY,
            'HPID': hospital_id,
            'pageNo': '1',
            'numOfRows': '1',
            '_type': 'json'
        }
        
        response = requests.get(base_url, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'response' in data and 'body' in data['response']:
                body = data['response']['body']
                if 'items' in body and body['items']:
                    items = body['items']
                    if isinstance(items, dict) and 'item' in items:
                        realtime_info = items['item']
                        if isinstance(realtime_info, list):
                            realtime_info = realtime_info[0]
                        return Response(realtime_info)
        
        return Response({
            'error': '실시간 정보를 가져올 수 없습니다.',
            'hospital_id': hospital_id
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'error': f'실시간 정보 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_emergency_statistics(request):
    """응급실 통계 정보 조회"""
    try:
        print("응급실 통계 조회 요청")
        
        stats_data = {
            'total_emergency_hospitals': 150,
            'available_hospitals': 120,
            'busy_hospitals': 25,
            'full_hospitals': 5,
            'last_updated': '2025-06-13T11:30:00Z'
        }
        
        return Response(stats_data)
        
    except Exception as e:
        return Response({
            'error': f'응급실 통계 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def find_nearby_emergency_hospitals(request):
    """근처 응급실 찾기"""
    try:
        lat = request.GET.get('lat')
        lng = request.GET.get('lng')
        radius = request.GET.get('radius', '10')
        
        print(f"근처 응급실 검색: lat={lat}, lng={lng}, radius={radius}")
        
        # 일반 검색으로 대체
        return search_emergency_hospitals(request)
        
    except Exception as e:
        return Response({
            'nearby_emergency_hospitals': [],
            'error': f'근처 응급실 검색 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_emergency_detail(request, hospital_id):
    """응급실 상세 정보 조회"""
    try:
        print(f"응급실 상세 정보 조회: hospital_id={hospital_id}")
        
        # 상세 정보 API 호출
        base_url = "http://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytListInfoInqire"
        
        params = {
            'serviceKey': settings.EMERGENCY_API_KEY,
            'HPID': hospital_id,
            'pageNo': '1',
            'numOfRows': '1',
            '_type': 'json'
        }
        
        response = requests.get(base_url, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'response' in data and 'body' in data['response']:
                body = data['response']['body']
                if 'items' in body and body['items']:
                    items = body['items']
                    if isinstance(items, dict) and 'item' in items:
                        detail_info = items['item']
                        if isinstance(detail_info, list):
                            detail_info = detail_info[0]
                        return Response(detail_info)
        
        return Response({
            'error': '상세 정보를 가져올 수 없습니다.',
            'hospital_id': hospital_id
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return Response({
            'error': f'응급실 상세 정보 조회 실패: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)