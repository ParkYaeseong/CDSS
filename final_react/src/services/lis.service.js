import apiClient from './apiClient';
import { ENDPOINTS } from './config';

/**
 * 특정 환자의 검사 결과를 조회합니다.
 * @param {string} patientId - 환자 ID
 */
export const getLabResults = async (patientId) => {
  try {
    const response = await apiClient.get(`${ENDPOINTS.LAB_RESULTS}?patient_id=${patientId}`);
    return response;
  } catch (error) {
    throw new Error(error.detail || '검사 결과 조회에 실패했습니다.');
  }
};