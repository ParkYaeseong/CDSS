import React, { useState, useEffect, useRef, useCallback } from 'react';
import PatientService from '../services/patient.service.js';
import DiagnosisService from '../services/diagnosis.service.js';
import AnalysisButton from '../components/AnalysisButton.jsx';
import {
  Box, Grid, Typography, Divider, Button, List, ListItemButton,
  ListItemText, CircularProgress, Paper, Select, MenuItem, Chip, Alert, Fade, Collapse, ToggleButton
} from '@mui/material';
import {
  CloudUpload, History, LocalHospital, Inbox, Assignment, ExpandLess, ExpandMore, CropSquare
} from '@mui/icons-material';

const themeColor = '#40B7C2';

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
      sx={{ fontWeight: 'bold' }}
    />
  );
};

const ViewerPlaceholder = ({ status, error }) => {
  const isLoading = ['PROCESSING', 'QUEUED', 'RECEIVED'].includes(status);
  const isError = ['FAILED', 'NIFTI_CONVERSION_FAILED', 'SEGMENTATION_FAILED', 'VIEWER_GENERATION_FAILED'].includes(status);

  return (
    <Paper
      sx={{
        height: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#999',
        border: '1px dashed #ccc',
        borderRadius: 2,
        textAlign: 'center',
        px: 2,
      }}
    >
      {isLoading && (
        <>
          <StatusChip status={status} />
          <CircularProgress sx={{ mt: 2 }} />
          <Typography variant="body2" color="text.secondary" mt={2}>
            분석 결과를 생성 중입니다. 잠시만 기다려주세요.
          </Typography>
        </>
      )}

      {isError && (
        <>
          <StatusChip status={status} />
          <Typography variant="body2" color="error" mt={1}>뷰어 로딩 실패</Typography>
          {error && <Typography variant="caption" color="text.secondary">{error}</Typography>}
        </>
      )}

      {!isLoading && !isError && (
        <Typography variant="body2" color="text.secondary">
          데이터 없음
        </Typography>
      )}
    </Paper>
  );
};

const ViewerBlock = React.forwardRef(({ title, url, status, error, onLoad }, ref) => (
    <Box sx={{ width: '100%' }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, textAlign: 'center' }}>{title}</Typography>
        {url ? (
            <iframe
                ref={ref}
                onLoad={onLoad}
                src={url}
                title={title}
                width="100%"
                height="480px"
                style={{ border: '1px solid #ccc', borderRadius: 8 }}
            />
        ) : (
            <ViewerPlaceholder status={status} error={error} />
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
  const [history, setHistory] = useState([]);
  const [analysisStatuses, setAnalysisStatuses] = useState({});
  const [error, setError] = useState('');
  const [activeMenu, setActiveMenu] = useState('CT 업로드');
  const [openHistory, setOpenHistory] = useState(false);
  const [demoViewer, setDemoViewer] = useState({ title: '', url: '' });

  const getOhifUrl = (uid) => `http://35.188.47.40:8042/ohif/viewer?StudyInstanceUIDs=${uid}`;
  const [isBoundingBoxToolActive, setIsBoundingBoxToolActive] = useState(false);
  
  // [신규] OHIF 뷰어 iframe을 참조하기 위한 ref
  const ohifViewerRef = useRef(null);
  const [isOhifViewerLoaded, setIsOhifViewerLoaded] = useState(false);

  // --- [핵심 수정] 바운딩 박스 그리기 모드를 토글하는 함수 ---
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

    // [핵심] 이제는 '명령'이 아닌, '버튼을 찾아 클릭하는 코드'를 문자열로 보냅니다.
    const codeToExecute = `
      try {
        const button = document.querySelector('button[aria-label="Rectangle"]');
        if (button) {
          button.click();
        } else {
          // 이 메시지는 React 앱의 콘솔이 아닌, OHIF 뷰어의 콘솔에 표시됩니다.
          console.error('Rectangle ROI 버튼을 찾을 수 없습니다.');
        }
      } catch(e) {
        console.error('버튼 클릭 중 오류 발생:', e);
      }
    `;

    // 코드를 실행하라는 메시지를 보냅니다.
    ohifWindow.postMessage({ command: 'runCode', code: codeToExecute }, '*');

    alert(`바운딩 박스 그리기 모드 ${newActiveState ? '활성화' : '전환'} 요청을 보냈습니다.`);

  }, [isBoundingBoxToolActive, isOhifViewerLoaded]);

  useEffect(() => {
    const fetchPatients = async () => {
      const res = await PatientService.getPatientProfiles();
      setPatients(res.data);
      setSelectedPatientId(res.data?.[0]?.id || '');
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedPatientId) return;
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
        { label: 'CT 업로드', icon: <CloudUpload /> },
        { label: '영상 판독 리포트', icon: <Assignment /> },
        { label: '의뢰 리스트', icon: <Inbox /> }
    ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e0f7fa' }}>
      <Box sx={{ width: 220, bgcolor: themeColor, color: 'white', p: 2 }}>
        <Typography fontWeight="bold" fontSize="1rem" mb={2}>🔬 영상의학과</Typography>
        <List>
          {menus.map(menu => (
            <ListItemButton key={menu.label} selected={activeMenu === menu.label} onClick={() => setActiveMenu(menu.label)}>
              <Box mr={1}>{menu.icon}</Box>
              <ListItemText primary={menu.label} />
            </ListItemButton>
          ))}
          <ListItemButton onClick={() => setOpenHistory(!openHistory)}>
            <Box mr={1}><History /></Box>
            <ListItemText primary="분석 기록" />
            {openHistory ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openHistory} timeout="auto" unmountOnExit>
            <List dense sx={{ pl: 2 }}>
              {history.map(h => (
                <ListItemButton key={h.id} onClick={() => handleHistoryItemClick(h.id)}>
                  <ListItemText primary={new Date(h.request_timestamp).toLocaleString()} />
                  <StatusChip status={h.status} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h6">환자 선택</Typography>
            <Select
              size="small"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              {patients.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        {activeMenu === 'CT 업로드' && (
          <>
            <Box mt={3}>
              <Typography fontWeight="bold">📂 폴더 업로드 또는 ZIP</Typography>
              <Box display="flex" gap={1} mb={2}>
                <Button variant="outlined" component="label">
                  폴더 선택
                  <input type="file" ref={folderRef} webkitdirectory="" multiple hidden onChange={handleFileChange} />
                </Button>
                <Button variant="outlined" component="label">
                  ZIP 선택
                  <input type="file" ref={zipRef} accept=".zip" hidden onChange={handleFileChange} />
                </Button>
                <Button variant="contained" onClick={handleUpload}>업로드 및 분석 시작</Button>
              </Box>
            </Box>

            {currentRequest && (
              <>
                <Box mt={2}>
                  <Typography fontWeight="bold">🧠 정밀 분석 요청</Typography>
                  {['liver', 'kidney', 'breast', 'pancreas'].map(type => (
                    <Button
                      key={type}
                      onClick={() => handleSpecialAnalysisClick(type)}
                      sx={{ m: 1 }}
                      variant="outlined"
                    >
                      {type.toUpperCase()} 분석 요청
                    </Button>
                  ))}
                  {/* 바운딩 박스 토글 버튼 */}
                  {/* <ToggleButton
                    value="check"
                    selected={isBoundingBoxToolActive}
                    onChange={handleBoundingBoxToolToggle}
                    sx={{ m: 1 }}
                  >
                    <CropSquare sx={{ mr: 1 }} />
                    바운딩 박스
                  </ToggleButton> */}
                </Box>

                <Box mt={4}>
                  <Grid container spacing={2} wrap="nowrap" sx={{ width: '100%' }}>
                    <Grid item sx={{ width: '50%' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <ViewerBlock
                          title="🎨 전체 장기 분할"
                          url={`${process.env.REACT_APP_API_BASE_URL}${currentRequest?.result?.visualization_3d_html_path}`}
                          status={currentRequest.status}
                        />
                        <ViewerBlock
                                  ref={ohifViewerRef}
                                  title="📈 OHIF 뷰어"
                                  url={currentRequest.study_uid ? getOhifUrl(currentRequest.study_uid) : ''}
                                  status={currentRequest.status}
                                  // iframe 로딩이 완료되면 isOhifViewerLoaded를 true로 설정
                                  onLoad={() => setIsOhifViewerLoaded(true)}
                        />
                      </Box>
                    </Grid>
                    <Grid item sx={{ width: '50%' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <ViewerBlock
                          title="🔬 통합 뷰어"
                          url={`${process.env.REACT_APP_API_BASE_URL}${currentRequest?.result?.integrated_viewer_html_path}`}
                          status={currentRequest.status}
                          error={currentRequest?.result?.error_message}
                        />

                        {/* 데모 뷰어를 "통합 뷰어" 아래, 그리고 다른 동적 결과들 위에 추가합니다. */}
                        {demoViewer.url && (
                            <ViewerBlock
                                title={demoViewer.title}
                                url={demoViewer.url}
                                status={'COMPLETED'} // 데모는 항상 완료 상태로 표시
                            />
                        )}

                        {currentRequest?.segmentation_results?.map((seg) => (
                          <ViewerBlock
                            key={seg.id || seg.analysis_name}
                            title={`✨ ${seg.analysis_name}`}
                            url={`${process.env.REACT_APP_API_BASE_URL}${seg.visualization_3d_html_path}`}
                            status={seg.status}
                            error={seg.error_message}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </>
        )}

        {activeMenu === '영상 판독 리포트' && currentRequest && (
          <Box mt={4}>
            <Typography variant="h6">📝 영상 판독 리포트</Typography>
            <Paper elevation={2} sx={{ p: 2, bgcolor: '#f9f9f9' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                아래는 자동 생성된 리포트 예시입니다. 영상의학과 의사는 이를 편집할 수 있습니다.
              </Typography>
              <textarea
                rows={6}
                defaultValue={`[자동 생성 리포트 예시]\n- 환자: ${patients.find(p => p.id === selectedPatientId)?.name}\n- 분석 부위: Liver\n- 판독 소견: Arterial phase에서 약 4.2cm 크기의 저음영 종괴가 관찰됨.\n- 임상적 판단이 필요함.`}
                style={{
                  width: '100%',
                  padding: 12,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
              <Box mt={1} textAlign="right">
                <Button variant="contained" size="small">저장</Button>
              </Box>
            </Paper>
          </Box>
        )}

        {activeMenu === '의뢰 리스트' && (
          <Box mt={4}>
            <Typography variant="h6">📬 의뢰 리스트</Typography>
            <Paper elevation={1} sx={{ p: 2 }}>
              <List>
                <ListItemButton>
                  <ListItemText primary="[내과] Liver CT 판독 요청" secondary="요청일: 2025-06-22 / 우측 간종괴 확인 요청" />
                </ListItemButton>
                <ListItemButton>
                  <ListItemText primary="[종양내과] 신장암 의심 CT 비교 분석" secondary="요청일: 2025-06-20 / 전후 변화 분석 요청" />
                </ListItemButton>
              </List>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}
