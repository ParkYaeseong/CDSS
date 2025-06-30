import requests
import xml.etree.ElementTree as ET
import google.generativeai as genai
import logging
import json # JSON 파싱을 위해 추가
from django.conf import settings

logger = logging.getLogger(__name__)

# --- Gemini API 초기 설정 (이전과 동일) ---
try:
    if hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY":
        genai.configure(api_key=settings.GEMINI_API_KEY)
        logger.info("✅ Gemini API 키가 성공적으로 설정되었습니다.")
    else:
        logger.warning("⚠️ 주의: settings.py에 GEMINI_API_KEY가 유효하게 설정되지 않았습니다.")
except Exception as e:
    logger.error(f"🔴 Gemini API 설정 중 심각한 오류 발생: {e}", exc_info=True)

# --- 헬퍼 함수 재설계 ---

def _search_epmc_fulltext(query: str, limit: int) -> list:
    # 이전과 동일
    logger.info(f"🇪🇺 Europe PMC 검색 시작: query='{query}', limit={limit}")
    url = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
    params = {
        "query": f'({query}) AND (OPEN_ACCESS:"Y")',
        "resultType": "lite",
        "format": "json",
        "pageSize": limit
    }
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        results = data.get("resultList", {}).get("result", [])
        logger.info(f"✅ Europe PMC 검색 완료. {len(results)}개 결과 수신.")
        return results
    except requests.exceptions.RequestException as e:
        logger.error(f"🔴 Europe PMC API 요청 실패: {e}", exc_info=True)
    return []

def _get_epmc_fulltext_xml(pmcid: str) -> str:
    # 이전과 동일
    logger.info(f"📄 Europe PMC에서 XML 전문 가져오기 (PMCID: {pmcid})")
    url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/{pmcid}/fullTextXML"
    try:
        response = requests.get(url, timeout=40)
        response.raise_for_status()
        logger.info(f"✅ XML 전문 가져오기 성공 (PMCID: {pmcid}).")
        return response.text
    except requests.exceptions.RequestException as e:
        logger.error(f"🔴 Europe PMC XML 전문 가져오기 실패 (PMCID: {pmcid}): {e}", exc_info=True)
    return ""

def _extract_full_text_from_xml(xml_text: str) -> str:
    """XML에서 모든 텍스트를 추출하여 하나의 문자열로 합칩니다."""
    if not xml_text:
        return ""
    try:
        root = ET.fromstring(xml_text)
        # itertext()를 사용하여 모든 태그의 텍스트를 순회하고 공백으로 연결
        full_text = " ".join(root.itertext())
        # 여러 공백을 하나의 공백으로 정리
        return ' '.join(full_text.split())
    except ET.ParseError as e:
        logger.error(f"🔴 XML 파싱 중 오류 발생: {e}", exc_info=True)
        return ""

def _generate_summaries_from_text_gemini(full_text: str, keyword: str) -> list:
    """논문 전체 텍스트와 키워드를 받아, AI가 직접 관련 문장을 찾고 요약하여 JSON 리스트를 반환합니다."""
    if not full_text:
        return []
    
    logger.info(f"🤖 Gemini에게 키워드 '{keyword}' 기반 핵심 문장 추출 및 요약 요청...")

    # AI에게 역할을 부여하고, 원하는 결과물의 형식을 명확히 지정하는 프롬프트
    prompt = f"""
    You are an expert medical research assistant. Your task is to analyze the following academic paper text and extract up to 5 key sentences that are most relevant to the keyword "{keyword}".

    For each extracted sentence, provide a concise Korean summary.

    Please return your findings as a single, valid JSON array of objects. Each object in the array should have two keys: "original_sentence" and "korean_summary".

    Do not include any text or explanation outside of the JSON array.

    Keyword: "{keyword}"

    Paper Text:
    ---
    {full_text[:12000]}
    ---
    """
    
    try:
        model = genai.GenerativeModel('models/gemini-1.5-flash-latest')
        response = model.generate_content(prompt)
        
        # AI 응답에서 JSON 부분만 깔끔하게 추출
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        
        logger.info("✅ Gemini 응답 수신. JSON 파싱 시도...")
        # JSON 문자열을 파이썬 리스트로 변환
        summaries = json.loads(cleaned_response)
        
        # 결과가 리스트 형태인지, 내부 요소가 딕셔너리인지 간단히 검증
        if isinstance(summaries, list) and all(isinstance(item, dict) for item in summaries):
            logger.info(f"✅ JSON 파싱 성공! {len(summaries)}개의 요약 생성.")
            return summaries
        else:
            logger.warning("⚠️ Gemini가 반환한 JSON 형식이 올바르지 않습니다.")
            return []

    except json.JSONDecodeError as e:
        logger.error(f"🔴 Gemini 응답 JSON 파싱 실패: {e}\n받은 응답: {cleaned_response}")
        return []
    except Exception as e:
        logger.error(f"🔴 Gemini 처리 중 예상치 못한 오류 발생: {e}", exc_info=True)
        return []

# --- 메인 서비스 함수 재설계 ---

def get_epmc_papers_and_summaries(query: str, keyword: str, count: int = 5) -> list:
    """논문 검색, 전체 텍스트 추출, AI 요약의 새로운 파이프라인"""
    logger.info(f"🚀 (v2) EPMC+Gemini 서비스 시작: 검색어='{query}', 키워드='{keyword}', 최대 논문 수={count}")
    
    epmc_papers = _search_epmc_fulltext(query, limit=count)
    if not epmc_papers:
        return []

    final_results = []
    for paper_info in epmc_papers:
        pmcid = paper_info.get("pmcid")
        if not pmcid:
            continue

        title = paper_info.get("title")
        logger.info(f"\n💡 '{title}' (PMCID: {pmcid}) 논문 처리 시작...")
        
        xml_text = _get_epmc_fulltext_xml(pmcid)
        full_text = _extract_full_text_from_xml(xml_text)
        
        # AI에게 텍스트와 키워드를 주고 요약 리스트를 직접 받음
        extracts = _generate_summaries_from_text_gemini(full_text, keyword)
        
        final_results.append({
            "title": title,
            "pmcid": pmcid,
            "epmc_link": f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/",
            "keyword_extracts": extracts
        })
            
    logger.info(f"🏁 (v2) 서비스 종료. 총 {len(final_results)}개 논문 처리 완료.")
    return final_results