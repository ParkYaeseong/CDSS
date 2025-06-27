// final_react/src/hooks/usePatients.js
import { useState, useEffect } from 'react';
import { nursingApiService } from '../services/nursingApi';

export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // LIS 서버에서 환자 목록 가져오기
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('LIS 서버에서 환자 목록 요청...');
      const response = await nursingApiService.getPatients();
      console.log('LIS 환자 목록 응답:', response);
      
      const patientData = response.data || [];
      
      // 환자 데이터 정규화
      const processedPatients = patientData.map(patient => ({
        ...patient,
        patient_id: patient.patient_id || patient.id,
        name: patient.name || '이름 없음',
        age: patient.age || 0,
        gender: patient.gender || 'U',
        openemr_id: patient.patient_id || patient.id
      }));
      
      setPatients(processedPatients);
      console.log('LIS 환자 목록 로드 성공:', processedPatients);
    } catch (err) {
      console.error('LIS 환자 목록 로드 실패:', err);
      setError('LIS 서버에서 환자 목록을 불러오는데 실패했습니다.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return { patients, loading, error, fetchPatients };
}
