import apiClient from './apiClient';
import { ENDPOINTS } from './config';

/**
 * 주어진 약물 목록의 상호작용(병용금기) 정보를 백엔드에 요청합니다.
 * @param {string[]} drugList - 약물 이름 배열. 예: ['아스피린', '와파린']
 * @returns {Promise<object>} 상호작용 검사 결과 객체 (실제 응답 데이터)
 */
export const checkDrugInteraction = async (drugList) => {
  try {
    const response = await apiClient.post(ENDPOINTS.DRUG_INTERACTION_CHECK, { drugs: drugList });
    return response.data; 
  } catch (error) {
    console.error("Error in checkDrugInteraction service:", error);
    throw error;
  }
};

/**
 * 약물명으로 검색하여 약물 목록을 가져옵니다.
 * @param {string} searchQuery - 검색할 약물명
 * @returns {Promise<Array>} 검색된 약물 목록 배열
 */
export const searchDrugs = async (searchQuery) => {
  try {
    const response = await apiClient.get(ENDPOINTS.DRUG_SEARCH, {
      params: { q: searchQuery, limit: 20 }
    });
    return response.data;
  } catch (error) {
    console.error("Error in searchDrugs service:", error);
    throw error;
  }
};

/**
 * 단일 약물의 병용금기 정보를 조회합니다.
 * @param {string} drugName - 약물명
 * @returns {Promise<object>} 병용금기 정보
 */
export const getDrugContraindications = async (drugName) => {
  try {
    const response = await apiClient.post(ENDPOINTS.DRUG_INTERACTION_CHECK, { drugs: [drugName] });
    return response.data;
  } catch (error) {
    console.error("Error in getDrugContraindications service:", error);
    throw error;
  }
};

/**
 * 처방전을 서버에 저장합니다.
 * @param {object} prescriptionData - 처방전 데이터
 * @returns {Promise<object>} 저장 결과
 */
export const savePrescription = async (prescriptionData) => {
  try {
    const response = await apiClient.post(ENDPOINTS.PRESCRIPTION_SAVE, prescriptionData);
    return response.data;
  } catch (error) {
    console.error("Error in savePrescription service:", error);
    throw error;
  }
};

export const getPatientPrescriptions = async (patientId) => {
  try {
    const response = await apiClient.get(ENDPOINTS.PRESCRIPTION_LIST, {
      params: { patient_id: patientId }
    });
    return response.data;
  } catch (error) {
    console.error("Error in getPatientPrescriptions service:", error);
    throw error;
  }
};