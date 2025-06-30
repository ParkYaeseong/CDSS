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
  // Tabs와 Tab은 더 이상 필요 없으므로 삭제 가능
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

// XAI 설명 컴포넌트 (수정됨: SHAP만 표시)
const XAIExplanation = ({ xaiData, themeColors, predictionType }) => {
  // 생존율 예측 모델에서는 XAI를 표시하지 않음
  if (predictionType === 'survival-rate') {
    return <Box sx={{ mt: 2 }} />;
  }
  
  if (!xaiData) return null;
  
  // SHAP 데이터 유무만 체크
  const hasShapValues = xaiData.shap_values && xaiData.shap_values.feature_names && xaiData.shap_values.values;
  
  return (
    <Accordion sx={{ mt: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6" sx={{ color: themeColors?.primary || '#00897b' }}>
          🔍 AI 모델 설명 (SHAP 분석)
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {hasShapValues ? (
          <Box sx={{ width: '100%' }}>
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
                    const safeShapValue = typeof shapValue === 'number' ? shapValue : parseFloat(shapValue) || 0;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{feature.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <Chip
                            label={safeShapValue.toFixed(4)}
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
        ) : (
          <Alert severity="warning" icon="⚠️">
            <Typography variant="body2">
              이 예측 모델에 대한 SHAP 설명 데이터를 생성할 수 없습니다.
            </Typography>
          </Alert>
        )}
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

        {Object.entries(allPredictionResults).map(([predType, result]) => (
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

            {result && (
              <Box sx={{ px: 3, pb: 2 }}>
                <XAIExplanation 
                  xaiData={result.xaiExplanation} 
                  themeColors={themeColors}
                  predictionType={predType}
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

        <XAIExplanation 
          xaiData={predictionResults.xaiExplanation} 
          themeColors={themeColors}
          predictionType={selectedPredictionType}
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