// prediction.service.js
import axios from 'axios';
import apiClient from './apiClient';

const API_BASE_URL = 'http://35.188.47.40:8000/api/clinical-prediction';

export const predictionService = {
  predictSurvival: async (patientId, patientName) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/predict/survival/`, {
        patient_id: patientId,
        patient_name: patientName
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || '생존율 예측 실패');
    }
  },
  getComprehensiveReport: async (patientId) => {
    try {
      const response = await apiClient.get(`/api/clinical-prediction/reports/comprehensive/${patientId}/`);
      // 컴포넌트에서 response.data를 사용하므로, response 전체를 넘겨줍니다.
      return response;
    } catch (error) {
      // 에러 처리는 컴포넌트에서 하므로, 받은 에러를 그대로 다시 던져줍니다.
      throw error;
    }
  }
};
