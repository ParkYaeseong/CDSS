# paper_search/serializers.py

from rest_framework import serializers

# 중첩된 'keyword_extracts' 리스트의 각 항목을 위한 Serializer
class KeywordExtractSerializer(serializers.Serializer):
    original_sentence = serializers.CharField()
    korean_summary = serializers.CharField()

# 최종 응답 데이터의 각 논문 항목을 위한 메인 Serializer
class PaperSummarySerializer(serializers.Serializer):
    title = serializers.CharField()
    pmcid = serializers.CharField()
    epmc_link = serializers.URLField()
    # KeywordExtractSerializer를 리스트(many=True) 형태로 중첩시킴
    keyword_extracts = KeywordExtractSerializer(many=True)