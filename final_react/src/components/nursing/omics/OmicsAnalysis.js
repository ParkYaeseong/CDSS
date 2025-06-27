// src/pages/OmicsAnalysis.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, Typography, Box, CircularProgress, Alert, Chip, 
  FormControl, InputLabel, Select, MenuItem, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, IconButton
} from '@mui/material';
import { 
  PersonOutline, FileUploadOutlined, PlayArrowOutlined, 
  AssignmentOutlined, ExpandMore, ExpandLess, CloudUpload
} from '@mui/icons-material';
import OmicsService from '../../../services/omics.service';
import PatientService from '../../../services/patient.service';

const REQUIREMENTS = [
  { type: 'RNA-seq', description: '유전자 발현 데이터 (RNA-seq)', icon: '🧬' },
  { type: 'Methylation', description: '메틸레이션 데이터', icon: '🔬' },
  { type: 'Mutation', description: '유전자 변이 데이터', icon: '🧪' },
  { type: 'CNV', description: '복제수 변이 데이터', icon: '📊' },
  { type: 'miRNA', description: 'miRNA 데이터', icon: '🔍' },
];

export default function OmicsSinglePage() {
  const navigate = useNavigate();
  
  // 상태 관리
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [omicsRequest, setOmicsRequest] = useState(null);
  const [previousAnalyses, setPreviousAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // 접기/펼치기 상태
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);

  // 초기 환자 목록 로드
  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await PatientService.getAllPatients();
        if (res.success) {
          setPatients(res.data || []);
        } else {
          setError('환자 목록을 불러오는데 실패했습니다.');
        }
      } catch (e) {
        setError('환자 목록을 불러오는데 실패했습니다.');
      }
    }
    fetchPatients();
  }, []);

  // 환자 선택 시 이전 분석 목록 로드
  useEffect(() => {
    if (selectedPatient?.id) {
      async function fetchPrevious() {
        try {
          const analyses = await OmicsService.getPatientAnalyses(selectedPatient.id);
          setPreviousAnalyses(analyses || []);
        } catch (e) {
          console.error('이전 분석 결과 로드 실패:', e);
          setPreviousAnalyses([]);
        }
      }
      fetchPrevious();
    } else {
      setPreviousAnalyses([]);
    }
  }, [selectedPatient]);

  // 환자 선택 핸들러
  const handlePatientChange = (event) => {
    const patientId = event.target.value;
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient);
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async (files, type) => {
    const file = files[0];
    if (!file) return;
    
    if (!omicsRequest) {
      alert('먼저 분석 요청을 생성해주세요.');
      return;
    }
    
    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      await OmicsService.uploadOmicsFile(omicsRequest.id, file, type);
      setUploadedFiles(prev => ({ ...prev, [type]: file }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  // 분석 요청 생성
  const createRequest = async () => {
    if (!selectedPatient) {
      setError('환자를 먼저 선택해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await OmicsService.createOmicsRequest({ patient: selectedPatient.id });
      setOmicsRequest(res.data);
      alert(`분석 요청이 생성되었습니다. (ID: ${res.data.id.slice(-6)})`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 분석 시작
  const startAnalysis = async () => {
    if (!omicsRequest || Object.keys(uploadedFiles).length === 0) {
      alert('파일을 먼저 업로드해주세요.');
      return;
    }
    setAnalyzing(true);
    setError('');
    try {
      await OmicsService.startAnalysisPipeline(omicsRequest.id);
      alert('분석이 시작되었습니다. 완료되면 결과를 확인할 수 있습니다.');
      
      // 분석 완료 대기
      await waitForCompletion();
      
    } catch (e) {
      setError(e.message);
      setAnalyzing(false);
    }
  };

  // 분석 완료 대기
  const waitForCompletion = async () => {
    const maxAttempts = 60;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const status = await OmicsService.checkAnalysisStatus(omicsRequest.id);
        
        if (status.status === 'COMPLETED') {
          setAnalyzing(false);
          alert('분석이 완료되었습니다!');
          
          // 이전 분석 목록 새로고침
          const analyses = await OmicsService.getPatientAnalyses(selectedPatient.id);
          setPreviousAnalyses(analyses || []);
          return;
        }
        
        if (status.status === 'FAILED') {
          setAnalyzing(false);
          setError('분석이 실패했습니다.');
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setAnalyzing(false);
          setError('분석 시간이 초과되었습니다.');
        }
        
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setAnalyzing(false);
          setError('분석 상태 확인 실패');
        }
      }
    };

    checkStatus();
  };

  // 상세 페이지로 이동하는 함수
  const navigateToResultDetail = (analysisId) => {
    navigate(`/omics/result/${analysisId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'PROCESSING': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED': return '완료';
      case 'FAILED': return '실패';
      case 'PROCESSING': return '진행중';
      case 'QUEUED': return '대기중';
      case 'PENDING': return '준비중';
      default: return status;
    }
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      p: 3, 
      bgcolor: '#f8f9fa',
      width: '100%',
      maxWidth: 'none'
    }}>
      {/* 헤더 */}
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#495057', textAlign: 'center' }}>
        🧬 오믹스 분석
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* 환자 선택 */}
      <Card sx={{ 
        border: '1px solid #dee2e6', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        mb: 3,
        borderLeft: '4px solid #E0969F',
        width: '100%',
        bgcolor: '#f8f9fa'
      }}>
        <CardContent sx={{ bgcolor: '#f8f9fa', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PersonOutline sx={{ color: '#E0969F' }} />
            <Typography variant="h6" fontWeight="600" sx={{ color: '#495057' }}>
              환자 선택
            </Typography>
          </Box>
          
          <FormControl fullWidth size="large">
            <InputLabel sx={{ color: '#6c757d' }}>환자를 선택해주세요</InputLabel>
            <Select
              value={selectedPatient?.id || ''}
              onChange={handlePatientChange}
              label="환자를 선택해주세요"
              disabled={analyzing}
              sx={{
                bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ced4da' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E0969F' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E0969F' }
              }}
            >
              <MenuItem value="" disabled>
                <em>환자를 선택해주세요</em>
              </MenuItem>
              {patients.map((patient) => (
                <MenuItem key={patient.id} value={patient.id}>
                  <Box>
                    <Typography fontWeight="600" color="#495057">
                      {patient.name || patient.display_name}
                    </Typography>
                    <Typography variant="caption" color="#6c757d">
                      ID: {patient.openemr_id || patient.id}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedPatient && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: '#e8f5e9', 
              borderRadius: 1,
              border: '1px solid #c8e6c9'
            }}>
              <Typography sx={{ color: '#2e7d32', fontWeight: '600' }}>
                ✅ 선택된 환자: {selectedPatient.name || selectedPatient.display_name}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 분석 요청 생성 - 항상 표시 */}
      <Card sx={{ 
        border: '1px solid #dee2e6', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        mb: 3,
        borderLeft: '4px solid #E0969F',
        width: '100%',
        bgcolor: '#f8f9fa'
      }}>
        <CardContent sx={{ bgcolor: '#f8f9fa', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AssignmentOutlined sx={{ color: '#E0969F' }} />
            <Typography variant="h6" fontWeight="600" sx={{ color: '#495057' }}>
              분석 요청 생성
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            onClick={createRequest} 
            disabled={loading || !selectedPatient || omicsRequest || analyzing}
            size="large"
            sx={{ 
              bgcolor: '#E0969F',
              '&:hover': { bgcolor: '#C8797F' },
              fontWeight: '600',
              mb: 2
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                요청 생성 중...
              </>
            ) : (
              '분석 요청 생성'
            )}
          </Button>
          
          {omicsRequest && (
            <Box sx={{ 
              p: 2, 
              bgcolor: '#e8f5e9', 
              borderRadius: 1,
              border: '1px solid #c8e6c9'
            }}>
              <Typography sx={{ color: '#2e7d32', fontWeight: '600' }}>
                ✅ 분석 요청 생성 완료 (ID: {omicsRequest.id.slice(-6)})
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 파일 업로드 - 접을 수 있는 섹션 */}
      <Card sx={{ 
        border: '1px solid #dee2e6', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        mb: 3,
        borderLeft: '4px solid #E0969F',
        width: '100%',
        bgcolor: '#f8f9fa'
      }}>
        <CardContent sx={{ bgcolor: '#f8f9fa', p: 0 }}>
          <Box 
            sx={{ 
              p: 3, 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: fileUploadOpen ? '1px solid #dee2e6' : 'none',
              bgcolor: '#f8f9fa'
            }}
            onClick={() => setFileUploadOpen(!fileUploadOpen)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileUploadOutlined sx={{ color: '#E0969F' }} />
              <Typography variant="h6" fontWeight="600" sx={{ color: '#495057' }}>
                파일 업로드
              </Typography>
            </Box>
            <IconButton sx={{ color: '#6c757d' }}>
              {fileUploadOpen ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={fileUploadOpen}>
            <Box sx={{ p: 3, bgcolor: 'white' }}>
              {!omicsRequest && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  분석 요청을 먼저 생성해주세요.
                </Alert>
              )}
              
              {REQUIREMENTS.map(req => (
                <Box 
                  key={req.type} 
                  sx={{ 
                    mb: 2, 
                    p: 2, 
                    border: '2px dashed #ced4da', 
                    borderRadius: 2,
                    bgcolor: uploadedFiles[req.type] ? '#e8f5e9' : '#f8f9fa',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#E0969F'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: '20px' }}>{req.icon}</span>
                      <Typography variant="body1" fontWeight="600" color="#495057">
                        {req.description}
                      </Typography>
                      <span style={{ fontSize: '18px' }}>
                        {uploadedFiles[req.type] ? '✅' : '⏳'}
                      </span>
                    </Box>
                    <Box>
                      <input
                        type="file"
                        id={`file-${req.type}`}
                        style={{ display: 'none' }}
                        onChange={e => handleFileUpload(e.target.files, req.type)}
                        disabled={uploading[req.type] || analyzing || !omicsRequest}
                      />
                      <label htmlFor={`file-${req.type}`}>
                        <Button 
                          variant="outlined" 
                          component="span" 
                          size="small"
                          disabled={uploading[req.type] || analyzing || !omicsRequest}
                          startIcon={<CloudUpload />}
                          sx={{
                            borderColor: '#ced4da',
                            color: '#495057',
                            '&:hover': { 
                              borderColor: '#E0969F',
                              bgcolor: '#fce4ec',
                              color: '#E0969F'
                            }
                          }}
                        >
                          {uploading[req.type] ? (
                            <>
                              <CircularProgress size={14} sx={{ mr: 0.5 }} />
                              업로드 중...
                            </>
                          ) : (
                            uploadedFiles[req.type] ? '파일 변경' : '파일 선택'
                          )}
                        </Button>
                      </label>
                    </Box>
                  </Box>
                  {uploadedFiles[req.type] && (
                    <Typography variant="body2" sx={{ color: '#6c757d', mt: 1, fontSize: '12px' }}>
                      📎 {uploadedFiles[req.type].name}
                    </Typography>
                  )}
                </Box>
              ))}

              {/* 분석 시작 버튼 */}
              {omicsRequest && Object.keys(uploadedFiles).length > 0 && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #dee2e6' }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={startAnalysis} 
                    disabled={analyzing}
                    startIcon={<PlayArrowOutlined />}
                    sx={{ 
                      bgcolor: '#E0969F',
                      '&:hover': { bgcolor: '#C8797F' },
                      fontWeight: '600'
                    }}
                  >
                    {analyzing ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                        분석 진행 중...
                      </>
                    ) : (
                      '🚀 분석 시작'
                    )}
                  </Button>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* 이전 분석 결과 - 접을 수 있는 섹션 */}
      {selectedPatient && (
        <Card sx={{ 
          border: '1px solid #dee2e6', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #E0969F',
          width: '100%',
          bgcolor: '#f8f9fa'
        }}>
          <CardContent sx={{ bgcolor: '#f8f9fa', p: 0 }}>
            <Box 
              sx={{ 
                p: 3, 
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: resultsOpen ? '1px solid #dee2e6' : 'none',
                bgcolor: '#f8f9fa'
              }}
              onClick={() => setResultsOpen(!resultsOpen)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentOutlined sx={{ color: '#E0969F' }} />
                <Typography variant="h6" fontWeight="600" sx={{ color: '#495057' }}>
                  📊 이전 분석 결과 ({previousAnalyses.length}개)
                </Typography>
              </Box>
              <IconButton sx={{ color: '#6c757d' }}>
                {resultsOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={resultsOpen}>
              {previousAnalyses.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'white' }}>
                  <Typography color="#6c757d">
                    이전 분석 결과가 없습니다.
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ bgcolor: 'white' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#e9ecef' }}>
                      <TableRow>
                        <TableCell sx={{ color: '#495057', fontWeight: '600', fontSize: '14px' }}>분석 번호</TableCell>
                        <TableCell sx={{ color: '#495057', fontWeight: '600', fontSize: '14px' }}>상태</TableCell>
                        <TableCell sx={{ color: '#495057', fontWeight: '600', fontSize: '14px' }}>생성일</TableCell>
                        <TableCell sx={{ color: '#495057', fontWeight: '600', fontSize: '14px' }}>작업</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previousAnalyses.map((analysis, index) => (
                        <TableRow 
                          key={analysis.id}
                          sx={{ 
                            '&:hover': { bgcolor: '#f8f9fa' }
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Typography fontWeight="600" color="#495057" fontSize="14px">
                              분석 #{index + 1}
                            </Typography>
                            <Typography variant="caption" color="#6c757d">
                              ID: {analysis.id.slice(-6)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip 
                              label={getStatusText(analysis.status)} 
                              color={getStatusColor(analysis.status)}
                              size="small"
                              sx={{ fontWeight: '600', fontSize: '12px' }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" color="#6c757d" fontSize="13px">
                              {new Date(analysis.request_timestamp).toLocaleDateString('ko-KR')}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Button 
                              size="small" 
                              variant="contained"
                              onClick={() => navigateToResultDetail(analysis.id)}
                              disabled={analysis.status !== 'COMPLETED'}
                              sx={{
                                bgcolor: analysis.status === 'COMPLETED' ? '#E0969F' : '#e9ecef',
                                color: analysis.status === 'COMPLETED' ? 'white' : '#6c757d',
                                fontSize: '12px',
                                py: 0.5,
                                px: 1.5,
                                '&:hover': { 
                                  bgcolor: analysis.status === 'COMPLETED' ? '#C8797F' : '#e9ecef'
                                }
                              }}
                            >
                              {analysis.status === 'COMPLETED' ? '📋 상세 결과' : '⏳ 분석 중'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
