// src/services/paper.service.js

import apiClient from './apiClient';
import { ENDPOINTS } from './config';

/**
 * 주제와 키워드로 논문을 검색하고 요약합니다.
 * @param {object} params - { query, keyword }
 * @returns {Promise<object | Array>} - 검색 결과 데이터 (객체 또는 배열)
 */
export const searchPapers = async ({ query, keyword }) => {
  try {
    // 백엔드가 'q'와 'keywords' 필드를 기대하므로, 객체 키 이름을 변경합니다.
    // 또한, 'keywords'는 백엔드가 배열을 기대할 가능성이 높으므로,
    // 현재 keyword가 단일 문자열이라면 쉼표로 구분하여 배열로 만들어 보냅니다.
    const keywordsArray = keyword ? keyword.split(',').map(k => k.trim()).filter(Boolean) : [];

    // console.log("Sending to backend:", { q: query, keywords: keywordsArray }); // ★★★ 서비스 단에서의 전송 데이터 확인용 (선택)

    const response = await apiClient.post(ENDPOINTS.PAPER_SEARCH, {
      q: query,       // 프론트엔드의 'query'를 백엔드의 'q'로 매핑
      keywords: keywordsArray // 프론트엔드의 'keyword'를 백엔드의 'keywords'로 매핑 (배열 형태)
    });
    
    // apiClient가 내부적으로 response.data를 반환한다고 가정했으므로,
    // 여기서 response 자체가 이미 데이터일 수 있습니다. (이전 DrugInteractionCard 사례처럼)
    // 하지만 안정성을 위해 response.data를 명시적으로 반환합니다.
    // 만약 apiClient가 이미 response.data를 줬다면, response.data는 undefined일 수 있으므로
    // 이 부분은 apiClient의 실제 구현에 따라 조정이 필요합니다.
    // 일단은 response에 데이터가 직접 오거나 response.data에 온다고 가정하고 response.data를 반환합니다.
    return response.data || response; 

  } catch (error) {
    // apiClient의 인터셉터가 이미 에러 응답 본문을 던지도록 설정되어 있다고 가정합니다.
    console.error("논문 검색 API 호출 실패 (service):", error);
    throw error; // 에러 객체 전체를 다시 던져서 컴포넌트에서 자세히 처리할 수 있게 합니다.
  }
};