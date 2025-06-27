// src/services/omics.service.js

import apiClient from './apiClient';
import { ENDPOINTS } from './config'; // ENDPOINTS 내용 확인 필수!

// ===================================================================
// 워크플로우 1: 오믹스 파일 기반 분석
// ===================================================================

const createOmicsRequest = async (requestData) => {
    try {
        const response = await apiClient.post(ENDPOINTS.OMICS_REQUESTS, requestData);
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.patient?.[0] || error.response?.data?.detail || '오믹스 분석 요청 생성에 실패했습니다.';
        throw new Error(errorMessage);
    }
};

const uploadOmicsFile = async (requestId, file, omicsType) => {
    const formData = new FormData();
    formData.append('request', requestId);
    formData.append('input_file', file);
    formData.append('omics_type', omicsType);

    try {
        const response = await apiClient.post(ENDPOINTS.OMICS_DATA_FILES, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response;
    } catch (error) {
        const errorMessage = error.response?.data?.detail || error.message || '오믹스 파일 업로드에 실패했습니다.';
        throw new Error(errorMessage);
    }
};

const getOmicsRequestDetails = async (requestId) => {
    try {
        const response = await apiClient.get(`${ENDPOINTS.OMICS_REQUESTS}${requestId}/`);
        return response;
    } catch (error) {
        throw new Error(error.response?.data?.detail || '오믹스 분석 요청 상세 정보 조회에 실패했습니다.');
    }
};

// ▼▼▼ 1. [함수 추가] 이 함수 전체를 여기에 추가합니다. ▼▼▼
/**
 * 특정 환자의 모든 오믹스 분석 요청 목록을 가져옵니다.
 * @param {string} patientId - 환자의 고유 ID (UUID)
 * @returns {Promise<AxiosResponse<any>>}
 */
const getOmicsRequestsByPatient = (patientId) => {
    // GET /api/omics/requests/?patient_id=실제UUID
    // 백엔드의 get_queryset 필터링 로직을 사용합니다.
    return apiClient.get(ENDPOINTS.OMICS_REQUESTS, {
        params: {
            patient_id: patientId // axios가 자동으로 URL에 쿼리 파라미터를 추가해줍니다.
        }
    });
};
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// formatted_result API 호출 함수 - URL을 백엔드와 일치하도록 'formatted-result/' (하이픈)으로 변경
const getOmicsFormattedResult = async (requestId) => {
  try {
    const response = await apiClient.get(`${ENDPOINTS.OMICS_REQUESTS}${requestId}/formatted-result/`); // <--- 이 부분 수정됨: 하이픈 사용
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || '오믹스 포맷된 결과 조회에 실패했습니다.');
  }
};


const getModelRequirements = (cancerType) => {
    return apiClient.get(`/api/omics/models/${cancerType}/requirements/`);
};

// startAnalysisPipeline 함수 - URL을 백엔드와 일치하도록 'start-analysis/' (하이픈)으로 변경
const startAnalysisPipeline = (requestId) => {
    return apiClient.post(`${ENDPOINTS.OMICS_REQUESTS}${requestId}/start-analysis/`); // <--- 이 부분 수정됨: 하이픈 사용
};

const getAvailableCancerTypes = () => {
    return apiClient.get('/api/omics/cancer-types/');
};


// ===================================================================
// [신규 추가] 워크플로우 2: CT 영상 기반 분할 분석 (새로운 기능)
// ===================================================================
const startAnalysis = (payload) => {
    // payload 예시: { diagnosis_request_id: 1, target_organ: 'liver' }
    // 이 함수는 이전에 우리가 만든 AI 분석 라우터 API를 호출합니다.
    // URL은 /api/omics/segmentation/start/ 형태입니다.
    return apiClient.post('/api/omics/segmentation/start/', payload);
};


// [수정] 모든 함수를 하나의 객체에 담아 default export 합니다.
const OmicsService = {
    createOmicsRequest,
    uploadOmicsFile,
    getOmicsRequestDetails,
    getOmicsFormattedResult, // <-- 새로 추가한 함수를 객체에 포함
    getModelRequirements,
    startAnalysisPipeline,
    getAvailableCancerTypes,
    startAnalysis,
    getOmicsRequestsByPatient,
};

export default OmicsService;