// prediction.service.js
import axios from 'axios';

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
  }
};
