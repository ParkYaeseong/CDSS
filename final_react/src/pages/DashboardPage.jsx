//src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CircularProgress, AppBar, Toolbar, Typography, Avatar, 
  IconButton, Badge
} from '@mui/material';
import {
  LocalHospital, Notifications, Phone
} from '@mui/icons-material';

import PatientService from '../services/patient.service.js';
import DiagnosisService from '../services/diagnosis.service';
import { getPatientPrescriptions } from '../services/cdss.service.js';

// 컴포넌트 imports
import LeftSidebar from '../components/dashboard/LeftSidebar';
import PatientDropdown from '../components/dashboard/PatientDropdown';
import DashboardContent from '../components/dashboard/DashboardContent';
import PatientManagementContent from '../components/dashboard/PatientManagementContent';
import ClinicalPredictionContent from '../components/dashboard/ClinicalPredictionContent';
import CalendarContent from '../components/dashboard/CalendarContent';
import DrugInteractionContent from '../components/dashboard/DrugInteractionContent';
import PaperSearchContent from '../components/dashboard/PaperSearchContent';
import NursingContent from '../components/dashboard/NursingContent';
import LabContent from '../components/dashboard/LabContent';

// 색상 테마
const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6',
  accent: '#5eead4',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceHover: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    light: '#94a3b8'
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#007C80'
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [ctLoading, setCTLoading] = useState(false);
  const [ctError, setCTError] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showAnalysisSelector, setShowAnalysisSelector] = useState(false);

  // 환자 데이터 가져오기
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await PatientService.getPatientProfiles();
        const patientData = response.data || [];
        
        const sortedPatients = [...patientData].sort((a, b) => {
          const idA = a.openemr_id;
          const idB = b.openemr_id;
          
          const isNumericA = /^\d+$/.test(idA);
          const isNumericB = /^\d+$/.test(idB);
          
          if (isNumericA && isNumericB) {
            return parseInt(idA) - parseInt(idB);
          }
          
          if (isNumericA && !isNumericB) {
            return -1;
          }
          
          if (!isNumericA && isNumericB) {
            return 1;
          }
          
          return idA.localeCompare(idB);
        });
        
        setPatients(sortedPatients);
        
        if (sortedPatients.length > 0) {
          setSelectedPatient(sortedPatients[0]);
        }
      } catch (err) {
        console.error('API 호출 실패:', err);
        setPatients([]);
        setSelectedPatient(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // 환자 선택 시 분석기록 가져오기
  useEffect(() => {
    if (!selectedPatient) {
      setAnalysisHistory([]);
      setSelectedAnalysis(null);
      setShowAnalysisSelector(false);
      return;
    }

    const fetchAnalysisHistory = async () => {
      setCTLoading(true);
      try {
        const response = await DiagnosisService.getAnalysisHistory(selectedPatient.id);
        
        if (response?.data && response.data.length > 0) {
          setAnalysisHistory(response.data);
          setShowAnalysisSelector(true);
        } else {
          setAnalysisHistory([]);
          setShowAnalysisSelector(false);
        }
      } catch (err) {
        console.error("분석기록 조회 실패:", err);
        setAnalysisHistory([]);
        setShowAnalysisSelector(false);
      } finally {
        setCTLoading(false);
      }
    };

    fetchAnalysisHistory();
  }, [selectedPatient]);

  // 분석 선택 시 CT 뷰어 업데이트
  useEffect(() => {
    if (selectedAnalysis) {
      setCurrentRequest(selectedAnalysis);
    }
  }, [selectedAnalysis]);

  // CT 요청 상태 폴링
  useEffect(() => {
    let interval;
    
    if (!selectedPatient) {
      return;
    }
    
    const isProcessing = currentRequest && 
      ['PROCESSING', 'QUEUED', 'RECEIVED', 'PENDING'].includes(currentRequest.status);

    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const response = await DiagnosisService.getCurrentCTRequest(selectedPatient.id);
          const updatedRequest = response.data;
          
          setCurrentRequest(updatedRequest);
          
          const allCompletedOrFailed = !['PROCESSING', 'QUEUED', 'RECEIVED', 'PENDING'].includes(updatedRequest.status);
          if (allCompletedOrFailed) {
            clearInterval(interval);
          }
        } catch (error) {
          console.error('CT 상태 업데이트 실패:', error);
          clearInterval(interval);
        }
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentRequest, selectedPatient]);

  // 메뉴별 컨텐츠 렌더링 함수
  const renderMainContent = () => {
    const commonProps = {
      selectedPatient,
      patients,
      onPatientSelect: setSelectedPatient,
      currentRequest,
      ctLoading,
      ctError,
      analysisHistory,
      selectedAnalysis,
      onAnalysisSelect: setSelectedAnalysis,
      showAnalysisSelector,
      onMenuChange: setSelectedMenu
    };

    switch (selectedMenu) {
      case 'dashboard':
        return <DashboardContent {...commonProps} />;
      case 'patients':
        return <PatientManagementContent {...commonProps} />;
      case 'clinical-prediction':
        return <ClinicalPredictionContent {...commonProps} />;
      case 'calendar':
        return <CalendarContent {...commonProps} />;
      case 'drug-interaction':
        return <DrugInteractionContent {...commonProps} />;
      case 'paper-search':
        return <PaperSearchContent />;
      case 'nursing':
        return <NursingContent {...commonProps} />;
      case 'lab':
        return <LabContent {...commonProps} />;
      default:
        return <DashboardContent {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: THEME_COLORS.background
      }}>
        <CircularProgress sx={{ color: THEME_COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh', 
      bgcolor: THEME_COLORS.background,
      width: '100vw',
      overflow: 'hidden'
    }}>
      {/* 헤더 */}
      <AppBar position="static" sx={{ bgcolor: '#ffffff', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalHospital sx={{ fontSize: 40, color: THEME_COLORS.primary }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: THEME_COLORS.primary }}>
                MEORING
              </Typography>
              <Typography variant="body2" color="#666">
                의료진 | 통합 의료 관리 시스템
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#e3f2fd', borderRadius: 2 }}>
              <Phone sx={{ color: '#1976d2', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="#1976d2" fontWeight="bold">
                  의료진 직통
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="#1976d2">
                  2718-4428
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton>
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <Avatar sx={{ bgcolor: THEME_COLORS.primary, width: 32, height: 32 }}>
                박
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  박소현 과장
                </Typography>
                <Typography variant="caption" color="#666">
                  내과
                </Typography>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 메인 영역 */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* 좌측 사이드바 - 240px 고정 */}
        <Box sx={{ 
          width: 240,
          flexShrink: 0,
          height: '100%',
          overflow: 'hidden'
        }}>
          <LeftSidebar selectedMenu={selectedMenu} onMenuSelect={setSelectedMenu} />
        </Box>
        
        {/* 메인 콘텐츠 영역 */}
        <Box sx={{ 
          width: 'calc(100vw - 240px)',
          height: '100%',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 환자 드롭다운 */}
          {(selectedMenu === 'dashboard' || selectedMenu === 'clinical-prediction' || selectedMenu === 'drug-interaction') && (
            <Box sx={{ flexShrink: 0 }}>
              <PatientDropdown 
                patients={patients}
                selectedPatient={selectedPatient}
                onPatientSelect={setSelectedPatient}
              />
            </Box>
          )}
          
          {/* 메인 콘텐츠 */}
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            height: (selectedMenu === 'dashboard' || selectedMenu === 'clinical-prediction' || selectedMenu === 'drug-interaction') ? 'calc(100% - 60px)' : '100%'
          }}>
            {renderMainContent()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
