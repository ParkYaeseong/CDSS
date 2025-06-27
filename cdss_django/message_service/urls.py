# message_service/urls.py
from django.urls import path
from . import views

app_name = 'message_service'

urlpatterns = [
    path('list/', views.MessageListView.as_view(), name='message_list'),
    path('send/', views.MessageSendView.as_view(), name='message_send'),
    path('<int:message_id>/read/', views.MessageReadView.as_view(), name='message_read'),
    path('users/search/', views.UserSearchView.as_view(), name='user_search'),
    
    # ✅ 기존 호환성을 위한 함수 기반 뷰 (선택적)
    path('users/search-func/', views.search_users, name='user_search_func'),
]
