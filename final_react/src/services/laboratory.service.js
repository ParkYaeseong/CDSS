import apiClient from './apiClient';
import { ENDPOINTS } from './config';

/**
 * 검사 오더 목록을 조회합니다.
 * @param {object} params - { status: 'ordered', patient: 'uuid', ... }
 */
export const getLabOrders = async (params = {}) => {
  try {
    const response = await apiClient.get(ENDPOINTS.LAB_ORDERS, { params });
    return response;
  } catch (error) {
    throw new Error(error.detail || '검사 주문 목록을 불러오는데 실패했습니다.');
  }
};

/**
 * 특정 검사 오더의 검체를 채취 처리합니다.
 * @param {string} orderId - 검사 오더 ID
 * @param {object} collectionData - { notes: '...' }
 */
export const collectSample = async (orderId, collectionData) => {
  try {
    // POST /api/laboratory/orders/{orderId}/collect_sample/
    const response = await apiClient.post(
      `${ENDPOINTS.LAB_ORDERS}${orderId}/collect_sample/`, 
      collectionData
    );
    return response;
  } catch (error) {
    throw new Error(error.detail || '검체 채취 처리에 실패했습니다.');
  }
};

/**
 * 특정 검사 오더에 결과를 입력합니다.
 * @param {string} orderId - 검사 오더 ID
 * @param {object} resultData - { result_value, unit, ... }
 */
export const addLabResult = async (orderId, resultData) => {
  try {
    // POST /api/laboratory/orders/{orderId}/add_result/
    const response = await apiClient.post(
      `${ENDPOINTS.LAB_ORDERS}${orderId}/add_result/`,
      resultData
    );
    return response;
  } catch (error) {
    throw new Error(error.detail || '검사 결과 입력에 실패했습니다.');
  }
};

/**
 * 특정 환자의 검사 결과를 조회합니다.
 * @param {string} patientId - 우리 시스템의 PatientProfile UUID
 */
export const getLabResults = async (patientId) => {
  try {
    // 백엔드 API에 patient_id 쿼리 파라미터를 붙여 요청합니다.
    const response = await apiClient.get(`${ENDPOINTS.LAB_RESULTS}?patient_id=${patientId}`);
    return response;
  } catch (error) {
    throw new Error(error.detail || '검사 결과 조회에 실패했습니다.');
  }
};

/**
 * 모든 검사 종류 목록을 조회합니다. (아직 백엔드 미구현)
 */
export const getLabTestTypes = async () => {
  try {
    const response = await apiClient.get(ENDPOINTS.LAB_TEST_TYPES);
    return response;
  } catch (error) {
    throw new Error(error.detail || '검사 종류 목록을 불러오는데 실패했습니다.');
  }
};