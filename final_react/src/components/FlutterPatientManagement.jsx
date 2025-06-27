// src/components/FlutterPatientManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Button, Alert,
  CircularProgress, Grid, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton
} from '@mui/material';
import { 
  Refresh, Visibility, Security, PersonAdd, QrCode, 
  Link, ContentCopy 
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
  const [activeTab, setActiveTab] = useState(0);
  
  // 회원가입 코드 관련 상태 추가
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [newGeneratedCode, setNewGeneratedCode] = useState(null);

  // 병원 환자 관련 상태 추가
  const [hospitalPatients, setHospitalPatients] = useState([]);
  const [patientCodeDialogOpen, setPatientCodeDialogOpen] = useState(false);

  useEffect(() => {
    fetchFlutterPatients();
    fetchHospitalPatients();
  }, []);

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

  const filteredPatients = flutterPatients.filter(patient => {
    if (activeTab === 0) return true; // 전체
    if (activeTab === 1) return patient.is_linked; // 연결된 환자
    if (activeTab === 2) return !patient.is_linked; // 미연결 환자
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          Flutter 인증 코드 발급
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setPatientCodeDialogOpen(true)}
            sx={{ mr: 1, bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
          >
            환자별 회원가입 코드 생성
          </Button>
          <Button
            variant="contained"
            startIcon={<Security />}
            onClick={generateRegistrationCode}
            sx={{ mr: 1, bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
          >
            일반 회원가입 코드 생성
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchFlutterPatients}
            disabled={loading}
          >
            새로고침
          </Button>
        </Box>
      </Box>

      {/* 생성된 인증 코드 목록 */}
      {generatedCodes.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'white', border: '1px solid #e5e7eb', borderLeft: '4px solid #4caf50' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
              🔐 생성된 회원가입 인증 코드
            </Typography>
            <Grid container spacing={2}>
              {generatedCodes.slice(0, 5).map((codeData, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card sx={{ 
                    border: '1px solid #4caf50',
                    borderRadius: 2,
                    bgcolor: codeData.is_used ? '#f5f5f5' : '#f8fff8'
                  }}>
                    <CardContent sx={{ p: 2 }}>
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
                      <Chip 
                        label={codeData.purpose === 'patient_registration' ? '환자 연결용' : '일반 회원가입'}
                        size="small"
                        color={codeData.purpose === 'patient_registration' ? 'primary' : 'success'}
                        sx={{ mt: 1, mr: 1 }}
                      />
                      <Chip 
                        label={codeData.is_used ? '사용됨' : '사용 가능'}
                        size="small"
                        color={codeData.is_used ? 'default' : 'success'}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Flutter 환자 통계 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {flutterPatients.length}
              </Typography>
              <Typography variant="body2">전체 Flutter 환자</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {flutterPatients.filter(p => p.is_linked).length}
              </Typography>
              <Typography variant="body2">병원 연결 환자</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {flutterPatients.filter(p => !p.is_linked).length}
              </Typography>
              <Typography variant="body2">미연결 환자</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {flutterPatients.filter(p => p.created_at && 
                  new Date(p.created_at) > new Date(Date.now() - 7*24*60*60*1000)
                ).length}
              </Typography>
              <Typography variant="body2">최근 7일 가입</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
        <Tab label={`전체 환자 (${flutterPatients.length})`} />
        <Tab label={`연결된 환자 (${flutterPatients.filter(p => p.is_linked).length})`} />
        <Tab label={`미연결 환자 (${flutterPatients.filter(p => !p.is_linked).length})`} />
      </Tabs>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button onClick={fetchFlutterPatients} sx={{ ml: 2 }}>
            다시 시도
          </Button>
        </Alert>
      )}

      {/* Flutter 환자 테이블 */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Flutter 환자 정보를 불러오는 중...</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Flutter 환자 ID</TableCell>
                <TableCell>병원 환자 ID</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>전화번호</TableCell>
                <TableCell>연결 상태</TableCell>
                <TableCell>가입일</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const status = getConnectionStatus(patient);
                  return (
                    <TableRow key={patient.flutter_patient_id}>
                      <TableCell>{patient.flutter_patient_id}</TableCell>
                      <TableCell>
                        {patient.hospital_patient_id || (
                          <Typography variant="body2" color="text.secondary">
                            미연결
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{patient.phone || '정보 없음'}</TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          color={status.color}
                          size="small"
                        />
                        {patient.is_linked && patient.linked_patient_name && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            연결: {patient.linked_patient_name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(patient.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => viewPatientDetail(patient.flutter_patient_id)}
                          >
                            상세
                          </Button>
                          {!patient.is_linked && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<QrCode />}
                                onClick={() => generateVerificationCodeForPatient(patient)}
                                sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
                              >
                                인증코드
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Link />}
                                onClick={() => {
                                  setSelectedFlutterPatient(patient);
                                  setLinkDialogOpen(true);
                                }}
                                sx={{ 
                                  borderColor: '#10b981',
                                  color: '#10b981',
                                  '&:hover': { borderColor: '#059669', color: '#059669' }
                                }}
                              >
                                연결
                              </Button>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', p: 4 }}>
                    {error ? '데이터를 불러올 수 없습니다.' : 
                     activeTab === 0 ? '등록된 Flutter 환자가 없습니다.' :
                     activeTab === 1 ? '연결된 Flutter 환자가 없습니다.' :
                     '미연결 Flutter 환자가 없습니다.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* 병원 환자 선택 다이얼로그 (새로 추가) */}
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

      {/* 회원가입 인증 코드 생성 성공 다이얼로그 (HTML 구조 에러 수정) */}
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

      {/* 인증 코드 생성 다이얼로그 (수정) */}
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
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📱 Flutter 앱 환자 관리 안내
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • "환자별 회원가입 코드 생성" 버튼으로 특정 병원 환자와 연결된 Flutter 앱 회원가입 코드를 생성할 수 있습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • "일반 회원가입 코드 생성" 버튼으로 일반적인 Flutter 앱 회원가입 코드를 생성할 수 있습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • "인증코드" 버튼으로 환자 프로필 연결용 코드를 생성할 수 있습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • "연결" 버튼으로 Flutter 환자를 병원 환자 프로필과 직접 연결할 수 있습니다.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 연결된 환자는 기존 의료 기록과 연동되어 통합 관리됩니다.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
