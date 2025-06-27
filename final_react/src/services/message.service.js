// src/services/message.service.js
import apiClient from './apiClient';

export const messageService = {
  // 메시지 목록 조회
  // src/services/message.service.js의 getMessages 메서드에 디버깅 추가
  getMessages: async () => {
    try {
      console.log('메시지 목록 조회 API 호출...');
      const response = await apiClient.get('/api/messages/list/');
      console.log('메시지 목록 응답 상태:', response.status);
      console.log('메시지 목록 응답 전체:', response.data);
      
      // ✅ 응답 구조 상세 로그
      if (response.data.success) {
        console.log('받은 메시지 수:', response.data.messages?.received?.length || 0);
        console.log('보낸 메시지 수:', response.data.messages?.sent?.length || 0);
        console.log('읽지 않은 메시지 수:', response.data.unread_count || 0);
        
        // 첫 번째 메시지 구조 확인
        if (response.data.messages?.received?.length > 0) {
          console.log('첫 번째 받은 메시지 구조:', response.data.messages.received[0]);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('메시지 조회 API 오류:', error);
      console.error('오류 응답:', error.response?.data);
      throw new Error(error.response?.data?.error || '메시지 조회 실패');
    }
  },


  // 메시지 전송
  sendMessage: async (messageData) => {
    try {
      console.log('메시지 전송 API 호출:', messageData);
      const response = await apiClient.post('/api/messages/send/', messageData);
      console.log('메시지 전송 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('메시지 전송 API 오류:', error);
      throw new Error(error.response?.data?.error || '메시지 전송 실패');
    }
  },

  // 메시지 읽음 처리
  markAsRead: async (messageId) => {
    try {
      console.log(`메시지 읽음 처리 API 호출: ${messageId}`);
      const response = await apiClient.put(`/api/messages/${messageId}/read/`);
      console.log('메시지 읽음 처리 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('메시지 읽음 처리 API 오류:', error);
      throw new Error(error.response?.data?.error || '메시지 읽음 처리 실패');
    }
  },

  // ✅ 사용자 검색 - Flutter 환자 포함 (수정됨)
  searchUsers: async (userType = '', searchTerm = '') => {
    try {
      console.log(`사용자 검색: 타입=${userType}, 검색어=${searchTerm}`);
      
      const results = {
        success: true,
        users: [],
        total_count: 0,
        search_term: searchTerm,
        user_type_filter: userType
      };

      // 의료진 및 스태프 검색 (accounts 앱)
      if (!userType || userType === 'doctor' || userType === 'nurse' || userType === 'admin' || userType === 'staff') {
        try {
          const params = new URLSearchParams();
          if (userType && ['doctor', 'nurse', 'admin', 'staff'].includes(userType)) {
            params.append('user_type', userType);
          }
          if (searchTerm) params.append('search', searchTerm);
          
          const medicalStaffUrl = `/api/messages/users/search/?${params.toString()}`;
          console.log('의료진 검색 API 호출:', medicalStaffUrl);
          
          const medicalResponse = await apiClient.get(medicalStaffUrl);
          if (medicalResponse.data.success) {
            results.users.push(...(medicalResponse.data.users || []));
          }
        } catch (error) {
          console.warn('의료진 검색 오류:', error);
        }
      }

      // Flutter 환자 검색 (patients 앱) - userType이 'patient'이거나 전체 검색일 때
      if (!userType || userType === 'patient') {
        try {
          const flutterResponse = await apiClient.get('/api/patients/flutter-patients/');
          if (flutterResponse.data.success) {
            let flutterPatients = flutterResponse.data.flutter_patients || [];
            
            // 검색어로 필터링
            if (searchTerm) {
              flutterPatients = flutterPatients.filter(patient => 
                patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.user_info?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.user_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.user_info?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.user_info?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
              );
            }
            
            // Flutter 환자를 사용자 형식으로 변환
            const flutterUsers = flutterPatients.map(patient => ({
              id: patient.user_info?.id || patient.id, // 실제 User ID 사용
              username: patient.user_info?.username || '',
              name: patient.name || patient.user_info?.full_name || '',
              user_type: 'patient',
              email: patient.user_info?.email || '',
              first_name: patient.user_info?.first_name || '',
              last_name: patient.user_info?.last_name || '',
              // 추가 정보
              flutter_patient_id: patient.flutter_patient_id,
              phone_number: patient.phone,
              source: 'flutter' // 구분을 위한 필드
            }));
            
            results.users.push(...flutterUsers);
          }
        } catch (error) {
          console.warn('Flutter 환자 검색 오류:', error);
        }
      }

      // 중복 제거 (같은 user ID를 가진 경우)
      const uniqueUsers = results.users.reduce((acc, user) => {
        const existingUser = acc.find(u => u.id === user.id);
        if (!existingUser) {
          acc.push(user);
        }
        return acc;
      }, []);

      results.users = uniqueUsers;
      results.total_count = uniqueUsers.length;
      
      console.log('통합 사용자 검색 결과:', results);
      return results;
    } catch (error) {
      console.error('사용자 검색 API 오류:', error);
      throw new Error(error.response?.data?.error || '사용자 검색 실패');
    }
  },

  // ✅ 의료진만 검색 (기존 API 사용)
  searchMedicalStaff: async (userType = '', searchTerm = '') => {
    try {
      const params = new URLSearchParams();
      if (userType && ['doctor', 'nurse', 'admin', 'staff'].includes(userType)) {
        params.append('user_type', userType);
      }
      if (searchTerm) params.append('search', searchTerm);
      
      const url = `/api/messages/users/search/?${params.toString()}`;
      console.log('의료진 검색 API 호출:', url);
      
      const response = await apiClient.get(url);
      console.log('의료진 검색 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('의료진 검색 API 오류:', error);
      throw new Error(error.response?.data?.error || '의료진 검색 실패');
    }
  },

  // ✅ Flutter 환자만 검색
  searchFlutterPatients: async (searchTerm = '') => {
    try {
      console.log('Flutter 환자 검색:', searchTerm);
      
      const response = await apiClient.get('/api/patients/flutter-patients/');
      if (!response.data.success) {
        throw new Error('Flutter 환자 조회 실패');
      }
      
      let flutterPatients = response.data.flutter_patients || [];
      
      // 검색어로 필터링
      if (searchTerm) {
        flutterPatients = flutterPatients.filter(patient => 
          patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.user_info?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.user_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.flutter_patient_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // 사용자 형식으로 변환
      const users = flutterPatients.map(patient => ({
        id: patient.user_info?.id || patient.id,
        username: patient.user_info?.username || '',
        name: patient.name || patient.user_info?.full_name || '',
        user_type: 'patient',
        email: patient.user_info?.email || '',
        first_name: patient.user_info?.first_name || '',
        last_name: patient.user_info?.last_name || '',
        flutter_patient_id: patient.flutter_patient_id,
        source: 'flutter'
      }));
      
      return {
        success: true,
        users,
        total_count: users.length,
        search_term: searchTerm,
        user_type_filter: 'patient'
      };
    } catch (error) {
      console.error('Flutter 환자 검색 오류:', error);
      throw new Error(error.response?.data?.error || 'Flutter 환자 검색 실패');
    }
  }
};

export default messageService;
