import React, { useState, useEffect, useRef, useCallback } from 'react';
import PatientService from '../services/patient.service.js';
import DiagnosisService from '../services/diagnosis.service.js';
import AnalysisButton from '../components/AnalysisButton.jsx';
import {
  Box, Grid, Typography, Divider, Button, List, ListItemButton,
  ListItemText, CircularProgress, Paper, Select, MenuItem, Chip, Alert, Fade, Collapse, ToggleButton,
  Card, CardContent, AppBar, Toolbar, IconButton, Badge, Avatar
} from '@mui/material';
import {
  CloudUpload, History, LocalHospital, Inbox, Assignment, ExpandLess, ExpandMore, CropSquare,
  Phone, Schedule, Person, Notifications, Help, Settings, ExitToApp
} from '@mui/icons-material';
import PatientSummaryDashboard from '../components/PatientSummaryDashboard.jsx';
const themeColor = '#40B7C2';

// 공통으로 사용할 Paper 스타일 정의
const contentPaperStyle = {
  p: 3,
  mb: 3,
  borderRadius: 2,
  border: '1px solid #e0e0e0',
  borderLeft: `4px solid ${themeColor}`,
  boxShadow: 'none', // 그림자 제거
};

const StatusChip = ({ status }) => {
  const config = {
    COMPLETED: { label: '완료', color: 'success' },
    PROCESSING: { label: '처리 중', color: 'primary' },
    QUEUED: { label: '대기 중', color: 'info' },
    RECEIVED: { label: '요청 수신', color: 'info' },
    FAILED: { label: '실패', color: 'error' },
    NIFTI_CONVERSION_FAILED: { label: 'NIfTI 변환 실패', color: 'error' },
    SEGMENTATION_FAILED: { label: 'AI 분할 실패', color: 'error' },
    VIEWER_GENERATION_FAILED: { label: '뷰어 생성 실패', color: 'error' },
  }[status] || { label: status, color: 'default' };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{ 
        fontWeight: 'bold',
        borderRadius: 2,
        fontSize: '0.75rem'
      }}
    />
  );
};

const ViewerPlaceholder = ({ status, error, showPatientPrompt = false }) => {
  const isLoading = ['PROCESSING', 'QUEUED', 'RECEIVED'].includes(status);
  const isError = ['FAILED', 'NIFTI_CONVERSION_FAILED', 'SEGMENTATION_FAILED', 'VIEWER_GENERATION_FAILED'].includes(status);

  if (showPatientPrompt) {
    return (
      <Paper
        elevation={0}
        sx={{
          height: 480,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#999',
          border: `2px dashed ${themeColor}`,
          borderRadius: 3,
          textAlign: 'center',
          px: 3,
          py: 4,
          bgcolor: '#f5f5f5',
          transition: 'all 0.3s ease'
        }}
      >
        <Box sx={{ 
          fontSize: 80, 
          mb: 2, 
          opacity: 0.4,
          color: themeColor
        }}>
          🏥
        </Box>
        <Typography variant="h6" sx={{ 
          color: themeColor, 
          mb: 1,
          fontWeight: 600
        }}>
          환자를 선택해주세요
        </Typography>
        <Typography variant="body2" sx={{ 
          color: '#999',
          lineHeight: 1.6
        }}>
          의료영상 분석을 위해 환자를 선택하세요
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        height: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#999',
        border: '1px solid #e0e0e0',
        borderRadius: 3,
        textAlign: 'center',
        px: 3,
        bgcolor: '#f5f5f5'
      }}
    >
      {isLoading && (
        <>
          <StatusChip status={status} />
          <CircularProgress sx={{ mt: 2, color: themeColor }} />
          <Typography variant="body2" color="text.secondary" mt={2}>
            의료영상 분석 중입니다. 잠시만 기다려주세요.
          </Typography>
        </>
      )}

      {isError && (
        <>
          <StatusChip status={status} />
          <Typography variant="body2" color="error" mt={1}>영상 분석 실패</Typography>
          {error && <Typography variant="caption" color="text.secondary">{error}</Typography>}
        </>
      )}

      {!isLoading && !isError && (
        <Typography variant="body2" color="text.secondary">
          분석 대기 중
        </Typography>
      )}
    </Paper>
  );
};

const ViewerBlock = React.forwardRef(({ title, url, status, error, onLoad, showPatientPrompt = false }, ref) => (
    <Box sx={{ width: '100%' }}>
        <Typography 
          variant="subtitle1" 
          fontWeight="600" 
          sx={{ 
            mb: 2, 
            textAlign: 'center',
            color: '#333',
            fontSize: '1rem'
          }}
        >
          {title}
        </Typography>
        {url ? (
            <iframe
                ref={ref}
                onLoad={onLoad}
                src={url}
                title={title}
                width="100%"
                height="480px"
                style={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            />
        ) : (
            <ViewerPlaceholder status={status} error={error} showPatientPrompt={showPatientPrompt} />
        )}
    </Box>
));

export default function RadiologistDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [currentRequest, setCurrentRequest] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [uploading, setUploading] = useState(false);
  const folderRef = useRef(null);
  const zipRef = useRef(null);
  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const [history, setHistory] = useState([]);
  const [analysisStatuses, setAnalysisStatuses] = useState({});
  const [error, setError] = useState('');
  const [activeMenu, setActiveMenu] = useState('CT 업로드');
  const [openHistory, setOpenHistory] = useState(false);
  const [demoViewer, setDemoViewer] = useState({ title: '', url: '' });

  const getOhifUrl = (uid) => `http://35.188.47.40:8042/ohif/viewer?StudyInstanceUIDs=${uid}`;
  const [isBoundingBoxToolActive, setIsBoundingBoxToolActive] = useState(false);
  
  const ohifViewerRef = useRef(null);
  const [isOhifViewerLoaded, setIsOhifViewerLoaded] = useState(false);

  const handleBoundingBoxToolToggle = useCallback(() => {
    if (!isOhifViewerLoaded) {
      alert("OHIF 뷰어가 아직 메시지를 받을 준비가 되지 않았습니다.");
      return;
    }
    
    const ohifWindow = ohifViewerRef.current?.contentWindow;
    if (!ohifWindow) {
      alert("OHIF 뷰어에 접근할 수 없습니다.");
      return;
    }

    const newActiveState = !isBoundingBoxToolActive;
    setIsBoundingBoxToolActive(newActiveState);

    const codeToExecute = `
      try {
        const button = document.querySelector('button[aria-label="Rectangle"]');
        if (button) {
          button.click();
        } else {
          console.error('Rectangle ROI 버튼을 찾을 수 없습니다.');
        }
      } catch(e) {
        console.error('버튼 클릭 중 오류 발생:', e);
      }
    `;

    ohifWindow.postMessage({ command: 'runCode', code: codeToExecute }, '*');
    alert(`바운딩 박스 그리기 모드 ${newActiveState ? '활성화' : '전환'} 요청을 보냈습니다.`);

  }, [isBoundingBoxToolActive, isOhifViewerLoaded]);

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await PatientService.getPatientProfiles();
      setPatients(res.data);
      setSelectedPatientId('');
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedPatientId) {
        setHistory([]);
        setCurrentRequest(null);
        return;
      }
      const res = await DiagnosisService.getAnalysisHistory(selectedPatientId);
      setHistory(res.data);
      setCurrentRequest(res.data?.[0] || null);
    };
    fetchHistory();
  }, [selectedPatientId]);

  useEffect(() => {
    if (currentRequest?.segmentation_results) {
      const statuses = currentRequest.segmentation_results.reduce((acc, result) => {
        if (result && result.analysis_name) {
          const key = result.analysis_name.split(' ')[0].toLowerCase();
          acc[key] = result.status;
        }
        return acc;
      }, {});
      setAnalysisStatuses(statuses);
    } else {
      setAnalysisStatuses({});
    }
  }, [currentRequest]);

  useEffect(() => {
    let interval;
    if (currentRequest?.id && ['PROCESSING', 'QUEUED', 'RECEIVED'].includes(currentRequest.status)) {
      interval = setInterval(async () => {
        try {
          const res = await DiagnosisService.getDiagnosisRequestDetail(currentRequest.id);
          const updated = res.data;
          setCurrentRequest(updated);
          setHistory(prev => prev.map(h => h.id === updated.id ? updated : h));
        } catch (err) {
          console.error('상태 polling 중 오류:', err);
          clearInterval(interval);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [currentRequest]);

  const handleHistoryItemClick = async (id) => {
    try {
      const res = await DiagnosisService.getDiagnosisRequestDetail(id);
      setCurrentRequest(res.data);
    } catch (err) {
      setError('분석 결과를 불러오는 데 실패했습니다.');
    }
  };

  const handleFileChange = (e) => setSelectedFiles(e.target.files);

  const handleUpload = async () => {
    if (!selectedPatientId || !selectedFiles) return alert('환자와 파일을 선택해주세요');
    setUploading(true);
    try {
      const response = await DiagnosisService.uploadDicomFiles(selectedPatientId, selectedFiles);
      setCurrentRequest(response.data);
      setHistory(prev => [response.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSpecialAnalysisClick = (type) => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://35.188.47.40';
    
    const htmlFileMap = {
        'liver': { title: 'LIVER 분석 결과', url: `${baseUrl}/media/tumor/liver.html` },
        'kidney': { title: 'KIDNEY 분석 결과', url: `${baseUrl}/media/tumor/kits23_ground_truth_view_reoriented.html` },
        'breast': { title: 'BREAST 분석 결과', url: `${baseUrl}/media/tumor/breast_3d_view.html` },
        'pancreas': { title: 'PANCREAS 분석 결과', url: `${baseUrl}/media/tumor/pancreas.html` }
    };

    const demoInfo = htmlFileMap[type.toLowerCase()];

    if (demoInfo) {
      setDemoViewer(demoInfo);
    } else {
      alert(`${type.toUpperCase()} 분석에 대한 데모 결과가 준비되지 않았습니다.`);
      setDemoViewer({ title: '', url: '' });
    }
  };

  const menus = [
    { label: 'CT 업로드', icon: <CloudUpload />, description: '의료영상 업로드 및 AI 분석' },
    { label: '영상 판독 리포트', icon: <Assignment />, description: '판독 결과 작성 및 관리' },
    { label: '의뢰 리스트', icon: <Inbox />, description: '타과 의뢰 및 협진 요청' }
  ];

  const renderPageTitle = () => {
    switch (activeMenu) {
      case 'CT 업로드':
        return (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
              🖥️ AI 영상 분석 및 뷰어
            </Typography>
            <Typography variant="subtitle1" color="#666">
              의료영상을 업로드하여 AI 분석을 실행하고, 3D 뷰어로 결과를 확인합니다.
            </Typography>
          </Box>
        );
      case '영상 판독 리포트':
        return (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
              📝 영상 판독 리포트 작성
            </Typography>
            <Typography variant="subtitle1" color="#666">
              AI가 생성한 초안을 바탕으로 빠르고 정확하게 영상 판독 소견을 작성합니다.
            </Typography>
          </Box>
        );
      case '의뢰 리스트':
        return (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
              📬 타과 의뢰 및 협진 관리
            </Typography>
            <Typography variant="subtitle1" color="#666">
              다른 과로부터 요청된 영상 판독 의뢰를 확인하고 관리합니다.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

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
                영상의학과 | AI 진단 시스템
              </Typography>
            </Box>
          </Box>

          {/* 응급연락처 및 사용자 정보 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, bgcolor: '#fff3cd', borderRadius: 2 }}>
              <Phone sx={{ color: '#856404', fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="#856404" fontWeight="bold">
                  응급실 직통
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="#856404">
                  010-2531-7463
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
              <Avatar sx={{ bgcolor: themeColor, width: 32, height: 32 }}>
                양
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  양미나 교수
                </Typography>
                <Typography variant="caption" color="#666">
                  영상의학과
                </Typography>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 메인 컨텐츠 */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* 사이드바 */}
        <Box sx={{ 
          width: 240, 
          bgcolor: themeColor, 
          color: 'white', 
          p: 3,
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
        }}>
          {/* 진료과 정보 */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              영상의학과
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
              AI 기반 의료영상 진단 시스템
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Schedule sx={{ fontSize: 16 }} />
              <Typography variant="caption">
                진료시간: 평일 09:00-18:00
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 16 }} />
              <Typography variant="caption">
                당직의: 박예성 교수 (내선 2345)
              </Typography>
            </Box>
          </Box>

          <List sx={{ p: 0 }}>
            {menus.map(menu => (
              <ListItemButton 
                key={menu.label} 
                selected={activeMenu === menu.label} 
                onClick={() => setActiveMenu(menu.label)}
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
                    <Typography fontWeight="600">{menu.label}</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5 }}>
                    {menu.description}
                  </Typography>
                </Box>
              </ListItemButton>
            ))}
            
            <ListItemButton 
              onClick={() => setOpenHistory(!openHistory)}
              sx={{
                borderRadius: 2,
                mb: 1,
                p: 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <History />
                  <Box>
                    <Typography fontWeight="600">분석 기록</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      최근 분석 내역 조회
                    </Typography>
                  </Box>
                </Box>
                {openHistory ? <ExpandLess /> : <ExpandMore />}
              </Box>
            </ListItemButton>
            
            <Collapse in={openHistory} timeout="auto" unmountOnExit>
              <List dense sx={{ pl: 2 }}>
                {history.length === 0 ? (
                  <Typography variant="body2" sx={{ p: 2, opacity: 0.7, textAlign: 'center' }}>
                    분석 기록이 없습니다
                  </Typography>
                ) : (
                  history.map(h => (
                    <ListItemButton 
                      key={h.id} 
                      onClick={() => handleHistoryItemClick(h.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)',
                        }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                          {new Date(h.request_timestamp).toLocaleDateString('ko-KR')}
                        </Typography>
                        <StatusChip status={h.status} />
                      </Box>
                    </ListItemButton>
                  ))
                )}
              </List>
            </Collapse>
          </List>
        </Box>

        {/* 메인 컨텐츠 영역 */}
        <Box sx={{ flexGrow: 1, bgcolor: '#f8f9fa', pt: 5, pb: 4, px: 4 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 페이지 제목 추가 */}
          {renderPageTitle()}

          {/* CT 업로드 메뉴일 때의 레이아웃 */}
          {activeMenu === 'CT 업로드' && (
            <>
              <Grid container spacing={3} sx={{ mb: 3, alignItems: 'flex-start' }}>
                {/* 왼쪽 컬럼 */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    {/* 1. 환자 선택 Paper */}
                    <Paper sx={{...contentPaperStyle, mb: 0}}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: themeColor, display: 'flex', alignItems: 'center', gap: 1 }}>
                          👤 환자 선택 및 정보
                        </Typography>
                        {selectedPatientId && (<Chip label="선택됨" color="success" size="small" sx={{ fontWeight: 'bold' }} />)}
                      </Box>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <Select size="medium" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} displayEmpty fullWidth sx={{ borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: themeColor }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: themeColor }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: themeColor } }}>
                            <MenuItem value="" disabled><em>환자를 선택해주세요</em></MenuItem>
                            {patients.map(p => (
                              <MenuItem key={p.id} value={p.id}>
                                <Box>
                                  <Typography fontWeight="600">{p.name}</Typography>
                                  <Typography variant="caption" color="#666">환자번호: {p.id} | 생년월일: {p.date_of_birth || 'N/A'}</Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </Grid>
                        {selectedPatientId && (
                          <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, border: '1px solid #4caf50' }}>
                              <Typography variant="body2" fontWeight="bold" color="#2e7d32">✅ 선택된 환자: {patients.find(p => p.id === selectedPatientId)?.name}</Typography>
                              <Typography variant="caption" color="#2e7d32">의료영상 분석이 가능합니다</Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>

                    {/* 2. DICOM 파일 업로드 Paper */}
                    <Paper sx={{...contentPaperStyle, mb: 0}}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: themeColor, display: 'flex', alignItems: 'center', gap: 1 }}>
                        📁 DICOM 파일 업로드
                </Typography>
                <Typography variant="body2" color="#666" sx={{ mb: 3 }}>
                  CT, MRI, X-ray 등의 DICOM 형식 의료영상을 업로드하여 AI 분석을 시작하세요.
                </Typography>
                
                <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                  <Button 
                    variant="outlined" 
                    component="label" 
                    disabled={!selectedPatientId}
                    startIcon={<CloudUpload />}
                    sx={{
                      borderRadius: 2,
                      borderColor: themeColor,
                      color: themeColor,
                      '&:hover': {
                        borderColor: themeColor,
                        bgcolor: `${themeColor}10`
                      }
                    }}
                  >
                    DICOM 폴더 선택
                    <input type="file" ref={folderRef} webkitdirectory="" multiple hidden onChange={handleFileChange} />
                  </Button>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    disabled={!selectedPatientId}
                    startIcon={<CloudUpload />}
                    sx={{
                      borderRadius: 2,
                      borderColor: themeColor,
                      color: themeColor,
                      '&:hover': {
                        borderColor: themeColor,
                        bgcolor: `${themeColor}10`
                      }
                    }}
                  >
                    ZIP 파일 선택
                    <input type="file" ref={zipRef} accept=".zip" hidden onChange={handleFileChange} />
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleUpload} 
                    disabled={uploading || !selectedPatientId || !selectedFiles}
                    startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <Assignment />}
                    sx={{
                      borderRadius: 2,
                      bgcolor: themeColor,
                      '&:hover': {
                        bgcolor: '#359ca6'
                      }
                    }}
                  >
                    {uploading ? '분석 중...' : 'AI 분석 시작'}
                  </Button>
                </Box>

                {selectedFiles && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      선택된 파일: {selectedFiles.length}개 | 
                      예상 분석 시간: 약 3-5분
                    </Typography>
                  </Alert>
                )}
              </Paper>

              {/* 정밀 분석 섹션 Paper */}
              <Paper sx={contentPaperStyle}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 600, 
                    color: themeColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  🧠 전문 AI 분석 모듈
                </Typography>
                <Typography variant="body2" color="#666" sx={{ mb: 3 }}>
                  장기별 특화된 AI 모델을 사용하여 정밀한 진단 분석을 수행합니다.
                </Typography>
                
                <Grid container spacing={2}>
                  {[
                                { type: 'liver', name: '간 분석', desc: '간암, 간경화 진단' },
                                { type: 'kidney', name: '신장 분석', desc: '신장암, 신결석 진단' },
                                { type: 'breast', name: '유방 분석', desc: '유방암 조기 진단' },
                                { type: 'pancreas', name: '췌장 분석', desc: '췌장암 진단' }
                            ].map(item => (
                                <Grid item xs={12} sm={6} md={3} key={item.type}>
                                    <Button onClick={() => handleSpecialAnalysisClick(item.type)} variant="outlined" disabled={!selectedPatientId} fullWidth sx={{ borderRadius: 2, p: 2, height: 80, flexDirection: 'column', borderColor: themeColor, color: themeColor, '&:hover': { borderColor: themeColor, bgcolor: `${themeColor}10` } }}>
                                        <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>{item.desc}</Typography>
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                  </Box>
                </Grid>

                {/* 오른쪽 컬럼 */}
                <Grid item xs={12} md={5}>
                  {/* 여기가 바로 PatientSummaryDashboard가 들어갈 자리입니다. */}
                  <PatientSummaryDashboard patient={selectedPatient} />
                </Grid>
              </Grid>

              {/* 하단 뷰어 섹션: 전체 너비 사용 */}
              <Paper sx={{...contentPaperStyle, mb: 0}}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: themeColor, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🔬 AI 분석 결과 뷰어
                </Typography>
                
                <Grid container spacing={2} wrap="nowrap" sx={{ width: '100%' }}>
                  <Grid item sx={{ width: '50%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <ViewerBlock
                        title="🎯 3D 장기 분할 결과"
                        url={selectedPatientId && currentRequest ? `${process.env.REACT_APP_API_BASE_URL}${currentRequest?.result?.visualization_3d_html_path}` : ''}
                        status={currentRequest?.status}
                        showPatientPrompt={!selectedPatientId}
                      />
                      <ViewerBlock
                        ref={ohifViewerRef}
                        title="📊 OHIF 영상 뷰어"
                        url={selectedPatientId && currentRequest?.study_uid ? getOhifUrl(currentRequest.study_uid) : ''}
                        status={currentRequest?.status}
                        onLoad={() => setIsOhifViewerLoaded(true)}
                        showPatientPrompt={!selectedPatientId}
                      />
                    </Box>
                  </Grid>
                  <Grid item sx={{ width: '50%' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <ViewerBlock
                        title="🔍 통합 분석 뷰어"
                        url={selectedPatientId && currentRequest ? `${process.env.REACT_APP_API_BASE_URL}${currentRequest?.result?.integrated_viewer_html_path}` : ''}
                        status={currentRequest?.status}
                        error={currentRequest?.result?.error_message}
                        showPatientPrompt={!selectedPatientId}
                      />

                      {/* 전문 AI 분석 모듈 플레이스홀더 및 결과 뷰어 */}
                      {selectedPatientId ? (
                        demoViewer.url ? (
                          <ViewerBlock
                            title={`✨ ${demoViewer.title}`}
                            url={demoViewer.url}
                            status={'COMPLETED'}
                          />
                        ) : (
                          <Box>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight="600" 
                              sx={{ mb: 2, textAlign: 'center', color: '#333', fontSize: '1rem' }}
                            >
                              ✨ 전문 AI 분석 결과
                            </Typography>
                            <Paper
                              elevation={0}
                              sx={{
                                height: 480,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                color: '#999',
                                border: `2px dashed ${themeColor}`,
                                borderRadius: 3,
                                textAlign: 'center',
                                px: 3,
                                py: 4,
                                bgcolor: '#f5f5f5',
                              }}
                            >
                              <Box sx={{ fontSize: 80, mb: 2, opacity: 0.4, color: themeColor }}>
                                🧠
                              </Box>
                              <Typography variant="h6" sx={{ color: themeColor, mb: 1, fontWeight: 600 }}>
                                전문 AI 분석 모듈을 선택하시오.
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#999', lineHeight: 1.6 }}>
                                상단의 모듈을 선택하여 특화된 분석 결과를 확인하세요.
                              </Typography>
                            </Paper>
                          </Box>
                        )
                      ) : (
                        <ViewerBlock
                          title="✨ 전문 AI 분석 결과"
                          showPatientPrompt={true}
                        />
                      )}

                      {selectedPatientId && currentRequest?.segmentation_results?.map((seg) => (
                        <ViewerBlock
                          key={seg.id || seg.analysis_name}
                          title={`🎯 ${seg.analysis_name}`}
                          url={`${process.env.REACT_APP_API_BASE_URL}${seg.visualization_3d_html_path}`}
                          status={seg.status}
                          error={seg.error_message}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}

          {activeMenu === '영상 판독 리포트' && (
            <Paper sx={contentPaperStyle}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600, 
                  color: themeColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📝 영상 판독 리포트 작성
              </Typography>
              {!selectedPatientId ? (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 2, border: `2px dashed ${themeColor}` }}>
                  <Box sx={{ fontSize: 60, mb: 2, opacity: 0.4, color: themeColor }}>🏥</Box>
                  <Typography variant="h6" color={themeColor} sx={{ mb: 1, fontWeight: 600 }}>
                    환자를 선택해주세요
                  </Typography>
                  <Typography variant="body2" color="#999">
                    판독 리포트를 작성할 환자를 먼저 선택하세요
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>AI 보조 판독:</strong> 아래 리포트는 AI가 생성한 초안입니다. 
                      의료진이 검토 후 최종 승인해주세요.
                    </Typography>
                  </Alert>
                  
                  <textarea
                    rows={12}
                    defaultValue={`[AI 생성 판독 리포트 - 검토 필요]

환자명: ${patients.find(p => p.id === selectedPatientId)?.name}
환자번호: ${selectedPatientId}
검사일: ${new Date().toLocaleDateString('ko-KR')}
판독의: 박예성 교수 (영상의학과)

【검사 소견】
- 검사 부위: 복부 CT (조영증강)
- 좌측 신장 실질에서 약 3.5cm 크기의 경계가 명확한 종괴 관찰됨
- 동맥기에서 불균일한 조영증강을 보이며, 정맥기에서 씻겨나감 현상(washout)이 관찰됨
- 신정맥 또는 주변 혈관 침범 소견은 명확하지 않음
- 주변 림프절 비대 소견 없음

【AI 분석 결과】
- 악성 종양(신세포암) 가능성: 높음 (85%)
- 권장 추가 검사: 신장 프로토콜 MRI, 흉부 CT (병기 설정 목적)
- 응급도: 준응급 (조속한 비뇨의학과 협진 필요)

【판독 의견】
좌측 신장에서 신세포암(Renal Cell Carcinoma)이 강력히 의심되는 소견입니다.
비뇨의학과 협진을 통한 추가 평가 및 치료 계획 수립이 필요합니다.

【권장사항】
1. 수술 전 병기 설정을 위한 흉부 CT 고려
2. 비뇨의학과 외래 예약하여 추가 검사 및 치료 방침 결정
3. 신장 기능 평가를 위한 혈액 검사 시행

판독일: ${new Date().toLocaleDateString('ko-KR')}
판독의: 박예성 교수 (영상의학과)`}
                    style={{
                      width: '100%',
                      padding: 16,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      borderRadius: 8,
                      border: `2px solid ${themeColor}`,
                      resize: 'vertical',
                      lineHeight: 1.5
                    }}
                  />
                  <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" gap={1}>
                      <Button variant="outlined" size="small">
                        임시저장
                      </Button>
                      <Button variant="outlined" size="small">
                        템플릿 적용
                      </Button>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Button 
                        variant="outlined"
                        sx={{
                          borderColor: '#f57c00',
                          color: '#f57c00'
                        }}
                      >
                        검토 요청
                      </Button>
                      <Button 
                        variant="contained" 
                        sx={{
                          borderRadius: 2,
                          bgcolor: themeColor,
                          '&:hover': {
                            bgcolor: '#359ca6'
                          }
                        }}
                      >
                        최종 승인
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {activeMenu === '의뢰 리스트' && (
            <Paper sx={contentPaperStyle}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600, 
                  color: themeColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                📬 타과 의뢰 및 협진 요청
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                    <Typography variant="h6" fontWeight="bold" color="#856404">
                      긴급 의뢰: 3건
                    </Typography>
                    <Typography variant="body2" color="#856404">
                      24시간 내 판독 필요
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: '#d4edda', border: '1px solid #c3e6cb' }}>
                    <Typography variant="h6" fontWeight="bold" color="#155724">
                      일반 의뢰: 12건
                    </Typography>
                    <Typography variant="body2" color="#155724">
                      48시간 내 판독 예정
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: '#d1ecf1', border: '1px solid #bee5eb' }}>
                    <Typography variant="h6" fontWeight="bold" color="#0c5460">
                      완료: 45건
                    </Typography>
                    <Typography variant="body2" color="#0c5460">
                      금주 판독 완료
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <List sx={{ p: 0 }}>
                <ListItemButton sx={{ 
                  borderRadius: 2, 
                  mb: 1, 
                  border: `1px solid #ffeaa7`,
                  bgcolor: '#fff3cd',
                  '&:hover': { bgcolor: '#ffeaa7' } 
                }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" fontWeight="bold" color="#856404">
                        [응급실] 복부 외상 환자 CT 판독 요청
                      </Typography>
                      <Chip label="긴급" color="error" size="small" />
                    </Box>
                    <Typography variant="body2" color="#856404">
                      요청의: 박응급 교수 | 요청일: 2025-06-28 16:15 | 환자: 이외상 (남, 45세)
                    </Typography>
                    <Typography variant="body2" color="#856404">
                      임상정보: 교통사고 후 복부 통증, 혈압 저하 소견
                    </Typography>
                  </Box>
                </ListItemButton>
                
                <ListItemButton sx={{ 
                  borderRadius: 2, 
                  mb: 1, 
                  border: `1px solid ${themeColor}20`, 
                  '&:hover': { bgcolor: `${themeColor}10` } 
                }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        [내과] 간종괴 정밀검사 CT 판독 요청
                      </Typography>
                      <Chip label="일반" color="primary" size="small" />
                    </Box>
                    <Typography variant="body2" color="#666">
                      요청의: 김내과 교수 | 요청일: 2025-06-28 14:30 | 환자: 강간암 (여, 62세)
                    </Typography>
                    <Typography variant="body2" color="#666">
                      임상정보: AFP 상승, 간경화 기왕력, 우상복부 종괴 촉지
                    </Typography>
                  </Box>
                </ListItemButton>
                
                <ListItemButton sx={{ 
                  borderRadius: 2, 
                  border: `1px solid ${themeColor}20`, 
                  '&:hover': { bgcolor: `${themeColor}10` } 
                }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        [종양내과] 신장암 수술 전 평가 CT
                      </Typography>
                      <Chip label="일반" color="primary" size="small" />
                    </Box>
                    <Typography variant="body2" color="#666">
                      요청의: 이종양 교수 | 요청일: 2025-06-28 13:45 | 환자: 신장훈 (남, 58세)
                    </Typography>
                    <Typography variant="body2" color="#666">
                      임상정보: 우측 신장 종괴, 수술 전 병기 평가 목적
                    </Typography>
                  </Box>
                </ListItemButton>
              </List>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}