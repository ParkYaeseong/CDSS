//src/components/FlutterPatientManagement.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Modal, IconButton, Stack, Pagination,
  FormControl, Select, MenuItem, InputLabel, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, CircularProgress
} from '@mui/material';
import { 
  Refresh, Visibility, Security, PersonAdd, QrCode, 
  Link, ContentCopy, Search, MoreVert, Person
} from '@mui/icons-material';
import { flutterPatientService } from '../services/flutterPatient.service';

export default function FlutterPatientManagement() {
  const [flutterPatients, setFlutterPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedFlutterPatient, setSelectedFlutterPatient] = useState(null);
  const [hospitalPatientId, setHospitalPatientId] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  
  // 회원가입 코드 관련 상태 추가
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [newGeneratedCode, setNewGeneratedCode] = useState(null);

  // 병원 환자 관련 상태 추가
  const [hospitalPatients, setHospitalPatients] = useState([]);
  const [patientCodeDialogOpen, setPatientCodeDialogOpen] = useState(false);

  // 페이징 상태 (간호일지와 동일)
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const statusTypes = [
    { value: '', label: '전체' },
    { value: 'linked', label: '연결됨' },
    { value: 'unlinked', label: '미연결' }
  ];

  useEffect(() => {
    fetchFlutterPatients();
    fetchHospitalPatients();
  }, []);

  // 필터링 및 정렬 로직 (간호일지와 동일)
  const filteredPatients = flutterPatients.filter(patient => {
    if (!patient) return false;
    
    let matchesSearch = true;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      matchesSearch = patient.name?.toLowerCase().includes(searchLower) ||
                     patient.email?.toLowerCase().includes(searchLower) ||
                     patient.flutter_patient_id?.toString().includes(searchTerm) ||
                     patient.hospital_patient_id?.toString().includes(searchTerm);
    }

    let matchesStatus = true;
    if (statusFilter) {
      if (statusFilter === 'linked') {
        matchesStatus = patient.is_linked;
      } else if (statusFilter === 'unlinked') {
        matchesStatus = !patient.is_linked;
      }
    }

    return matchesSearch && matchesStatus;
  });

  // 정렬 적용
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // 페이징 계산 (간호일지와 동일)
  const totalPages = Math.ceil(sortedPatients.length / rowsPerPage);
  const paginatedPatients = sortedPatients.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const fetchFlutterPatients = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Flutter 환자 목록 조회 시작...');
      const response = await flutterPatientService.getFlutterPatients();
      console.log('Flutter 환자 조회 성공:', response);
      
      if (response.success && Array.isArray(response.flutter_patients)) {
        setFlutterPatients(response.flutter_patients);
        console.log(`Flutter 환자 ${response.flutter_patients.length}명 조회 완료`);
      } else {
        setError('Flutter 환자 데이터 형식이 올바르지 않습니다.');
        setFlutterPatients([]);
      }
    } catch (err) {
      console.error('Flutter 환자 조회 오류:', err);
      setError(`Flutter 환자 목록을 불러오는데 실패했습니다: ${err.message}`);
      setFlutterPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // 병원 환자 목록 조회
  const fetchHospitalPatients = async () => {
    try {
      const response = await flutterPatientService.getHospitalPatients();
      if (response.success) {
        setHospitalPatients(response.patients);
      }
    } catch (error) {
      console.error('병원 환자 목록 조회 실패:', error);
    }
  };

  // 회원가입용 인증 코드 생성 (기존)
  const generateRegistrationCode = async () => {
    try {
      setLoading(true);
      const response = await flutterPatientService.generateRegistrationCode();
      
      if (response.success) {
        const codeData = {
          code: response.code,
          purpose: 'registration',
          created_at: new Date().toISOString(),
          expires_at: response.expires_at,
          is_used: false
        };

        setGeneratedCodes(prev => [codeData, ...prev]);
        setNewGeneratedCode(codeData);
        setShowCodeDialog(true);
        
        console.log('회원가입 인증 코드 생성:', response.code);
      } else {
        alert(`오류: ${response.error}`);
      }
    } catch (error) {
      console.error('인증 코드 생성 실패:', error);
      alert('인증 코드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 특정 환자를 위한 회원가입 코드 생성 (새로 추가)
  const generateRegistrationCodeForPatient = async (hospitalPatient) => {
    try {
      setLoading(true);
      const response = await flutterPatientService.generateRegistrationCodeForPatient(hospitalPatient.openemr_id);
      
      if (response.success) {
        const codeData = {
          code: response.code,
          purpose: 'patient_registration',
          created_at: new Date().toISOString(),
          expires_at: response.expires_at,
          is_used: false,
          hospital_patient: response.hospital_patient
        };

        setGeneratedCodes(prev => [codeData, ...prev]);
        setNewGeneratedCode(codeData);
        setShowCodeDialog(true);
        
        console.log('환자별 회원가입 인증 코드 생성:', response.code);
      } else {
        alert(`오류: ${response.error}`);
      }
    } catch (error) {
      console.error('환자별 인증 코드 생성 실패:', error);
      alert('인증 코드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 환자 프로필 연결용 인증 코드 생성 (수정)
  const generateVerificationCodeForPatient = async (flutterPatient) => {
    try {
      setLoading(true);
      const response = await flutterPatientService.generateVerificationCode(flutterPatient.flutter_patient_id);
      
      if (response.success) {
        setGeneratedCode({
          ...response,
          flutter_patient: flutterPatient
        });
        setCodeDialogOpen(true);
      } else {
        alert(`오류: ${response.error}`);
      }
    } catch (error) {
      console.error('인증 코드 생성 실패:', error);
      alert('인증 코드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 환자 프로필 연결 (새로 추가)
  const linkToPatientProfile = async () => {
    if (!selectedFlutterPatient || !hospitalPatientId) {
      alert('Flutter 환자와 병원 환자 ID를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await flutterPatientService.linkToPatientProfile(
        selectedFlutterPatient.flutter_patient_id,
        hospitalPatientId
      );
      
      if (response.success) {
        alert('환자 프로필과 성공적으로 연결되었습니다!');
        setLinkDialogOpen(false);
        setSelectedFlutterPatient(null);
        setHospitalPatientId('');
        await fetchFlutterPatients(); // 목록 새로고침
      } else {
        alert(`연결 실패: ${response.error}`);
      }
    } catch (error) {
      console.error('환자 프로필 연결 실패:', error);
      alert('환자 프로필 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const viewPatientDetail = async (patientId) => {
    try {
      const response = await flutterPatientService.getFlutterPatientDetail(patientId);
      if (response.success) {
        setSelectedPatient(response.patient);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error('환자 상세 조회 실패:', error);
    }
  };

  // 클립보드에 코드 복사 (새로 추가)
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('인증 코드가 클립보드에 복사되었습니다!');
    }).catch(err => {
      console.error('복사 실패:', err);
    });
  };

  const getConnectionStatus = (patient) => {
    if (patient.is_linked) {
      return { label: '연결됨', color: 'success' };
    }
    return { label: '미연결', color: 'warning' };
  };

  if (loading && flutterPatients.length === 0) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Typography>Flutter 환자 목록을 불러오는 중...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* 헤더 섹션 - 간호일지와 동일한 스타일 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #003d82', // 남색 포인트
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mr: 2, color: '#374151' }}>
                Flutter 환자 관리 게시판
              </Typography>
              <Typography variant="h6" color="#003d82" fontWeight="600">
                {filteredPatients.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                명의 환자
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setPatientCodeDialogOpen(true)}
                sx={{ 
                  bgcolor: '#4caf50',
                  '&:hover': { bgcolor: '#45a049' }
                }}
              >
                환자별 회원가입 코드
              </Button>
              <Button
                variant="contained"
                startIcon={<Security />}
                onClick={generateRegistrationCode}
                sx={{ 
                  bgcolor: '#003d82',
                  '&:hover': { bgcolor: '#0066cc' }
                }}
              >
                일반 회원가입 코드
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchFlutterPatients}
                disabled={loading}
                sx={{ 
                  color: '#003d82',
                  borderColor: '#003d82',
                  '&:hover': {
                    borderColor: '#0066cc',
                    bgcolor: '#f9fafb'
                  }
                }}
              >
                새로고침
              </Button>
            </Box>
          </Box>

          {/* 검색 및 필터 섹션 - 간호일지와 동일한 스타일 */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            mb: 2
          }}>
            <TextField
              placeholder="환자명, 이메일, Flutter ID, 병원 ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#003d82' },
                  '&.Mui-focused fieldset': { borderColor: '#003d82' }
                }
              }}
            />
            
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>연결 상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="연결 상태"
                sx={{
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#003d82' },
                  '&.Mui-focused fieldset': { borderColor: '#003d82' }
                }}
              >
                {statusTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>표시 개수</InputLabel>
              <Select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(e.target.value)}
                label="표시 개수"
                sx={{
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#003d82' },
                  '&.Mui-focused fieldset': { borderColor: '#003d82' }
                }}
              >
                <MenuItem value={5}>5개</MenuItem>
                <MenuItem value={10}>10개</MenuItem>
                <MenuItem value={20}>20개</MenuItem>
                <MenuItem value={50}>50개</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {searchTerm && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              "{searchTerm}" 검색 결과: {filteredPatients.length}명
            </Typography>
          )}
        </Box>
      </Box>

      {/* 생성된 인증 코드 목록 */}
      {generatedCodes.length > 0 && (
        <Box sx={{ 
          bgcolor: 'white',
          borderRadius: 1,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #4caf50',
          mb: 3
        }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
              🔐 생성된 회원가입 인증 코드
            </Typography>
            <Grid container spacing={2}>
              {generatedCodes.slice(0, 5).map((codeData, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Box sx={{ 
                    border: '1px solid #4caf50',
                    borderRadius: 2,
                    bgcolor: codeData.is_used ? '#f5f5f5' : '#f8fff8',
                    p: 2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h5" fontWeight="bold" color="#4caf50">
                        {codeData.code}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => copyToClipboard(codeData.code)}
                        sx={{ color: '#4caf50' }}
                      >
                        <ContentCopy />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      생성: {new Date(codeData.created_at).toLocaleString('ko-KR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      만료: {new Date(codeData.expires_at).toLocaleString('ko-KR')}
                    </Typography>
                    {codeData.hospital_patient && (
                      <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                        환자: {codeData.hospital_patient.name}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip 
                        label={codeData.purpose === 'patient_registration' ? '환자 연결용' : '일반 회원가입'}
                        size="small"
                        color={codeData.purpose === 'patient_registration' ? 'primary' : 'success'}
                      />
                      <Chip 
                        label={codeData.is_used ? '사용됨' : '사용 가능'}
                        size="small"
                        color={codeData.is_used ? 'default' : 'success'}
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      )}

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderLeft: '4px solid #dc3545' }}>
          {error}
          <Button onClick={fetchFlutterPatients} sx={{ ml: 2 }}>
            다시 시도
          </Button>
        </Alert>
      )}

      {/* 게시판 테이블 섹션 - 간호일지와 동일한 스타일 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #003d82'
      }}>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151', width: '60px' }}>
                  번호
                </TableCell>
                <TableCell 
                  sx={{ fontWeight: 'bold', color: '#374151', cursor: 'pointer' }}
                  onClick={() => handleSort('flutter_patient_id')}
                >
                  Flutter 환자 ID
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  병원 환자 ID
                </TableCell>
                <TableCell 
                  sx={{ fontWeight: 'bold', color: '#374151', cursor: 'pointer' }}
                  onClick={() => handleSort('name')}
                >
                  환자 정보
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  연결 상태
                </TableCell>
                <TableCell 
                  sx={{ fontWeight: 'bold', color: '#374151', cursor: 'pointer' }}
                  onClick={() => handleSort('created_at')}
                >
                  가입일
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151', width: '120px' }}>
                  관리
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                    <Person sx={{ fontSize: 60, color: '#003d82', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#374151', mb: 1 }}>
                      {searchTerm ? '검색 결과가 없습니다' : '등록된 Flutter 환자가 없습니다'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      새로운 Flutter 환자를 등록해보세요!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPatients.map((patient, index) => {
                  const status = getConnectionStatus(patient);
                  return (
                    <TableRow 
                      key={patient.flutter_patient_id}
                      sx={{ 
                        '&:hover': { bgcolor: '#f8f9fa' },
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      <TableCell sx={{ color: '#6b7280' }}>
                        {(page - 1) * rowsPerPage + index + 1}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" fontWeight="500" sx={{ color: '#374151' }}>
                          {patient.flutter_patient_id}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {patient.hospital_patient_id || (
                            <Typography variant="body2" color="text.secondary">
                              미연결
                            </Typography>
                          )}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500" sx={{ color: '#374151' }}>
                            {patient.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {patient.email}
                          </Typography>
                          {patient.phone && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {patient.phone}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={status.label}
                          color={status.color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {patient.is_linked && patient.linked_patient_name && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            연결: {patient.linked_patient_name}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {new Date(patient.created_at).toLocaleDateString('ko-KR')}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="상세 보기">
                            <IconButton 
                              size="small"
                              onClick={() => viewPatientDetail(patient.flutter_patient_id)}
                              sx={{ 
                                color: '#003d82',
                                '&:hover': { bgcolor: '#f3f4f6' }
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {!patient.is_linked && (
                            <>
                              <Tooltip title="인증코드">
                                <IconButton 
                                  size="small"
                                  onClick={() => generateVerificationCodeForPatient(patient)}
                                  sx={{ 
                                    color: '#2196f3',
                                    '&:hover': { bgcolor: '#f3f4f6' }
                                  }}
                                >
                                  <QrCode fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="연결">
                                <IconButton 
                                  size="small"
                                  onClick={() => {
                                    setSelectedFlutterPatient(patient);
                                    setLinkDialogOpen(true);
                                  }}
                                  sx={{ 
                                    color: '#10b981',
                                    '&:hover': { bgcolor: '#f3f4f6' }
                                  }}
                                >
                                  <Link fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          
                          <Tooltip title="더보기">
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: '#6b7280',
                                '&:hover': { bgcolor: '#f3f4f6' }
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이징 섹션 - 간호일지와 동일한 스타일 */}
        {filteredPatients.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid #e5e7eb'
          }}>
            <Typography variant="body2" color="text.secondary">
              총 {filteredPatients.length}명 중 {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredPatients.length)}명 표시
            </Typography>
            
            <Pagination 
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
                  '&.Mui-selected': {
                    bgcolor: '#003d82',
                    '&:hover': { bgcolor: '#0066cc' }
                  }
                }
              }}
            />
          </Box>
        )}
      </Box>

      {/* 기존 다이얼로그들 유지 */}
      {/* 병원 환자 선택 다이얼로그 */}
      <Dialog open={patientCodeDialogOpen} onClose={() => setPatientCodeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>병원 환자 선택 - Flutter 앱 회원가입 코드 생성</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Flutter 앱에서 회원가입할 병원 환자를 선택하세요.
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>환자명</TableCell>
                  <TableCell>OpenEMR ID</TableCell>
                  <TableCell>생년월일</TableCell>
                  <TableCell>성별</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hospitalPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.openemr_id}</TableCell>
                    <TableCell>
                      {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('ko-KR') : '-'}
                    </TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          generateRegistrationCodeForPatient(patient);
                          setPatientCodeDialogOpen(false);
                        }}
                        sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
                      >
                        코드 생성
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatientCodeDialogOpen(false)}>취소</Button>
        </DialogActions>
      </Dialog>

      {/* 회원가입 인증 코드 생성 성공 다이얼로그 */}
      <Dialog open={showCodeDialog} onClose={() => setShowCodeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white', textAlign: 'center' }}>
          <Security sx={{ fontSize: 60, mb: 2 }} />
          <Box component="div" sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {newGeneratedCode?.purpose === 'patient_registration' ? '환자별 회원가입 코드 생성 완료!' : '회원가입 인증 코드 생성 완료!'}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          {newGeneratedCode && (
            <Box>
              <Typography variant="h3" fontWeight="bold" color="#4caf50" sx={{ mb: 2 }}>
                {newGeneratedCode.code}
              </Typography>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="bold">
                  {newGeneratedCode.hospital_patient ? 
                    `${newGeneratedCode.hospital_patient.name} 환자를 위한 Flutter 앱 회원가입 코드입니다!` :
                    'Flutter 앱에서 회원가입 시 이 코드를 입력하세요!'
                  }
                </Typography>
              </Alert>
              
              <Box sx={{ bgcolor: '#f8fff8', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  • 코드 유효시간: 24시간
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 일회용 코드입니다
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Flutter 앱 회원가입 화면에서 입력하세요
                </Typography>
                {newGeneratedCode.hospital_patient && (
                  <Typography variant="body2" color="text.secondary">
                    • 회원가입 시 자동으로 {newGeneratedCode.hospital_patient.name} 환자와 연결됩니다
                  </Typography>
                )}
              </Box>
              
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => copyToClipboard(newGeneratedCode.code)}
                sx={{ 
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  '&:hover': { borderColor: '#45a049', color: '#45a049' }
                }}
              >
                코드 복사
              </Button>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={() => setShowCodeDialog(false)}
            variant="contained"
            sx={{ 
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' }
            }}
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>

      {/* 인증 코드 생성 다이얼로그 */}
      <Dialog open={codeDialogOpen} onClose={() => setCodeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>환자 프로필 연결용 인증 코드</DialogTitle>
        <DialogContent>
          {generatedCode && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                {generatedCode.verification_code}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                환자: {generatedCode.flutter_patient?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                만료시간: {new Date(generatedCode.expires_at).toLocaleString('ko-KR')}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => copyToClipboard(generatedCode.verification_code)}
                sx={{ mt: 2 }}
              >
                코드 복사
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 환자 프로필 연결 다이얼로그 */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>환자 프로필 연결</DialogTitle>
        <DialogContent>
          {selectedFlutterPatient && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Flutter 환자: {selectedFlutterPatient.name}
              </Typography>
              <TextField
                fullWidth
                label="병원 환자 ID (OpenEMR ID)"
                value={hospitalPatientId}
                onChange={(e) => setHospitalPatientId(e.target.value)}
                placeholder="예: EMR123456"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                병원 시스템에 등록된 환자의 OpenEMR ID를 입력하세요.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>취소</Button>
          <Button 
            onClick={linkToPatientProfile}
            variant="contained"
            disabled={!hospitalPatientId || loading}
          >
            연결
          </Button>
        </DialogActions>
      </Dialog>

      {/* 환자 상세 정보 다이얼로그 */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Flutter 환자 상세 정보</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>기본 정보</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Flutter 환자 ID"
                  value={selectedPatient.flutter_patient_id}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="병원 환자 ID"
                  value={selectedPatient.hospital_patient_id || 'N/A'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="사용자명"
                  value={selectedPatient.user_info?.username || 'N/A'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="이메일"
                  value={selectedPatient.user_info?.email || 'N/A'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="이름"
                  value={selectedPatient.user_info?.full_name || 'N/A'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="전화번호"
                  value={selectedPatient.medical_info?.phone_number || 'N/A'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="생년월일"
                  value={selectedPatient.medical_info?.birth_date || 'N/A'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="혈액형"
                  value={selectedPatient.medical_info?.blood_type || 'N/A'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="주소"
                  value={selectedPatient.medical_info?.address || 'N/A'}
                  fullWidth
                  multiline
                  rows={2}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="알레르기"
                  value={selectedPatient.medical_info?.allergies || 'N/A'}
                  fullWidth
                  multiline
                  rows={2}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>연결 정보</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="연결 상태"
                  value={selectedPatient.link_info?.is_linked ? '연결됨' : '미연결'}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="연결된 환자명"
                  value={selectedPatient.link_info?.linked_patient_name || 'N/A'}
                  fullWidth
                  disabled
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* Flutter 환자 관리 안내 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #17a2b8',
        mt: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#374151' }}>
            Flutter 앱 환자 관리 안내
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" paragraph>
                • "환자별 회원가입 코드 생성" 버튼으로 특정 병원 환자와 연결된 Flutter 앱 회원가입 코드를 생성할 수 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • "일반 회원가입 코드 생성" 버튼으로 일반적인 Flutter 앱 회원가입 코드를 생성할 수 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • "인증코드" 버튼으로 환자 프로필 연결용 코드를 생성할 수 있습니다.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" paragraph>
                • "연결" 버튼으로 Flutter 환자를 병원 환자 프로필과 직접 연결할 수 있습니다.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • 연결된 환자는 기존 의료 기록과 연동되어 통합 관리됩니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 문의사항은 원무과 직통 02-2072-1234로 연락주세요.
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
