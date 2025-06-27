# ai_chatbot/views.py

from django.http import JsonResponse
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt # AJAX POST 요청 테스트를 위해 임시로 CSRF 보호 비활성화 (실제 서비스에서는 CSRF 처리 필요)
from django.views.decorators.http import require_POST # POST 요청만 받도록 설정
from . import bot_service # 우리가 만든 bot_service.py 임포트
import json # 클라이언트로부터 JSON 데이터를 받기 위해

@csrf_exempt # 중요: 테스트 중에는 CSRF 보호를 임시로 비활성화. 실제 배포 시에는 CSRF 토큰 처리 방식을 사용해야 함!
@require_POST # 이 view는 POST 요청만 처리하도록 설정
def send_chat_message(request):
    try:
        # 클라이언트(웹 브라우저의 JavaScript)가 보낸 JSON 데이터 파싱
        data = json.loads(request.body)
        user_message = data.get('message', '').strip() # 사용자가 보낸 메시지
        
        # 사용자 식별자 가져오기 (여기서는 Django 세션 키를 사용)
        # 실제 로그인 기능이 있다면 request.user.id 등을 사용할 수 있음
        if not request.session.session_key:
            request.session.create() # 세션이 없으면 새로 생성
        user_session_key = request.session.session_key

        if not user_message:
            return JsonResponse({'error': '메시지가 비어있습니다.'}, status=400)

        print(f"💬 View: 사용자 메시지 수신 (세션: {user_session_key}) - '{user_message}'")

        # bot_service.py의 함수를 호출해서 챗봇 응답 받기
        bot_response_text = bot_service.get_gemini_chat_response(user_session_key, user_message)

        print(f"🤖 View: 챗봇 응답 반환 (세션: {user_session_key}) - '{bot_response_text}'")
        
        # 챗봇 응답을 JSON 형태로 클라이언트에게 반환
        return JsonResponse({'reply': bot_response_text})

    except json.JSONDecodeError:
        print("🔴 View: 잘못된 JSON 형식 수신")
        return JsonResponse({'error': '잘못된 JSON 형식입니다.'}, status=400)
    except Exception as e:
        print(f"🔴 View: 메시지 처리 중 서버 오류 발생 - {str(e)}")
        return JsonResponse({'error': f'서버 내부 오류가 발생했습니다: {str(e)}'}, status=500)
    
def chatbot_home(request):
    return HttpResponse("🤖 여기는 챗봇 API입니다. POST 요청은 /chatbot/send_message/로 보내세요.")