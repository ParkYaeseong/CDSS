// final_react/src/services/nursingApi.js
import axios from 'axios';

const LIS_API_URL = 'http://35.188.47.40:8115';

const lisApiClient = axios.create({
  baseURL: LIS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

lisApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('요청 인터셉터 오류:', error);
    return Promise.reject(error);
  }
);

lisApiClient.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized request, logging out.");
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/cdss/login';
    }
    console.error('API 오류:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export const nursingApiService = {
  // 환자 목록 조회 - LIS 서버에서 가져오기
  getPatients: async (params = {}) => {
    try {
      console.log('LIS 환자 API 호출:', `${LIS_API_URL}/api/patients/`);
      const response = await lisApiClient.get('/api/patients/', { params });
      console.log('LIS 환자 API 응답:', response);
      
      // 응답 데이터 정규화
      let patientData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          patientData = response.data;
        } else if (response.data.results) {
          patientData = response.data.results;
        }
      }
      
      // 환자 데이터에 age 필드 추가 (생년월일로부터 계산)
      const processedPatients = patientData.map(patient => {
        let age = 0;
        if (patient.birth_date) {
          const today = new Date();
          const birthDate = new Date(patient.birth_date);
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        return {
          ...patient,
          age: age,
          openemr_id: patient.patient_id, // 호환성을 위해 추가
        };
      });
      
      console.log('처리된 LIS 환자 데이터:', processedPatients);
      return { data: processedPatients };
      
    } catch (error) {
      console.error('LIS 환자 API 실패:', error);
      throw error;
    }
  },

  // 간호일지 목록 조회
  getNursingLogs: async (patientId = '', params = {}) => {
    try {
      console.log('LIS 간호일지 API 호출:', `${LIS_API_URL}/api/nursing-logs/`);
      const response = await lisApiClient.get('/api/nursing-logs/', { 
        params: patientId ? { ...params, patient_id: patientId } : params 
      });
      return response;
    } catch (error) {
      console.error('LIS 간호일지 API 실패:', error);
      throw error;
    }
  },

  // AI 자동완성
  generateNursingLog: async (data) => {
    try {
      console.log('LIS AI API 호출:', `${LIS_API_URL}/api/nursing-logs/ai_generate/`);
      const response = await lisApiClient.post('/api/nursing-logs/ai_generate/', data);
      return response;
    } catch (error) {
      console.error('LIS AI API 실패:', error);
      throw error;
    }
  },

  // 직접 작성 간호일지 생성
  createManualNursingLog: async (data) => {
    try {
      const response = await lisApiClient.post('/api/nursing-logs/', {
        ...data,
        writing_mode: 'manual'
      });
      return response;
    } catch (error) {
      console.error('LIS 생성 API 실패:', error);
      throw error;
    }
  },

  // 간호일지 수정
  updateNursingLog: async (logId, logData) => {
    try {
      const response = await lisApiClient.put(`/api/nursing-logs/${logId}/`, logData);
      return response;
    } catch (error) {
      console.error('LIS 수정 API 실패:', error);
      throw error;
    }
  },

  // 간호일지 승인
  approveNursingLog: async (logId) => {
    try {
      const response = await lisApiClient.post(`/api/nursing-logs/${logId}/approve/`);
      return response;
    } catch (error) {
      console.error('LIS 승인 API 실패:', error);
      throw error;
    }
  }
};

export default nursingApiService;
