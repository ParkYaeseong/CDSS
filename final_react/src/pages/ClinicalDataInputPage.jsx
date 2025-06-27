import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Select, MenuItem, 
  FormControl, InputLabel, Button, List, ListItemButton, ListItemText,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientService from '../services/patient.service.js';

// 암종별 임상 데이터 필드 정의 (모든 예측 모델 필드 포함)
const CANCER_CLINICAL_FIELDS = {
  liver: {
    name: '간암 (LIHC)',
    fields: [
      // 생존 결과 변수
      'vital_status', 'days_to_death', 'days_to_last_follow_up',
      // 간기능 평가 (핵심 예측 인자)
      'child_pugh_classification', 'ishak_fibrosis_score',
      // 병기 및 종양 특성
      'ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m',
      'tumor_grade', 'morphology',
      // 환자 기본 특성
      'age_at_diagnosis', 'gender', 'race', 'ethnicity',
      // 치료 관련 변수
      'treatments_pharmaceutical_treatment_intent_type', 
      'treatments_pharmaceutical_treatment_type',
      'treatments_pharmaceutical_treatment_or_therapy',
      'treatments_radiation_treatment_type',
      'treatments_radiation_treatment_or_therapy',
      'treatments_radiation_treatment_intent_type',
      'prior_treatment',
      // 과거력
      'prior_malignancy',
      'synchronous_malignancy',
      // 종양 특성
      'residual_disease',
      'classification_of_tumor',
      'tissue_or_organ_of_origin',
      'site_of_resection_or_biopsy',
      // 추가 임상 변수
      'primary_diagnosis', 'year_of_diagnosis'
    ]
  },
  kidney: {
    name: '신장암 (KIRC)',
    fields: [
      // 생존 결과 변수
      'vital_status', 'days_to_death', 'days_to_last_follow_up', 'year_of_diagnosis',
      // 병기 관련 (가장 중요한 예후 인자)
      'ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m',
      'ajcc_clinical_stage', 'ajcc_clinical_t', 'ajcc_clinical_n', 'ajcc_clinical_m',
      // 종양 특성
      'morphology', 'classification_of_tumor', 'primary_diagnosis',
      // 환자 기본 정보
      'age_at_diagnosis', 'gender', 'race', 'ethnicity',
      // 생활습관 위험인자
      'tobacco_smoking_status', 'pack_years_smoked', 'tobacco_smoking_quit_year', 'tobacco_smoking_onset_year',
      // 치료 관련
      'prior_treatment', 'prior_malignancy',
      'treatments_pharmaceutical_treatment_type', 'treatments_radiation_treatment_type',
      'treatments_pharmaceutical_treatment_or_therapy',
      // 해부학적/진단 관련
      'laterality', 'site_of_resection_or_biopsy', 'tissue_or_organ_of_origin',
      // 진단 관련 시간 정보
      'days_to_diagnosis',
      // 동반 질환
      'synchronous_malignancy',
      // 치료 관련 세부 정보
      'treatments_pharmaceutical_treatment_intent_type', 'treatments_radiation_treatment_intent_type'
    ]
  },
  stomach: {
    name: '위암 (STAD)',
    fields: [
      // 생존 시간 및 이벤트 변수 (필수)
      'vital_status', 'days_to_death', 'days_to_last_follow_up', 'year_of_diagnosis',
      // 병기 관련 (가장 중요한 예후 인자)
      'ajcc_pathologic_stage', 'ajcc_pathologic_t', 'ajcc_pathologic_n', 'ajcc_pathologic_m',
      'ajcc_staging_system_edition',
      // 종양 특성
      'tumor_grade', 'morphology', 'primary_diagnosis', 'residual_disease', 'classification_of_tumor',
      // 환자 기본 정보
      'age_at_diagnosis', 'gender', 'race', 'ethnicity', 'submitter_id',
      // 치료 관련
      'treatments_pharmaceutical_treatment_intent_type', 'treatments_pharmaceutical_treatment_type',
      'treatments_pharmaceutical_treatment_outcome', 'treatments_radiation_treatment_type',
      'treatments_radiation_treatment_outcome', 'treatments_radiation_treatment_intent_type',
      // 예후 관련 (매우 중요)
      'last_known_disease_status', 'days_to_recurrence', 'progression_or_recurrence',
      'days_to_last_known_disease_status',
      // 기타 중요 변수
      'prior_treatment', 'prior_malignancy', 'synchronous_malignancy',
      'site_of_resection_or_biopsy', 'tissue_or_organ_of_origin',
      // 사망 관련 (중요)
      'cause_of_death',
      // 시간 정보 (보완)
      'age_at_index', 'days_to_birth', 'year_of_birth', 'year_of_death',
      // 치료 세부 정보 (예후 예측에 중요)
      'treatments_pharmaceutical_regimen_or_line_of_therapy', 'treatments_pharmaceutical_number_of_cycles',
      'treatments_pharmaceutical_days_to_treatment_start', 'treatments_pharmaceutical_initial_disease_status',
      'treatments_pharmaceutical_therapeutic_agents', 'treatments_pharmaceutical_treatment_dose',
      'treatments_pharmaceutical_treatment_dose_units', 'treatments_pharmaceutical_prescribed_dose_units',
      'treatments_pharmaceutical_number_of_fractions', 'treatments_pharmaceutical_treatment_anatomic_sites',
      'treatments_pharmaceutical_prescribed_dose', 'treatments_pharmaceutical_clinical_trial_indicator',
      'treatments_pharmaceutical_route_of_administration', 'treatments_pharmaceutical_course_number',
      // 방사선 치료 정보
      'treatments_radiation_days_to_treatment_start', 'treatments_radiation_number_of_cycles',
      'treatments_radiation_treatment_dose', 'treatments_radiation_treatment_dose_units',
      'treatments_radiation_therapeutic_agents', 'treatments_radiation_days_to_treatment_end',
      'treatments_radiation_clinical_trial_indicator', 'treatments_radiation_number_of_fractions',
      'treatments_radiation_treatment_anatomic_sites', 'treatments_radiation_prescribed_dose_units',
      'treatments_radiation_prescribed_dose', 'treatments_radiation_route_of_administration',
      'treatments_radiation_course_number',
      // 진단 관련
      'icd_10_code', 'tumor_of_origin'
    ]
  }
};

export default function ClinicalDataInputPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL state에서 선택된 환자 정보 가져오기
  const initialPatient = location.state?.patient || null;
  
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(initialPatient);
  const [selectedCancerType, setSelectedCancerType] = useState('');
  const [clinicalData, setClinicalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accordionExpanded, setAccordionExpanded] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 환자 목록 불러오기
  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await PatientService.getPatientProfiles();
        const patientData = response.data || [];
        setPatients(patientData);
        
        // 초기 환자가 없으면 첫 번째 환자 선택
        if (!selectedPatient && patientData.length > 0) {
          setSelectedPatient(patientData[0]);
        }
      } catch (err) {
        console.error('환자 목록 불러오기 실패:', err);
        setSaveMessage('환자 목록을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [selectedPatient]);

  // 암종 선택 시 필드 초기화
  const handleCancerTypeChange = (event) => {
    const cancerType = event.target.value;
    setSelectedCancerType(cancerType);
    
    if (cancerType && CANCER_CLINICAL_FIELDS[cancerType]) {
      const initialData = {};
      CANCER_CLINICAL_FIELDS[cancerType].fields.forEach(field => {
        initialData[field] = '';
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
      
      // 3초 후 메시지 제거
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('임상 데이터 저장 실패:', error);
      setSaveMessage('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
        >
          대시보드로 돌아가기
        </Button>
        <Typography variant="h4" fontWeight="bold">
          임상 데이터 입력
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 환자 선택 패널 */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Accordion 
                expanded={accordionExpanded} 
                onChange={() => setAccordionExpanded(!accordionExpanded)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight="bold">
                    {accordionExpanded 
                      ? `환자 목록 (${patients.length})` 
                      : `👤 ${selectedPatient?.name || '환자 선택'}`
                    }
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {patients.map(patient => (
                      <ListItemButton
                        key={patient.id}
                        selected={selectedPatient?.id === patient.id}
                        onClick={() => {
                          setSelectedPatient(patient);
                          setAccordionExpanded(false);
                          // 환자 변경 시 데이터 초기화
                          setSelectedCancerType('');
                          setClinicalData({});
                          setSaveMessage('');
                        }}
                      >
                        <ListItemText
                          primary={patient.name}
                          secondary={`환자ID: ${patient.openemr_id}`}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* 임상 데이터 입력 폼 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {selectedPatient ? (
                <>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    환자: {selectedPatient.name} (ID: {selectedPatient.openemr_id})
                  </Typography>

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
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>암종 선택</InputLabel>
                      <Select
                        value={selectedCancerType}
                        onChange={handleCancerTypeChange}
                        label="암종 선택"
                      >
                        <MenuItem value="">암종을 선택하세요</MenuItem>
                        {Object.entries(CANCER_CLINICAL_FIELDS).map(([key, config]) => (
                          <MenuItem key={key} value={key}>{config.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* 임상 데이터 입력 필드 */}
                  {selectedCancerType && CANCER_CLINICAL_FIELDS[selectedCancerType] && (
                    <>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        {CANCER_CLINICAL_FIELDS[selectedCancerType].name} 임상 데이터
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        {CANCER_CLINICAL_FIELDS[selectedCancerType].fields.map((field) => (
                          <Grid item xs={12} sm={6} key={field}>
                            <TextField
                              fullWidth
                              label={field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              value={clinicalData[field] || ''}
                              onChange={(e) => handleClinicalDataChange(field, e.target.value)}
                              variant="outlined"
                              size="small"
                              placeholder={`${field} 값을 입력하세요`}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      {/* 저장 버튼 */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveClinicalData}
                          disabled={saving}
                          size="large"
                        >
                          {saving ? '저장 중...' : '임상 데이터 저장'}
                        </Button>
                      </Box>
                    </>
                  )}

                  {!selectedCancerType && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        암종을 선택하여 임상 데이터 입력을 시작하세요.
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    왼쪽에서 환자를 선택해주세요.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
