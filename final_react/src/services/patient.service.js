// src/services/patient.service.js
import apiClient from './apiClient';
import { ENDPOINTS } from './config';
import { flutterPatientService } from './flutterPatient.service';

// ✅ 환자 프로필 조회 (디버깅 강화)
const getPatientProfiles = async () => {
    try {
        const patientList = await apiClient.get(ENDPOINTS.PATIENT_PROFILES);
        return patientList;
    } catch (error) {
        throw new Error('환자 목록을 불러오는 데 실패했습니다.');
    }
};

// ✅ 통합 환자 조회 (디버깅 추가)
const getAllPatients = async () => {
    try {
        console.log('환자 목록 조회 시작...');
        
        const response = await apiClient.get('/api/patients/profiles/');
        
        // 환자 ID 형태 확인
        if (response.data && response.data.length > 0) {
            console.log('첫 번째 환자 ID:', response.data[0].id);
            console.log('ID 타입:', typeof response.data[0].id);
            console.log('ID 길이:', response.data[0].id.length);
        }
        
        const processedData = response.data.map(patient => ({
            ...patient,
            id: patient.id.toString(), // 문자열로 확실히 변환
            display_name: patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
            type: 'profile',
            source: 'OpenEMR'
        }));
        
        console.log(`환자 목록 처리 완료: 총 ${processedData.length}명`);
        
        return {
            success: true,
            data: processedData,
            stats: { total: processedData.length, profile: processedData.length }
        };
    } catch (error) {
        console.error('환자 목록 조회 오류:', error);
        return { 
            success: false, 
            data: [],
            error: error.message,
            stats: { total: 0, profile: 0 }
        };
    }
};

// ✅ Flutter 환자 목록 조회
const getFlutterPatients = async () => {
    try {
        const response = await flutterPatientService.getFlutterPatients();
        console.log('Flutter 환자 서비스 응답:', response);
        
        return response;
    } catch (error) {
        console.error('Flutter 환자 조회 오류:', error);
        return {
            success: false,
            flutter_patients: [],
            total_count: 0,
            error: error.message || 'Flutter 환자 목록을 불러오는 데 실패했습니다.'
        };
    }
};

// ✅ 환자 타입별 조회
const getPatientsByType = async (type = 'all') => {
    try {
        const allPatientsResponse = await getAllPatients();

        if (!allPatientsResponse.success) {
            throw new Error('환자 데이터 조회 실패');
        }

        let filteredPatients = allPatientsResponse.data;

        switch (type) {
            case 'regular':
            case 'profile':
                filteredPatients = allPatientsResponse.data.filter(p => 
                    p.patient_type === 'regular' || p.type === 'profile'
                );
                break;
            case 'flutter':
                filteredPatients = allPatientsResponse.data.filter(p => 
                    p.patient_type === 'flutter' || p.type === 'flutter'
                );
                break;
            case 'patient':
                filteredPatients = allPatientsResponse.data.filter(p => p.type === 'patient');
                break;
            case 'linked':
                filteredPatients = allPatientsResponse.data.filter(p => p.is_linked === true);
                break;
            case 'unlinked':
                filteredPatients = allPatientsResponse.data.filter(p => 
                    (p.patient_type === 'flutter' || p.type === 'flutter') && !p.is_linked
                );
                break;
            default:
                break;
        }

        console.log(`환자 타입별 조회 완료: ${type} - ${filteredPatients.length}명`);

        return {
            success: true,
            data: filteredPatients,
            total_count: filteredPatients.length,
            filter_type: type,
            stats: allPatientsResponse.stats
        };

    } catch (error) {
        console.error('환자 타입별 조회 오류:', error);
        throw error;
    }
};

// ✅ 환자 검색
const searchPatients = async (searchTerm, type = 'all') => {
    try {
        const patientsResponse = await getPatientsByType(type);

        if (!searchTerm || searchTerm.trim() === '') {
            return patientsResponse;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        const filteredPatients = patientsResponse.data.filter(patient => {
            return (
                patient.name?.toLowerCase().includes(searchLower) ||
                patient.display_name?.toLowerCase().includes(searchLower) ||
                patient.first_name?.toLowerCase().includes(searchLower) ||
                patient.last_name?.toLowerCase().includes(searchLower) ||
                patient.openemr_id?.toLowerCase().includes(searchLower) ||
                patient.email?.toLowerCase().includes(searchLower) ||
                patient.phone_number?.includes(searchTerm) ||
                patient.hospital_patient_id?.toLowerCase().includes(searchLower) ||
                patient.flutter_patient_id?.toLowerCase().includes(searchLower) ||
                patient.username?.toLowerCase().includes(searchLower)
            );
        });

        console.log(`환자 검색 완료: "${searchTerm}" (${type}) - ${filteredPatients.length}명`);

        return {
            success: true,
            data: filteredPatients,
            total_count: filteredPatients.length,
            search_term: searchTerm,
            filter_type: type,
            stats: patientsResponse.stats
        };

    } catch (error) {
        console.error('환자 검색 오류:', error);
        throw new Error(`환자 검색에 실패했습니다: ${error.message}`);
    }
};

// ✅ 환자 ID로 검색
const searchPatientById = async (patientId) => {
    try {
        console.log(`환자 ID 검색: ${patientId}`);
        const response = await apiClient.get(`/api/patients/search/${patientId}/`);
        
        if (response.data && response.data.success) {
            return response.data;
        } else {
            return {
                success: false,
                found_patients: [],
                total_found: 0,
                error: '환자를 찾을 수 없습니다.'
            };
        }
    } catch (error) {
        console.error('환자 ID 검색 오류:', error);
        return {
            success: false,
            found_patients: [],
            total_found: 0,
            error: error.message
        };
    }
};

// ✅ 환자 생성
const createPatientProfile = async (patientData) => {
    try {
        const existingPatients = await apiClient.get(ENDPOINTS.PATIENT_PROFILES);
        const patientList = existingPatients.data || existingPatients || [];

        const numericIds = patientList
            .map(p => parseInt(p.openemr_id))
            .filter(id => !isNaN(id));

        const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
        const nextId = maxId + 1;

        const response = await apiClient.post(ENDPOINTS.PATIENT_PROFILES, {
            openemr_id: nextId.toString(),
            first_name: patientData.fname,
            last_name: patientData.lname,
            date_of_birth: patientData.DOB,
            gender: patientData.sex === 'Male' ? 'MALE' :
                    patientData.sex === 'Female' ? 'FEMALE' : 'OTHER',
            phone_number: patientData.phone_cell || '',
            address: patientData.street || '',
        });
        
        console.log('환자 생성 완료:', response.data);
        return response;
    } catch (error) {
        console.error('API 오류 상세:', error.response?.data);
        throw new Error('환자 생성에 실패했습니다.');
    }
};

// ✅ CT와 Omics 분석 기록을 모두 가져와 합치는 함수
const getCombinedAnalysisHistory = async (patientId) => {
    if (!patientId) return { data: [] };

    console.log(`환자 ${patientId}의 통합 분석 기록 조회 시작...`);

    const diagnosisPromise = apiClient.get(`${ENDPOINTS.DIAGNOSIS_REQUESTS}?patient=${patientId}`)
                                      .catch(e => { 
                                          console.error("CT 분석 기록 조회 오류:", e); 
                                          return { data: [] }; 
                                      });
    const omicsPromise = apiClient.get(`${ENDPOINTS.OMICS_REQUESTS}?patient=${patientId}`)
                                  .catch(e => { 
                                      console.error("Omics 분석 기록 조회 오류:", e); 
                                      return { data: [] }; 
                                  });

    const [diagnosisResponse, omicsResponse] = await Promise.all([diagnosisPromise, omicsPromise]);

    const combinedData = [
        ...(diagnosisResponse.data || []),
        ...(omicsResponse.data || [])
    ];

    combinedData.sort((a, b) => new Date(b.request_timestamp) - new Date(a.request_timestamp));
    
    console.log(`통합 분석 기록 조회 완료: 총 ${combinedData.length}개`);
    return { data: combinedData };
};

// ✅ [추가] 특정 환자의 바이탈 데이터 조회 함수
const getPatientVitals = async (patientId) => {
    // patientId가 없는 경우 오류를 방지하기 위해 빈 배열을 반환합니다.
    if (!patientId) {
        console.log('getPatientVitals: patientId가 제공되지 않았습니다.');
        return { data: [] };
    }
    try {
        console.log(`환자 ${patientId}의 바이탈 데이터 조회 시작...`);
        // Django 백엔드에 정의한 API 엔드포인트를 호출합니다.
        const response = await apiClient.get(`/api/patients/${patientId}/vitals/`);
        console.log('바이탈 데이터 조회 완료:', response.data);
        return response; // 전체 응답을 반환하여 data 속성을 사용할 수 있도록 합니다.
    } catch (error) {
        console.error(`환자 ID ${patientId}의 바이탈 데이터 조회 중 오류 발생:`, error);
        // 오류가 발생해도 앱이 중단되지 않도록 빈 데이터 배열을 포함한 객체를 반환할 수 있습니다.
        return { data: [], error: '바이탈 데이터 조회에 실패했습니다.' };
    }
};


// ✅ Flutter 환자 인증 코드 생성 함수
const generateFlutterVerificationCode = async (patientId) => {
    try {
        console.log(`Flutter 환자 ${patientId}의 인증 코드 생성 요청...`);
        
        const response = await apiClient.post('/api/simple-auth/generate-code/', {
            patient_id: patientId
        });
        
        console.log('인증 코드 생성 응답:', response.data);
        return response.data;
    } catch (error) {
        console.error('인증 코드 생성 오류:', error);
        throw new Error(error.response?.data?.error || '인증 코드 생성에 실패했습니다.');
    }
};

// ✅ 임상 데이터 저장
const saveClinicalData = async (patientId, clinicalData) => {
    try {
        console.log(`환자 ${patientId}의 임상 데이터 저장 요청...`, clinicalData);
        const response = await apiClient.post(`/api/patients/${patientId}/clinical-data/`, clinicalData);
        console.log('임상 데이터 저장 완료:', response.data);
        return response.data;
    } catch (error) {
        console.error('임상 데이터 저장 오류:', error);
        throw new Error(error.response?.data?.error || '임상 데이터 저장에 실패했습니다.');
    }
};

// ✅ 임상 데이터 목록 조회
const getClinicalData = async (patientId) => {
    try {
        console.log(`환자 ${patientId}의 임상 데이터 목록 조회...`);
        const response = await apiClient.get(`/api/patients/${patientId}/clinical-data/list/`);
        console.log('임상 데이터 목록 조회 완료:', response.data);
        return response.data;
    } catch (error) {
        console.error('임상 데이터 조회 오류:', error);
        throw new Error(error.response?.data?.error || '임상 데이터 조회에 실패했습니다.');
    }
};

// ✅ 임상 데이터 상세 조회
const getClinicalDataDetail = async (patientId, clinicalDataId) => {
    try {
        console.log(`환자 ${patientId}의 임상 데이터 ${clinicalDataId} 상세 조회...`);
        const response = await apiClient.get(`/api/patients/${patientId}/clinical-data/${clinicalDataId}/`);
        console.log('임상 데이터 상세 조회 완료:', response.data);
        return response.data;
    } catch (error) {
        console.error('임상 데이터 상세 조회 오류:', error);
        throw new Error(error.response?.data?.error || '임상 데이터 상세 조회에 실패했습니다.');
    }
};

// ✅ 임상 데이터 삭제
const deleteClinicalData = async (patientId, clinicalDataId) => {
    try {
        console.log(`환자 ${patientId}의 임상 데이터 ${clinicalDataId} 삭제...`);
        const response = await apiClient.delete(`/api/patients/${patientId}/clinical-data/${clinicalDataId}/delete/`);
        console.log('임상 데이터 삭제 완료:', response.data);
        return response.data;
    } catch (error) {
        console.error('임상 데이터 삭제 오류:', error);
        throw new Error(error.response?.data?.error || '임상 데이터 삭제에 실패했습니다.');
    }
};

// ✅ default export 방식으로 통일
export default {
    getPatientProfiles,
    getFlutterPatients,
    getAllPatients,
    getPatientsByType,
    searchPatients,
    searchPatientById,
    createPatientProfile,
    getPatientVitals,
    getCombinedAnalysisHistory,
    generateFlutterVerificationCode,
    saveClinicalData,
    getClinicalData,
    getClinicalDataDetail,
    deleteClinicalData,
};
