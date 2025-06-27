# core_api/middleware.py
import logging
import json
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    """요청마다 로고와 상세 디버깅 정보를 출력하는 미들웨어"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 요청 시작 시간
        start_time = time.time()
        
        # 🎨 로고와 요청 정보 출력
        self.print_request_logo_and_info(request)
        
        # 실제 뷰 처리
        response = self.get_response(request)
        
        # 처리 시간 계산
        process_time = time.time() - start_time
        
        # 🎨 응답 정보 출력
        self.print_response_info(request, response, process_time)
        
        return response
    
    def print_request_logo_and_info(self, request):
        """요청마다 로고와 상세 정보 출력"""
        
        # 🎨 컬러풀한 로고
        logo = """"""
        print(logo)
        print("\033[92m" + "="*80 + "\033[0m")
        print(f"\033[96m🚀 새로운 요청 처리 시작! {time.strftime('%Y-%m-%d %H:%M:%S')}\033[0m")
        print("\033[92m" + "="*80 + "\033[0m")
        
        # 📋 요청 기본 정보
        print(f"\033[93m📋 요청 기본 정보:\033[0m")
        print(f"  🔗 메서드: \033[94m{request.method}\033[0m")
        print(f"  🌐 URL: \033[94m{request.get_full_path()}\033[0m")
        print(f"  📍 IP 주소: \033[94m{self.get_client_ip(request)}\033[0m")
        print(f"  👤 사용자: \033[94m{request.user if hasattr(request, 'user') else 'Anonymous'}\033[0m")
        
        # 🔍 특별한 엔드포인트 확인
        if 'link-profile' in request.get_full_path():
            print(f"\033[91m🎯 특별 감시 대상: link-profile 엔드포인트!\033[0m")
            print(f"\033[91m🔍 405 Method Not Allowed 디버깅 모드 활성화!\033[0m")
        
        # 📨 헤더 정보
        print(f"\033[93m📨 요청 헤더:\033[0m")
        important_headers = ['Content-Type', 'Authorization', 'User-Agent', 'Accept']
        for header in important_headers:
            value = request.META.get(f'HTTP_{header.upper().replace("-", "_")}', 'N/A')
            if header == 'Authorization' and value != 'N/A':
                value = value[:20] + '...' if len(value) > 20 else value
            print(f"  📄 {header}: \033[94m{value}\033[0m")
        
        # 📦 요청 본문 (POST/PUT/PATCH인 경우)
        if request.method in ['POST', 'PUT', 'PATCH']:
            print(f"\033[93m📦 요청 본문:\033[0m")
            try:
                if hasattr(request, 'body') and request.body:
                    body = request.body.decode('utf-8')
                    if len(body) > 500:
                        body = body[:500] + '...(truncated)'
                    
                    # JSON 형태로 예쁘게 출력
                    try:
                        json_body = json.loads(body)
                        formatted_body = json.dumps(json_body, indent=2, ensure_ascii=False)
                        print(f"  📝 JSON 데이터:\n\033[94m{formatted_body}\033[0m")
                    except:
                        print(f"  📝 Raw 데이터: \033[94m{body}\033[0m")
                else:
                    print(f"  📝 본문 없음")
            except Exception as e:
                print(f"  ❌ 본문 읽기 오류: {e}")
        
        print("\033[92m" + "-"*80 + "\033[0m")
    
    def print_response_info(self, request, response, process_time):
        """응답 정보 출력"""
        print("\033[92m" + "-"*80 + "\033[0m")
        print(f"\033[96m📤 응답 정보:\033[0m")
        
        # 상태 코드에 따른 색상 변경
        status_color = "\033[92m"  # 초록 (성공)
        if 400 <= response.status_code < 500:
            status_color = "\033[93m"  # 노랑 (클라이언트 오류)
        elif response.status_code >= 500:
            status_color = "\033[91m"  # 빨강 (서버 오류)
        
        print(f"  📊 상태 코드: {status_color}{response.status_code}\033[0m")
        print(f"  ⏱️ 처리 시간: \033[94m{process_time:.3f}초\033[0m")
        
        # 405 Method Not Allowed 특별 처리
        if response.status_code == 405:
            print(f"\033[91m🚨 405 Method Not Allowed 오류 발생!\033[0m")
            print(f"\033[91m🔍 디버깅 정보:\033[0m")
            print(f"  📍 요청 URL: {request.get_full_path()}")
            print(f"  🔧 요청 메서드: {request.method}")
            print(f"  ❌ 허용되지 않는 메서드입니다!")
            
            # 허용된 메서드 확인
            if hasattr(response, 'get') and 'Allow' in response:
                print(f"  ✅ 허용된 메서드: {response['Allow']}")
        
        # 응답 본문 (오류인 경우만)
        if response.status_code >= 400:
            print(f"\033[93m📦 응답 본문:\033[0m")
            try:
                if hasattr(response, 'content') and response.content:
                    content = response.content.decode('utf-8')
                    if len(content) > 300:
                        content = content[:300] + '...(truncated)'
                    print(f"  📝 내용: \033[91m{content}\033[0m")
            except Exception as e:
                print(f"  ❌ 응답 본문 읽기 오류: {e}")
        
        print("\033[92m" + "="*80 + "\033[0m")
        print(f"\033[96m✅ 요청 처리 완료! {time.strftime('%Y-%m-%d %H:%M:%S')}\033[0m")
        print("\033[92m" + "="*80 + "\033[0m")
        print()  # 빈 줄 추가
    
    def get_client_ip(self, request):
        """클라이언트 IP 주소 가져오기"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
