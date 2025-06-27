// src/services/medicalRecords.service.js
import apiClient from './apiClient';

export const medicalRecordsService = {
  // 진료기록 목록 조회
  getMedicalRecords: async (patientId = '') => {
    try {
      const url = patientId ? `/api/medical-records/?patient_id=${patientId}` : '/api/medical-records/';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || '진료기록 조회 실패');
    }
  },

  // 특정 진료기록 상세 조회
  getMedicalRecordDetail: async (recordId) => {
    try {
      const response = await apiClient.get(`/api/medical-records/${recordId}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || '진료기록 상세 조회 실패');
    }
  },

  // 진료기록 생성 (의료진용)
  createMedicalRecord: async (recordData) => {
    try {
      const response = await apiClient.post('/api/medical-records/', recordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || '진료기록 생성 실패');
    }
  }
};
