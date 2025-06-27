// PredictionPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  LinearProgress,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import PatientService from '../services/patient.service';
import '../styles/PredictionPage.css';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prediction-tabpanel-${index}`}
      aria-labelledby={`prediction-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 게이지 바 컴포넌트
const GaugeBar = ({ value, label, maxValue = 100 }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="gauge-wrapper">
      <div className="gauge-label">
        <span>{label}</span>
        <span className="gauge-value">{percentage.toFixed(1)}%</span>
      </div>
      <div className="gauge-container">
        <div
          className="gauge-fill"
          style={{ width: `${percentage}%` }}
        >
          <span className="gauge-text">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

// 정보 카드 컴포넌트
const InfoCard = ({ icon, title, content }) => (
  <div className="info-card">
    <div className="info-card-title">
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      {title}
    </div>
    <div className="info-card-content">{content}</div>
  </div>
);

const predictionTypes = [
  { id: 'cancer-risk', label: '암 위험도 분류', icon: '⚠️', description: '저위험/고위험 분류' },
  { id: 'survival-rate', label: '생존율 예측', icon: '📊', description: '1년, 3년, 5년 생존율' },
  { id: 'treatment-effect', label: '치료 효과 예측', icon: '💊', description: '최적 치료법 추천' }
];

// 수정된 Django API 호출 함수
const callPredictionAPI = async (predictionType, patientId, patientName) => {
  const API_BASE_URL = 'http://35.188.47.40:8000/api/clinical-prediction';

  let endpoint;
  switch (predictionType) {
    case 'survival-rate':
      endpoint = '/predict/survival/';
      break;
    case 'cancer-risk':
      endpoint = '/predict/risk-classification/';
      break;
    case 'treatment-effect':
      endpoint = '/predict/treatment-effect/';
      break;
    default:
      throw new Error('지원하지 않는 예측 타입입니다.');
  }

  console.log(`API 호출: ${API_BASE_URL}${endpoint}`, {
    patient_id: patientId,
    patient_name: patientName
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patient_id: patientId,
      patient_name: patientName
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: 예측 API 호출 실패`);
  }

  const result = await response.json();
  console.log('API 응답:', result);
  return result;
};

export default function PredictionPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 상태 관리
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPredictionType, setSelectedPredictionType] = useState('survival-rate');
  const [activeTab, setActiveTab] = useState(0);
  const [predictionResults, setPredictionResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 간암 임상데이터가 있는 환자 목록 (Django에서 확인된 환자들)
  const patientsWithClinicalData = ['강 경화'];

  // 전달받은 환자 정보 처리
  useEffect(() => {
    const patientFromState = location.state?.patient;
    if (patientFromState) {
      setSelectedPatient(patientFromState);
    }
    fetchPatients();
  }, [location.state]);

  // 환자 목록 불러오기
  const fetchPatients = async () => {
    try {
      const response = await PatientService.getPatientProfiles();
      setPatients(response.data || []);
    } catch (err) {
      console.error('환자 목록 조회 오류:', err);
      setError('환자 목록을 불러오는데 실패했습니다.');
    }
  };

  // 실제 Django API를 사용한 예측 실행
  const handlePrediction = async () => {
    if (!selectedPatient) {
      setError('환자를 선택해주세요.');
      return;
    }

    // 임상데이터가 없는 환자 체크
    if (!patientsWithClinicalData.includes(selectedPatient.name)) {
      setError('선택한 환자는 간암 임상데이터가 없어 예측 분석이 불가능합니다.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPredictionResults(null);

    try {
      console.log('예측 시작:', {
        type: selectedPredictionType,
        patient: selectedPatient.name,
        openemr_id: selectedPatient.openemr_id
      });

      const response = await callPredictionAPI(
        selectedPredictionType,
        selectedPatient.openemr_id, // OpenEMR ID 사용
        selectedPatient.name
      );

      // Django API 응답 구조에 맞게 수정
      if (response.success) {
        const apiData = response.data;
        let formattedResults;

        if (selectedPredictionType === 'survival-rate') {
          formattedResults = {
            primaryValue: `${(apiData.survival_probabilities['5_year'] * 100).toFixed(1)}%`,
            secondaryValue: apiData.median_survival_months ?
              `${apiData.median_survival_months.toFixed(1)}개월` :
              `${Math.round(apiData.median_survival_days / 30)}개월`,
            primaryLabel: '5년 생존율',
            secondaryLabel: '예상 생존기간',
            confidence: apiData.confidence || 0.85,
            features: [
              {
                name: '1년 생존율',
                value: `${(apiData.survival_probabilities['1_year'] * 100).toFixed(1)}%`,
                importance: apiData.survival_probabilities['1_year']
              },
              {
                name: '3년 생존율',
                value: `${(apiData.survival_probabilities['3_year'] * 100).toFixed(1)}%`,
                importance: apiData.survival_probabilities['3_year']
              },
              {
                name: '5년 생존율',
                value: `${(apiData.survival_probabilities['5_year'] * 100).toFixed(1)}%`,
                importance: apiData.survival_probabilities['5_year']
              },
              {
                name: '위험 점수',
                value: apiData.risk_score ? apiData.risk_score.toFixed(3) : 'N/A',
                importance: apiData.risk_score ? Math.min(1 - apiData.risk_score, 1.0) : 0.5
              }
            ],
            clinicalSummary: apiData.clinical_data_summary
          };
        } else if (selectedPredictionType === 'cancer-risk') {
          const lowRiskProb = apiData.risk_probabilities?.low_risk || 0;
          const highRiskProb = apiData.risk_probabilities?.high_risk || 0;

          formattedResults = {
            primaryValue: apiData.predicted_risk_class || 'Unknown',
            secondaryValue: `${(apiData.confidence * 100).toFixed(1)}%`,
            primaryLabel: '위험도 분류',
            secondaryLabel: '예측 신뢰도',
            confidence: apiData.confidence || 0.85,
            features: [
              {
                name: '저위험 확률',
                value: `${(lowRiskProb * 100).toFixed(1)}%`,
                importance: lowRiskProb
              },
              {
                name: '고위험 확률',
                value: `${(highRiskProb * 100).toFixed(1)}%`,
                importance: highRiskProb
              },
              ...(apiData.risk_factors || []).slice(0, 3).map(factor => ({
                name: factor.factor.replace(/_/g, ' '),
                value: typeof factor.value === 'number' ? factor.value.toFixed(3) : factor.value,
                importance: factor.importance || 0.5
              }))
            ],
            clinicalSummary: apiData.clinical_data_summary
          };
        } else if (selectedPredictionType === 'treatment-effect') {
          const recommendedTreatment = apiData.recommended_treatment;
          const treatmentEffects = apiData.treatment_effects || {};

          formattedResults = {
            primaryValue: recommendedTreatment?.primary || '수술',
            secondaryValue: `${(recommendedTreatment?.effectiveness || 75).toFixed(1)}%`,
            primaryLabel: '추천 치료법',
            secondaryLabel: '예상 효과',
            confidence: apiData.overall_confidence || 0.87,
            features: Object.entries(treatmentEffects).slice(0, 4).map(([treatment, effect]) => ({
              name: treatment,
              value: `${(effect.effectiveness || 50).toFixed(1)}%`,
              importance: (effect.effectiveness || 50) / 100
            })),
            combinationTherapy: apiData.combination_therapy,
            treatmentRanking: apiData.treatment_ranking || [],
            clinicalRationale: apiData.clinical_rationale || '환자의 임상 상태를 종합적으로 고려한 최적 치료법입니다.',
            clinicalSummary: apiData.clinical_data_summary
          };
        }

        setPredictionResults(formattedResults);
        console.log('예측 결과 처리 완료:', formattedResults);

      } else {
        throw new Error(response.error || '예측 결과를 받아오는데 실패했습니다.');
      }

    } catch (err) {
      console.error('예측 API 오류:', err);

      // 상세한 오류 메시지 제공
      let errorMessage = '예측 분석 중 오류가 발생했습니다.';

      if (err.message.includes('year_of_diagnosis')) {
        errorMessage = '환자의 진단 연도 정보가 누락되어 있습니다. 임상데이터를 확인해주세요.';
      } else if (err.message.includes('환자를 찾을 수 없습니다')) {
        errorMessage = '선택한 환자의 정보를 찾을 수 없습니다.';
      } else if (err.message.includes('간암 임상 데이터를 찾을 수 없습니다')) {
        errorMessage = '선택한 환자의 간암 임상데이터가 없습니다.';
      } else if (err.message.includes('HTTP')) {
        errorMessage = `서버 연결 오류: ${err.message}`;
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 환자나 예측 타입 변경 시 결과 초기화
  useEffect(() => {
    setPredictionResults(null);
    setError(null);
  }, [selectedPatient, selectedPredictionType]);

  return (
    <div className="prediction-container">
      {/* 헤더 */}
      <div className="prediction-header">
        <h1 className="prediction-title">
          🔬 임상 예측 분석 시스템
        </h1>
        <p className="prediction-subtitle">
          환자의 임상 데이터를 활용한 AI 기반 예측 및 분류 분석
        </p>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="prediction-main-content">
        <div className="prediction-content-wrapper">
          {/* 환자 선택 영역 - 1/3 */}
          <div className="patient-selection-area">
            <Card className="patient-card">
              <div className="card-header">
                📋 환자 선택
              </div>
              <div className="card-content">
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>환자 선택</InputLabel>
                  <Select
                    value={selectedPatient?.id || ''}
                    onChange={(e) => {
                      const patient = patients.find(p => p.id === e.target.value);
                      setSelectedPatient(patient);
                    }}
                    label="환자 선택"
                  >
                    {patients.map(patient => (
                      <MenuItem key={patient.id} value={patient.id}>
                        {patient.name} (ID: {patient.openemr_id})
                        {patientsWithClinicalData.includes(patient.name) && (
                          <Chip
                            size="small"
                            label="데이터 보유"
                            sx={{ ml: 1, fontSize: '0.7rem', backgroundColor: '#7A9598', color: 'white' }}
                          />
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedPatient && (
                  <div className="patient-info-box">
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                      선택된 환자 정보
                    </Typography>
                    <Typography variant="body2">이름: {selectedPatient.name}</Typography>
                    <Typography variant="body2">환자ID: {selectedPatient.openemr_id}</Typography>
                    <Typography variant="body2">생년월일: {selectedPatient.date_of_birth}</Typography>
                    <Typography variant="body2">성별: {selectedPatient.gender}</Typography>
                    {patientsWithClinicalData.includes(selectedPatient.name) ? (
                      <Typography variant="body2" sx={{ color: '#7A9598', fontWeight: 'bold', mt: 1 }}>
                        ✅ 간암 임상데이터 보유 - 예측 분석 가능
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold', mt: 1 }}>
                        ❌ 간암 임상데이터 없음 - 예측 분석 불가
                      </Typography>
                    )}
                  </div>
                )}

                <div className="prediction-type-container">
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                    예측 분석 유형
                  </Typography>
                  <div className="prediction-type-grid">
                    {predictionTypes.map(type => (
                      <div
                        key={type.id}
                        className={`prediction-type-card ${selectedPredictionType === type.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPredictionType(type.id)}
                      >
                        <span className="prediction-type-icon">{type.icon}</span>
                        <div className="prediction-type-label">{type.label}</div>
                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5 }}>
                          {type.description}
                        </Typography>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handlePrediction}
                  disabled={!selectedPatient || isLoading ||
                    !patientsWithClinicalData.includes(selectedPatient?.name)}
                  className="prediction-button"
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                      분석 중...
                    </>
                  ) : (
                    '🔍 예측 분석 실행'
                  )}
                </Button>

                {selectedPatient && !patientsWithClinicalData.includes(selectedPatient.name) && (
                  <Alert severity="warning" sx={{ mt: 2, fontSize: '0.8rem' }}>
                    현재 간암 임상데이터가 있는 환자만 예측 분석이 가능합니다.
                    <br />
                    데이터 보유 환자: {patientsWithClinicalData.join(', ')}
                  </Alert>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/dashboard')}
                  className="back-button"
                >
                  대시보드로 돌아가기
                </Button>
              </div>
            </Card>
          </div>

          {/* 예측 결과 영역 - 2/3 */}
          <div className="prediction-results-area">
            <Card className="result-card">
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  className="prediction-tabs"
                >
                  <Tab label="📊 예측 결과" />
                  <Tab label="🤖 모델 설명" />
                  <Tab label="📋 환자 데이터" />
                </Tabs>
              </Box>

              <div className="card-content">
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>오류:</strong> {error}
                    </Typography>
                  </Alert>
                )}

                <TabPanel value={activeTab} index={0}>
                  {predictionResults ? (
                    <Box className={selectedPredictionType}>
                      <div className="section-title">
                        {predictionTypes.find(t => t.id === selectedPredictionType)?.label} 결과
                        <Chip
                          label={`신뢰도: ${(predictionResults.confidence * 100).toFixed(1)}%`}
                          size="small"
                          sx={{ ml: 2, backgroundColor: '#7A9598', color: 'white' }}
                        />
                      </div>

                      <div className="result-metrics-grid">
                        <div className="result-metric-card">
                          <div className="result-metric-value">
                            {predictionResults.primaryValue}
                          </div>
                          <div className="result-metric-label">{predictionResults.primaryLabel}</div>
                        </div>
                        <div className="result-metric-card">
                          <div className="result-metric-value">
                            {predictionResults.secondaryValue}
                          </div>
                          <div className="result-metric-label">{predictionResults.secondaryLabel}</div>
                        </div>
                      </div>

                      {/* 치료 효과 예측 전용 조합 치료 섹션 */}
                      {selectedPredictionType === 'treatment-effect' && predictionResults.combinationTherapy && (
                        <>
                          <Divider sx={{ my: 3 }} />
                          <div className="section-title">
                            🔗 조합 치료 추천
                          </div>
                          <Card className="combination-therapy-card">
                            <CardContent>
                              <Typography variant="body1" className="combination-therapy-title">
                                {predictionResults.combinationTherapy.primary_treatment} + {predictionResults.combinationTherapy.secondary_treatment}
                              </Typography>
                              <Typography variant="body2" className="combination-therapy-description">
                                {predictionResults.combinationTherapy.rationale}
                              </Typography>
                              <Typography variant="body2" className="combination-therapy-effectiveness">
                                예상 조합 효과: <strong>{predictionResults.combinationTherapy.combined_effectiveness?.toFixed(1) || 'N/A'}%</strong>
                              </Typography>
                            </CardContent>
                          </Card>
                        </>
                      )}

                      {/* 치료 효과 예측 전용 임상적 근거 섹션 */}
                      {selectedPredictionType === 'treatment-effect' && predictionResults.clinicalRationale && (
                        <>
                          <Divider sx={{ my: 3 }} />
                          <div className="section-title">
                            📋 임상적 근거
                          </div>
                          <Alert severity="info" sx={{ backgroundColor: 'rgba(122, 149, 152, 0.1)' }}>
                            <Typography variant="body2">
                              {predictionResults.clinicalRationale}
                            </Typography>
                          </Alert>
                        </>
                      )}

                      <Divider sx={{ my: 3 }} />

                      <div className="section-title">
                        {selectedPredictionType === 'treatment-effect' ? '치료법별 효과' : '주요 예측 지표'}
                      </div>

                      <Box sx={{ width: '100%' }}>
                        {predictionResults.features.map((feature, index) => (
                          <GaugeBar
                            key={index}
                            value={feature.importance * 100}
                            label={`${feature.name}: ${feature.value}`}
                            maxValue={100}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <div className="no-results-container">
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        🔍 환자를 선택하고 예측 분석을 실행해주세요
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        왼쪽 패널에서 간암 임상데이터가 있는 환자를 선택하고 원하는 예측 유형을 선택한 후 분석을 시작하세요.
                      </Typography>
                      {selectedPatient && !patientsWithClinicalData.includes(selectedPatient.name) && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          선택한 환자({selectedPatient.name})는 간암 임상데이터가 없어 예측 분석이 불가능합니다.
                        </Alert>
                      )}
                    </div>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  <div className="section-title">
                    🤖 AI 모델 설명
                  </div>

                  {selectedPredictionType === 'survival-rate' && (
                    <>
                      <Typography variant="body1" paragraph>
                        <strong>GBSA (Gradient Boosting Survival Analysis)</strong> 모델을 사용하여 간암 환자의 생존율을 예측합니다.
                        이 모델은 Django 데이터베이스에 저장된 간암 임상데이터를 활용하여 개인화된 생존 예측을 제공합니다.
                      </Typography>
                      <div className="info-cards-grid">
                        <InfoCard
                          icon="⚙️"
                          title="모델 특징"
                          content="Gradient Boosting 알고리즘을 사용하여 순차적 학습을 통한 고성능 예측을 제공합니다."
                        />
                        <InfoCard
                          icon="📊"
                          title="사용 변수"
                          content="간암 임상데이터의 핵심 변수들: 종양 병기, 간기능, 치료력, 인구학적 특성 등을 종합적으로 분석합니다."
                        />
                        <InfoCard
                          icon="🎯"
                          title="예측 결과"
                          content="1년, 3년, 5년 생존율과 예상 생존기간을 개인별 맞춤형으로 제공합니다."
                        />
                        <InfoCard
                          icon="🔬"
                          title="데이터 소스"
                          content="OpenEMR의 간암 임상데이터 폼에서 입력된 실제 환자 데이터를 사용합니다."
                        />
                      </div>
                    </>
                  )}

                  {selectedPredictionType === 'cancer-risk' && (
                    <>
                      <Typography variant="body1" paragraph>
                        <strong>XGBoost 위험도 분류</strong> 모델을 사용하여 간암 환자의 위험도를 분류합니다.
                        이 모델은 Django 데이터베이스의 간암 임상데이터를 기반으로 저위험/고위험 그룹을 분류합니다.
                      </Typography>
                      <div className="info-cards-grid">
                        <InfoCard
                          icon="⚡"
                          title="XGBoost 알고리즘"
                          content="극한 그래디언트 부스팅을 사용하여 빠르고 정확한 분류를 수행합니다."
                        />
                        <InfoCard
                          icon="🎯"
                          title="이진 분류"
                          content="저위험 vs 고위험으로 명확하게 분류하여 치료 계획 수립에 도움을 줍니다."
                        />
                        <InfoCard
                          icon="📈"
                          title="특성 중요도"
                          content="각 위험 요인의 중요도를 분석하여 주요 위험 인자를 식별합니다."
                        />
                        <InfoCard
                          icon="📊"
                          title="확률 예측"
                          content="각 위험도별 확률을 제공하여 불확실성까지 고려한 의사결정을 지원합니다."
                        />
                      </div>
                    </>
                  )}

                  {selectedPredictionType === 'treatment-effect' && (
                    <>
                      <Typography variant="body1" paragraph>
                        <strong>LightGBM 치료 효과 예측</strong> 모델을 사용하여 간암 환자에게 최적의 치료법을 추천합니다.
                        이 모델은 환자의 간암 임상데이터를 기반으로 각 치료법의 효과를 예측합니다.
                      </Typography>
                      <div className="info-cards-grid">
                        <InfoCard
                          icon="🚀"
                          title="LightGBM"
                          content="빠르고 정확한 그래디언트 부스팅 알고리즘으로 효율적인 예측을 제공합니다."
                        />
                        <InfoCard
                          icon="🔄"
                          title="다중 치료 비교"
                          content="수술, 화학요법, 방사선치료, 표적치료의 효과를 동시에 비교 분석합니다."
                        />
                        <InfoCard
                          icon="👤"
                          title="개인화 추천"
                          content="환자별 특성을 고려하여 최적의 치료법을 개인별로 추천합니다."
                        />
                        <InfoCard
                          icon="🔗"
                          title="조합 치료"
                          content="주 치료와 보조 치료의 조합을 제안하여 치료 효과를 극대화합니다."
                        />
                      </div>
                    </>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                  <div className="section-title">
                    📋 환자 임상 데이터
                  </div>
                  {selectedPatient && patientsWithClinicalData.includes(selectedPatient.name) ? (
                    <Box>
                      <div className="info-cards-grid">
                        <InfoCard
                          icon="👤"
                          title="환자 정보"
                          content={`이름: ${selectedPatient.name} (OpenEMR ID: ${selectedPatient.openemr_id})`}
                        />
                        <InfoCard
                          icon="✅"
                          title="데이터 상태"
                          content="Django 데이터베이스에 간암 임상데이터 저장 완료 - 정확한 예측 분석 가능"
                        />
                        <InfoCard
                          icon="🤖"
                          title="AI 모델 호환성"
                          content="GBSA, XGBoost, LightGBM 모델과 완전 호환되는 임상 변수들이 매핑되어 있습니다."
                        />
                        <InfoCard
                          icon="📊"
                          title="분석 가능 항목"
                          content="생존율 예측, 위험도 분류, 치료 효과 예측 모든 기능 이용 가능"
                        />
                      </div>

                      {selectedPredictionType === 'survival-rate' && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>생존율 예측:</strong> 간암 임상데이터의 생존 관련 변수들 활용
                            (생존 상태, 병기, 간기능, 치료력, 진단 연도 등)
                          </Typography>
                        </Alert>
                      )}
                      {selectedPredictionType === 'cancer-risk' && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>위험도 분류:</strong> 간암 임상데이터의 핵심 위험 인자들 활용
                            (간기능 평가, 종양 특성, 환자 기본 특성, 치료 이력, 진단 연도 등)
                          </Typography>
                        </Alert>
                      )}
                      {selectedPredictionType === 'treatment-effect' && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>치료 효과 예측:</strong> 환자 특성 기반 치료법 비교 분석
                            (병기, 간기능, 연령, 치료 이력, 진단 연도 등을 종합적으로 고려)
                          </Typography>
                        </Alert>
                      )}

                      {/* 실제 임상데이터 미리보기 */}
                      {predictionResults?.clinicalSummary && (
                        <>
                          <Divider sx={{ my: 3 }} />
                          <div className="section-title">
                            🔍 현재 환자 임상데이터
                          </div>
                          <div className="info-cards-grid">
                            <InfoCard
                              icon="👤"
                              title="환자 연령"
                              content={`${predictionResults.clinicalSummary.age || 'N/A'}세`}
                            />
                            <InfoCard
                              icon="🎯"
                              title="암 병기"
                              content={predictionResults.clinicalSummary.stage || 'Unknown'}
                            />
                            <InfoCard
                              icon="🫀"
                              title="간기능 등급"
                              content={`Child-Pugh ${predictionResults.clinicalSummary.child_pugh || 'Unknown'}`}
                            />
                            <InfoCard
                              icon="💊"
                              title="화학요법 여부"
                              content={predictionResults.clinicalSummary.treatment === 'yes' ? '시행함' : '시행하지 않음'}
                            />
                          </div>
                        </>
                      )}
                    </Box>
                  ) : (
                    <div className="no-results-container">
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        📋 환자 데이터 없음
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        현재 Django 데이터베이스에 간암 임상데이터가 저장된 환자만 예측 분석이 가능합니다.
                      </Typography>
                      <Alert severity="info">
                        <Typography variant="body2">
                          <strong>데이터 보유 환자:</strong> {patientsWithClinicalData.join(', ')}
                          <br />
                          <strong>데이터 소스:</strong> OpenEMR 간암 임상데이터 폼 → Django LiverCancerClinicalData 모델
                        </Typography>
                      </Alert>
                    </div>
                  )}
                </TabPanel>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
