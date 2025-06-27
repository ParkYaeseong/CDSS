// src/services/patientMapping.service.js (새로 생성)
export const patientMappingService = {
  // 환자 ID를 표준화
  normalizePatientId: (patient) => {
    if (patient.source === 'openemr') {
      return patient.openemr_id || patient.id || `openemr_${patient.uuid}`;
    } else if (patient.source === 'flutter') {
      return patient.flutter_patient_id || patient.patient_id || `flutter_${patient.id}`;
    }
    return patient.id || `unknown_${Date.now()}`;
  },

  // 환자 검색 시 모든 ID 형태로 검색
  searchPatientByAnyId: (patients, searchId) => {
    return patients.find(p => 
      p.openemr_id === searchId ||
      p.flutter_patient_id === searchId ||
      p.patient_id === searchId ||
      p.id === searchId ||
      p.unique_id === searchId
    );
  },

  // 환자 연결 상태 확인
  checkPatientLinkStatus: (patient) => {
    if (patient.source === 'flutter') {
      return {
        is_linked: !!patient.linked_patient,
        linked_to: patient.linked_patient?.patient_id || null,
        link_type: 'flutter_to_openemr'
      };
    }
    return {
      is_linked: false,
      linked_to: null,
      link_type: null
    };
  }
};
