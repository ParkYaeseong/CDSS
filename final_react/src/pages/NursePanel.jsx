import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, CircularProgress, Typography, AppBar, Toolbar, IconButton, 
  Badge, Avatar, List, ListItemButton, Collapse, Card, CardContent,
  Grid, Select, MenuItem, Button, Alert, Paper
} from '@mui/material';
import {
  Phone, Schedule, Person, Notifications, Help, Settings, 
  ExitToApp, LocalHospital, History, CloudUpload, Assignment, 
  Inbox, ExpandLess, ExpandMore
} from '@mui/icons-material';

import { getLabOrders, collectSample, addLabResult } from '../services/laboratory.service'; 
import PatientService from '../services/patient.service';
import { usePatients } from '../hooks/usePatients';

// 컴포넌트 imports
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

// 간호사 전용 색상 체계 (핑크색 유지)
const themeColor = '#E0969F';

export default function NursePanel() {
  // 메인 탭 상태
  const [activeMainTab, setActiveMainTab] = useState('nursing-list');
  
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

  // 히스토리 관련 상태
  const [openHistory, setOpenHistory] = useState(false);
  
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

  const fetchPatients = async () => {
    try {
      setIsPatientLoading(true);
      console.log('환자 목록 조회 시작...');
      
      const response = await PatientService.getAllPatients();
      
      if (response.success) {
        if (response.data && response.data.length > 0) {
          console.log('첫 번째 환자 ID:', response.data[0].id);
          console.log('ID 타입:', typeof response.data[0].id);
          console.log('ID 길이:', response.data[0].id.length);
        }
        
        const processedData = response.data.map(patient => ({
          ...patient,
          id: patient.id.toString(),
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
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
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
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
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
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <NursingLogList selectedPatient={selectedPatientForNursing} />
          </Box>
        );
      
      case 'nursing-patients':
        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
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
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
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
          <Inbox 
            labOrders={labOrders}
            nursingPatients={nursingPatients}
          />
        );
    }
  };

  // 메뉴 정의
  const menus = [
    { label: '간호일지 목록', icon: <Inbox />, description: '작성된 간호일지 조회', id: 'nursing-list' },
    { label: '간호일지 작성', icon: <CloudUpload />, description: 'AI 기반 간호일지 작성', id: 'nursing-form' },
    { label: '임상데이터 입력', icon: <Assignment />, description: '환자 임상정보 입력', id: 'clinical-data-input' },
    { label: '오믹스 분석', icon: <CloudUpload />, description: '오믹스 분석 요청', id: 'omics-analysis' },
    { label: '오믹스 결과 목록', icon: <LocalHospital />, description: '오믹스 분석 결과 조회', id: 'lab-management' }
  ];
  
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
        <CircularProgress sx={{ color: themeColor }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa'
    }}>
      {/* 전문적인 헤더 */}
      <AppBar position="static" sx={{ bgcolor: '#ffffff', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* 병원 로고 및 정보 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalHospital sx={{ fontSize: 40, color: themeColor }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: themeColor }}>
                MEORING
              </Typography>
              <Typography variant="body2" color="#666">
                간호부 | 간호 관리 시스템
              </Typography>
            </Box>
          </Box>

          {/* 응급연락처 및 사용자 정보 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#fff3cd', borderRadius: 2 }}>
              <Phone sx={{ color: '#856404', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="#856404" fontWeight="bold">
                  간호부 직통
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="#856404">
                  2539-0599
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton>
                <Badge badgeContent={5} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton>
                <Help />
              </IconButton>
              <Avatar sx={{ bgcolor: themeColor, width: 32, height: 32 }}>
                배
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  배은정 수간호사
                </Typography>
                <Typography variant="caption" color="#666">
                  간호부
                </Typography>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 메인 컨텐츠 */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* 사이드바 - 240px 고정 */}
        <Box sx={{ 
          width: 240,
          flexShrink: 0,
          bgcolor: themeColor, 
          color: 'white', 
          p: 2,
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          minWidth: 240,
          maxWidth: 240,
          overflow: 'auto'
        }}>
          {/* 진료과 정보 */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              간호부
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
              간호 관리 시스템
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Schedule sx={{ fontSize: 16 }} />
              <Typography variant="caption">
                근무시간: 24시간 3교대
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 16 }} />
              <Typography variant="caption">
                당직: 배은정 수간호사 
                <br />
                (내선 3456)
              </Typography>
            </Box>
          </Box>

          <List sx={{ p: 0 }}>
            {menus.map(menu => (
              <ListItemButton 
                key={menu.id} 
                selected={activeMainTab === menu.id} 
                onClick={() => setActiveMainTab(menu.id)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  p: 2,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    }
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {menu.icon}
                    <Typography fontWeight="600" fontSize="0.9rem">{menu.label}</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5 }}>
                    {menu.description}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
            
            <Collapse in={openHistory} timeout="auto" unmountOnExit>
              <List dense sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ p: 2, opacity: 0.7, textAlign: 'center' }}>
                  간호 기록이 없습니다
                </Typography>
              </List>
            </Collapse>
          </List>
        </Box>

        {/* 메인 컨텐츠 영역 - 사이드바 240px 제외한 나머지 공간 */}
        <Box sx={{ 
          flex: 1,
          width: 'calc(100vw - 240px)',
          maxWidth: 'calc(100vw - 240px)',
          overflow: 'auto',
          bgcolor: '#f8f9fa'
        }}>
          <Box sx={{ p: 3 }}>
            {pageError && (
              <Alert 
                severity="error" 
                onClose={() => setPageError('')}
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {pageError}
              </Alert>
            )}

            {renderMainTabContent()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
