// src/services/flutterPatient.service.js
import apiClient from './apiClient';

export const flutterPatientService = {
  // Flutter 환자 목록 조회 (patients 앱 API로 변경)
  getFlutterPatients: async () => {
    try {
      const response = await apiClient.get('/api/patients/flutter-patients/');
      console.log('Flutter 환자 조회 응답:', response);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          flutter_patients: response.data.flutter_patients || [],
          total_count: response.data.total_count || 0
        };
      } else {
        return {
          success: false,
          flutter_patients: [],
          total_count: 0,
          error: '예상하지 못한 응답 형식입니다.'
        };
      }
    } catch (error) {
      console.error('Flutter 환자 조회 오류:', error);
      
      return {
        success: false,
        flutter_patients: [],
        total_count: 0,
        error: error.response?.data?.error || error.message || 'Flutter 환자 조회 실패'
      };
    }
  },

  // Flutter 환자 상세 조회 (patients 앱 API로 변경)
  getFlutterPatientDetail: async (patientId) => {
    try {
      const response = await apiClient.get(`/api/patients/flutter-patients/${patientId}/`);
      console.log('Flutter 환자 상세 조회 응답:', response);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          patient: response.data.patient
        };
      } else {
        return {
          success: false,
          patient: null,
          error: '환자 정보를 찾을 수 없습니다.'
        };
      }
    } catch (error) {
      console.error('Flutter 환자 상세 조회 오류:', error);
      
      return {
        success: false,
        patient: null,
        error: error.response?.data?.error || error.message || 'Flutter 환자 상세 조회 실패'
      };
    }
  },

  // 회원가입 인증 코드 생성 (기존 - 일반용)
  generateRegistrationCode: async () => {
    try {
      const response = await apiClient.post('/api/patients/registration-codes/generate/');
      console.log('회원가입 코드 생성 응답:', response);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          code: response.data.code,
          expires_at: response.data.expires_at,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: '인증 코드 생성에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('회원가입 코드 생성 오류:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || '회원가입 코드 생성 실패'
      };
    }
  },

  // 특정 병원 환자를 위한 회원가입 인증 코드 생성 (새로 추가)
  generateRegistrationCodeForPatient: async (hospitalPatientId) => {
    try {
      const response = await apiClient.post('/api/patients/registration-codes/generate-for-patient/', {
        hospital_patient_id: hospitalPatientId
      });
      console.log('환자별 회원가입 코드 생성 응답:', response);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          code: response.data.code,
          expires_at: response.data.expires_at,
          hospital_patient: response.data.hospital_patient,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: '인증 코드 생성에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('환자별 회원가입 코드 생성 오류:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || '환자별 회원가입 코드 생성 실패'
      };
    }
  },

  // 병원 환자 목록 조회 (회원가입 코드 생성용) (새로 추가)
  getHospitalPatients: async () => {
    try {
      const response = await apiClient.get('/api/patients/profiles/');
      console.log('병원 환자 목록 조회 응답:', response);
      
      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          patients: response.data
        };
      } else {
        return {
          success: false,
          patients: [],
          error: '예상하지 못한 응답 형식입니다.'
        };
      }
    } catch (error) {
      console.error('병원 환자 목록 조회 오류:', error);
      
      return {
        success: false,
        patients: [],
        error: error.response?.data?.error || error.message || '병원 환자 목록 조회 실패'
      };
    }
  },

  // 환자 프로필 연결용 인증 코드 생성 (기존)
  generateVerificationCode: async (flutterPatientId) => {
    try {
      const response = await apiClient.post('/api/patients/flutter-patients/generate-verification-code/', {
        flutter_patient_id: flutterPatientId
      });
      console.log('인증 코드 생성 응답:', response);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          verification_code: response.data.verification_code,
          expires_at: response.data.expires_at,
          flutter_patient_id: response.data.flutter_patient_id,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: '인증 코드 생성에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('인증 코드 생성 오류:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || '인증 코드 생성 실패'
      };
    }
  },

  // 환자 프로필 연결 (기존)
  linkToPatientProfile: async (flutterPatientId, hospitalPatientId) => {
    try {
      const response = await apiClient.post('/api/patients/flutter-patients/link-profile/', {
        flutter_patient_id: flutterPatientId,
        hospital_patient_id: hospitalPatientId
      });
      console.log('환자 프로필 연결 응답:', response);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          linked_patient: response.data.linked_patient,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: '환자 프로필 연결에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('환자 프로필 연결 오류:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || '환자 프로필 연결 실패'
      };
    }
  }
};
