// final_react/src/services/apiClient.js

import axios from 'axios';

// 백엔드 API의 기본 주소 설정
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://35.188.47.40:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 모든 요청 전에 실행
apiClient.interceptors.request.use(
  (config) => {
    // [수정] auth.service.js에서 저장한 'accessToken'을 직접 가져옵니다.
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 모든 응답 후에 실행
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 에러 발생 시 자동 로그아웃 처리
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized request, logging out.");
      
      // 순환 참조를 피하기 위해 localStorage를 직접 정리합니다.
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // [수정] App.js의 basename을 고려하여 리디렉션 경로를 수정합니다.
      window.location.href = '/cdss/login'; 
    }
    return Promise.reject(error);
  }
);

export default apiClient;