// src/services/config.js

export const API_CONFIG = {
  BACKEND_BASE: process.env.REACT_APP_BACKEND_BASE_URL || 'http://35.188.47.40:8000',
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
};

export const ENDPOINTS = {
  // 인증
  LOGIN: '/api/token/',
  TOKEN_REFRESH: '/api/token/refresh/',
  AUTH_STATUS: '/api/auth/status/',

  // 환자
  PATIENT_PROFILES: '/api/patients/profiles/',

  // CT 진단
  DIAGNOSIS_REQUESTS: '/api/diagnosis/requests/',
  CURRENT_CT_REQUEST: '/api/pacs/current-ct-request/',
  PACS_UPLOAD: '/api/pacs/upload/',

  // 기타 AI 서비스
  PAPER_SEARCH: '/api/paper-search/',
  AI_CHAT: '/api/chatbot/send_message/',

  // LIS 관련 엔드포인트 추가
  LAB_ORDERS: '/api/laboratory/orders/',
  LAB_TEST_TYPES: '/api/laboratory/test-types/',
  LAB_RESULTS: '/api/laboratory/results/',
  
  // 약물 상호작용 검사 엔드포인트
  DRUG_INTERACTION_CHECK: '/api/drug-checker/interaction-check/',
  DRUG_SEARCH: '/api/drug-checker/drugs/search/',
  
  // 처방전 관련 엔드포인트 (중복 제거)
  PRESCRIPTION_SAVE: '/api/drug-checker/prescription/save/',
  PRESCRIPTION_LIST: '/api/drug-checker/prescription/list/',

  // 오믹스 분석 요청 엔드포인트
  OMICS_REQUESTS: '/api/omics/requests/',
  OMICS_DATA_FILES: '/api/omics/data-files/', 
};

console.log("✅ config.js 로드됨. DRUG_INTERACTION_CHECK 엔드포인트:", ENDPOINTS.DRUG_INTERACTION_CHECK);
console.log("✅ config.js 로드됨. DRUG_SEARCH 엔드포인트:", ENDPOINTS.DRUG_SEARCH);
