// components/clinical/PredictionResults.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

const GaugeBar = ({ value, label, maxValue = 100, color = '#00897b' }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" fontWeight="bold">{label}</Typography>
        <Typography variant="body2" fontWeight="bold" sx={{ color: color }}>
          {percentage.toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        sx={{ 
          height: 12, 
          borderRadius: 6,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            borderRadius: 6,
            backgroundColor: color,
          }
        }} 
      />
    </Box>
  );
};

// XAI 설명 컴포넌트
const XAIExplanation = ({ xaiData, themeColors, predictionType }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // 생존율 예측 모델에서는 XAI를 표시하지 않음
  if (predictionType === 'survival-rate') {
    return (
      <Box sx={{ mt: 2 }}>
      </Box>
    );
  }
  
  if (!xaiData) return null;
  
  // 빈 데이터 체크
  const hasFeatureImportance = xaiData.feature_importance && xaiData.feature_importance.length > 0;
  const hasShapValues = xaiData.shap_values && xaiData.shap_values.feature_names && xaiData.shap_values.values;
  const hasPermutationImportance = xaiData.permutation_importance && xaiData.permutation_importance.length > 0;
  
  // 모든 데이터가 없으면 컴포넌트를 렌더링하지 않음
  if (!hasFeatureImportance && !hasShapValues && !hasPermutationImportance) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="warning" icon="⚠️">
          <Typography variant="body2">
            이 예측 모델에 대한 XAI 설명 데이터를 생성할 수 없습니다.
          </Typography>
        </Alert>
      </Box>
    );
  }
  
  return (
    <Accordion sx={{ mt: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6" sx={{ color: themeColors?.primary || '#00897b' }}>
          🔍 AI 모델 설명 (XAI)
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ width: '100%' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            {hasFeatureImportance && <Tab label="특성 중요도" />}
            {hasShapValues && <Tab label="SHAP 분석" />}
            {hasPermutationImportance && <Tab label="순열 중요도" />}
          </Tabs>
          
          {/* 특성 중요도 탭 */}
          {activeTab === 0 && hasFeatureImportance && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                모델이 예측에 사용한 주요 특성들
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>순위</TableCell>
                      <TableCell>특성명</TableCell>
                      <TableCell>중요도</TableCell>
                      <TableCell>시각화</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {xaiData.feature_importance.slice(0, 10).map((feature, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {feature.feature.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>{(feature.importance * 100).toFixed(2)}%</TableCell>
                        <TableCell>
                          <LinearProgress
                            variant="determinate"
                            value={feature.importance * 100}
                            sx={{
                              width: 100,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: themeColors?.primary || '#00897b',
                                borderRadius: 4
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          {/* SHAP 분석 탭 */}
          {((hasFeatureImportance && activeTab === 1) || (!hasFeatureImportance && activeTab === 0)) && hasShapValues && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                SHAP 값 분석 (개별 예측 기여도)
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                SHAP 값은 각 특성이 최종 예측에 얼마나 기여했는지를 보여줍니다.
                양수는 위험도 증가, 음수는 위험도 감소를 의미합니다.
              </Alert>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>특성명</TableCell>
                      <TableCell>SHAP 값</TableCell>
                      <TableCell>기여도</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {xaiData.shap_values.feature_names.map((feature, index) => {
                      const shapValue = xaiData.shap_values.values[0]?.[index] || 0;
                      
                      // 안전한 숫자 변환 추가
                      const safeShapValue = typeof shapValue === 'number' ? shapValue : parseFloat(shapValue) || 0;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{feature.replace(/_/g, ' ')}</TableCell>
                          <TableCell>
                            <Chip
                              label={safeShapValue.toFixed(4)} // 안전한 값 사용
                              size="small"
                              color={safeShapValue > 0 ? 'error' : 'success'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(Math.abs(safeShapValue) * 100, 100)}
                              sx={{
                                width: 100,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: safeShapValue > 0 ? '#f44336' : '#4caf50',
                                  borderRadius: 4
                                }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          
          {/* 순열 중요도 탭 */}
          {((hasFeatureImportance && hasShapValues && activeTab === 2) || 
            (hasFeatureImportance && !hasShapValues && activeTab === 1) || 
            (!hasFeatureImportance && !hasShapValues && activeTab === 0)) && hasPermutationImportance && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                순열 중요도 (Permutation Importance)
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                각 특성을 무작위로 섞었을 때 모델 성능이 얼마나 감소하는지를 측정합니다.
              </Alert>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>특성명</TableCell>
                      <TableCell>중요도</TableCell>
                      <TableCell>표준편차</TableCell>
                      <TableCell>시각화</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {xaiData.permutation_importance.slice(0, 10).map((feature, index) => (
                      <TableRow key={index}>
                        <TableCell>{feature.feature.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{feature.importance.toFixed(4)}</TableCell>
                        <TableCell>±{feature.std.toFixed(4)}</TableCell>
                        <TableCell>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(Math.abs(feature.importance) * 1000, 100)}
                            sx={{
                              width: 100,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: themeColors?.secondary || '#14b8a6',
                                borderRadius: 4
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

const PredictionResults = ({
  predictionResults,
  allPredictionResults,
  selectedPredictionType,
  detectedCancerType,
  supportedCancerTypes,
  selectedPatient,
  themeColors
}) => {
  const getCancerTypeColor = (cancerType) => {
    const colors = {
      liver: '#00897b',
      kidney: '#ff8a65',
      stomach: '#42a5f5'
    };
    return colors[cancerType] || (themeColors?.accent || '#26a69a');
  };

  const predictionTypeLabels = {
    'survival-rate': '생존율 예측',
    'cancer-risk': '위험도 분류',
    'treatment-effect': '치료 효과 예측'
  };

  // 안전한 색상 접근
  const primaryColor = themeColors?.primary || '#00897b';
  const infoColor = themeColors?.info || '#2196f3';
  const successColor = themeColors?.success || '#4caf50';

  if (allPredictionResults) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ 
          color: primaryColor, 
          fontWeight: 'bold', 
          mb: 3 
        }}>
          통합 예측 분석 결과
          {detectedCancerType && (
            <Chip
              label={`${supportedCancerTypes[detectedCancerType] || detectedCancerType}`}
              size="medium"
              sx={{ 
                ml: 2, 
                backgroundColor: getCancerTypeColor(detectedCancerType), 
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          )}
        </Typography>

        {Object.entries(allPredictionResults).map(([predType, result], index) => (
          <Paper key={predType} elevation={3} sx={{ 
            mb: 3, 
            borderLeft: `4px solid ${getCancerTypeColor(detectedCancerType)}`,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              p: 2, 
              backgroundColor: `${getCancerTypeColor(detectedCancerType)}15`,
              borderBottom: '1px solid #e0e0e0'
            }}>
              <Typography variant="h6" sx={{ 
                color: getCancerTypeColor(detectedCancerType), 
                fontWeight: 'bold'
              }}>
                {predictionTypeLabels[predType] || predType}
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {result && result.error ? (
                <Alert severity="warning">
                  <Typography variant="body2">{result.error}</Typography>
                </Alert>
              ) : result ? (
                <Box>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: 2, 
                    mb: 3 
                  }}>
                    <Paper elevation={2} sx={{ 
                      p: 2.5, 
                      textAlign: 'center',
                      backgroundColor: `${getCancerTypeColor(detectedCancerType)}10`,
                      border: `2px solid ${getCancerTypeColor(detectedCancerType)}30`
                    }}>
                      <Typography variant="h4" sx={{ 
                        color: getCancerTypeColor(detectedCancerType), 
                        fontWeight: 'bold',
                        mb: 1,
                        fontSize: '2rem'
                      }}>
                        {result.primaryValue}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary" fontWeight="bold">
                        {result.primaryLabel}
                      </Typography>
                    </Paper>
                    
                    <Paper elevation={2} sx={{ 
                      p: 2.5, 
                      textAlign: 'center',
                      backgroundColor: `${infoColor}10`,
                      border: `2px solid ${infoColor}30`
                    }}>
                      <Typography variant="h4" sx={{ 
                        color: infoColor, 
                        fontWeight: 'bold',
                        mb: 1,
                        fontSize: '2rem'
                      }}>
                        {result.secondaryValue}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary" fontWeight="bold">
                        {result.secondaryLabel}
                      </Typography>
                    </Paper>
                  </Box>

                  {result.features?.slice(0, 3).map((feature, idx) => (
                    <GaugeBar
                      key={idx}
                      value={feature.importance * 100}
                      label={`${feature.name}: ${feature.value}`}
                      color={getCancerTypeColor(detectedCancerType)}
                    />
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  <Typography variant="body2">
                    이 예측 유형의 결과를 처리하는 중입니다...
                  </Typography>
                </Alert>
              )}
            </CardContent>

            {/* 각 예측 타입별 XAI 설명 추가 */}
            {result && (
              <Box sx={{ px: 3, pb: 2 }}>
                <XAIExplanation 
                  xaiData={result.xaiExplanation} 
                  themeColors={themeColors}
                  predictionType={predType}  // 예측 타입 전달
                />
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    );
  }

  if (predictionResults) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ 
          color: primaryColor, 
          fontWeight: 'bold', 
          mb: 3 
        }}>
          {predictionTypeLabels[selectedPredictionType]} 결과
          <Chip
            label={`신뢰도: ${(predictionResults.confidence * 100).toFixed(1)}%`}
            size="medium"
            sx={{ 
              ml: 2, 
              backgroundColor: successColor, 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 2, 
          mb: 3 
        }}>
          <Paper elevation={3} sx={{ 
            p: 3, 
            textAlign: 'center',
            backgroundColor: `${getCancerTypeColor(detectedCancerType)}10`,
            border: `2px solid ${getCancerTypeColor(detectedCancerType)}`
          }}>
            <Typography variant="h3" sx={{ 
              color: getCancerTypeColor(detectedCancerType), 
              fontWeight: 'bold',
              mb: 1.5,
              fontSize: '2.5rem'
            }}>
              {predictionResults.primaryValue}
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight="bold">
              {predictionResults.primaryLabel}
            </Typography>
          </Paper>
          
          <Paper elevation={3} sx={{ 
            p: 3, 
            textAlign: 'center',
            backgroundColor: `${infoColor}10`,
            border: `2px solid ${infoColor}`
          }}>
            <Typography variant="h3" sx={{ 
              color: infoColor, 
              fontWeight: 'bold',
              mb: 1.5,
              fontSize: '2.5rem'
            }}>
              {predictionResults.secondaryValue}
            </Typography>
            <Typography variant="h6" color="text.secondary" fontWeight="bold">
              {predictionResults.secondaryLabel}
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ 
          color: primaryColor, 
          fontWeight: 'bold',
          mb: 2
        }}>
          주요 예측 지표
        </Typography>

        {predictionResults.features?.map((feature, index) => (
          <GaugeBar
            key={index}
            value={feature.importance * 100}
            label={`${feature.name}: ${feature.value}`}
            color={getCancerTypeColor(detectedCancerType)}
          />
        ))}

        {/* XAI 설명 추가 */}
        <XAIExplanation 
          xaiData={predictionResults.xaiExplanation} 
          themeColors={themeColors}
          predictionType={selectedPredictionType}  // 예측 타입 전달
        />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
      p: 4
    }}>
      <Typography variant="h5" color="text.secondary" gutterBottom>
        환자를 선택하고 예측 분석을 실행해주세요
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        왼쪽 패널에서 환자를 선택하고 원하는 예측 유형을 선택한 후 분석을 시작하세요.
      </Typography>
      {selectedPatient && (
        <Alert severity="info" sx={{ mt: 2, maxWidth: 500 }}>
          선택된 환자: {selectedPatient.name}
        </Alert>
      )}
    </Box>
  );
};

export default PredictionResults;
