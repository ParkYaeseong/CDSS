import logging # 파이썬 기본 로깅 라이브러리 추가

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from . import ai_service
from .serializers import PaperSummarySerializer

# 로거 설정
logger = logging.getLogger(__name__)

class PaperSearchView(APIView):
    """
    논문 주제(query)와 키워드(keyword)를 POST 방식으로 받아,
    ai_service를 통해 논문을 검색 및 요약하고, 유효한 결과만 필터링하여 반환하는 API
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get('query')
        keyword = request.data.get('keyword')

        # ... (if not query or not keyword: 부분은 그대로) ...

        TARGET_RESULT_COUNT = 5
        API_FETCH_COUNT = 15

        # --- 로직 수정 ---
        # 1. 두 키워드를 조합하여 하나의 검색 쿼리로 만듭니다.
        search_query = f"{query} AND {keyword}"
        
        logger.info(f"✅ PaperSearchView: 검색 요청 수신 - 주제: '{query}', 키워드: '{keyword}'")
        # 2. 로그에 통합된 검색어를 출력하여 확인합니다.
        logger.info(f"🔄 통합 검색어: '{search_query}', 목표 결과 수: {TARGET_RESULT_COUNT}, API 시도 수: {API_FETCH_COUNT}")

        try:
            # 2. ai_service 호출 시, 가져올 논문 개수(API_FETCH_COUNT)를 인자로 전달
            # (나중에 ai_service.py 파일을 이 인자를 받도록 수정해야 합니다)
            all_papers = ai_service.get_epmc_papers_and_summaries(
                query, keyword, count=API_FETCH_COUNT
            )
            
            logger.info(f"✅ PaperSearchView: ai_service로부터 {len(all_papers)}개 논문 결과 받음")

            # 3. 'keyword_extracts'가 비어있지 않은 논문만 필터링
            filtered_papers = []
            for paper in all_papers:
                # paper 딕셔너리에 'keyword_extracts' 키가 존재하고, 그 값이 비어있지 않은 경우
                if paper.get("keyword_extracts"): 
                    filtered_papers.append(paper)
            
            logger.info(f"✅ PaperSearchView: 필터링 후 {len(filtered_papers)}개 유효 논문 남음")

            # 4. 필터링된 결과에서 최종 목표 개수만큼만 선택
            final_papers = filtered_papers[:TARGET_RESULT_COUNT]

            serializer = PaperSummarySerializer(final_papers, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            # 5. 에러 로깅 강화 (어떤 에러인지 추적하기 위함)
            logger.error(f"❗️ PaperSearchView 처리 중 심각한 오류 발생: {e}", exc_info=True)
            return Response(
                {"error": "논문 검색 중 서버 내부 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        # --- 로직 수정 끝 ---