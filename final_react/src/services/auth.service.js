// final_react/src/services/auth.service.js

import apiClient from './apiClient';

/**
 * 로그인 요청을 보내고 성공 시 토큰과 사용자 정보를 저장합니다.
 * @param {object} credentials - { username, password }
 * @returns {Promise<object>} 서버로부터 받은 데이터 (access, refresh, user 포함)
 */
const login = async (credentials) => {
  try {
    // [수정] 백엔드 accounts/urls.py에 정의된 올바른 주소로 변경합니다.
    const response = await apiClient.post('/api/accounts/login/', credentials);
    
    // 응답 데이터에 access 토큰이 있는지 확인하고 localStorage에 저장합니다.
    if (response.data && response.data.access) {
      localStorage.setItem('accessToken', response.data.access);
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
      }
      
      // 로그인 성공 시 응답에 포함된 사용자 정보를 user 키로 저장합니다.
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } else {
      // 서버 응답에 access 토큰이 없는 경우 에러 처리
      throw new Error('Login response is missing token data.');
    }
  } catch (error) {
    console.error('Login service error:', error);
    throw error;
  }
};

/**
 * 저장된 토큰을 삭제하여 로그아웃 처리합니다.
 */
const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

/**
 * 현재 토큰의 유효성을 서버에 확인하고 최신 사용자 정보를 가져옵니다.
 * @returns {Promise<object>} 사용자 정보 객체
 */
const checkStatus = async () => {
  try {
    // 백엔드 accounts/urls.py에 정의된 올바른 주소입니다.
    const response = await apiClient.get('/api/accounts/profile/');

    // 사용자 정보를 받아오면 localStorage에 저장하여 다른 곳에서 사용할 수 있도록 합니다.
    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    console.error('Check status service error:', error);
    throw error;
  }
};

const authService = {
  login,
  logout,
  checkStatus,
};

export default authService;
