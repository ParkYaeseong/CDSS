# ai_chatbot/bot_service.py

import google.generativeai as genai
from django.conf import settings
from .models import ChatMessage # 우리가 만든 ChatMessage 모델 임포트

# --- Gemini API 설정 (기존과 동일) ---
GEMINI_API_KEY_VALID = False 
chat_model = None 
try:
    if hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() != "":
        genai.configure(api_key=settings.GEMINI_API_KEY)
        chat_model = genai.GenerativeModel('gemini-1.5-flash')
        GEMINI_API_KEY_VALID = True
        print("✅ (Chatbot) Gemini API 키가 유효하며 모델이 초기화되었습니다.")
    else:
        print("⚠️ (Chatbot) 주의: settings.py에 GEMINI_API_KEY가 설정되지 않았거나 비어있습니다. 실제 키를 입력해주세요.")
except Exception as e:
    print(f"🔴 (Chatbot) Gemini API 초기 설정 중 심각한 오류 발생: {e}")

# ✅ 1. [핵심 추가] 챗봇의 역할과 페르소나를 정의하는 시스템 프롬프트입니다.
SYSTEM_INSTRUCTION = {
    "role": "user",
    "parts": [
        """너는 'CDSS 챗봇'이야. 임상 의사 결정 지원 시스템(CDSS)에서 의사, 간호사와 같은 의료진을 돕는 전문 AI 어시스턴트 역할을 맡고 있어.

        # 너의 역할 및 규칙
        1.  **정체성**: 너의 이름은 'CDSS 챗봇' 또는 'AI 설명 도우미'야. 사용자가 너의 정체를 물으면, "저는 의료진의 의사 결정을 돕기 위해 개발된 AI 어시스턴트입니다."라고 전문적으로 대답해야 해. 절대로 "구글에서 훈련된 언어 모델"이라는 등의 일반적인 답변은 하지 마.
        2.  **어조**: 항상 친절하고, 명확하며, 전문적인 어조를 유지해.
        3.  **핵심 기능 안내**: 이 시스템의 핵심 기능(환자 관리, 분석, 진단 보조 등)에 대해 질문받으면, 각 기능의 목적과 사용법을 간결하게 설명할 수 있어야 해.
        4.  **한계 명시**: 너는 의료 전문가의 판단을 대체할 수 없어. 모든 정보는 참고용이며, 최종적인 의학적 결정은 반드시 담당 의료진이 내려야 한다는 점을 항상 명확히 해야 해.
        """
    ]
}

# --- 메인 대화 함수 ---
def get_gemini_chat_response(user_session_key, user_message):
    if not GEMINI_API_KEY_VALID or not chat_model:
        print("🚫 (Chatbot) Gemini API가 설정되지 않아 챗봇 서비스를 사용할 수 없습니다.")
        return "죄송합니다, 챗봇 서비스가 현재 API 키 문제로 사용 불가능합니다. 관리자에게 문의해주세요."

    # 1. DB에서 이전 대화 기록 불러오기
    past_messages_queryset = ChatMessage.objects.filter(session_key=user_session_key).order_by('timestamp')

    history_for_gemini = []
    
    # ✅ 2. [핵심 추가] 대화 기록이 없을 때 (즉, 대화가 처음 시작될 때) 시스템 프롬프트를 주입합니다.
    if not past_messages_queryset.exists():
        history_for_gemini.append(SYSTEM_INSTRUCTION)
        # 시스템의 역할을 AI가 인지하고 첫 답변을 하도록 유도하는 부분입니다.
        history_for_gemini.append({
            "role": "model",
            "parts": ["네, 안녕하세요! 저는 의료진의 의사 결정을 돕기 위해 개발된 AI 어시스턴트, CDSS 챗봇입니다. 무엇을 도와드릴까요?"]
        })

    # DB에 저장된 기존 대화 기록을 history_for_gemini 리스트에 추가합니다.
    for db_message in past_messages_queryset:
        role = "user" if db_message.is_from_user else "model"
        history_for_gemini.append({"role": role, "parts": [db_message.message]})

    try:
        # 3. Gemini API와 대화 시작 (기존 구조 유지)
        #    이제 history_for_gemini에는 우리의 역할 정의가 포함되어 있습니다.
        chat_session = chat_model.start_chat(history=history_for_gemini)

        print(f"💬 사용자 ({user_session_key}): {user_message}")

        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        response = chat_session.send_message(user_message, safety_settings=safety_settings)

        # 이하 응답 처리 및 DB 저장 로직은 기존과 동일합니다.
        bot_reply_text = ""
        if response.parts:
            bot_reply_text = "".join(part.text for part in response.parts if hasattr(part, 'text')).strip()
        elif response.prompt_feedback and response.prompt_feedback.block_reason:
            block_reason = response.prompt_feedback.block_reason
            bot_reply_text = f"죄송합니다, 요청이 안전 문제로 차단되었습니다 (이유: {block_reason}). 다른 질문을 해주시겠어요?"
            print(f"⚠️ Gemini 요청 차단됨 (세션: {user_session_key}): {block_reason}")
        else:
            bot_reply_text = "죄송합니다, 현재 답변을 드릴 수 없습니다. 잠시 후 다시 시도해주세요."
            print(f"⚠️ Gemini로부터 비어있는 응답 (세션: {user_session_key})")

        print(f"🤖 챗봇 ({user_session_key}): {bot_reply_text}")

        # 3. 새 대화 DB에 저장
        ChatMessage.objects.create(
            session_key=user_session_key,
            message=user_message,
            is_from_user=True
        )
        if bot_reply_text:
            ChatMessage.objects.create(
                session_key=user_session_key,
                message=bot_reply_text,
                is_from_user=False
            )

        return bot_reply_text

    except Exception as e:
        print(f"🔴 Gemini API와 대화 중 심각한 오류 발생 (세션: {user_session_key}): {e}")
        error_message = "죄송합니다, 챗봇과 대화 중 오류가 발생했습니다."
        if "API key not valid" in str(e) or "API_KEY_INVALID" in str(e):
            error_message = "Gemini API 키가 유효하지 않습니다. 관리자에게 문의해주세요."
        elif "permission" in str(e).lower() or "denied" in str(e).lower():
            error_message = "Gemini API 접근 권한에 문제가 있습니다. 관리자에게 문의해주세요."
        return error_message

def generate_text_from_prompt(prompt_text):
    """
    하나의 프롬프트를 받아 Gemini 모델로부터 텍스트 응답을 생성합니다.
    대화 기록을 사용하지 않는 단발성 요청에 사용됩니다 (예: 보고서 생성).
    """
    if not GEMINI_API_KEY_VALID or not chat_model:
        print("🚫 (Report Gen) Gemini API가 설정되지 않아 텍스트 생성을 사용할 수 없습니다.")
        return "오류: AI 서비스가 현재 API 키 문제로 사용 불가능합니다."

    try:
        print(f"📄 새로운 텍스트 생성 요청 수신...")
        
        # 대화형이 아닌 단일 요청에는 generate_content를 사용하는 것이 더 적합합니다.
        response = chat_model.generate_content(prompt_text)
        
        generated_text = ""
        # 성공적인 응답 처리
        if response.parts:
            generated_text = "".join(part.text for part in response.parts if hasattr(part, 'text')).strip()
        # 안전 문제로 차단된 경우 처리
        elif response.prompt_feedback and response.prompt_feedback.block_reason:
            block_reason = response.prompt_feedback.block_reason
            generated_text = f"오류: 요청이 안전 문제로 차단되었습니다 (이유: {block_reason})."
            print(f"⚠️ (Report Gen) Gemini 요청 차단됨: {block_reason}")
        # 그 외의 이유로 응답이 없는 경우
        else:
            generated_text = "오류: AI로부터 비어있는 응답을 받았습니다."
            print(f"⚠️ (Report Gen) Gemini로부터 비어있는 응답")

        return generated_text

    except Exception as e:
        print(f"🔴 (Report Gen) Gemini API로 텍스트 생성 중 심각한 오류 발생: {e}")
        error_message = "오류: AI와 통신 중 오류가 발생했습니다."
        return error_message