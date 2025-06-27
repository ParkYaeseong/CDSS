// src/components/clinical/ClinicalDataForm.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, 
  CircularProgress, Alert, LinearProgress, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  CheckCircle
} from '@mui/icons-material';
import PatientService from '../../services/patient.service.js';

// 암종별 임상 데이터 필드 정의 (간소화)
const CANCER_CLINICAL_FIELDS = {
  liver: {
    name: '간암 (LIHC)',
    categories: {
      '기본 정보': ['vital_status', 'age_at_diagnosis', 'gender', 'race', 'ethnicity', 'year_of_diagnosis'],
      '간기능 평가': ['child_pugh_classification', 'ishak_fibrosis_score'],
      '병기 정보': ['ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m', 'tumor_grade', 'morphology'],
      '치료 정보': ['treatments_pharmaceutical_treatment_intent_type', 'treatments_pharmaceutical_treatment_type', 'treatments_pharmaceutical_treatment_or_therapy', 'treatments_radiation_treatment_type', 'treatments_radiation_treatment_or_therapy', 'treatments_radiation_treatment_intent_type', 'prior_treatment'],
      '과거력 및 종양 특성': ['prior_malignancy', 'synchronous_malignancy', 'residual_disease', 'classification_of_tumor', 'tissue_or_organ_of_origin', 'site_of_resection_or_biopsy', 'primary_diagnosis'],
      '생존 정보': ['days_to_death', 'days_to_last_follow_up']
    }
  },
  kidney: {
    name: '신장암 (KIRC)',
    categories: {
      '기본 정보': ['vital_status', 'age_at_diagnosis', 'gender', 'race', 'ethnicity', 'year_of_diagnosis'],
      '병기 정보 (Pathologic)': ['ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m'],
      '병기 정보 (Clinical)': ['ajcc_clinical_stage', 'ajcc_clinical_t', 'ajcc_clinical_n', 'ajcc_clinical_m'],
      '종양 특성': ['morphology', 'classification_of_tumor', 'primary_diagnosis'],
      '생활습관 위험인자': ['tobacco_smoking_status', 'pack_years_smoked', 'tobacco_smoking_quit_year', 'tobacco_smoking_onset_year'],
      '치료 정보': ['prior_treatment', 'prior_malignancy', 'treatments_pharmaceutical_treatment_type', 'treatments_radiation_treatment_type', 'treatments_pharmaceutical_treatment_or_therapy'],
      '해부학적/진단 정보': ['laterality', 'site_of_resection_or_biopsy', 'tissue_or_organ_of_origin', 'days_to_diagnosis'],
      '동반 질환 및 세부 치료': ['synchronous_malignancy', 'treatments_pharmaceutical_treatment_intent_type', 'treatments_radiation_treatment_intent_type'],
      '생존 정보': ['days_to_death', 'days_to_last_follow_up']
    }
  },
  stomach: {
    name: '위암 (STAD)',
    categories: {
      '기본 정보': ['vital_status', 'age_at_diagnosis', 'gender', 'race', 'ethnicity', 'submitter_id', 'year_of_diagnosis'],
      '병기 정보': ['ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m', 'ajcc_staging_system_edition'],
      '종양 특성': ['tumor_grade', 'morphology', 'primary_diagnosis', 'residual_disease', 'classification_of_tumor'],
      '치료 정보 (기본)': ['treatments_pharmaceutical_treatment_intent_type', 'treatments_pharmaceutical_treatment_type', 'treatments_pharmaceutical_treatment_outcome', 'treatments_radiation_treatment_type', 'treatments_radiation_treatment_outcome', 'treatments_radiation_treatment_intent_type'],
      '예후 정보': ['last_known_disease_status', 'days_to_recurrence', 'progression_or_recurrence', 'days_to_last_known_disease_status'],
      '과거력 및 해부학적 정보': ['prior_treatment', 'prior_malignancy', 'synchronous_malignancy', 'site_of_resection_or_biopsy', 'tissue_or_organ_of_origin'],
      '생존 정보': ['days_to_death', 'days_to_last_follow_up']
    }
  }
};

// 색상 테마 - #E0969F 기반
const THEME_COLORS = {
  primary: '#E0969F',
  secondary: '#C8797F',
  accent: '#F2B5BC',
  surface: '#ffffff',
  border: '#f0e6e8',
  text: {
    primary: '#1e293b',
    secondary: '#64748b'
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

export default function ClinicalDataForm({ 
  patient, 
  onSave = null,
  autoSelectDefaults = true
}) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(patient);
  const [selectedCancerType, setSelectedCancerType] = useState('');
  const [clinicalData, setClinicalData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 컴포넌트 마운트 시 자동으로 기본값 설정
  useEffect(() => {
    fetchPatients();
    
    if (autoSelectDefaults) {
      // 자동으로 첫 번째 암종(간암) 선택
      handleCancerTypeChange('liver');
    }
  }, [autoSelectDefaults]);

  // 환자 목록이 로드되면 첫 번째 환자 자동 선택
  useEffect(() => {
    if (autoSelectDefaults && patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0]);
    }
  }, [patients, autoSelectDefaults, selectedPatient]);

  // 환자가 변경될 때 상태 업데이트
  useEffect(() => {
    setSelectedPatient(patient);
  }, [patient]);

  // 디버깅 로그
  useEffect(() => {
    console.log('선택된 환자 변경됨:', selectedPatient);
  }, [selectedPatient]);

  useEffect(() => {
    console.log('환자 목록 로드됨:', patients);
  }, [patients]);

  // 환자 목록 조회
  const fetchPatients = async () => {
    try {
      const response = await PatientService.getPatientProfiles();
      setPatients(response.data || []);
    } catch (err) {
      console.error('환자 목록 조회 오류:', err);
      setSaveMessage('환자 목록을 불러오는데 실패했습니다.');
    }
  };

  // 환자 선택 핸들러
  const handlePatientChange = (patientId) => {
    const newSelectedPatient = patients.find(p => (p.openemr_id || p.id) === patientId);
    setSelectedPatient(newSelectedPatient);
    
    // 환자 변경 시 임상 데이터 초기화
    setClinicalData({});
    setSaveMessage('');
    
    console.log('환자 변경:', newSelectedPatient);
  };

  // 암종 선택 시 필드 초기화
  const handleCancerTypeChange = (cancerType) => {
    setSelectedCancerType(cancerType);
    
    if (cancerType && CANCER_CLINICAL_FIELDS[cancerType]) {
      const initialData = {};
      Object.values(CANCER_CLINICAL_FIELDS[cancerType].categories).forEach(fields => {
        fields.forEach(field => {
          initialData[field] = '';
        });
      });
      setClinicalData(initialData);
    } else {
      setClinicalData({});
    }
  };

  // 임상 데이터 입력 핸들러
  const handleClinicalDataChange = (field, value) => {
    setClinicalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 임상 데이터 저장
  const handleSaveClinicalData = async () => {
    if (!selectedPatient || !selectedCancerType) {
      setSaveMessage('환자와 암종을 선택해주세요.');
      return;
    }

    setSaving(true);
    setSaveMessage('');
    
    try {
      const dataToSave = {
        cancer_type: selectedCancerType,
        clinical_data: clinicalData
      };
      
      await PatientService.saveClinicalData(selectedPatient.id, dataToSave);
      setSaveMessage('임상 데이터가 성공적으로 저장되었습니다.');
      
      if (onSave) {
        onSave(dataToSave);
      }
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('임상 데이터 저장 실패:', error);
      setSaveMessage('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 진행률 계산
  const calculateProgress = () => {
    if (!selectedCancerType || !CANCER_CLINICAL_FIELDS[selectedCancerType]) return 0;
    
    const allFields = Object.values(CANCER_CLINICAL_FIELDS[selectedCancerType].categories)
      .flat();
    const filledFields = allFields.filter(field => clinicalData[field]?.trim());
    
    return Math.round((filledFields.length / allFields.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <Box sx={{ 
      p: 1, 
      minHeight: '100%',
      width: '100%'
    }}>
      {/* 환자 선택 */}
      <Card sx={{ 
        mb: 2, 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`
      }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: THEME_COLORS.text.primary }}>
            환자 선택
          </Typography>
          <FormControl fullWidth>
            <InputLabel>환자를 선택하세요</InputLabel>
            <Select
              value={selectedPatient ? (selectedPatient.openemr_id || selectedPatient.id) : ''}
              onChange={(e) => handlePatientChange(e.target.value)}
              label="환자를 선택하세요"
            >
              {patients.map(patient => (
                <MenuItem key={patient.id} value={patient.openemr_id || patient.id}>
                  {patient.name} (ID: {patient.openemr_id || patient.id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* 환자 정보 및 진행률 */}
      {selectedPatient && (
        <Card sx={{ 
          mb: 2, 
          bgcolor: THEME_COLORS.surface,
          border: `1px solid ${THEME_COLORS.border}`
        }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" fontWeight="600" color={THEME_COLORS.text.primary}>
                환자: {selectedPatient.name} (ID: {selectedPatient.openemr_id || selectedPatient.id})
              </Typography>
              {selectedCancerType && (
                <Typography variant="body2" fontWeight="600" sx={{ color: THEME_COLORS.primary }}>
                  진행률: {progress}%
                </Typography>
              )}
            </Box>
            {selectedCancerType && (
              <LinearProgress 
                variant="determinate" 
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: `${THEME_COLORS.primary}20`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: THEME_COLORS.primary,
                    borderRadius: 3
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {selectedPatient ? (
        <>
          {/* 저장 메시지 */}
          {saveMessage && (
            <Alert 
              severity={saveMessage.includes('성공') ? 'success' : 'error'} 
              sx={{ mb: 2 }}
              onClose={() => setSaveMessage('')}
            >
              {saveMessage}
            </Alert>
          )}

          {/* 암종 선택 */}
          <Card sx={{ 
            mb: 2, 
            bgcolor: THEME_COLORS.surface,
            border: `1px solid ${THEME_COLORS.border}`
          }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: THEME_COLORS.text.primary }}>
                암종 선택
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(CANCER_CLINICAL_FIELDS).map(([key, config]) => (
                  <Grid item xs={12} sm={4} key={key}>
                    <Button
                      fullWidth
                      variant={selectedCancerType === key ? "contained" : "outlined"}
                      onClick={() => handleCancerTypeChange(key)}
                      sx={{
                        p: 1.5,
                        bgcolor: selectedCancerType === key ? THEME_COLORS.primary : 'transparent',
                        borderColor: selectedCancerType === key ? THEME_COLORS.primary : THEME_COLORS.border,
                        color: selectedCancerType === key ? 'white' : THEME_COLORS.text.primary,
                        '&:hover': {
                          bgcolor: selectedCancerType === key ? THEME_COLORS.secondary : `${THEME_COLORS.primary}10`,
                          borderColor: THEME_COLORS.primary
                        }
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {config.name}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {Object.keys(config.categories).length}개 카테고리
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* 임상 데이터 입력 필드 */}
          {selectedCancerType && CANCER_CLINICAL_FIELDS[selectedCancerType] && (
            <>
              <Typography variant="h6" sx={{ mb: 2, color: THEME_COLORS.text.primary, px: 1 }}>
                {CANCER_CLINICAL_FIELDS[selectedCancerType].name} 임상 데이터
              </Typography>
              
              {Object.entries(CANCER_CLINICAL_FIELDS[selectedCancerType].categories).map(([categoryName, fields]) => {
                const filledFields = fields.filter(field => clinicalData[field]?.trim());
                
                return (
                  <Card key={categoryName} sx={{ 
                    mb: 2, 
                    bgcolor: THEME_COLORS.surface,
                    border: `1px solid ${THEME_COLORS.border}`
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="600" color={THEME_COLORS.text.primary}>
                          {categoryName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color={THEME_COLORS.text.secondary}>
                            {filledFields.length} / {fields.length}
                          </Typography>
                          {filledFields.length > 0 && (
                            <CheckCircle sx={{ color: THEME_COLORS.status.success, fontSize: '1rem' }} />
                          )}
                        </Box>
                      </Box>
                      
                      <Grid container spacing={1}>
                        {fields.map(field => (
                          <Grid item xs={12} sm={6} md={4} key={field}>
                            <TextField
                              fullWidth
                              label={field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              value={clinicalData[field] || ''}
                              onChange={(e) => handleClinicalDataChange(field, e.target.value)}
                              variant="outlined"
                              size="small"
                              InputProps={{
                                endAdornment: clinicalData[field]?.trim() && (
                                  <CheckCircle sx={{ color: THEME_COLORS.status.success, fontSize: '1rem' }} />
                                )
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&.Mui-focused fieldset': {
                                    borderColor: THEME_COLORS.primary
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: THEME_COLORS.primary
                                }
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                );
              })}

              {/* 저장 버튼 */}
              <Box sx={{ 
                position: 'sticky', 
                bottom: 10, 
                display: 'flex', 
                justifyContent: 'center',
                mt: 2,
                mb: 2
              }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SaveIcon />}
                  onClick={handleSaveClinicalData}
                  disabled={saving || !selectedCancerType}
                  size="large"
                  sx={{
                    bgcolor: THEME_COLORS.primary,
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: THEME_COLORS.secondary
                    },
                    '&:disabled': {
                      bgcolor: THEME_COLORS.border
                    }
                  }}
                >
                  {saving ? '저장 중...' : '임상 데이터 저장'}
                </Button>
              </Box>
            </>
          )}

          {!selectedCancerType && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color={THEME_COLORS.text.secondary} sx={{ mb: 1 }}>
                암종을 선택하여 임상 데이터 입력을 시작하세요
              </Typography>
              <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                위의 버튼에서 해당하는 암종을 클릭해주세요
              </Typography>
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color={THEME_COLORS.text.secondary}>
            환자 정보가 필요합니다
          </Typography>
          <Typography variant="body2" color={THEME_COLORS.text.secondary}>
            환자를 선택한 후 임상 데이터를 입력할 수 있습니다
          </Typography>
        </Box>
      )}
    </Box>
  );
}
