// final_react/src/components/nursing/forms/NursingLogForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, Grid, 
  Checkbox, FormControlLabel, FormGroup, Alert,
  CircularProgress, Paper, Chip
} from '@mui/material';
import { Save, Refresh, AutoAwesome, Person, Assignment } from '@mui/icons-material';
import { nursingApiService } from '../../../services/nursingApi';

function NursingLogForm({ selectedPatient, onSuccess, setLoading }) {
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    diagnosis: '',
    age: '',
    log_type: 'progress_note',
    partial_content: ''
  });

  const [checkedItems, setCheckedItems] = useState({});
  const [itemDetails, setItemDetails] = useState({});
  const [aiResponse, setAiResponse] = useState(null);

  const checklistItems = {
    progress_note: [
      { id: 'morning_round', text: '오전 회진 시 환자 상태 관찰', placeholder: '예: 환자 의식 명료, 협조적, 특이사항 없음' },
      { id: 'vital_signs', text: '활력징후 측정 (혈압, 맥박, 체온, 호흡)', placeholder: '예: 혈압 120/80mmHg, 맥박 72회/분, 체온 36.5℃, 호흡 18회/분' },
      { id: 'pain_assessment', text: '통증 사정 및 평가', placeholder: '예: 복부 통증 NRS 3점, 진통제 투여 후 2점으로 감소' },
      { id: 'medication_effect', text: '투약 후 효과 관찰', placeholder: '예: 혈압약 투여 후 30분 뒤 혈압 정상 범위로 감소' },
      { id: 'patient_complaint', text: '환자 호소사항 청취', placeholder: '예: "어지럽고 메스꺼워요", "잠을 잘 못 잤어요"' }
    ],
    initial_assessment: [
      { id: 'admission_vital', text: '입원 시 활력징후 측정', placeholder: '예: 혈압 140/90mmHg, 맥박 88회/분, 체온 37.2℃' },
      { id: 'medical_history', text: '과거 병력 및 현재 복용약물 확인', placeholder: '예: 고혈압 5년, 당뇨병 3년, 현재 복용약물 3가지' },
      { id: 'allergy_check', text: '알레르기 여부 확인', placeholder: '예: 페니실린 알레르기, 음식 알레르기 없음' }
    ],
    medication_record: [
      { id: 'med_preparation', text: '투약 전 약물 확인 (5R 원칙)', placeholder: '예: 올바른 환자, 올바른 약물, 올바른 용량, 올바른 경로, 올바른 시간 확인' },
      { id: 'patient_identification', text: '환자 신원 확인', placeholder: '예: 환자 성명, 생년월일, 등록번호 3가지 확인' },
      { id: 'med_administration', text: '정확한 시간에 투약 실시', placeholder: '예: 오전 8시 정확히 경구 투여, 환자 복용 확인' }
    ]
  };

  const logTypes = [
    { value: 'initial_assessment', label: '초기 사정' },
    { value: 'progress_note', label: '경과 기록' },
    { value: 'medication_record', label: '투약 기록' },
    { value: 'patient_education', label: '환자 교육' },
    { value: 'discharge_planning', label: '퇴원 계획' }
  ];

  const fetchPatients = async () => {
    setPatientsLoading(true);
    setPatientsError(null);
    try {
      const response = await nursingApiService.getPatients();
      if (response && response.data) {
        setPatients(response.data);
      }
    } catch (err) {
      setPatientsError('환자 목록을 불러오는 데 실패했습니다.');
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleCheckboxChange = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
    
    if (checkedItems[itemId]) {
      setItemDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[itemId];
        return newDetails;
      });
    }
  };

  const handleDetailChange = (itemId, value) => {
    setItemDetails(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const generateContentFromChecklist = () => {
    const currentItems = checklistItems[formData.log_type] || [];
    const selectedItems = currentItems.filter(item => checkedItems[item.id]);
    
    if (selectedItems.length === 0) return formData.partial_content;
    
    const detailedContent = selectedItems.map(item => {
      const detail = itemDetails[item.id];
      return detail ? `- ${item.text}: ${detail}` : `- ${item.text}`;
    }).join('\n');
    
    return detailedContent + (formData.partial_content ? '\n\n' + formData.partial_content : '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'log_type') {
      setCheckedItems({});
      setItemDetails({});
    }
  };

  const handlePatientSelect = (e) => {
    const patientId = e.target.value;
    const patient = patients.find(p => p.patient_id === patientId || p.id === patientId);
    if (patient) {
      setFormData(prev => ({
        ...prev,
        patient_id: patientId,
        diagnosis: patient.diagnosis || '',
        age: patient.age ? patient.age.toString() : ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patient_id.trim()) {
      alert('환자 ID를 입력해주세요.');
      return;
    }

    const combinedContent = generateContentFromChecklist();
    
    if (!combinedContent.trim()) {
      alert('체크리스트에서 항목을 선택하거나 추가 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const response = await nursingApiService.generateNursingLog({
        patient_id: formData.patient_id,
        log_type: formData.log_type,
        partial_content: combinedContent
      });

      if (response.data.success) {
        alert('간호일지 자동완성이 완료되었습니다!');
        setAiResponse(response.data.data);
        if (onSuccess) onSuccess();
      } else {
        alert('오류: ' + response.data.error);
      }
    } catch (error) {
      console.error('AI 자동완성 실패:', error);
      alert('자동완성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentItems = checklistItems[formData.log_type] || [];

  return (
    <Box sx={{ 
      width: '100%',
      height: '100vh',
      overflow: 'auto', // 스크롤 문제 해결
      bgcolor: '#f8f9fa'
    }}>
      <Box sx={{ p: 3 }}>
        {/* 헤더 */}
        <form onSubmit={handleSubmit}>
          {/* 환자 선택 섹션 - 하얀 박스 + 포인트 색 줄 */}
          <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: 1, 
            mb: 3,
            border: '1px solid #e5e7eb',
            borderLeft: '4px solid #E0969F'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="600" sx={{ color: '#374151' }}>
                  간호일지 AI 자동완성
                </Typography>
              </Box>
              
              {/* 환자 선택 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#6b7280' }}>
                  환자 선택:
                </Typography>
                {patientsLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">환자 목록 로딩 중...</Typography>
                  </Box>
                ) : patientsError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {patientsError}
                    <Button size="small" onClick={fetchPatients} sx={{ ml: 1 }}>
                      다시 시도
                    </Button>
                  </Alert>
                ) : (
                  <FormControl fullWidth>
                    <InputLabel>새 환자 또는 직접 입력</InputLabel>
                    <Select
                      value={formData.patient_id}
                      onChange={handlePatientSelect}
                      label="새 환자 또는 직접 입력"
                      MenuProps={{
                        disableScrollLock: true, // 스크롤 문제 해결
                        PaperProps: {
                          style: {
                            maxHeight: 200
                          }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e5e7eb'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0969F'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0969F'
                        }
                      }}
                    >
                      <MenuItem value="">새 환자 또는 직접 입력</MenuItem>
                      {patients.map(patient => (
                        <MenuItem key={patient.id || patient.patient_id} value={patient.patient_id || patient.id}>
                          {patient.patient_id || patient.id} - {patient.name} {patient.age && `(${patient.age}세)`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {/* 입력 필드들 */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="환자 ID *"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleInputChange}
                    placeholder="예: P001, 홍길동"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#E0969F' },
                        '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="나이"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="예: 65"
                    inputProps={{ min: 0, max: 150 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#E0969F' },
                        '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="진단명"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    placeholder="예: 고혈압, 당뇨병, 폐렴"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#E0969F' },
                        '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>일지 유형 *</InputLabel>
                    <Select
                      name="log_type"
                      value={formData.log_type}
                      onChange={handleInputChange}
                      label="일지 유형 *"
                      required
                      MenuProps={{
                        disableScrollLock: true // 스크롤 문제 해결
                      }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e5e7eb'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0969F'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0969F'
                        }
                      }}
                    >
                      {logTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* 간호 활동 체크리스트 - 하얀 박스 + 포인트 색 줄 */}
          <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: 1, 
            mb: 3,
            border: '1px solid #e5e7eb',
            borderLeft: '4px solid #E0969F'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Assignment sx={{ mr: 1, color: '#E0969F' }} />
                <Typography variant="h6" fontWeight="600" sx={{ color: '#374151' }}>
                  간호 활동 체크리스트 *
                </Typography>
              </Box>
              
              <FormGroup>
                {currentItems.map(item => (
                  <Box key={item.id} sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checkedItems[item.id] || false}
                          onChange={() => handleCheckboxChange(item.id)}
                          sx={{
                            color: '#E0969F',
                            '&.Mui-checked': { color: '#E0969F' }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight="500" sx={{ color: '#374151' }}>
                          {item.text}
                        </Typography>
                      }
                    />
                    
                    {checkedItems[item.id] && (
                      <Box sx={{ ml: 4, mt: 1 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          value={itemDetails[item.id] || ''}
                          onChange={(e) => handleDetailChange(item.id, e.target.value)}
                          placeholder={item.placeholder}
                          variant="outlined"
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: '#f9fafb',
                              '& fieldset': { borderColor: '#e5e7eb' },
                              '&:hover fieldset': { borderColor: '#E0969F' },
                              '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                ))}
              </FormGroup>
            </Box>
          </Box>

          {/* 추가 작성 내용 - 하얀 박스 + 포인트 색 줄 */}
          <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: 1, 
            mb: 3,
            border: '1px solid #e5e7eb',
            borderLeft: '4px solid #E0969F'
          }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
                추가 작성 내용
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="partial_content"
                value={formData.partial_content}
                onChange={handleInputChange}
                placeholder="체크리스트 외에 추가로 기록할 내용이 있으면 입력하세요..."
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#e5e7eb' },
                    '&:hover fieldset': { borderColor: '#E0969F' },
                    '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                  }
                }}
              />
            </Box>
          </Box>

          {/* 버튼 그룹 */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setFormData({
                  patient_id: '',
                  diagnosis: '',
                  age: '',
                  log_type: 'progress_note',
                  partial_content: ''
                });
                setCheckedItems({});
                setItemDetails({});
                setAiResponse(null);
              }}
              sx={{
                color: '#6b7280',
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: '#E0969F',
                  color: '#E0969F'
                }
              }}
            >
              새로고침
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<AutoAwesome />}
              sx={{
                bgcolor: '#E0969F',
                '&:hover': { bgcolor: '#C8797F' },
                px: 4
              }}
            >
              🚀 AI 자동완성 실행
            </Button>
          </Box>
        </form>

        {/* AI 응답 결과 - 하얀 박스 + 포인트 색 줄 */}
        {aiResponse && (
          <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: 1,
            border: '1px solid #e5e7eb',
            borderLeft: '4px solid #10b981'
          }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AutoAwesome sx={{ mr: 1, color: '#10b981' }} />
                <Typography variant="h6" fontWeight="600" color="#10b981">
                  ✅ AI 생성 결과
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 1, border: '1px solid #e5e7eb' }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: '#9c27b0' }}>
                      👁️ 관찰사항
                    </Typography>
                    <Typography variant="body2">
                      {aiResponse.parsed_data.subjective}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #e5e7eb' }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: '#2196f3' }}>
                      🩺 수행간호
                    </Typography>
                    <Typography variant="body2">
                      {aiResponse.parsed_data.objective}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #e5e7eb' }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: '#ff9800' }}>
                      💬 환자반응
                    </Typography>
                    <Typography variant="body2">
                      {aiResponse.parsed_data.assessment}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: '#e8f5e8', borderRadius: 1, border: '1px solid #e5e7eb' }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: '#4caf50' }}>
                      📚 교육내용
                    </Typography>
                    <Typography variant="body2">
                      {aiResponse.parsed_data.plan}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default NursingLogForm;
