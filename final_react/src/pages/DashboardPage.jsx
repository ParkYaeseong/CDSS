//src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 추가
import {
  Box, Card, CardContent, Typography, Divider, Button, List, ListItemButton,
  ListItemText, CircularProgress, IconButton, Avatar, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, MenuItem, Select,
  FormControl, InputLabel, Grid, Modal, Tabs, Tab, Alert, Badge,  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  Dashboard, LocalHospital, Assignment, CalendarToday, Science,
  Medication, Person, Add, Edit, Delete, Close, ExpandMore,
  Psychology, Search, EventAvailable, Notifications, Settings, LocalPharmacy,
  ViewInAr, ImageSearch, Hub
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

import PatientService from '../services/patient.service.js';
import LabResultCard from '../components/LabResultCard.jsx';
import DrugInteractionCard from '../components/DrugInteractionCard.jsx';
import PaperSearchCard from '../components/PaperSearchCard.jsx';
import PatientCalendar from '../components/PatientCalendar.jsx';
import ClinicalPredictionDashboard from '../components/clinical/ClinicalPredictionDashboard';
import NursingRecordViewer from '../components/nursing/NursingRecordViewer';
import DrugInteractionComponent from '../components/DrugInteractionComponent';
import { checkDrugInteraction, searchDrugs } from '../services/cdss.service.js';

import DiagnosisService from '../services/diagnosis.service';
import { getPatientPrescriptions } from '../services/cdss.service.js';

import { 
  getPatientVitalData, 
  getPatientOmicsData, 
  getPatientMedications, 
  getPatientBasicInfo,
  getPatientMedicalRecords
} from '../data/patientData';
import VitalChart from '../components/VitalChart';

// 청록색 계열로 변경된 색상 테마
const THEME_COLORS = {
  primary: '#007C80',       // 진한 청록색 (네비게이션바)
  secondary: '#14b8a6',     // 중간 청록색 (포인트 컬러)
  accent: '#5eead4',        // 밝은 청록색 (액센트)
  background: '#f8fafc',    // 기존 백그라운드 유지
  surface: '#ffffff',       // 기존 카드 배경 유지
  surfaceHover: '#f1f5f9',  // 기존 호버 색상 유지
  border: '#e2e8f0',        // 기존 테두리 색상 유지
  borderLight: '#f1f5f9',   // 기존 연한 테두리 유지
  text: {
    primary: '#1e293b',     // 기존 텍스트 색상 유지
    secondary: '#64748b',   // 기존 보조 텍스트 유지
    light: '#94a3b8'        // 기존 연한 텍스트 유지
  },
  status: {
    success: '#10b981',     // 녹색 유지
    warning: '#f59e0b',     // 주황색 유지
    error: '#ef4444',       // 빨간색 유지
    info: '#007C80'         // 청록색으로 변경
  }
};

const StatusChip = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED': return { bg: '#4caf50', text: '#fff' };
            case 'PROCESSING': return { bg: '#ff9800', text: '#fff' };
            case 'FAILED': return { bg: '#f44336', text: '#fff' };
            case 'PENDING': return { bg: '#2196f3', text: '#fff' };
            case 'QUEUED': return { bg: '#007C80', text: '#fff' };
            case 'RECEIVED': return { bg: '#007C80', text: '#fff' };
            default: return { bg: '#9e9e9e', text: '#fff' };
        }
    };
    const colors = getStatusColor(status);
    return <Chip label={status || 'UNKNOWN'} size="small" sx={{ bgcolor: colors.bg, color: colors.text, fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 1 } }} />;
};

const ViewerPlaceholder = ({ status, error }) => {
    const isLoading = ['PROCESSING', 'QUEUED', 'RECEIVED'].includes(status);
    const isError = ['FAILED', 'NIFTI_CONVERSION_FAILED', 'SEGMENTATION_FAILED', 'VIEWER_GENERATION_FAILED'].includes(status);

    return (
        <Paper sx={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#999', border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center', px: 2 }}>
            {isLoading && (<> <StatusChip status={status} /> <CircularProgress sx={{ mt: 2 }} /> <Typography variant="body2" color="text.secondary" mt={2}> 분석 결과를 생성 중입니다. </Typography> </>)}
            {isError && (<> <StatusChip status={status} /> <Typography variant="body2" color="error" mt={1}>뷰어 로딩 실패</Typography> {error && <Typography variant="caption" color="text.secondary">{error}</Typography>} </>)}
            {!isLoading && !isError && (<Typography variant="body2" color="text.secondary">데이터 없음</Typography>)}
        </Paper>
    );
};

const ViewerBlock = ({ title, url, status, error }) => (
    <Box sx={{ width: '100%' }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, textAlign: 'center' }}>{title}</Typography>
        {url ? (<iframe src={url} title={title} width="100%" height="480px" style={{ border: '1px solid #ccc', borderRadius: 8 }} />) : (<ViewerPlaceholder status={status} error={error} />)}
    </Box>
);

// 좌측 고정 메뉴
function LeftSidebar({ selectedMenu, onMenuSelect }) {
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: <Dashboard /> },
    { id: 'patients', label: '환자 관리', icon: <Person /> },
    { id: 'clinical-prediction', label: '임상 예측 분석', icon: <Psychology /> },
    { id: 'calendar', label: '환자 예약 캘린더', icon: <CalendarToday /> },
    { id: 'drug-interaction', label: '약물 처방', icon: <LocalPharmacy /> },
    { id: 'paper-search', label: '논문 AI 검색', icon: <Search /> },
      { id: 'nursing', label: '간호 기록', icon: <Assignment /> },
    { id: 'lab', label: '검사 결과', icon: <Science /> }
  ];

  return (
    <Box sx={{ 
      width: 200, 
      height: '100vh', 
      bgcolor: THEME_COLORS.primary, 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      borderRight: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
    }}>
      <Box sx={{ 
        p: 1.5, 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        bgcolor: THEME_COLORS.primary
      }}>
        <Typography variant="h6" fontWeight="bold" fontSize="1rem">
          🏥 Doctor Manager
        </Typography>
      </Box>
      
      <List sx={{ flexGrow: 1, p: 0, overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={selectedMenu === item.id}
            onClick={() => onMenuSelect(item.id)}
            sx={{
              py: 1,
              px: 1.5,
              minHeight: 40,
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRight: `3px solid ${THEME_COLORS.secondary}`,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <Box sx={{ mr: 1.5, fontSize: '1rem', color: selectedMenu === item.id ? THEME_COLORS.secondary : 'inherit' }}>
              {item.icon}
            </Box>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ fontSize: '0.875rem' }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ 
        p: 1.5, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        bgcolor: 'rgba(0,0,0,0.1)'
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.75rem', color: THEME_COLORS.secondary }}>
          📅 오늘 일정
        </Typography>
        <Box sx={{ 
          bgcolor: 'rgba(255,255,255,0.1)', 
          p: 1, 
          borderRadius: 1,
          fontSize: '0.7rem',
          border: `1px solid ${THEME_COLORS.secondary}20`
        }}>
          <Typography variant="caption" fontSize="0.7rem">
            2025년 6월 24일 (화)
          </Typography>
          <Typography variant="caption" display="block" fontSize="0.7rem">
            • 회진: 09:00 ✓
          </Typography>
          <Typography variant="caption" display="block" fontSize="0.7rem">
            • 컨퍼런스: 14:00
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// 상단 환자 드롭다운
function PatientDropdown({ patients, selectedPatient, onPatientSelect }) {
  // ✅ 나이 계산 함수 추가
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Box sx={{ 
      height: 60, 
      bgcolor: THEME_COLORS.background, 
      borderBottom: `1px solid ${THEME_COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      px: 2,
      gap: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <Typography variant="h6" fontWeight="bold" sx={{ minWidth: 'fit-content', color: THEME_COLORS.text.primary }}>
        환자 선택:
      </Typography>
      <FormControl sx={{ minWidth: 200 }}>
        <Select
          value={selectedPatient?.id || ''}
          onChange={(e) => {
            const patient = patients.find(p => p.id === e.target.value);
            onPatientSelect(patient);
          }}
          displayEmpty
          size="small"
          sx={{ 
            bgcolor: THEME_COLORS.surface,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: THEME_COLORS.border
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: THEME_COLORS.secondary
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: THEME_COLORS.primary
            }
          }}
        >
          <MenuItem value="" disabled>
            환자를 선택하세요
          </MenuItem>
          {patients.map((patient) => (
            <MenuItem key={patient.id} value={patient.id}>
              {patient.name} ({patient.openemr_id})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selectedPatient && (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          {/* ✅ Avatar 제거 */}
          <Typography variant="body2" color={THEME_COLORS.text.secondary}>
            {/* ✅ 나이 계산 함수 사용 */}
            {calculateAge(selectedPatient.date_of_birth)}세 {selectedPatient.gender}
          </Typography>
        </Box>
      )}
      
      {/* 우측 알림 아이콘 추가 */}
      <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
        <IconButton sx={{ color: THEME_COLORS.text.secondary }}>
          <Badge badgeContent={3} color="error">
            <Notifications />
          </Badge>
        </IconButton>
        <IconButton sx={{ color: THEME_COLORS.text.secondary }}>
          <Settings />
        </IconButton>
      </Box>
    </Box>
  );
}

// 환자 기본 정보 카드
function PatientInfoCard({ patient }) {
  if (!patient) return null;

  const basicInfo = getPatientBasicInfo(patient.openemr_id);
  
  // 성별 한글 변환
  const getGenderText = (gender) => {
    if (!gender) return '정보 없음';
    switch (gender.toLowerCase()) {
      case 'male':
      case 'm':
        return '남';
      case 'female':
      case 'f':
        return '여';
      default:
        return gender;
    }
  };

  // ✅ 검색 결과와 동일한 나이 계산 함수 사용
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '정보 없음';
    
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      
      // 유효한 날짜인지 확인
      if (isNaN(birthDate.getTime())) {
        return '정보 없음';
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age > 0 ? age : '정보 없음';
    } catch (error) {
      console.error('나이 계산 오류:', error);
      return '정보 없음';
    }
  };

  return (
    <Card sx={{ 
      mb: 1, 
      bgcolor: THEME_COLORS.surface,
      border: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ 
          mb: 1, 
          fontSize: '0.9rem',
          color: THEME_COLORS.primary,
          borderBottom: `2px solid ${THEME_COLORS.secondary}`,
          pb: 0.5
        }}>
          📋 환자 기본 정보
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, fontSize: '0.75rem' }}>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>이름</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {patient.name || patient.display_name || '정보 없음'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>키</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.height}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>체중</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.weight}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>혈액형</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.blood_type}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>성별</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {getGenderText(patient.sex || patient.gender)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>나이</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {/* ✅ 검색 결과와 동일한 방식으로 나이 계산 */}
              {calculateAge(patient.date_of_birth || patient.birth_date || patient.DOB)}세
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>알레르기</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.allergies}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>흡연</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.smoking}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// 바이탈 사인 차트
function VitalChartComponent({ patient }) {
  // 환자가 없으면 빈 상태 표시
  if (!patient) {
    return (
      <Card sx={{ mb: 1 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: THEME_COLORS.primary }}>
            📊 바이탈 사인
          </Typography>
          <Typography variant="body2" color="text.secondary">
            환자를 선택해주세요.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // VitalChart 컴포넌트 렌더링
  return <VitalChart patient={patient} />;
}

// 오믹스 분석 결과
function OmicsResults({ patient }) {
  if (!patient) return null;
  
  const omicsData = getPatientOmicsData(patient.openemr_id);
  
  return (
    <Card sx={{ 
      mb: 1,
      bgcolor: THEME_COLORS.surface,
      border: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ 
          mb: 1, 
          fontSize: '0.9rem',
          color: THEME_COLORS.primary,
          borderBottom: `2px solid ${THEME_COLORS.secondary}`,
          pb: 0.5
        }}>
          🧬 오믹스 분석 결과
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: `${THEME_COLORS.primary}10` }}>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem', fontWeight: 'bold', color: THEME_COLORS.primary }}>유전자</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem', fontWeight: 'bold', color: THEME_COLORS.primary }}>발현량</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem', fontWeight: 'bold', color: THEME_COLORS.primary }}>P-value</TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.75rem', fontWeight: 'bold', color: THEME_COLORS.primary }}>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {omicsData.map((row) => (
                <TableRow key={row.name} sx={{ '&:hover': { bgcolor: `${THEME_COLORS.secondary}10` } }}>
                  <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>{row.name}</TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>{row.expression}</TableCell>
                  <TableCell sx={{ py: 0.5, fontSize: '0.75rem' }}>{row.pValue}</TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Chip 
                      label={row.status} 
                      color={row.status === '상향조절' ? 'error' : 'info'}
                      size="small"
                      sx={{ 
                        fontSize: '0.7rem', 
                        height: 20,
                        bgcolor: row.status === '상향조절' ? '#fee2e2' : `${THEME_COLORS.secondary}20`,
                        color: row.status === '상향조절' ? '#dc2626' : THEME_COLORS.primary
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

// 분석기록 선택 컴포넌트
function AnalysisSelector({ analysisHistory, selectedAnalysis, onAnalysisSelect, loading }) {
  if (!analysisHistory || analysisHistory.length === 0) {
    return null;
  }

  // 분석 선택 시 상세 정보 가져오기
  const handleAnalysisSelect = async (analysis) => {
    try {
      console.log('분석 선택:', analysis.id);
      // 상세 정보 가져오기 (result 객체 포함)
      const detailResponse = await DiagnosisService.getDiagnosisRequestDetail(analysis.id);
      if (detailResponse?.data) {
        console.log('상세 정보 가져옴:', detailResponse.data);
        onAnalysisSelect(detailResponse.data);
      } else {
        console.log('상세 정보 없음, 기본 분석 사용');
        onAnalysisSelect(analysis);
      }
    } catch (error) {
      console.error('상세 정보 가져오기 실패:', error);
      onAnalysisSelect(analysis);
    }
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ 
        mb: 1, fontSize: '0.8rem', color: THEME_COLORS.primary
      }}>
        📜 분석 기록 선택
      </Typography>
      
      <List sx={{ 
        maxHeight: 120, overflowY: 'auto', 
        border: `1px solid ${THEME_COLORS.border}`, 
        borderRadius: 1, bgcolor: THEME_COLORS.surfaceHover, p: 0
      }}>
        {analysisHistory.map((analysis) => (
          <ListItemButton 
            key={analysis.id} 
            selected={selectedAnalysis?.id === analysis.id}
            onClick={() => handleAnalysisSelect(analysis)} // 수정된 핸들러 사용
            sx={{
              py: 0.5, px: 1, minHeight: 32,
              '&.Mui-selected': {
                bgcolor: `${THEME_COLORS.primary}20`,
                '&:hover': { bgcolor: `${THEME_COLORS.primary}30` }
              }
            }}
          >
            <ListItemText 
              primary={
                <Typography fontSize="0.7rem" fontWeight="medium">
                  {new Date(analysis.request_timestamp).toLocaleString('ko-KR')}
                </Typography>
              }
              secondary={
                <Typography fontSize="0.6rem" color={THEME_COLORS.text.secondary}>
                  ID: {analysis.id.substring(0, 8)}... | {analysis.analysis_type}
                </Typography>
              }
            />
            <StatusChip status={analysis.status} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

// CT 영상 뷰어 (분석기록 선택 기능 통합)
function CTImageViewer({ 
  currentRequest, loading, error, 
  analysisHistory, selectedAnalysis, onAnalysisSelect, showAnalysisSelector 
}) {
  const [activeViewer, setActiveViewer] = useState('INTEGRATED'); // 'INTEGRATED', 'OHIF', 'TOTAL'

  const getOhifUrl = (uid) => `http://35.188.47.40:8042/ohif/viewer?StudyInstanceUIDs=${uid}`;

  const getViewerProps = () => {
    if (!selectedAnalysis) {
      return { title: 'CT 뷰어', url: null, status: 'PENDING', error: null };
    }
    
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://35.188.47.40';
    const getFullUrl = (path) => path ? `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}` : '';
    
    switch(activeViewer) {
      case 'TOTAL':
        return {
          title: '🎨 전체 장기 분할',
          url: getFullUrl(selectedAnalysis.result?.visualization_3d_html_path),
          status: selectedAnalysis.status,
          error: selectedAnalysis.result?.error_message,
        };
      case 'OHIF':
        return {
          title: '📈 OHIF 뷰어',
          url: selectedAnalysis.study_uid ? getOhifUrl(selectedAnalysis.study_uid) : '',
          status: selectedAnalysis.status,
          error: null,
        };
      case 'INTEGRATED':
      default:
        return {
          title: '🔬 통합 뷰어',
          url: getFullUrl(selectedAnalysis.result?.integrated_viewer_html_path),
          status: selectedAnalysis.status,
          error: selectedAnalysis.result?.error_message,
        };
    }
  };

  const currentViewer = getViewerProps();

  return (
    <Card sx={{ 
      mb: 1, bgcolor: THEME_COLORS.surface,
      border: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <ToggleButtonGroup
            value={activeViewer}
            exclusive
            onChange={(event, newViewer) => {
              if (newViewer !== null) {
                setActiveViewer(newViewer);
              }
            }}
            aria-label="viewer selection"
            size="small"
          >
            <ToggleButton value="INTEGRATED" aria-label="integrated viewer">
              <ViewInAr sx={{ mr: 0.5, fontSize: '1rem' }} /> 통합
            </ToggleButton>
            <ToggleButton value="OHIF" aria-label="ohif viewer">
              <ImageSearch sx={{ mr: 0.5, fontSize: '1rem' }} /> OHIF
            </ToggleButton>
            <ToggleButton value="TOTAL" aria-label="total segmentation">
              <Hub sx={{ mr: 0.5, fontSize: '1rem' }} /> 전체 장기
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {showAnalysisSelector && (
          <AnalysisSelector
            analysisHistory={analysisHistory}
            selectedAnalysis={selectedAnalysis}
            onAnalysisSelect={onAnalysisSelect}
            loading={loading}
          />
        )}
        
        {loading && (
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <CircularProgress size={40} sx={{ color: THEME_COLORS.primary }} />
            <Typography sx={{ mt: 2, color: THEME_COLORS.text.secondary, fontSize: '0.8rem' }}>
              CT 분석 데이터 로딩 중...
            </Typography>
          </Box>
        )}
        
        {!loading && (
           <ViewerBlock
              title={currentViewer.title}
              url={currentViewer.url}
              status={currentViewer.status}
              error={currentViewer.error || error} // Pass general error as well
           />
        )}
      </CardContent>
    </Card>
  );
}

// 진료 기록
function MedicalRecords({ patient }) {
  const [records, setRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    chiefComplaint: '',
    presentIllness: '',
    physicalExam: '',
    assessment: '',
    plan: ''
  });

  useEffect(() => {
    if (patient) {
      const patientRecords = getPatientMedicalRecords(patient.openemr_id);
      const sortedRecords = patientRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecords(sortedRecords);
    } else {
      setRecords([]);
    }
  }, [patient]);

  const handleInputChange = (field, value) => {
    setNewRecord(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addRecord = () => {
    const hasContent = Object.values(newRecord).some(value => value.trim());
    
    if (hasContent) {
      const now = new Date();
      const today = new Date().toISOString().split('T')[0];
      
      const newRecordData = {
        id: Date.now(),
        date: today,
        time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
        chiefComplaint: newRecord.chiefComplaint,
        presentIllness: newRecord.presentIllness,
        physicalExam: newRecord.physicalExam,
        assessment: newRecord.assessment,
        plan: newRecord.plan
      };
      
      setRecords([newRecordData, ...records]);
      
      setNewRecord({
        chiefComplaint: '',
        presentIllness: '',
        physicalExam: '',
        assessment: '',
        plan: ''
      });
    }
  };

  const clearRecord = () => {
    setNewRecord({
      chiefComplaint: '',
      presentIllness: '',
      physicalExam: '',
      assessment: '',
      plan: ''
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!patient) {
    return (
      <Card sx={{ 
        mb: 1,
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ 
            mb: 1, 
            fontSize: '0.9rem',
            color: THEME_COLORS.primary,
            borderBottom: `2px solid ${THEME_COLORS.secondary}`,
            pb: 0.5
          }}>
            🩺 진료 기록
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            환자를 선택해주세요.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      mb: 1,
      bgcolor: THEME_COLORS.surface,
      border: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ 
          mb: 1, 
          fontSize: '0.9rem',
          color: THEME_COLORS.primary,
          borderBottom: `2px solid ${THEME_COLORS.secondary}`,
          pb: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          🩺 진료 기록
          <Chip 
            label={`${patient.name} (${records.length}건)`}
            size="small"
            sx={{ 
              bgcolor: `${THEME_COLORS.primary}20`, 
              color: THEME_COLORS.primary,
              fontSize: '0.7rem',
              height: 18
            }}
          />
        </Typography>
        
        {/* 기존 진료기록 목록 */}
        <Box sx={{ maxHeight: 350, overflowY: 'auto', mb: 2 }}>
          {records.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1, fontSize: '0.9rem' }}>
              진료 기록이 없습니다.
            </Typography>
          ) : (
            records.map((record) => (
              <Box key={record.id} sx={{ 
                mb: 1, 
                p: 1.5, 
                bgcolor: `${THEME_COLORS.primary}08`, 
                borderRadius: 1,
                border: `1px solid ${THEME_COLORS.primary}20`
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color={THEME_COLORS.text.secondary} sx={{ fontSize: '0.8rem' }}> {/* ✅ 0.7rem → 0.8rem */}
                    {formatDate(record.date)} {record.time}
                  </Typography>
                </Box>
                
                {/* ✅ 진료기록 내용 글씨 크기 증가 */}
                <Box sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}> {/* ✅ 0.75rem → 0.85rem, lineHeight 추가 */}
                  {record.chiefComplaint && (
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}> {/* ✅ 0.75rem → 0.85rem */}
                      <strong>주소:</strong> {record.chiefComplaint}
                    </Typography>
                  )}
                  {record.presentIllness && (
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                      <strong>현병력:</strong> {record.presentIllness}
                    </Typography>
                  )}
                  {record.physicalExam && (
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                      <strong>신체검사:</strong> {record.physicalExam}
                    </Typography>
                  )}
                  {record.assessment && (
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                      <strong>평가/진단:</strong> {record.assessment}
                    </Typography>
                  )}
                  {record.plan && (
                    <Typography variant="body2" sx={{ 
                      borderTop: `1px solid ${THEME_COLORS.border}`,
                      pt: 0.5,
                      mt: 0.5,
                      fontStyle: 'italic',
                      color: THEME_COLORS.text.secondary,
                      fontSize: '0.85rem' // ✅ 0.75rem → 0.85rem
                    }}>
                      <strong>계획/처방:</strong> {record.plan}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
        
        {/* 새 진료기록 입력 양식 - ✅ 글씨 크기 증가 */}
        <Box sx={{ 
          border: `2px solid ${THEME_COLORS.primary}30`,
          borderRadius: 2,
          p: 1.5,
          bgcolor: `${THEME_COLORS.primary}05`
        }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ 
            mb: 1.5, 
            color: THEME_COLORS.primary,
            fontSize: '0.9rem' // ✅ 0.8rem → 0.9rem
          }}>
            📝 새 진료기록 작성
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* 주소 (Chief Complaint) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem', // ✅ 0.7rem → 0.8rem
                mb: 0.5,
                display: 'block'
              }}>
                주소 (C.C)
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="환자가 호소하는 주요 증상을 입력하세요"
                value={newRecord.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.5 }, // ✅ 0.75rem → 0.85rem
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>

            {/* 현병력 (Present Illness) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem', // ✅ 0.7rem → 0.8rem
                mb: 0.5,
                display: 'block'
              }}>
                현병력 (P.I)
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="현재 질병의 경과, 증상의 변화 등을 입력하세요"
                value={newRecord.presentIllness}
                onChange={(e) => handleInputChange('presentIllness', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem' }, // ✅ 0.75rem → 0.85rem
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>

            {/* 신체검사 (Physical Examination) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem', // ✅ 0.7rem → 0.8rem
                mb: 0.5,
                display: 'block'
              }}>
                신체검사 (P.E)
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="신체검사 소견을 입력하세요"
                value={newRecord.physicalExam}
                onChange={(e) => handleInputChange('physicalExam', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.5 }, // ✅ 0.75rem → 0.85rem
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>

            {/* 평가/진단 (Assessment) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem', // ✅ 0.7rem → 0.8rem
                mb: 0.5,
                display: 'block'
              }}>
                평가/진단 (Assessment)
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="진단명 또는 임상적 판단을 입력하세요"
                value={newRecord.assessment}
                onChange={(e) => handleInputChange('assessment', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.5 }, // ✅ 0.75rem → 0.85rem
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>

            {/* 계획/처방 (Plan) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem', // ✅ 0.7rem → 0.8rem
                mb: 0.5,
                display: 'block'
              }}>
                계획/처방 (Plan)
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="치료 계획, 처방약, 추후 관리 방안 등을 입력하세요"
                value={newRecord.plan}
                onChange={(e) => handleInputChange('plan', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem' }, // ✅ 0.75rem → 0.85rem
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>
          </Box>

          {/* 버튼 영역 - ✅ 글씨 크기 증가 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button
              variant="contained"
              onClick={addRecord}
              disabled={!Object.values(newRecord).some(value => value.trim())}
              size="small"
              sx={{ 
                bgcolor: THEME_COLORS.primary,
                color: 'white',
                fontSize: '0.8rem', // ✅ 0.75rem → 0.8rem
                '&:hover': {
                  bgcolor: THEME_COLORS.secondary
                },
                '&:disabled': {
                  bgcolor: THEME_COLORS.border
                }
              }}
            >
              기록 저장
            </Button>
            <Button
              variant="outlined"
              onClick={clearRecord}
              size="small"
              sx={{ 
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text.secondary,
                fontSize: '0.8rem', // ✅ 0.75rem → 0.8rem
                '&:hover': {
                  borderColor: THEME_COLORS.primary,
                  bgcolor: `${THEME_COLORS.primary}10`
                }
              }}
            >
              전체 초기화
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// 처방약 목록 - 실제 처방 데이터 사용
function MedicationCard({ patient, onMenuChange }) {
  const [medications, setMedications] = useState([]);
  const [prescriptionInfo, setPrescriptionInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patient) {
      setMedications([]);
      setPrescriptionInfo(null);
      return;
    }

    const loadPatientMedications = async () => {
      setLoading(true);
      try {
        console.log('🔍 대시보드에서 환자 처방 조회 시작:', patient.id);
        
        // Django API 호출 (서비스 함수 사용)
        const prescriptions = await getPatientPrescriptions(patient.id);
        console.log('✅ Django API 처방 조회 성공:', prescriptions);
        
        if (prescriptions.length > 0) {
          const latestPrescription = prescriptions[0];
          setMedications(latestPrescription.drugs || []);
          setPrescriptionInfo({
            timestamp: latestPrescription.timestamp,
            doctorId: latestPrescription.doctor_id
          });
        } else {
          console.log('📝 해당 환자의 처방이 없음');
          setMedications([]);
          setPrescriptionInfo(null);
        }
      } catch (error) {
        console.error('Django API 실패, localStorage 백업 사용:', error);
        // localStorage 백업 사용
        const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
        const patientPrescriptions = prescriptions.filter(p => p.patient_id === patient.id);
        
        if (patientPrescriptions.length > 0) {
          const latestPrescription = patientPrescriptions[patientPrescriptions.length - 1];
          setMedications(latestPrescription.drugs || []);
          setPrescriptionInfo({
            timestamp: latestPrescription.timestamp,
            doctorId: latestPrescription.doctor_id
          });
        } else {
          setMedications([]);
          setPrescriptionInfo(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPatientMedications();

    // 처방 업데이트 이벤트 리스너
    const handlePrescriptionUpdate = () => {
      console.log('🔄 처방 업데이트 이벤트 수신');
      loadPatientMedications();
    };

    window.addEventListener('prescriptionUpdated', handlePrescriptionUpdate);

    return () => {
      window.removeEventListener('prescriptionUpdated', handlePrescriptionUpdate);
    };
  }, [patient]);


  // 나머지 코드는 동일...
  const formatSimpleDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const handlePrescriptionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onMenuChange) {
      onMenuChange('drug-interaction');
    }
  };

  if (!patient) return null;
  
  return (
    <Card sx={{
      bgcolor: THEME_COLORS.surface,
      border: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ 
          mb: 1, 
          fontSize: '0.9rem',
          color: THEME_COLORS.primary,
          borderBottom: `2px solid ${THEME_COLORS.secondary}`,
          pb: 0.5
        }}>
          💊 처방약 목록 {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Typography>
        
        {medications.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 3, 
            color: THEME_COLORS.text.secondary 
          }}>
            <Typography variant="body2" fontSize="0.8rem">
              처방된 약물이 없습니다.
            </Typography>
            <Typography variant="caption" fontSize="0.7rem">
              약물 처방 메뉴에서 처방을 추가해주세요.
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ p: 0 }}>
            {medications.map((med, index) => (
              <ListItemButton key={med.prescriptionId || index} sx={{ 
                px: 0, 
                py: 0.5, 
                minHeight: 32,
                '&:hover': {
                  bgcolor: `${THEME_COLORS.secondary}10`
                }
              }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold" fontSize="0.8rem">
                          {med.name}
                        </Typography>
                        {med.code && (
                          <Chip 
                            label={med.code} 
                            size="small" 
                            sx={{ 
                              fontSize: '0.6rem', 
                              height: 18,
                              bgcolor: `${THEME_COLORS.secondary}20`,
                              color: THEME_COLORS.primary
                            }} 
                          />
                        )}
                      </Box>
                      {prescriptionInfo && (
                        <Typography variant="caption" sx={{ 
                          fontSize: '0.65rem',
                          color: THEME_COLORS.text.secondary,
                          fontStyle: 'italic'
                        }}>
                          {formatSimpleDate(prescriptionInfo.timestamp)}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={`${med.dosage} | ${med.frequency} | ${med.duration}`}
                  primaryTypographyProps={{ fontSize: '0.8rem', color: THEME_COLORS.text.primary }}
                  secondaryTypographyProps={{ fontSize: '0.7rem', color: THEME_COLORS.text.secondary }}
                />
                <IconButton 
                  size="small" 
                  sx={{ 
                    p: 0.5,
                    color: THEME_COLORS.primary,
                    '&:hover': {
                      bgcolor: `${THEME_COLORS.secondary}20`
                    }
                  }}
                  onClick={handlePrescriptionClick}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
        
        <Button 
          variant="outlined" 
          fullWidth 
          startIcon={<Add />} 
          sx={{ 
            mt: 1, 
            height: 32, 
            fontSize: '0.75rem',
            borderColor: THEME_COLORS.secondary,
            color: THEME_COLORS.primary,
            '&:hover': {
              borderColor: THEME_COLORS.primary,
              bgcolor: `${THEME_COLORS.secondary}10`
            }
          }}
          onClick={handlePrescriptionClick}
        >
          처방 추가
        </Button>
      </CardContent>
    </Card>
  );
}





// 메뉴별 컨텐츠 컴포넌트들
function ClinicalPredictionContent({ selectedPatient }) {
  // ✅ selectedPatient를 props로 전달
  return <ClinicalPredictionDashboard selectedPatient={selectedPatient} />;
}

function CalendarContent({ selectedPatient }) {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
        📅 환자 예약 캘린더
      </Typography>
      <Card sx={{ 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <CardContent>
          <PatientCalendar 
            selectedPatient={selectedPatient} 
            onDateChange={(date) => console.log('선택된 날짜:', date)} 
          />
        </CardContent>
      </Card>
    </Box>
  );
}

function PaperSearchContent() {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      <PaperSearchCard />
    </Box>
  );
}


function PatientManagementContent({ patients, selectedPatient, onPatientSelect }) {
  // 나이 계산 함수
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // 환자 ID를 숫자로 변환하여 오름차순 정렬
  const sortedPatients = [...patients].sort((a, b) => {
    // openemr_id에서 숫자 부분만 추출하여 비교
    const numA = parseInt(a.openemr_id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.openemr_id.replace(/\D/g, '')) || 0;
    return numA - numB; // 오름차순 정렬
  });

  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
        👥 환자 관리
      </Typography>
      <TableContainer component={Card} sx={{ 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: `${THEME_COLORS.primary}10` }}>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>환자ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>이름</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>나이</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>성별</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>연락처</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPatients.map((patient) => (
              <TableRow 
                key={patient.id} 
                sx={{ 
                  '&:hover': { bgcolor: `${THEME_COLORS.secondary}10` },
                  cursor: 'pointer',
                  backgroundColor: selectedPatient?.id === patient.id ? `${THEME_COLORS.primary}15` : 'transparent'
                }}
                onClick={() => onPatientSelect(patient)}
              >
                <TableCell sx={{ fontWeight: selectedPatient?.id === patient.id ? 'bold' : 'normal' }}>
                  {patient.openemr_id}
                </TableCell>
                <TableCell sx={{ fontWeight: selectedPatient?.id === patient.id ? 'bold' : 'normal' }}>
                  {patient.name}
                </TableCell>
                <TableCell>
                  {calculateAge(patient.date_of_birth)}세
                </TableCell>
                <TableCell>{patient.gender}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      📞 {patient.phone_number || '010-0000-0000'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function NursingContent({ selectedPatient }) {
  return (
    <Box sx={{ bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      <NursingRecordViewer selectedPatient={selectedPatient} />
    </Box>
  );
}

function LabContent({ selectedPatient }) {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
        🧪 검사 결과 분석
      </Typography>
      {selectedPatient ? (
        <Card sx={{ 
          bgcolor: THEME_COLORS.surface,
          border: `1px solid ${THEME_COLORS.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" color={THEME_COLORS.text.primary}>환자: {selectedPatient.name}</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ 
          bgcolor: THEME_COLORS.surface,
          border: `1px solid ${THEME_COLORS.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography color={THEME_COLORS.text.secondary}>환자를 선택해주세요.</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// 메인 컴포넌트
export default function ENRDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [ctLoading, setCTLoading] = useState(false); // CT 로딩 상태 추가
  const [ctError, setCTError] = useState(null); // CT 에러 상태 추가
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showAnalysisSelector, setShowAnalysisSelector] = useState(false);
 
  // 약물 상호작용 컨텐츠 - 수정된 부분
  function DrugInteractionContent({ selectedPatient }) {
  return <DrugInteractionComponent selectedPatient={selectedPatient} />;
  }

  useEffect(() => {
    console.log('=== CT 디버깅 ===');
    console.log('selectedPatient:', selectedPatient);
    console.log('currentRequest:', currentRequest);
    console.log('ctLoading:', ctLoading);
    console.log('ctError:', ctError);
    console.log('API Base URL:', process.env.REACT_APP_API_BASE_URL);
    
    if (currentRequest?.result?.integrated_viewer_html_path) {
      const fullUrl = `${process.env.REACT_APP_API_BASE_URL}${currentRequest.result.integrated_viewer_html_path}`;
      console.log('Full iframe URL:', fullUrl);
    }
  }, [selectedPatient, currentRequest, ctLoading, ctError]);

  useEffect(() => {
    console.log('=== OHIF 뷰어 디버깅 ===');
    console.log('currentRequest:', currentRequest);
    console.log('study_uid:', currentRequest?.study_uid);
    // console.log('생성된 OHIF URL:', getIframeUrl());
  }, [currentRequest]);

  // 환자 선택 시 디버깅 정보 출력
  useEffect(() => {
    if (selectedPatient) {
      console.log('=== 선택된 환자 정보 ===');
      console.log('환자명:', selectedPatient.name);
      console.log('환자 ID:', selectedPatient.id);
      console.log('OpenEMR ID:', selectedPatient.openemr_id);
      console.log('Park 환자 여부:', selectedPatient.name?.includes('Park'));
    }
  }, [selectedPatient]);

  useEffect(() => {
    console.log('=== CTImageViewer 상세 디버깅 ===');
    console.log('currentRequest 전체:', JSON.stringify(currentRequest, null, 2));
    console.log('result 객체:', currentRequest?.result);
    console.log('integrated_viewer_html_path:', currentRequest?.result?.integrated_viewer_html_path);
  }, [currentRequest]);

  useEffect(() => {
    if (currentRequest) {
      console.log('=== currentRequest 전체 구조 ===');
      console.log(JSON.stringify(currentRequest, null, 2));
      
      if (currentRequest.result) {
        console.log('=== result 객체 ===');
        console.log(JSON.stringify(currentRequest.result, null, 2));
        
        // result 객체의 모든 키 확인
        console.log('result 객체의 키들:', Object.keys(currentRequest.result));
      }
    }
  }, [currentRequest]);
  
  // 기존 환자 데이터 가져오기
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await PatientService.getPatientProfiles();
        const patientData = response.data || [];
        
        // ✅ 숫자 ID와 비숫자 ID 분리 후 정렬
        const sortedPatients = [...patientData].sort((a, b) => {
          const idA = a.openemr_id;
          const idB = b.openemr_id;
          
          // 숫자인지 확인
          const isNumericA = /^\d+$/.test(idA);
          const isNumericB = /^\d+$/.test(idB);
          
          // 둘 다 숫자인 경우: 숫자 크기로 오름차순 정렬
          if (isNumericA && isNumericB) {
            return parseInt(idA) - parseInt(idB);
          }
          
          // A만 숫자인 경우: A를 앞으로
          if (isNumericA && !isNumericB) {
            return -1;
          }
          
          // B만 숫자인 경우: B를 앞으로
          if (!isNumericA && isNumericB) {
            return 1;
          }
          
          // 둘 다 비숫자인 경우: 문자열로 정렬
          return idA.localeCompare(idB);
        });
        
        console.log('정렬 전:', patientData.map(p => `${p.name} (${p.openemr_id})`));
        console.log('정렬 후:', sortedPatients.map(p => `${p.name} (${p.openemr_id})`));
        
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
  }, [selectedAnalysis]); // selectedPatient가 변경될 때마다 실행

  // CT 요청 상태 폴링 (처리 중일 때)
  useEffect(() => {
    let interval;
    
    // selectedPatient가 없으면 폴링하지 않음 (개선사항)
    if (!selectedPatient) {
      return;
    }
    
    const isProcessing = currentRequest && 
      ['PROCESSING', 'QUEUED', 'RECEIVED', 'PENDING'].includes(currentRequest.status);

    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          // DiagnosisService 사용으로 변경
          const response = await DiagnosisService.getCurrentCTRequest(selectedPatient.id);
          const updatedRequest = response.data;
          
          setCurrentRequest(updatedRequest);
          
          // 완료되면 폴링 중지
          const allCompletedOrFailed = !['PROCESSING', 'QUEUED', 'RECEIVED', 'PENDING'].includes(updatedRequest.status);
          if (allCompletedOrFailed) {
            clearInterval(interval);
          }
        } catch (error) {
          console.error('CT 상태 업데이트 실패:', error);
          clearInterval(interval);
        }
      }, 5000); // 5초마다 폴링
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentRequest, selectedPatient]);

  // 메뉴별 컨텐츠 렌더링 함수
// 메뉴별 컨텐츠 렌더링 함수
const renderMainContent = () => {
  if (selectedMenu === 'dashboard') {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', bgcolor: THEME_COLORS.background }}>
        <Box sx={{ 
          width: '50%', 
          p: 1, 
          overflowY: 'auto',
          borderRight: `1px solid ${THEME_COLORS.border}`
        }}>
          <PatientInfoCard patient={selectedPatient} />
          <VitalChartComponent patient={selectedPatient} />
          <OmicsResults patient={selectedPatient} />
          <CTImageViewer 
            currentRequest={currentRequest}
            loading={ctLoading}
            error={ctError}
            analysisHistory={analysisHistory}
            selectedAnalysis={selectedAnalysis}
            onAnalysisSelect={setSelectedAnalysis}
            showAnalysisSelector={showAnalysisSelector}
          />
        </Box>
        
        <Box sx={{ 
          width: '50%', 
          p: 1, 
          overflowY: 'auto'
        }}>
          <MedicalRecords patient={selectedPatient} />
          <MedicationCard patient={selectedPatient} onMenuChange={setSelectedMenu} />
        </Box>
      </Box>
    );
  }

  // 다른 메뉴들은 새로운 컨텐츠 표시
  switch (selectedMenu) {
    case 'patients':
      return <PatientManagementContent patients={patients} selectedPatient={selectedPatient} onPatientSelect={setSelectedPatient} />;
    case 'clinical-prediction':
      return <ClinicalPredictionContent selectedPatient={selectedPatient} />;
    case 'calendar':
      return <CalendarContent selectedPatient={selectedPatient} />;
    case 'drug-interaction':
      return <DrugInteractionContent selectedPatient={selectedPatient} />;
    case 'paper-search':
      return <PaperSearchContent />;
    case 'nursing':
      return <NursingContent selectedPatient={selectedPatient} />;
    case 'lab':
      return <LabContent selectedPatient={selectedPatient} />;
    default:
      return (
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', bgcolor: THEME_COLORS.background }}>
          <Box sx={{ 
            width: '50%', 
            p: 1, 
            overflowY: 'auto',
            borderRight: `1px solid ${THEME_COLORS.border}`
          }}>
            <PatientInfoCard patient={selectedPatient} />
            <VitalChartComponent patient={selectedPatient} />
            <OmicsResults patient={selectedPatient} />
            <CTImageViewer 
              currentRequest={currentRequest}
              loading={ctLoading}
              error={ctError}
              analysisHistory={analysisHistory}
              selectedAnalysis={selectedAnalysis}
              onAnalysisSelect={setSelectedAnalysis}
              showAnalysisSelector={showAnalysisSelector}
            />
          </Box>
          
          <Box sx={{ 
            width: '50%', 
            p: 1, 
            overflowY: 'auto'
          }}>
            <MedicationCard 
              patient={selectedPatient} 
              onMenuChange={setSelectedMenu} 
            />
          </Box>
        </Box>
      );
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
      height: '100vh', 
      bgcolor: THEME_COLORS.background,
      width: '100vw', // 뷰포트 전체 너비 사용
      overflow: 'hidden' // 전체 컨테이너 스크롤 방지
    }}>
      {/* 좌측 고정 메뉴 - 고정 너비 */}
      <Box sx={{ 
        width: 200, 
        flexShrink: 0, // 크기 변경 방지
        height: '100vh',
        overflow: 'hidden'
      }}>
        <LeftSidebar selectedMenu={selectedMenu} onMenuSelect={setSelectedMenu} />
      </Box>
      
      {/* 메인 콘텐츠 영역 - 계산된 너비 */}
      <Box sx={{ 
        width: 'calc(100vw - 200px)', // 사이드바 너비 제외한 정확한 계산
        height: '100vh',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 상단 환자 드롭다운 (대시보드와 임상예측분석에서 표시) */}
        {(selectedMenu === 'dashboard' || selectedMenu === 'clinical-prediction' || selectedMenu === 'drug-interaction') && (
          <Box sx={{ flexShrink: 0 }}>
            <PatientDropdown 
              patients={patients}
              selectedPatient={selectedPatient}
              onPatientSelect={setSelectedPatient}
            />
          </Box>
        )}
        
        {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          height: (selectedMenu === 'dashboard' || selectedMenu === 'clinical-prediction' || selectedMenu === 'drug-interaction') ? 'calc(100vh - 60px)' : '100vh'
        }}>
          {renderMainContent()}
        </Box>
      </Box>
    </Box>
  );
}
