// src/components/AdminPanel/index.jsx
import React, { useState, useEffect } from 'react';
import { Box, Card, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import PatientService from '../../services/patient.service';
import { THEME_COLORS } from '../Common/theme';

// 컴포넌트 import
import LeftSidebar from './LeftSidebar';
import TopHeader from './TopHeader';
import DashboardContent from './DashboardContent';
import ReceptionContent from './ReceptionContent';
import PatientManagementContent from './PatientManagementContent';
import FlutterPatientContent from './FlutterPatientContent';
import VerificationContent from './VerificationContent';
import AppointmentContent from './AppointmentContent';

function AdminPanel() {
  const { user } = useAuth();
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
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
        bgcolor: THEME_COLORS.background
      }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" fontWeight="bold" sx={{ mb: 2 }}>
            접근 권한이 없습니다
          </Typography>
          <Typography color={THEME_COLORS.text.secondary}>
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
      case 'dashboard':
        return <DashboardContent stats={stats} />;
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
        return <DashboardContent stats={stats} />;
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      width: '100vw',      // 화면 전체 너비
      height: '100vh',     // 화면 전체 높이
      overflow: 'hidden',  // 스크롤바 제거
      bgcolor: THEME_COLORS.background,
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      margin: 0,           // 마진 제거
      padding: 0           // 패딩 제거
    }}>
      <LeftSidebar 
        selectedMenu={selectedMenu} 
        onMenuSelect={setSelectedMenu} 
      />
      
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        width: 'calc(100vw - 200px)', // 사이드바 제외한 전체 너비
        height: '100vh'               // 전체 높이
      }}>
        <TopHeader user={user} />
        
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'auto', 
          height: 'calc(100vh - 60px)', // 헤더 제외한 높이
          width: '100%'                 // 전체 너비
        }}>
          {renderMainContent()}
        </Box>
      </Box>
    </Box>
  );
}

export default AdminPanel;
