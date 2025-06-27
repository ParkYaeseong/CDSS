// final_react/src/pages/NursePanel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

import { getLabOrders, collectSample, addLabResult } from '../services/laboratory.service'; 
import PatientService from '../services/patient.service';
import { usePatients } from '../hooks/usePatients';

// 컴포넌트 imports
import LeftSidebar from '../components/nursing/layout/LeftSidebar';
import NursingDashboard from '../components/nursing/dashboard/NursingDashboard';
import MedicationManagement from '../components/nursing/medication/MedicationManagement';
import CalendarManagement from '../components/nursing/calendar/CalendarManagement';
import WoundCareManagement from '../components/nursing/wound/WoundCareManagement';
import PatientEducation from '../components/nursing/education/PatientEducation';
import OmicsAnalysis from '../components/nursing/omics/OmicsAnalysis';
import NursingLogForm from '../components/nursing/forms/NursingLogForm';
import NursingLogList from '../components/nursing/lists/NursingLogList';
import PatientList from '../components/nursing/lists/PatientList';
import LabManagement from '../components/nursing/lab/LabManagement';
import ClinicalDataForm from '../components/clinical/ClinicalDataForm';

import '../styles/MedicalDashboard.css';

export default function NursePanel() {
  // 메인 탭 상태
  const [activeMainTab, setActiveMainTab] = useState('dashboard');
  
  // 검사실 관리 상태들
  const [patients, setPatients] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('ordered');
  const [isPatientLoading, setIsPatientLoading] = useState(true);
  const [isOrderLoading, setIsOrderLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [collectionNotes, setCollectionNotes] = useState('');
  const [resultForm, setResultForm] = useState({ result_value: '', reference_range: '', unit: '' });

  const [selectedPatientForOmics, setSelectedPatientForOmics] = useState('');

  // 간호일지 관련 상태들
  const [selectedPatientForNursing, setSelectedPatientForNursing] = useState('');
  const [nursingLoading, setNursingLoading] = useState(false);
  
  // 오믹스 분석 상태들
  const [selectedFiles, setSelectedFiles] = useState({
    'RNA-seq': null,
    'Methylation': null,
    'Mutation': null,
    'CNV': null,
    'miRNA': null
  });
  
  const { patients: nursingPatients, fetchPatients: fetchNursingPatients } = usePatients();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
    fetchNursingPatients();
  }, []);

  const fetchLabOrders = async () => {
    try {
      setIsOrderLoading(true);
      const orderResponse = await getLabOrders({ status: selectedStatus });
      setLabOrders(orderResponse.data.results || []);
    } catch (err) {
      console.error("검사 오더 로딩 실패:", err.message);
      setLabOrders([]);
    } finally {
      setIsOrderLoading(false);
    }
  };

  useEffect(() => {
    if(!isPatientLoading) { 
        fetchLabOrders();
    }
  }, [selectedStatus, isPatientLoading]); 

  // 첫 번째 코드의 getAllPatients 함수를 사용한 fetchPatients
  const fetchPatients = async () => {
    try {
      setIsPatientLoading(true);
      console.log('환자 목록 조회 시작...');
      
      const response = await PatientService.getAllPatients();
      
      if (response.success) {
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
        
        setPatients(processedData);
        console.log(`환자 목록 처리 완료: 총 ${processedData.length}명`);
      } else {
        throw new Error(response.error || '환자 목록 조회 실패');
      }
    } catch (err) {
      console.error('환자 목록 조회 오류:', err);
      setPageError(err.message || '환자 목록을 불러오는 데 실패했습니다.');
      setPatients([]);
    } finally {
      setIsPatientLoading(false);
    }
  };
  
  const handleRefresh = () => {
    fetchPatients();
    fetchNursingPatients();
  };

  // 메인 탭 렌더링
  const renderMainTabContent = () => {
    const commonProps = {
      patients: nursingPatients,
      onRefresh: fetchNursingPatients
    };

    switch (activeMainTab) {
      case 'dashboard':
        return (
          <NursingDashboard 
            labOrders={labOrders}
            nursingPatients={nursingPatients}
          />
        );
      
      case 'clinical-data-input':
        return (
          <Box sx={{ width: '100%', height: '100vh', overflow: 'auto' }}>
            <ClinicalDataForm 
              autoSelectDefaults={true}
              onSave={(data) => {
                console.log('임상 데이터 저장됨:', data);
                alert('임상 데이터가 성공적으로 저장되었습니다!');
              }}
            />
          </Box>
        );
        
      case 'nursing-form':
        return (
          <Box sx={{ width: '100%', height: '100vh', overflow: 'auto' }}>
            <NursingLogForm 
              patients={nursingPatients}
              selectedPatient={selectedPatientForNursing}
              onSuccess={() => setActiveMainTab('nursing-list')}
              setLoading={setNursingLoading}
            />
          </Box>
        );
      
      case 'nursing-list':
        return (
          <Box sx={{ width: '100%', height: '100vh', overflow: 'auto' }}>
            <NursingLogList selectedPatient={selectedPatientForNursing} />
          </Box>
        );
      
      case 'nursing-patients':
        return (
          <Box sx={{ width: '100%', height: '100vh', overflow: 'auto' }}>
            <PatientList {...commonProps} />
          </Box>
        );
      
      case 'medication-management':
        return <MedicationManagement {...commonProps} />;
      
      case 'wound-care':
        return <WoundCareManagement {...commonProps} />;
      
      case 'patient-education':
        return <PatientEducation {...commonProps} />;
      
      case 'calendar':
        return <CalendarManagement />;
      
      case 'omics-analysis':
        return (
          <Box sx={{ width: '100%', height: '100vh', overflow: 'auto' }}>
            <OmicsAnalysis 
              patients={patients}
              selectedPatientForOmics={selectedPatientForOmics}
              setSelectedPatientForOmics={setSelectedPatientForOmics}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />
          </Box>
        );
      
      case 'lab-management':
        return (
          <LabManagement
            labOrders={labOrders}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            isOrderLoading={isOrderLoading}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            setShowCollectionModal={setShowCollectionModal}
            setShowResultModal={setShowResultModal}
            showCollectionModal={showCollectionModal}
            showResultModal={showResultModal}
            collectionNotes={collectionNotes}
            setCollectionNotes={setCollectionNotes}
            resultForm={resultForm}
            setResultForm={setResultForm}
            handleCollectSample={handleCollectSample}
            handleAddResult={handleAddResult}
          />
        );
      
      default:
        return (
          <NursingDashboard 
            labOrders={labOrders}
            nursingPatients={nursingPatients}
          />
        );
    }
  };

  // 핸들러 함수들
  const handleCollectSample = async () => {
    if(!selectedOrder) return;
    try {
      await collectSample(selectedOrder.id, { notes: collectionNotes });
      setShowCollectionModal(false);
      setCollectionNotes('');
      fetchLabOrders();
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleAddResult = async () => {
    if(!selectedOrder) return;
    try {
      await addLabResult(selectedOrder.id, resultForm);
      setShowResultModal(false);
      setResultForm({ result_value: '', reference_range: '', unit: '' });
      fetchLabOrders();
    } catch (err) {
      console.error(err.message);
    }
  };
  
  if (pageError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">오류: {pageError}</Typography>
      </Box>
    );
  }
  
  if (isPatientLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: '#E0969F' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#f9fafb' }}>
      {/* 좌측 사이드바 */}
      <LeftSidebar selectedMenu={activeMainTab} onMenuSelect={setActiveMainTab} />
      
      {/* 메인 콘텐츠 영역 */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {renderMainTabContent()}
      </Box>
    </Box>
  );
}
