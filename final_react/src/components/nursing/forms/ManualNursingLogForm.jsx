import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, Grid,
  Paper, Table, TableBody, TableCell, TableContainer, TableRow,
  CircularProgress
} from '@mui/material';
import { Save, Close } from '@mui/icons-material';
import { nursingApiService } from '../../../services/nursingApi';
import PatientService from '../../../services/patient.service';

function ManualNursingLogForm({ onClose, onSuccess, initialData = {} }) {
  const [formData, setFormData] = useState({
    patient_id: initialData.patient_id || '',
    log_type: initialData.log_type || 'progress_note',
    title: initialData.title || '',
    subjective: initialData.subjective || '',
    objective: initialData.objective || '',
    assessment: initialData.assessment || '',
    plan: initialData.plan || '',
    special_notes: initialData.special_notes || '',
    practice_location: initialData.practice_location || '' // 장소 추가
  });

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState('');

  const logTypes = [
    { value: 'initial_assessment', label: '초기 사정' },
    { value: 'progress_note', label: '경과 기록' },
    { value: 'medication_record', label: '투약 기록' },
    { value: 'patient_education', label: '환자 교육' },
    { value: 'discharge_planning', label: '퇴원 계획' }
  ];

  const fetchPatients = async () => {
    try {
      setPatientsLoading(true);
      setPatientsError('');
      console.log('환자 목록 조회 시작...');
      
      const response = await PatientService.getAllPatients();
      
      if (response.success) {
        const processedData = response.data.map(patient => ({
          ...patient,
          id: patient.id.toString(),
          display_name: patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          type: 'profile'
          // source 정보 제거
        }));
        
        setPatients(processedData);
        console.log(`환자 목록 처리 완료: 총 ${processedData.length}명`);
        
        if (initialData.patient_id) {
          const initialPatient = processedData.find(p => 
            p.id === initialData.patient_id.toString()
          );
          if (initialPatient) {
            setSelectedPatient(initialPatient);
          }
        }
      } else {
        throw new Error(response.error || '환자 목록 조회 실패');
      }
    } catch (err) {
      console.error('환자 목록 조회 오류:', err);
      setPatientsError(err.message || '환자 목록을 불러오는 데 실패했습니다.');
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [initialData.patient_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    const patient = patients.find(p => p.id === patientId);
    
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patient_id: patientId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patient_id.trim() || !formData.title.trim()) {
      alert('환자와 제목을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const response = await nursingApiService.createManualNursingLog(formData);

      if (response.data) {
        alert('간호일지가 성공적으로 작성되었습니다!');
        if (onSuccess) onSuccess();
      } else {
        alert('오류: 간호일지 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('간호일지 작성 실패:', error);
      alert('간호일지 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: 900,
      maxHeight: '90vh',
      overflow: 'auto',
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 24,
      outline: 'none'
    }}>
      {/* 헤더 */}
      <Box sx={{ 
        p: 3, 
        bgcolor: '#E0969F',
        color: 'white',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5" fontWeight="bold">
          ✏️ 간호일지 직접 작성
        </Typography>
        <Button
          onClick={onClose}
          sx={{ 
            color: 'white',
            minWidth: 'auto',
            p: 1
          }}
        >
          <Close />
        </Button>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ p: 4, bgcolor: '#f8f9fa' }}>
          <Paper sx={{ 
            p: 4, 
            bgcolor: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }}>
            {/* 문서 제목 */}
            <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #333', pb: 2 }}>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
                간호일지
              </Typography>
            </Box>

            {/* 기본 정보 테이블 */}
            <TableContainer sx={{ mb: 4 }}>
              <Table sx={{ border: '2px solid #333' }}>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      border: '1px solid #333',
                      width: '150px'
                    }}>
                      환자/성명
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #333' }}>
                      {selectedPatient ? (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedPatient.display_name} ({selectedPatient.id})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedPatient.age || selectedPatient.birth_date ? 
                              `${selectedPatient.age || ''}세` : ''} {selectedPatient.gender || selectedPatient.sex}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          환자를 선택해주세요
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      border: '1px solid #333',
                      width: '100px'
                    }}>
                      작성일
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #333', width: '150px' }}>
                      {new Date().toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      border: '1px solid #333',
                      width: '100px'
                    }}>
                      장 소
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #333', width: '150px', p: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        variant="standard"
                        name="practice_location"
                        value={formData.practice_location}
                        onChange={handleInputChange}
                        placeholder="장소 입력"
                        InputProps={{ disableUnderline: true }}
                        sx={{ 
                          '& input': { 
                            fontSize: '14px',
                            textAlign: 'center'
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* 환자 선택 및 일지 유형, 제목 */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>환자 선택 *</InputLabel>
                    <Select
                      name="patient_id"
                      value={formData.patient_id}
                      onChange={handlePatientChange}
                      label="환자 선택 *"
                      required
                      disabled={patientsLoading}
                      sx={{ bgcolor: 'white' }}
                    >
                      {patientsLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          환자 목록 로딩 중...
                        </MenuItem>
                      ) : patientsError ? (
                        <MenuItem disabled>
                          <Typography color="error" variant="body2">
                            {patientsError}
                          </Typography>
                        </MenuItem>
                      ) : patients.length === 0 ? (
                        <MenuItem disabled>환자 정보가 없습니다</MenuItem>
                      ) : (
                        patients.map(patient => (
                          <MenuItem 
                            key={patient.id} 
                            value={patient.id}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {patient.display_name} ({patient.id})
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {patient.age ? `${patient.age}세` : ''} {patient.gender || patient.sex}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>일지 유형 *</InputLabel>
                    <Select
                      name="log_type"
                      value={formData.log_type}
                      onChange={handleInputChange}
                      label="일지 유형 *"
                      required
                      sx={{ bgcolor: 'white' }}
                    >
                      {logTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="제목 *"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="간호일지 제목"
                    required
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* SOAP 기록 테이블 */}
            <TableContainer>
              <Table sx={{ border: '2px solid #333' }}>
                <TableBody>
                  {/* 교과내용 헤더 */}
                  <TableRow>
                    <TableCell 
                      colSpan={2} 
                      sx={{ 
                        bgcolor: '#f5f5f5', 
                        fontWeight: 'bold', 
                        border: '1px solid #333',
                        textAlign: 'center',
                        fontSize: '16px'
                      }}
                    >
                      교과내용
                    </TableCell>
                  </TableRow>
                  
                  {/* S - 주관적 자료 */}
                  <TableRow>
                    <TableCell sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      border: '1px solid #333',
                      width: '120px',
                      verticalAlign: 'top',
                      pt: 2
                    }}>
                      주관적 자료 (S)
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #333', p: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="standard"
                        name="subjective"
                        value={formData.subjective}
                        onChange={handleInputChange}
                        placeholder="환자가 호소하는 증상, 불편감, 요구사항 등을 기록하세요"
                        InputProps={{ disableUnderline: true }}
                        sx={{ 
                          '& textarea': { 
                            fontSize: '14px',
                            lineHeight: 1.5,
                            resize: 'none'
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>

                  {/* O - 객관적 자료 */}
                  <TableRow>
                    <TableCell sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      border: '1px solid #333',
                      verticalAlign: 'top',
                      pt: 2
                    }}>
                      객관적 자료 (O)
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #333', p: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="standard"
                        name="objective"
                        value={formData.objective}
                        onChange={handleInputChange}
                        placeholder="관찰된 환자 상태, 활력징후, 검사 결과, 수행한 간호 행위 등을 기록하세요"
                        InputProps={{ disableUnderline: true }}
                        sx={{ 
                          '& textarea': { 
                            fontSize: '14px',
                            lineHeight: 1.5,
                            resize: 'none'
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>

                  {/* A - 사정 */}
                  <TableRow>
                    <TableCell sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      border: '1px solid #333',
                      verticalAlign: 'top',
                      pt: 2
                    }}>
                      사정 (A)
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #333', p: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="standard"
                        name="assessment"
                        value={formData.assessment}
                        onChange={handleInputChange}
                        placeholder="환자 상태에 대한 간호사의 전문적 판단 및 분석을 기록하세요"
                        InputProps={{ disableUnderline: true }}
                        sx={{ 
                          '& textarea': { 
                            fontSize: '14px',
                            lineHeight: 1.5,
                            resize: 'none'
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>

                  {/* P - 계획 */}
                  <TableRow>
                    <TableCell sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      border: '1px solid #333',
                      verticalAlign: 'top',
                      pt: 2
                    }}>
                      계획 (P)
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #333', p: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="standard"
                        name="plan"
                        value={formData.plan}
                        onChange={handleInputChange}
                        placeholder="향후 간호 계획, 교육 내용, 추가 관찰 사항 등을 기록하세요"
                        InputProps={{ disableUnderline: true }}
                        sx={{ 
                          '& textarea': { 
                            fontSize: '14px',
                            lineHeight: 1.5,
                            resize: 'none'
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>

                  {/* 특이사항 */}
                  <TableRow>
                    <TableCell sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      border: '1px solid #333',
                      verticalAlign: 'top',
                      pt: 2
                    }}>
                      특이사항
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #333', p: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="standard"
                        name="special_notes"
                        value={formData.special_notes}
                        onChange={handleInputChange}
                        placeholder="기타 주목할 만한 사항이나 추가 정보를 기록하세요"
                        InputProps={{ disableUnderline: true }}
                        sx={{ 
                          '& textarea': { 
                            fontSize: '14px',
                            lineHeight: 1.5,
                            resize: 'none'
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* 버튼 그룹 */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                color: '#6b7280',
                borderColor: '#d1d5db',
                px: 4,
                '&:hover': {
                  borderColor: '#9ca3af',
                  color: '#374151'
                }
              }}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={loading || !formData.patient_id || patientsLoading}
              sx={{
                bgcolor: '#E0969F',
                '&:hover': { bgcolor: '#C8797F' },
                '&:disabled': { bgcolor: '#d1d5db' },
                px: 4
              }}
            >
              {loading ? '저장 중...' : '💾 저장하기'}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}

export default ManualNursingLogForm;
