// src/services/omics.service.js

import apiClient from './apiClient';
import { ENDPOINTS } from './config';



// [수정] 함수 이름과 URL을 백엔드와 일치시킵니다.
const getOmicsRequests = (patientId) => {
  return apiClient.get(`/api/patients/${patientId}/omics-requests/`);
};

// [수정] analysisId 대신 requestId를 사용하고 URL을 수정합니다.
const getOmicsResult = (requestId) => {
  // [최종 수정] 백엔드의 urls.py가 아는 정확한 경로로 수정합니다.
  // 'omics-results'가 아닌 'results'입니다.
  const correctUrl = `/api/omics/results/${requestId}/`;

  console.log("최종 API 요청 주소:", correctUrl);

  return apiClient.get(correctUrl);
};

// ===================================================================
// 오믹스 분석 서비스 - 완전 통합 버전
// ===================================================================

// 오믹스 분석 요청 생성
const createOmicsRequest = async (requestData) => {
    try {
        console.log('오믹스 분석 요청 생성:', requestData);
        const response = await apiClient.post(ENDPOINTS.OMICS_REQUESTS, requestData);
        console.log('오믹스 분석 요청 생성 성공:', response.data);
        return response;
    } catch (error) {
        console.error('오믹스 분석 요청 생성 실패:', error);
        const errorMessage = error.response?.data?.patient?.[0] || error.response?.data?.detail || '오믹스 분석 요청 생성에 실패했습니다.';
        throw new Error(errorMessage);
    }
};

// 파일 업로드
const uploadOmicsFile = async (requestId, file, omicsType) => {
    // 파일 크기 확인
    if (file.size > 50 * 1024 * 1024) { // 50MB 이상
        throw new Error('파일 크기가 너무 큽니다. 50MB 이하의 파일을 업로드해주세요.');
    }

    const formData = new FormData();
    formData.append('request', requestId);
    formData.append('input_file', file);
    formData.append('omics_type', omicsType);

    try {
        console.log(`파일 업로드 시작: ${file.name}, 타입: ${omicsType}`);
        const response = await apiClient.post(ENDPOINTS.OMICS_DATA_FILES, formData, {
            headers: { 
                'Content-Type': 'multipart/form-data',
            },
            timeout: 300000, // 5분 타임아웃
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`업로드 진행률: ${percentCompleted}%`);
            }
        });
        console.log('파일 업로드 성공:', response.data);
        return response;
    } catch (error) {
        console.error('파일 업로드 실패:', error);
        const errorMessage = error.response?.data?.detail || error.message || '오믹스 파일 업로드에 실패했습니다.';
        throw new Error(errorMessage);
    }
};

// 분석 시작
const startAnalysisPipeline = async (requestId) => {
    try {
        console.log('분석 시작:', requestId);
        const response = await apiClient.post(`${ENDPOINTS.OMICS_REQUESTS}${requestId}/start-analysis/`);
        console.log('분석 시작 성공:', response.data);
        return response;
    } catch (error) {
        console.error('분석 시작 실패:', error);
        throw new Error(error.response?.data?.detail || '분석 시작에 실패했습니다.');
    }
};

// 분석 상태 확인
const checkAnalysisStatus = async (requestId) => {
    try {
        console.log('분석 상태 확인:', requestId);
        const response = await apiClient.get(`${ENDPOINTS.OMICS_REQUESTS}${requestId}/`);
        console.log('분석 상태 확인 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('분석 상태 확인 실패:', error);
        throw new Error('분석 상태 확인에 실패했습니다.');
    }
};

// 분석 결과 조회
const getAnalysisResult = async (requestId) => {
    try {
        console.log('분석 결과 조회:', requestId);
        const response = await apiClient.get(`${ENDPOINTS.OMICS_REQUESTS}${requestId}/result/`);
        console.log('분석 결과 조회 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('분석 결과 조회 실패:', error);
        throw new Error('분석 결과 조회에 실패했습니다.');
    }
};

// 환자별 이전 분석 목록 조회
const getPatientAnalyses = async (patientId) => {
    try {
        console.log('환자별 분석 목록 조회:', patientId);
        const response = await apiClient.get(ENDPOINTS.OMICS_REQUESTS, {
            params: { patient_id: patientId }
        });
        console.log('환자별 분석 목록 조회 성공:', response.data);
        return response.data.results || response.data || [];
    } catch (error) {
        console.error('환자별 분석 목록 조회 실패:', error);
        return [];
    }
};

// 오믹스 요청 상세 정보 조회
const getOmicsRequestDetails = async (requestId) => {
    try {
        console.log('오믹스 요청 상세 조회:', requestId);
        const response = await apiClient.get(`${ENDPOINTS.OMICS_REQUESTS}${requestId}/`);
        console.log('오믹스 요청 상세 조회 성공:', response.data);
        return response;
    } catch (error) {
        console.error('오믹스 요청 상세 조회 실패:', error);
        throw new Error(error.response?.data?.detail || '오믹스 분석 요청 상세 정보 조회에 실패했습니다.');
    }
};

// 환자별 오믹스 요청 목록 조회 (기존 호환성)
const getOmicsRequestsByPatient = (patientId) => {
    if (!patientId) {
        throw new Error('환자 ID가 필요합니다.');
    }
    
    const cleanPatientId = String(patientId).trim();
    console.log('환자별 오믹스 요청 조회 - 환자 ID:', cleanPatientId);
    
    return apiClient.get(ENDPOINTS.OMICS_REQUESTS, {
        params: {
            patient_id: cleanPatientId
        }
    }).then(response => {
        console.log('환자별 오믹스 요청 조회 성공:', response.data);
        return response;
    }).catch(error => {
        console.error('환자별 오믹스 요청 조회 실패:', error);
        throw error;
    });
};

// 파일 URL 처리 함수
const getFileUrl = (filePath) => {
    if (!filePath) return null;
    
    // 이미 전체 URL인 경우
    if (filePath.startsWith('http')) {
        return filePath;
    }
    
    // Django 미디어 URL과 결합
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://35.188.47.40:8000';
    return `${baseUrl}${filePath}`;
};

// 결과 데이터 로드 함수
const loadResultData = async (requestId) => {
    try {
        console.log('결과 데이터 로드 시작:', requestId);
        
        // 1. 먼저 formatted-result API로 메타데이터 가져오기
        const metaResponse = await apiClient.get(`${ENDPOINTS.OMICS_REQUESTS}${requestId}/formatted-result/`);
        const resultMeta = metaResponse.data;
        
        console.log('메타데이터 조회 성공:', resultMeta);
        
        // 2. 실제 결과 파일 URL이 있으면 파일 내용 가져오기
        if (resultMeta.result_file_url) {
            try {
                console.log('결과 파일 로드 시작:', resultMeta.result_file_url);
                const fileResponse = await fetch(resultMeta.result_file_url);
                if (fileResponse.ok) {
                    const contentType = fileResponse.headers.get('content-type');
                    let fileContent;
                    
                    if (contentType && contentType.includes('application/json')) {
                        fileContent = await fileResponse.json();
                    } else {
                        fileContent = await fileResponse.text();
                    }
                    
                    console.log('파일 내용 로드 성공:', fileContent);
                    
                    return {
                        ...resultMeta,
                        fileContent: fileContent
                    };
                }
            } catch (fileError) {
                console.warn('파일 내용 로드 실패:', fileError);
                // 파일 로드 실패해도 메타데이터는 반환
            }
        }
        
        return resultMeta;
    } catch (error) {
        console.error('결과 데이터 로드 실패:', error);
        throw new Error('결과 데이터 로드에 실패했습니다: ' + error.message);
    }
};

// formatted_result API 호출 함수
const getOmicsFormattedResult = async (requestId) => {
    try {
        console.log('포맷된 결과 조회:', requestId);
        const response = await apiClient.get(`${ENDPOINTS.OMICS_REQUESTS}${requestId}/formatted-result/`);
        console.log('포맷된 결과 조회 성공:', response.data);
        return response;
    } catch (error) {
        console.error('포맷된 결과 조회 실패:', error);
        throw new Error(error.response?.data?.detail || '오믹스 포맷된 결과 조회에 실패했습니다.');
    }
};

// 파일 다운로드 함수
const downloadResultFile = async (requestId) => {
    try {
        console.log('결과 파일 다운로드:', requestId);
        const response = await apiClient.get(
            `${ENDPOINTS.OMICS_REQUESTS}${requestId}/download/`,
            { responseType: 'blob' }
        );
        console.log('결과 파일 다운로드 성공');
        return response;
    } catch (error) {
        console.error('결과 파일 다운로드 실패:', error);
        throw new Error('파일 다운로드에 실패했습니다.');
    }
};

// 모델 요구사항 조회
const getModelRequirements = (cancerType) => {
    console.log('모델 요구사항 조회:', cancerType);
    return apiClient.get(`/api/omics/models/${cancerType}/requirements/`);
};

// 사용 가능한 암 유형 조회
const getAvailableCancerTypes = () => {
    console.log('사용 가능한 암 유형 조회');
    return apiClient.get('/api/omics/cancer-types/');
};

// CT 영상 기반 분할 분석 시작
const startAnalysis = (payload) => {
    console.log('분할 분석 시작:', payload);
    return apiClient.post('/api/omics/segmentation/start/', payload);
};

// 디버그 정보 조회
const getDebugInfo = () => {
    console.log('디버그 정보 조회');
    return apiClient.get('/api/omics/debug/');
};

// 모든 함수를 하나의 객체에 담아 export
const OmicsService = {
    // 핵심 분석 플로우
    createOmicsRequest,
    uploadOmicsFile,
    startAnalysisPipeline,
    checkAnalysisStatus,
    getAnalysisResult,
    getPatientAnalyses,
    
    // 상세 정보 조회
    getOmicsRequestDetails,
    getOmicsRequestsByPatient,
    
    // 결과 처리
    getFileUrl,
    loadResultData,
    getOmicsFormattedResult,
    downloadResultFile,
    
    // 기타 기능
    getModelRequirements,
    getAvailableCancerTypes,
    startAnalysis,
    getDebugInfo,

    // 의사 목록에
    getOmicsRequests,
    getOmicsResult,

};

export default OmicsService;
