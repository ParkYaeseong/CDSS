from django.urls import path
# [수정] search_page 대신 새로 만든 PaperSearchView를 import 합니다.
from .views import PaperSearchView

app_name = 'paper_search'

urlpatterns = [
    # [수정] 함수형 뷰(views.search_page) 대신 클래스 기반 뷰(PaperSearchView.as_view())를 연결합니다.
    # 주소는 /api/paper-search/ 가 되며, POST 요청을 처리합니다.
    path('', PaperSearchView.as_view(), name='paper-search-api'),
]