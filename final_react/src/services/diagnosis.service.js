import apiClient from './apiClient';
import { ENDPOINTS } from './config';

/**
 * DICOM 파일을 서버에 업로드하여 AI 분석을 요청합니다.
 * @param {string} patientId - 분석을 요청할 환자의 ID (DB UUID 또는 EMR ID)
 * @param {FileList | File[]} files - 사용자가 선택한 DICOM 파일 리스트 또는 ZIP 파일
 * @returns {Promise<object>} - 서버로부터 받은 AI 분석 요청 결과 데이터
 */
const uploadDicomFiles = (patientId, files) => {
    const formData = new FormData();
    formData.append('patient', patientId);

    for (const file of files) {
        formData.append('dicom_files', file);
    }
    
    return apiClient.post(ENDPOINTS.PACS_UPLOAD, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

/**
 * 특정 환자의 CT 분석 기록 목록만 가져옵니다.
 * @param {string} patientId - 환자의 UUID
 * @returns {Promise<Array>} - 해당 환자의 CT 분석 기록 배열
 */
const getAnalysisHistory = (patientId) => {
    return apiClient.get(`${ENDPOINTS.DIAGNOSIS_REQUESTS}?patient=${patientId}`);
};

/**
 * 모든 CT 진단 요청 목록을 가져옵니다.
 * @returns {Promise<Array>} - 진단 요청 객체의 배열
 */
const getDiagnosisRequestList = () => {
    return apiClient.get(ENDPOINTS.DIAGNOSIS_REQUESTS);
};

/**
 * 특정 CT 진단 요청의 상세 정보를 가져옵니다.
 * @param {string} id - 진단 요청의 UUID
 * @returns {Promise<object>} - 진단 요청 상세 정보 객체
 */
const getDiagnosisRequestDetail = (id) => {
    return apiClient.get(`${ENDPOINTS.DIAGNOSIS_REQUESTS}${id}/`);
};

/**
 * [신규 추가] 특정 분석 시작을 요청하는 API를 호출합니다.
 * @param {object} data - { diagnosis_request_id: string, analysis_type: string }
 * @returns {Promise<object>}
 */
const startSpecificAnalysis = (data) => {
    // pacs_integration/urls.py에 정의한 주소를 호출합니다.
    return apiClient.post('/api/pacs/start-analysis/', data);
};

const getCurrentCTRequest = (patientId) => {
    return apiClient.get(`${ENDPOINTS.DIAGNOSIS_REQUESTS}current/?patient=${patientId}`);
};

// 위 함수들을 하나의 서비스 객체로 묶어서 내보냅니다.
const DiagnosisService = {
    uploadDicomFiles,
    getAnalysisHistory,
    getDiagnosisRequestList,
    getDiagnosisRequestDetail,
    startSpecificAnalysis, // [수정] 이 함수를 여기에 추가해야 합니다.
    getCurrentCTRequest,
};

export default DiagnosisService;
