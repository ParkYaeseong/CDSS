// components/clinical/ClinicalPredictionDashboard.jsx
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
} from '@mui/material';
import PatientService from '../../services/patient.service';
import PredictionTypeSelector from './PredictionTypeSelector';
import PatientSelector from './PatientSelector';
import PredictionResults from './PredictionResults';
import PredictionAPI from '../../services/predictionAPI';

// 네비게이션바와 조화로운 색상 팔레트
const NAV_THEME = {
  primary: '#00897b',        // 네비게이션바 메인 색상
  primaryDark: '#00695c',    // 진한 teal
  primaryLight: '#4db6ac',   // 밝은 teal
  secondary: '#26a69a',      // 보조 teal
  accent: '#80cbc4',         // 연한 teal
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  background: '#f8fffe',
  surface: '#ffffff',
  text: {
    primary: '#263238',
    secondary: '#546e7a'
  },
  border: '#e0f2f1',
  divider: '#e0e0e0'
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prediction-tabpanel-${index}`}
      aria-labelledby={`prediction-tab-${index}`}
      {...other}
      style={{ height: '100%', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
    >
      {value === index && (
        <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ClinicalPredictionDashboard = ({ selectedPatient: dashboardSelectedPatient }) => {
  // 상태 관리
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPredictionType, setSelectedPredictionType] = useState('survival-rate');
  const [activeTab, setActiveTab] = useState(0);
  const [predictionResults, setPredictionResults] = useState(null);
  const [allPredictionResults, setAllPredictionResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedCancerType, setDetectedCancerType] = useState(null);
  const [supportedCancerTypes, setSupportedCancerTypes] = useState({});

  // 실제 임상데이터 보유 환자 목록
  const patientsWithClinicalData = {
    liver: ['강 경화'],
    stomach: ['이 선아'],
    kidney: ['신 장훈', 'Park Yeaseng']
  };

  // 대시보드에서 선택한 환자가 변경될 때마다 자동으로 설정
  useEffect(() => {
    if (dashboardSelectedPatient) {
      setSelectedPatient(dashboardSelectedPatient);
    }
  }, [dashboardSelectedPatient]);

  useEffect(() => {
    fetchPatients();
    fetchSupportedCancerTypes();
  }, []);

  const fetchSupportedCancerTypes = async () => {
    try {
      const result = await PredictionAPI.getSupportedCancerTypes();
      setSupportedCancerTypes(result.data.supported_cancer_types || {});
    } catch (err) {
      console.error('지원 암종 목록 조회 오류:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await PatientService.getPatientProfiles();
      setPatients(response.data || []);
    } catch (err) {
      console.error('환자 목록 조회 오류:', err);
      setError('환자 목록을 불러오는데 실패했습니다.');
    }
  };

  // 환자의 암종별 임상데이터 보유 여부 확인
  const getPatientCancerTypes = (patientName) => {
    const cancerTypes = [];
    
    // 정확한 이름 매칭만 수행
    Object.entries(patientsWithClinicalData).forEach(([cancerType, patients]) => {
        // 정확히 일치하는 경우만 추가
        if (patients.includes(patientName)) {
        cancerTypes.push(cancerType);
        }
    });
    
    return cancerTypes;
    };

    // 환자에게 임상데이터가 있는지 확인 (정확한 매칭만)
    const hasAnyClinicalData = (patientName) => {
    return Object.values(patientsWithClinicalData).some(patients => 
        patients.includes(patientName)
    );
  };

  const handlePrediction = async () => {
    if (!selectedPatient) {
      setError('환자를 선택해주세요.');
      return;
    }

    if (!hasAnyClinicalData(selectedPatient.name)) {
      setError(`선택한 환자(${selectedPatient.name})는 임상데이터가 없어 예측 분석이 불가능합니다.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPredictionResults(null);
    setDetectedCancerType(null);

    try {
      const response = await PredictionAPI.callPredictionAPI(
        selectedPredictionType,
        selectedPatient.openemr_id,
        selectedPatient.name
      );

      if (response.success) {
        const apiData = response.data;
        setDetectedCancerType(apiData.cancer_type);
        
        let formattedResults = PredictionAPI.formatPredictionResults(apiData, selectedPredictionType);
        setPredictionResults(formattedResults);
      } else {
        throw new Error(response.error || '예측 결과를 받아오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('예측 API 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllPredictions = async () => {
    if (!selectedPatient) {
      setError('환자를 선택해주세요.');
      return;
    }

    if (!hasAnyClinicalData(selectedPatient.name)) {
      setError(`선택한 환자(${selectedPatient.name})는 임상데이터가 없어 예측 분석이 불가능합니다.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAllPredictionResults(null);
    setDetectedCancerType(null);

    try {
      const response = await PredictionAPI.callAllPredictionsAPI(
        selectedPatient.openemr_id,
        selectedPatient.name
      );

      if (response.success) {
        const allResults = response.data;
        
        const firstSuccessfulResult = Object.values(allResults).find(result => result && !result.error);
        if (firstSuccessfulResult) {
          setDetectedCancerType(firstSuccessfulResult.cancer_type);
        }

        const formattedAllResults = {};
        const keyMapping = {
          'survival': 'survival-rate',
          'risk_classification': 'cancer-risk',
          'treatment_effect': 'treatment-effect'
        };

        Object.entries(allResults).forEach(([predType, result]) => {
          if (result && !result.error) {
            const mappedType = keyMapping[predType] || predType;
            try {
              formattedAllResults[mappedType] = PredictionAPI.formatPredictionResults(result, mappedType);
            } catch (formatError) {
              formattedAllResults[mappedType] = { 
                error: `결과 포맷팅 실패: ${formatError.message}` 
              };
            }
          } else {
            const mappedType = keyMapping[predType] || predType;
            formattedAllResults[mappedType] = { 
              error: result?.error || '예측 결과가 없습니다.' 
            };
          }
        });

        setAllPredictionResults(formattedAllResults);
      } else {
        throw new Error(response.error || '통합 예측 결과를 받아오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('통합 예측 API 오류:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 환자나 예측 타입 변경 시 결과 초기화
  useEffect(() => {
    setPredictionResults(null);
    setAllPredictionResults(null);
    setError(null);
    setDetectedCancerType(null);
  }, [selectedPatient, selectedPredictionType]);

  // 암종별 색상 매핑 (네비게이션바와 조화로운 색상)
  const getCancerTypeColor = (cancerType) => {
    const colors = {
      liver: '#00897b',     // 청록색 (teal
      kidney: '#ff8a65',    // 따뜻한 오렌지
      stomach: '#42a5f5'    // 밝은 파랑
    };
    return colors[cancerType] || NAV_THEME.secondary;
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100%',
      margin: 0,
      padding: 0,
      backgroundColor: NAV_THEME.background,
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* 감지된 암종 표시 */}
      {detectedCancerType && (
        <Box sx={{ 
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}>
          <Chip
            label={`감지된 암종: ${supportedCancerTypes[detectedCancerType] || detectedCancerType}`}
            sx={{ 
              backgroundColor: NAV_THEME.primary, 
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          />
        </Box>
      )}

      {/* 좌측 패널 - 환자 선택 및 예측 설정 */}
      <Box sx={{ 
        flex: '1 1 33%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 1,
        overflow: 'hidden'
      }}>
        <Card elevation={1} sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ 
            p: 2, 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          }}>
            
            {/* 대시보드에서 선택한 환자 표시 */}
            {selectedPatient ? (
              <Box sx={{ 
                p: 2, 
                backgroundColor: `${NAV_THEME.primary}10`, 
                borderRadius: 1,
                border: `2px solid ${NAV_THEME.primary}`,
                mb: 2
              }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: NAV_THEME.primary }}>
                  환자 정보
                </Typography>
                <Typography variant="body2"><strong>이름:</strong> {selectedPatient.name}</Typography>
                <Typography variant="body2"><strong>환자ID:</strong> {selectedPatient.openemr_id}</Typography>
                <Typography variant="body2"><strong>생년월일:</strong> {selectedPatient.date_of_birth}</Typography>
                <Typography variant="body2"><strong>성별:</strong> {selectedPatient.gender}</Typography>
                
                {/* 임상데이터 보유 여부 표시 */}
                {hasAnyClinicalData(selectedPatient.name) ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ color: NAV_THEME.success, fontWeight: 'bold', mb: 1 }}>
                      임상데이터 보유 - 예측 분석 가능
                    </Typography>
                    {getPatientCancerTypes(selectedPatient.name).length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {getPatientCancerTypes(selectedPatient.name).map(cancerType => (
                          <Chip
                            key={cancerType}
                            size="small"
                            label={supportedCancerTypes[cancerType] || cancerType}
                            sx={{ 
                              backgroundColor: getCancerTypeColor(cancerType), 
                              color: 'white' 
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: NAV_THEME.error, fontWeight: 'bold', mt: 1 }}>
                    임상데이터 없음 - 예측 분석 불가
                  </Typography>
                )}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  대시보드에서 환자를 선택해주세요.
                </Typography>
              </Alert>
            )}

            {/* 추가 환자 선택 옵션 (선택사항) */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, color: NAV_THEME.text.secondary }}>
              다른 환자 선택 (선택사항)
            </Typography>
            <PatientSelector
              patients={patients}
              selectedPatient={selectedPatient}
              setSelectedPatient={setSelectedPatient}
              supportedCancerTypes={supportedCancerTypes}
              compact={true}
            />

            <Divider sx={{ my: 2 }} />

            <PredictionTypeSelector
              selectedPredictionType={selectedPredictionType}
              setSelectedPredictionType={setSelectedPredictionType}
            />

            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handlePrediction}
                disabled={!selectedPatient || isLoading}
                sx={{ 
                  py: 1.2,
                  backgroundColor: NAV_THEME.primary,
                  '&:hover': {
                    backgroundColor: NAV_THEME.primaryDark,
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={18} sx={{ mr: 1, color: 'white' }} />
                    분석 중...
                  </>
                ) : (
                  '선택한 예측 분석 실행'
                )}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={handleAllPredictions}
                disabled={!selectedPatient || isLoading}
                sx={{ 
                  py: 1.2,
                  borderColor: NAV_THEME.secondary, 
                  color: NAV_THEME.secondary,
                  '&:hover': {
                    backgroundColor: `${NAV_THEME.secondary}10`,
                    borderColor: NAV_THEME.secondary,
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={18} sx={{ mr: 1, color: NAV_THEME.secondary }} />
                    통합 분석 중...
                  </>
                ) : (
                  '모든 예측 통합 분석'
                )}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>오류:</strong> {error}
                </Typography>
              </Alert>
            )}

            <Box sx={{ flex: 1 }} />
          </CardContent>
        </Card>
      </Box>

      {/* 우측 패널 - 예측 결과 */}
      <Box sx={{ 
        flex: '1 1 67%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 1,
        pl: 0,
        overflow: 'hidden'
      }}>
        <Card elevation={1} sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ 
                px: 2,
                '& .MuiTab-root': {
                  color: NAV_THEME.text.secondary,
                  fontWeight: 'bold'
                },
                '& .Mui-selected': {
                  color: NAV_THEME.primary,
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: NAV_THEME.primary,
                  height: 3
                }
              }}
            >
              <Tab label="예측 결과" />
              <Tab label="모델 설명" />
              <Tab label="환자 데이터" />
            </Tabs>
          </Box>

          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ 
                height: '100%', 
                overflow: 'auto',
                pr: 1
              }}>
                <PredictionResults
                  predictionResults={predictionResults}
                  allPredictionResults={allPredictionResults}
                  selectedPredictionType={selectedPredictionType}
                  detectedCancerType={detectedCancerType}
                  supportedCancerTypes={supportedCancerTypes}
                  selectedPatient={selectedPatient}
                  themeColors={NAV_THEME}
                />
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ 
                height: '100%', 
                overflow: 'auto',
                pr: 1
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: NAV_THEME.primary }}>
                  AI 모델 설명
                </Typography>
                <Typography variant="body1" paragraph>
                  암종별로 최적화된 머신러닝 모델을 사용하여 정확한 예측을 제공합니다.
                </Typography>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: 2,
                  pb: 2
                }}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ color: getCancerTypeColor('liver'), mb: 1 }}>
                      간암 (LIHC) 모델
                    </Typography>
                    <Typography variant="body2">
                      • 생존 예측: GBSA (Gradient Boosting Survival Analysis)<br/>
                      • 위험도 분류: XGBoost<br/>
                      • 치료 효과: LightGBM
                    </Typography>
                  </Card>
                  
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ color: getCancerTypeColor('kidney'), mb: 1 }}>
                      신장암 (KIRC) 모델
                    </Typography>
                    <Typography variant="body2">
                      • 생존 예측: Random Survival Forest<br/>
                      • 위험도 분류: XGBoost<br/>
                      • 치료 효과: Random Forest
                    </Typography>
                  </Card>
                  
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ color: getCancerTypeColor('stomach'), mb: 1 }}>
                      위암 (STAD) 모델
                    </Typography>
                    <Typography variant="body2">
                      • 생존 예측: GBSA<br/>
                      • 위험도 분류: Random Forest<br/>
                      • 치료 효과: Random Forest (개선된 버전)
                    </Typography>
                  </Card>
                </Box>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Box sx={{ 
                height: '100%', 
                overflow: 'auto',
                pr: 1
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: NAV_THEME.primary }}>
                  환자 임상 데이터
                </Typography>
                
                {selectedPatient ? (
                  <Box sx={{ pb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      선택된 환자: {selectedPatient.name} (ID: {selectedPatient.openemr_id})
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                      gap: 2
                    }}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          기본 정보
                        </Typography>
                        <Typography variant="body2">
                          • 이름: {selectedPatient.name}<br/>
                          • 환자 ID: {selectedPatient.openemr_id}<br/>
                          • 생년월일: {selectedPatient.date_of_birth}<br/>
                          • 성별: {selectedPatient.gender}
                        </Typography>
                      </Card>
                      
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          임상데이터 상태
                        </Typography>
                        <Typography variant="body2">
                          Django 데이터베이스에서 환자의 임상데이터를 조회하여 AI 모델에 적용합니다.
                        </Typography>
                      </Card>
                      
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          분석 가능 항목
                        </Typography>
                        <Typography variant="body2">
                          • 생존율 예측 (1년, 3년, 5년)<br/>
                          • 위험도 분류 (저위험/고위험)<br/>
                          • 치료 효과 예측 (최적 치료법 추천)
                        </Typography>
                      </Card>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minHeight: '300px',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                      환자를 선택해주세요
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      대시보드에서 환자를 선택하면 해당 환자의 임상데이터 정보를 확인할 수 있습니다.
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                      gap: 2,
                      maxWidth: 800,
                      width: '100%'
                    }}>
                      <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: NAV_THEME.primary, mb: 1 }}>
                          임상데이터 기반 분석
                        </Typography>
                        <Typography variant="body2">
                          환자의 실제 임상데이터를 활용하여 정확한 AI 예측 분석을 제공합니다.
                        </Typography>
                      </Card>
                      
                      <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: NAV_THEME.primary, mb: 1 }}>
                          다중 암종 지원
                        </Typography>
                        <Typography variant="body2">
                          간암, 신장암, 위암에 대한 전문화된 AI 모델을 제공합니다.
                        </Typography>
                      </Card>
                    </Box>
                  </Box>
                )}
              </Box>
            </TabPanel>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default ClinicalPredictionDashboard;
