// src/services/appointment.service.js
import apiClient from './apiClient';

export const appointmentService = {
  // 예약 생성 - Flutter 환자 지원
  createAppointment: async (appointmentData) => {
    try {
      console.log('예약 생성 요청:', appointmentData);
      
      // ✅ Flutter 환자와 기존 환자 구분 처리
      const processedData = {
        ...appointmentData,
        // Flutter 환자인 경우 flutter_patient 필드 사용
        // 기존 환자인 경우 patient 필드 사용
      };
      
      const response = await apiClient.post('/api/appointments/appointments/', processedData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('예약 생성 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('예약 생성 오류:', error);
      
      if (error.response) {
        console.error('서버 응답 오류:', error.response.data);
        console.error('응답 상태:', error.response.status);
        return {
          success: false,
          error: error.response.data?.error || error.response.data || '예약 생성 실패',
          status: error.response.status,
          details: error.response.data
        };
      } else if (error.request) {
        console.error('네트워크 오류:', error.request);
        return {
          success: false,
          error: '네트워크 연결 오류'
        };
      } else {
        console.error('요청 설정 오류:', error.message);
        return {
          success: false,
          error: error.message || '요청 처리 오류'
        };
      }
    }
  },

  // 예약 목록 조회 - Flutter 환자 포함
  getAppointments: async () => {
    try {
      console.log('예약 목록 조회 중...');
      const response = await apiClient.get('/api/appointments/appointments/');
      console.log('예약 목록 응답:', response.data);
      
      // ✅ Flutter 환자와 기존 환자 정보 통합 처리
      if (response.data.success && response.data.appointments) {
        const processedAppointments = response.data.appointments.map(appointment => ({
          ...appointment,
          patient_type: appointment.patient_source || 'unknown', // flutter, django, unknown
          patient_display_name: appointment.patient_name,
          patient_display_id: appointment.patient_id,
          patient_phone: appointment.patient_phone
        }));
        
        return {
          ...response.data,
          appointments: processedAppointments
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('예약 목록 조회 오류:', error);
      return {
        success: false,
        appointments: [],
        error: error.response?.data?.error || '예약 조회 실패'
      };
    }
  },

  // 의사별 예약 조회 - Flutter 환자 포함
  getDoctorAppointments: async (doctorId) => {
    try {
      console.log(`의사 ID ${doctorId}의 예약 조회 중...`);
      const response = await apiClient.get(`/api/appointments/appointments/doctor_appointments/?doctor_id=${doctorId}`);
      console.log('의사 예약 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('의사 예약 조회 오류:', error);
      return {
        success: false,
        appointments: [],
        error: error.response?.data?.error || '의사 예약 조회 실패'
      };
    }
  },

  // 예약 수정
  updateAppointment: async (appointmentId, appointmentData) => {
    try {
      console.log(`예약 ${appointmentId} 수정 요청:`, appointmentData);
      const response = await apiClient.put(`/api/appointments/appointments/${appointmentId}/`, appointmentData);
      console.log('예약 수정 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('예약 수정 오류:', error);
      return {
        success: false,
        error: error.response?.data?.error || '예약 수정 실패'
      };
    }
  },

  // 예약 삭제
  deleteAppointment: async (appointmentId) => {
    try {
      console.log(`예약 ${appointmentId} 삭제 요청`);
      const response = await apiClient.delete(`/api/appointments/appointments/${appointmentId}/`);
      console.log('예약 삭제 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('예약 삭제 오류:', error);
      return {
        success: false,
        error: error.response?.data?.error || '예약 삭제 실패'
      };
    }
  },

  // 예약 상태 변경
  updateAppointmentStatus: async (appointmentId, status, notes = '') => {
    try {
      console.log(`예약 ${appointmentId} 상태 변경: ${status}`);
      const response = await apiClient.patch(`/api/appointments/appointments/${appointmentId}/update_status/`, { 
        status, 
        notes 
      });
      console.log('예약 상태 변경 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('예약 상태 변경 오류:', error);
      return {
        success: false,
        error: error.response?.data?.error || '예약 상태 변경 실패'
      };
    }
  },

  // 의사 목록 조회 - 기존 accounts API 사용
  getDoctors: async () => {
    try {
      console.log('의사 목록 조회 중...');
      const response = await apiClient.get('/api/accounts/doctors/');
      console.log('의사 목록 조회 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('의사 목록 조회 오류:', error);
      return {
        success: false,
        doctors: [],
        error: error.response?.data?.error || '의사 목록 조회 실패'
      };
    }
  },

  // ✅ 환자 검색 (Flutter + 기존 환자 통합)
  searchPatients: async (searchTerm = '', patientType = 'all') => {
    try {
      console.log(`환자 검색: ${searchTerm}, 타입: ${patientType}`);
      
      const results = {
        success: true,
        patients: [],
        flutter_patients: [],
        total_count: 0
      };

      // Flutter 환자 검색 (patients 앱)
      if (patientType === 'all' || patientType === 'flutter') {
        try {
          const flutterResponse = await apiClient.get('/api/patients/flutter-patients/');
          if (flutterResponse.data.success) {
            let flutterPatients = flutterResponse.data.flutter_patients || [];
            
            // 검색어로 필터링
            if (searchTerm) {
              flutterPatients = flutterPatients.filter(patient => 
                patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.flutter_patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.phone?.includes(searchTerm) ||
                patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
              );
            }
            
            results.flutter_patients = flutterPatients.map(patient => ({
              ...patient,
              patient_type: 'flutter',
              display_name: patient.name,
              display_id: patient.flutter_patient_id,
              search_key: `flutter_${patient.id}`
            }));
          }
        } catch (error) {
          console.warn('Flutter 환자 검색 오류:', error);
        }
      }

      // 기존 환자 검색 (patients 앱)
      if (patientType === 'all' || patientType === 'hospital') {
        try {
          const hospitalResponse = await apiClient.get('/api/patients/profiles/');
          if (hospitalResponse.data) {
            let hospitalPatients = Array.isArray(hospitalResponse.data) ? hospitalResponse.data : [];
            
            // 검색어로 필터링
            if (searchTerm) {
              hospitalPatients = hospitalPatients.filter(patient => 
                patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.openemr_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.phone_number?.includes(searchTerm) ||
                `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
              );
            }
            
            results.patients = hospitalPatients.map(patient => ({
              ...patient,
              patient_type: 'hospital',
              display_name: patient.name || `${patient.first_name} ${patient.last_name}`,
              display_id: patient.openemr_id,
              search_key: `hospital_${patient.id}`
            }));
          }
        } catch (error) {
          console.warn('병원 환자 검색 오류:', error);
        }
      }

      results.total_count = results.patients.length + results.flutter_patients.length;
      
      console.log('환자 검색 결과:', results);
      return results;
    } catch (error) {
      console.error('환자 검색 오류:', error);
      return {
        success: false,
        patients: [],
        flutter_patients: [],
        total_count: 0,
        error: error.response?.data?.error || '환자 검색 실패'
      };
    }
  }
};

export default appointmentService;
