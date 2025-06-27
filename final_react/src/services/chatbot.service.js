// src/services/chatbot.service.js

import apiClient from './apiClient'; 

export const sendChatMessage = async (message) => {
  try {
    // [핵심 수정] 추적된 정확한 전체 경로로 수정합니다.
    const response = await apiClient.post('/api/chatbot/send_message/', { message });

    if (response && response.data && response.data.reply) {
      return response.data.reply;
    } else {
      console.error('챗봇 API 응답 형식이 예상과 다릅니다:', response);
      throw new Error('챗봇 응답에서 reply 필드를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error("챗봇 API 호출 또는 처리 중 실패:", error);
    throw error;
  }
};
