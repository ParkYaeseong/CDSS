//src/components/AdminPanel/index.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, Card, Typography, AppBar, Toolbar, IconButton, 
  Badge, Avatar, Alert, CircularProgress 
} from '@mui/material';
import {
  Phone, Schedule, Person, Notifications, Help, Settings, 
  ExitToApp, LocalHospital
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import PatientService from '../../services/patient.service';

// 컴포넌트 import
import LeftSidebar from './LeftSidebar';
import ReceptionContent from './ReceptionContent';
import PatientManagementContent from './PatientManagementContent';
import FlutterPatientContent from './FlutterPatientContent';
import VerificationContent from './VerificationContent';
import AppointmentContent from './AppointmentContent';

// 남색 테마 색상 체계
const adminTheme = {
  primary: '#003d82',
  secondary: '#0066cc',
  accent: '#e8f4fd',
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  background: '#f8f9fa',
  surface: '#ffffff',
  border: '#dee2e6',
  text: {
    primary: '#212529',
    secondary: '#6c757d',
    white: '#ffffff'
  }
};

function AdminPanel() {
  const { user } = useAuth();
  const [selectedMenu, setSelectedMenu] = useState('reception');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ django_count: 0, flutter_count: 0, linked_count: 0 });

  // 모달 상태들
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showFlutterConnectionModal, setShowFlutterConnectionModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [flutterConnectionInfo, setFlutterConnectionInfo] = useState(null);

  // 폼 데이터
  const [newPatientData, setNewPatientData] = useState({
    fname: '', lname: '', DOB: '', sex: '', phone_cell: '', street: ''
  });

  const [visitData, setVisitData] = useState({
    reason: '', chief_complaint: '', history: '', examination: '',
    assessment: '', plan: '', vital_signs: {
      temperature: '', blood_pressure: '', heart_rate: '',
      respiratory_rate: '', weight: '', height: ''
    }
  });

  useEffect(() => {
    if (selectedMenu === 'patients') {
      fetchPatients();
    }
  }, [selectedMenu]);

  // 권한 확인
  if (user?.user_type !== 'admin' && user?.user_type !== 'staff') {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        bgcolor: adminTheme.background
      }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" fontWeight="bold" sx={{ mb: 2 }}>
            접근 권한이 없습니다
          </Typography>
          <Typography color={adminTheme.text.secondary}>
            원무과 직원만 접근 가능한 페이지입니다.
          </Typography>
        </Card>
      </Box>
    );
  }

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('통합 환자 목록을 불러오는 중...');
      const response = await PatientService.getAllPatients();
      console.log('통합 환자 목록 응답:', response);
      
      if (response.success && Array.isArray(response.data)) {
        const validPatients = response.data.filter(patient => 
          patient && (patient.name || patient.display_name || patient.first_name || patient.last_name)
        );
        
        const sortedPatients = validPatients.sort((a, b) => {
          const aId = parseInt(a.openemr_id?.replace(/\D/g, '')) || 0;
          const bId = parseInt(b.openemr_id?.replace(/\D/g, '')) || 0;
          return aId - bId;
        });

        setPatients(sortedPatients);
        setStats(response.stats || { django_count: 0, flutter_count: 0, linked_count: 0 });
        
        console.log(`총 ${sortedPatients.length}명의 환자 데이터 로드 완료`);
      } else {
        setError(response.error || '환자 데이터 형식이 올바르지 않습니다.');
        setPatients([]);
        setStats({ django_count: 0, flutter_count: 0, linked_count: 0 });
      }
    } catch (err) {
      console.error('환자 목록 조회 오류:', err);
      setError(`환자 목록을 불러오는데 실패했습니다: ${err.message}`);
      setPatients([]);
      setStats({ django_count: 0, flutter_count: 0, linked_count: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleFlutterConnect = async (patient) => {
    try {
      setLoading(true);
      
      console.log('Flutter 연결 요청:', patient);
      
      const result = await PatientService.generateFlutterVerificationCode(
        patient.openemr_id || patient.id || patient.flutter_patient_id
      );
      
      if (result.success) {
        setFlutterConnectionInfo({
          patient: patient,
          verificationCode: result.verification_code,
          patientId: result.patient_id || patient.openemr_id || patient.id
        });
        setShowFlutterConnectionModal(true);
        console.log('Flutter 연결 정보 생성 완료:', result);
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('Flutter 연결 오류:', error);
      alert(`Flutter 연결 처리 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await PatientService.createPatientProfile(newPatientData);
      console.log('환자 생성 성공:', result);
      
      await fetchPatients();
      setShowNewPatientForm(false);
      
      setNewPatientData({
        fname: '', lname: '', DOB: '', sex: '',
        phone_cell: '', street: ''
      });
      
      alert('환자가 성공적으로 등록되었습니다!');
      
    } catch (error) {
      console.error('환자 생성 오류:', error);
      alert(`환자 등록에 실패했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderMainContent = () => {
    switch (selectedMenu) {
      case 'reception':
        return <ReceptionContent />;
      case 'patients':
        return (
          <PatientManagementContent 
            patients={patients}
            loading={loading}
            error={error}
            stats={stats}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onRefresh={fetchPatients}
            onAddPatient={() => setShowNewPatientForm(true)}
            onFlutterConnect={handleFlutterConnect}
            onVisitRegister={(patient) => {
              setSelectedPatient(patient);
              setShowVisitForm(true);
            }}
          />
        );
      case 'flutter':
        return <FlutterPatientContent />;
      case 'verification':
        return <VerificationContent />;
      case 'appointments':
        return <AppointmentContent />;
      default:
        return <ReceptionContent />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: adminTheme.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', // 간호사 패널과 동일하게 minHeight 사용
      backgroundColor: '#f8f9fa' // 간호사 패널과 동일한 배경색
    }}>
      {/* 헤더 - 간호사 패널과 동일한 스타일 */}
      <AppBar position="static" sx={{ bgcolor: '#ffffff', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* 병원 로고 및 정보 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalHospital sx={{ fontSize: 40, color: adminTheme.primary }} />
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ color: adminTheme.primary }}>
                MEORING
              </Typography>
              <Typography variant="body2" color="#666">
                원무과 | 환자 관리 시스템
              </Typography>
            </Box>
          </Box>

          {/* 응급연락처 및 사용자 정보 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#fff3cd', borderRadius: 2 }}>
              <Phone sx={{ color: '#856404', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="#856404" fontWeight="bold">
                  원무과 직통
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="#856404">
                  010-4513-6508
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton>
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton>
                <Help />
              </IconButton>
              <Avatar sx={{ bgcolor: adminTheme.primary, width: 32, height: 32 }}>
                지
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  지유나 과장
                </Typography>
                <Typography variant="caption" color="#666">
                  원무과
                </Typography>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 메인 컨텐츠 - 간호사 패널과 동일한 구조 */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* 사이드바 - 간호사 패널과 동일한 스타일 */}
        <LeftSidebar 
          selectedMenu={selectedMenu} 
          onMenuSelect={setSelectedMenu}
          themeColor={adminTheme.primary}
          accentColor={adminTheme.accent}
          borderColor={adminTheme.border}
        />

        {/* 메인 컨텐츠 영역 - 간호사 패널과 동일한 구조 */}
        <Box sx={{ 
          flex: 1,
          width: 'calc(100vw - 240px)',
          maxWidth: 'calc(100vw - 240px)',
          overflow: 'auto',
          bgcolor: '#f8f9fa'
        }}>
          <Box sx={{ p: 3 }}>
            {error && (
              <Alert 
                severity="error" 
                onClose={() => setError('')}
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {error}
              </Alert>
            )}

            {renderMainContent()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminPanel;
