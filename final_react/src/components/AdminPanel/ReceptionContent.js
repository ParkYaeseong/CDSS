//src/components/AdminPanel/ReceptionContent.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Grid, FormControl, InputLabel, 
  Select, MenuItem, Chip, Stepper, Step, StepLabel, Alert, Autocomplete, 
  Dialog, DialogTitle, DialogContent, DialogActions, Paper, Card, CardContent
} from '@mui/material';
import { 
  QrCodeScanner, Print, Save, Search, CheckCircle, ArrowForward, 
  Person, LocalHospital 
} from '@mui/icons-material';
import { THEME_COLORS } from '../Common/theme';
import appointmentService from '../../services/appointment.service';
import PatientService from '../../services/patient.service';

function ReceptionContent() {
  const [activeStep, setActiveStep] = useState(0);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isProcessingRef = useRef(false);
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdPatientInfo, setCreatedPatientInfo] = useState(null);
  
  const [receptionData, setReceptionData] = useState({
    patientType: '',
    patientId: '',
    selectedPatient: null,
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    visitType: '',
    department: '',
    doctor: '',
    symptoms: '',
    insurance: ''
  });

  const [newPatientData, setNewPatientData] = useState({
    fname: '',
    lname: '',
    DOB: '',
    sex: '',
    phone_cell: '',
    street: '',
  });

  const steps = ['환자 확인', '접수 정보'];

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await PatientService.getAllPatients();
      if (response.success && Array.isArray(response.data)) {
        setPatients(response.data);
        console.log('환자 목록 로드 완료:', response.data.length + '명');
      }
    } catch (error) {
      console.error('환자 목록 조회 실패:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await appointmentService.getDoctors();
      console.log('의사 목록 조회 응답:', response);
      
      if (response.success && response.doctors) {
        setDoctors(response.doctors);
        console.log('의사 목록 로드 완료:', response.doctors.length + '명');
      } else {
        console.warn('의사 목록 조회 실패:', response.error);
        setDoctors([]);
      }
    } catch (error) {
      console.error('의사 목록 조회 실패:', error);
      setDoctors([]);
    }
  };

  const handleInputChange = (field, value) => {
    setReceptionData(prev => ({ ...prev, [field]: value }));
    
    if (receptionData.patientType === 'new') {
      if (field === 'firstName') {
        setNewPatientData(prev => ({ ...prev, fname: value.trim() }));
      } else if (field === 'lastName') {
        setNewPatientData(prev => ({ ...prev, lname: value.trim() }));
      } else if (field === 'phone') {
        setNewPatientData(prev => ({ ...prev, phone_cell: value }));
      } else if (field === 'birthDate') {
        setNewPatientData(prev => ({ ...prev, DOB: value }));
      } else if (field === 'gender') {
        setNewPatientData(prev => ({ ...prev, sex: value }));
      } else if (field === 'address') {
        setNewPatientData(prev => ({ ...prev, street: value }));
      }
    }
  };

  const filteredPatients = patients.filter(patient => {
    if (!patient) return false;
    
    const displayName = patient.display_name || patient.name || 
                       `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const searchLower = searchTerm.toLowerCase();
    
    return displayName.toLowerCase().includes(searchLower) ||
           (patient.openemr_id && patient.openemr_id.toString().includes(searchTerm)) ||
           (patient.flutter_patient_id && patient.flutter_patient_id.toString().includes(searchTerm)) ||
           (patient.id && patient.id.toString().includes(searchTerm)) ||
           (patient.email && patient.email.toLowerCase().includes(searchLower)) ||
           (patient.username && patient.username.toLowerCase().includes(searchLower));
  });

  const handlePatientSelect = (event, selectedPatient) => {
    if (selectedPatient) {
      const fullName = selectedPatient.display_name || selectedPatient.name || 
                      `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim();
      const nameParts = fullName.split(' ');
      
      setReceptionData(prev => ({
        ...prev,
        patientId: selectedPatient.id,
        selectedPatient: selectedPatient,
        lastName: nameParts[0] || '',
        firstName: nameParts.slice(1).join(' ') || '',
        phone: selectedPatient.phone_number || '',
        birthDate: selectedPatient.date_of_birth || '',
        gender: selectedPatient.gender || '',
        address: selectedPatient.address || ''
      }));
    } else {
      setReceptionData(prev => ({
        ...prev,
        patientId: '',
        selectedPatient: null,
        firstName: '',
        lastName: '',
        phone: '',
        birthDate: '',
        gender: '',
        address: ''
      }));
    }
  };

  const handleNext = () => setActiveStep(prev => prev + 1);
  const handleBack = () => setActiveStep(prev => prev - 1);

  const createNewPatient = async () => {
    try {
      console.log('신규 환자 생성 시작:', newPatientData);
      
      const result = await PatientService.createPatientProfile(newPatientData);
      console.log('환자 생성 성공:', result);
      
      if (result.data && result.data.id) {
        console.log('신규 환자 생성 완료:', result.data);
        return result.data;
      } else {
        throw new Error('환자 생성 응답에 ID가 없습니다.');
      }
    } catch (error) {
      console.error('신규 환자 생성 실패:', error);
      throw error;
    }
  };

  const handleComplete = async () => {
    if (isProcessingRef.current) {
      console.log('이미 처리 중입니다.');
      return;
    }

    try {
      isProcessingRef.current = true;
      setLoading(true);
      console.log('접수 완료 처리 시작:', receptionData);

      let patientId = receptionData.patientId;
      let createdPatient = null;

      if (receptionData.patientType === 'new') {
        console.log('신규 환자 생성 중...');
        try {
          createdPatient = await createNewPatient();
          patientId = createdPatient.id;
          console.log('✅ 신규 환자 생성 완료. 환자 ID:', patientId);
          
          setCreatedPatientInfo({
            id: patientId,
            name: `${receptionData.lastName}${receptionData.firstName}`,
            phone: receptionData.phone,
            type: 'new'
          });
        } catch (error) {
          console.error('❌ 환자 생성 실패:', error);
          alert(`환자 생성에 실패했습니다: ${error.message}`);
          return;
        }
      } else {
        setCreatedPatientInfo({
          id: patientId,
          name: `${receptionData.lastName}${receptionData.firstName}`,
          phone: receptionData.phone,
          type: 'existing'
        });
      }

      setShowSuccessDialog(true);

      if (receptionData.patientType === 'new') {
        await fetchPatients();
      }

      window.dispatchEvent(new CustomEvent('patientUpdated'));
      
    } catch (error) {
      console.error('접수 처리 오류:', error);
      alert(`접수 처리 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setCreatedPatientInfo(null);
    
    setActiveStep(0);
    setSearchTerm('');
    setReceptionData({
      patientType: '', patientId: '', selectedPatient: null, 
      firstName: '', lastName: '', phone: '', birthDate: '',
      gender: '', address: '', visitType: '', department: '', doctor: '', 
      symptoms: '', insurance: ''
    });
    
    setNewPatientData({
      fname: '', lname: '', DOB: '', sex: '',
      phone_cell: '', street: ''
    });
  };

  const handleGoToAppointments = () => {
    handleSuccessDialogClose();
    window.dispatchEvent(new CustomEvent('changeMenu', { detail: 'appointments' }));
  };

  if (loading && !showSuccessDialog) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Typography>환자 접수를 처리하는 중...</Typography>
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
                환자 접수 시스템
              </Typography>
              <Typography variant="h6" color="#003d82" fontWeight="600">
                {patients.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                명 등록
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<QrCodeScanner />} 
                sx={{ 
                  color: '#003d82',
                  borderColor: '#003d82',
                  '&:hover': {
                    borderColor: '#0066cc',
                    bgcolor: '#f9fafb'
                  }
                }}
              >
                QR 스캔
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Print />} 
                sx={{ 
                  color: '#003d82',
                  borderColor: '#003d82',
                  '&:hover': {
                    borderColor: '#0066cc',
                    bgcolor: '#f9fafb'
                  }
                }}
              >
                접수증 출력
              </Button>
            </Box>
          </Box>

          {/* 진행 단계 */}
          <Box sx={{ 
            p: 3,
            bgcolor: '#f8f9fa',
            borderRadius: 1,
            mb: 3
          }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Box>
      </Box>

      {/* 메인 폼 섹션 - 간호일지와 동일한 스타일 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #003d82'
      }}>
        <Box sx={{ p: 4 }}>
          {/* 1단계: 환자 확인 */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#374151' }}>
                환자 정보 확인
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl sx={{ overflow:'visible', width: '120px', margin: '0 auto' }}>
                    <InputLabel>환자 구분</InputLabel>
                    <Select
                      value={receptionData.patientType}
                      onChange={(e) => {
                        handleInputChange('patientType', e.target.value);
                        if (e.target.value === 'new') {
                          setSearchTerm('');
                          setReceptionData(prev => ({
                            ...prev,
                            patientId: '',
                            selectedPatient: null,
                            firstName: '',
                            lastName: '',
                            phone: '',
                            birthDate: '',
                            gender: '',
                            address: ''
                          }));
                        }
                      }}
                      label="환자 구분"
                      sx={{
                        bgcolor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#003d82' },
                        '&.Mui-focused fieldset': { borderColor: '#003d82' }
                      }}
                    >
                      <MenuItem value="new">신규 환자</MenuItem>
                      <MenuItem value="existing">기존 환자</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {receptionData.patientType === 'existing' && (
                  <Grid item xs={12}>
                    <Autocomplete
                      options={filteredPatients}
                      value={receptionData.selectedPatient}
                      onChange={handlePatientSelect}
                      inputValue={searchTerm}
                      onInputChange={(event, newInputValue) => {
                        setSearchTerm(newInputValue);
                      }}
                      getOptionLabel={(option) => {
                        const name = option.display_name || option.name || `${option.first_name || ''} ${option.last_name || ''}`.trim();
                        const id = option.openemr_id || option.flutter_patient_id || option.id;
                        return `${name} (${id})`;
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="기존 환자 검색"
                          placeholder="환자명, 환자번호, 이메일로 검색..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <Search sx={{ mr: 1, color: '#9ca3af' }} />
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: '#f9fafb',
                              '& fieldset': { borderColor: '#e5e7eb' },
                              '&:hover fieldset': { borderColor: '#003d82' },
                              '&.Mui-focused fieldset': { borderColor: '#003d82' }
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <Typography variant="body1" fontWeight="bold">
                              {option.display_name || option.name || `${option.first_name || ''} ${option.last_name || ''}`.trim()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              환자번호: {option.openemr_id || option.flutter_patient_id || option.id}
                              {option.phone_number && ` | 연락처: ${option.phone_number}`}
                            </Typography>
                            {option.email && (
                              <Typography variant="caption" color="text.secondary">
                                이메일: {option.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      noOptionsText={searchTerm ? `"${searchTerm}" 검색 결과가 없습니다.` : "환자명을 입력하여 검색하세요"}
                      loadingText="환자 목록을 불러오는 중..."
                    />
                    {searchTerm && filteredPatients.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        "{searchTerm}" 검색 결과: {filteredPatients.length}명
                      </Typography>
                    )}
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="이름"
                    value={receptionData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    placeholder="철수"
                    disabled={receptionData.patientType === 'existing'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#003d82' },
                        '&.Mui-focused fieldset': { borderColor: '#003d82' }
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="성"
                    value={receptionData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    placeholder="김"
                    disabled={receptionData.patientType === 'existing'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#003d82' },
                        '&.Mui-focused fieldset': { borderColor: '#003d82' }
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="연락처"
                    value={receptionData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="010-1234-5678"
                    required
                    disabled={receptionData.patientType === 'existing'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#003d82' },
                        '&.Mui-focused fieldset': { borderColor: '#003d82' }
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="생년월일"
                    type="date"
                    value={receptionData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    disabled={receptionData.patientType === 'existing'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#003d82' },
                        '&.Mui-focused fieldset': { borderColor: '#003d82' }
                      }
                    }}
                  />
                </Grid>

                {/* 신규 환자인 경우 추가 정보 입력 */}
                {receptionData.patientType === 'new' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl sx={{ overflow:'visible', width: '120px', margin: '0 auto' }}>
                        <InputLabel>성별</InputLabel>
                        <Select
                          value={receptionData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          label="성별"
                          required
                          sx={{
                            bgcolor: '#f9fafb',
                            '& fieldset': { borderColor: '#e5e7eb' },
                            '&:hover fieldset': { borderColor: '#003d82' },
                            '&.Mui-focused fieldset': { borderColor: '#003d82' }
                          }}
                        >
                          <MenuItem value="Male">남성</MenuItem>
                          <MenuItem value="Female">여성</MenuItem>
                          <MenuItem value="Other">기타</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="주소"
                        value={receptionData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="서울시 강남구 테헤란로 123"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#f9fafb',
                            '& fieldset': { borderColor: '#e5e7eb' },
                            '&:hover fieldset': { borderColor: '#003d82' },
                            '&.Mui-focused fieldset': { borderColor: '#003d82' }
                          }
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}

          {/* 2단계: 접수 정보 */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: '#374151' }}>
                접수 정보 입력
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl sx={{ overflow:'visible', width: '120px', margin: '0 auto' }}>
                    <InputLabel>내원 구분</InputLabel>
                    <Select
                      value={receptionData.visitType}
                      onChange={(e) => handleInputChange('visitType', e.target.value)}
                      label="내원 구분"
                      sx={{
                        bgcolor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#003d82' },
                        '&.Mui-focused fieldset': { borderColor: '#003d82' }
                      }}
                    >
                      <MenuItem value="initial">초진</MenuItem>
                      <MenuItem value="revisit">재진</MenuItem>
                      <MenuItem value="emergency">응급</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl sx={{ overflow:'visible', width: '120px', margin: '0 auto' }}>
                    <InputLabel>진료과</InputLabel>
                    <Select
                      value={receptionData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      label="진료과"
                      sx={{
                        bgcolor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#003d82' },
                        '&.Mui-focused fieldset': { borderColor: '#003d82' }
                      }}
                    >
                      <MenuItem value="내과">내과</MenuItem>
                      <MenuItem value="외과">외과</MenuItem>
                      <MenuItem value="정형외과">정형외과</MenuItem>
                      <MenuItem value="피부과">피부과</MenuItem>
                      <MenuItem value="소아과">소아과</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl sx={{ overflow:'visible', width: '120px', margin: '0 auto' }}>
                    <InputLabel>담당의</InputLabel>
                    <Select
                      value={receptionData.doctor}
                      onChange={(e) => handleInputChange('doctor', e.target.value)}
                      label="담당의"
                      sx={{
                        bgcolor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#003d82' },
                        '&.Mui-focused fieldset': { borderColor: '#003d82' }
                      }}
                    >
                      {doctors.map((doctor) => (
                        <MenuItem key={doctor.id} value={doctor.id}>
                          {doctor.name || doctor.username} 
                          {doctor.department && ` (${doctor.department})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="주요 증상"
                    value={receptionData.symptoms}
                    onChange={(e) => handleInputChange('symptoms', e.target.value)}
                    multiline
                    rows={4}
                    placeholder="환자의 주요 증상을 입력하세요"
                    sx={{overflow:'visible', width: '100px', margin: '0 auto' ,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#f9fafb',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#003d82' },
                        '&.Mui-focused fieldset': { borderColor: '#003d82' }
                      }
                    }}
                  />
                </Grid>
              </Grid>
              
              <Alert severity="info" sx={{ mt: 3, borderRadius: 1 }}>
                {receptionData.patientType === 'new' 
                  ? '접수가 완료되면 신규 환자가 생성됩니다.'
                  : '접수가 완료됩니다.'
                }
              </Alert>
            </Box>
          )}

          {/* 하단 버튼 */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 4, 
            pt: 3, 
            borderTop: '1px solid #e5e7eb'
          }}>
            <Button 
              disabled={activeStep === 0} 
              onClick={handleBack}
              variant="outlined"
              sx={{ 
                color: '#003d82',
                borderColor: '#003d82',
                '&:hover': {
                  borderColor: '#0066cc',
                  bgcolor: '#f9fafb'
                }
              }}
            >
              이전
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined"
                sx={{ 
                  color: '#003d82',
                  borderColor: '#003d82',
                  '&:hover': {
                    borderColor: '#0066cc',
                    bgcolor: '#f9fafb'
                  }
                }}
              >
                임시저장
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleComplete}
                  startIcon={<Save />}
                  disabled={loading || !receptionData.firstName || !receptionData.lastName || (receptionData.patientType === 'new' && !receptionData.gender)}
                  sx={{ 
                    bgcolor: '#003d82',
                    '&:hover': { bgcolor: '#0066cc' }
                  }}
                >
                  {loading ? '처리 중...' : '접수 완료'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!receptionData.firstName || !receptionData.lastName || !receptionData.phone || !receptionData.birthDate}
                  sx={{ 
                    bgcolor: '#003d82',
                    '&:hover': { bgcolor: '#0066cc' }
                  }}
                >
                  다음
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 접수 안내 섹션 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #17a2b8',
        mt: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#374151' }}>
            💡 접수 안내
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" paragraph>
                • 성과 이름을 분리하여 입력해주세요
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • 환자명으로 빠른 검색이 가능합니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 신규 환자는 자동으로 생성됩니다
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" paragraph>
                • 중복 처리 방지가 적용됩니다
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • 한국식 이름 순서를 사용합니다 (성+이름)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 문의사항은 원무과 직통 02-2072-1234로 연락주세요
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 성공 다이얼로그 */}
      <Dialog 
        open={showSuccessDialog} 
        onClose={handleSuccessDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <CheckCircle sx={{ fontSize: 60, color: '#28a745', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" color="#28a745">
            접수 완료!
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          {createdPatientInfo && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                {createdPatientInfo.name}님
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                연락처: {createdPatientInfo.phone}
              </Typography>
              <Chip 
                label={createdPatientInfo.type === 'new' ? '신규 환자 생성 완료' : '기존 환자 선택'}
                color={createdPatientInfo.type === 'new' ? 'success' : 'primary'}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
          
          <Alert severity="success" sx={{ width: '100%' }}>
            ✅ 환자 접수가 완료되었습니다!
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button 
            onClick={handleSuccessDialogClose}
            variant="outlined"
            sx={{ 
              color: '#003d82',
              borderColor: '#003d82',
              '&:hover': {
                borderColor: '#0066cc',
                bgcolor: '#f9fafb'
              }
            }}
          >
            확인
          </Button>
          <Button 
            onClick={handleGoToAppointments}
            variant="contained"
            startIcon={<ArrowForward />}
            sx={{ 
              bgcolor: '#003d82',
              '&:hover': { bgcolor: '#0066cc' }
            }}
          >
            예약 관리로 이동
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReceptionContent;
