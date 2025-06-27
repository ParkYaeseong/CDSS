# ai_chatbot/urls.py

from django.urls import path
from . import views # ai_chatbot 폴더 안의 views.py를 가져옴

app_name = 'ai_chatbot' # 이 앱의 URL 패턴들의 네임스페이스 (나중에 유용)

urlpatterns = [
    # 예: /chatbot/send_message/ 라는 주소로 POST 요청이 오면
    # views.py 파일 안에 있는 send_chat_message 함수를 실행
    path('', views.chatbot_home, name='chatbot_home'),
    path('send_message/', views.send_chat_message, name='send_chat_message'),

    # 만약 채팅 인터페이스를 보여주는 HTML 페이지도 Django로 만든다면,
    # 그 페이지를 위한 URL도 여기에 추가할 수 있어. 예를 들면:
    # path('', views.chat_page_view, name='chat_page'), 
    # (이러려면 views.py에 chat_page_view 함수랑 연결된 HTML 템플릿도 만들어야 함)
]