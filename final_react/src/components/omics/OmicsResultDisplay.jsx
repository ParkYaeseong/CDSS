// final_react/src/components/omics/OmicsResultDisplay.jsx

import React from 'react';
import { 
  Typography, 
  Box, 
  CircularProgress, 
  Paper,
  Grid,
  Divider,
  LinearProgress
} from '@mui/material';

// [1. 추가] 이미 만들어져 있는 BiomarkerCard 컴포넌트를 import 합니다.
import BiomarkerCard from '../BiomarkerCard';

// 테마 색상을 직접 정의하여 일관성을 유지합니다.
const THEME = {
  primary: '#007C80',
  secondary: '#14b8a6',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  error: '#ef4444',
  success: '#10b981',
  accent: '#5eead4'
};

const OmicsResultDisplay = ({ result, loading }) => {
  // 로딩 중일 때 표시
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: 200 }}>
        <CircularProgress sx={{ color: THEME.primary }} />
      </Box>
    );
  }

  // 결과 데이터가 없을 때 표시
  if (!result) {
    return (
      <Paper elevation={0} sx={{ p: 2, mt: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
        <Typography variant="body2" color={THEME.textSecondary}>
          왼쪽 목록에서 분석 항목을 선택하세요.
        </Typography>
      </Paper>
    );
  }
  
  // 1차 분석 결과 변수들
  const isCancer = result.binary_cancer_prediction === 1;
  const cancerProbability = (result.binary_cancer_probability || 0) * 100;

  // 2차 분석 결과 변수들
  const cancerType = result.predicted_cancer_type_name || 'N/A';
  const cancerTypeProb = result.all_cancer_type_probabilities 
    ? (result.all_cancer_type_probabilities[cancerType] || 0) * 100
    : null;

  return (
    // Box로 전체를 감싸서 여러 컴포넌트를 포함할 수 있도록 합니다.
    <Box>
      {/* 기존 모델 예측 결과 카드 */}
      <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${THEME.primary}20` }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: THEME.textPrimary, borderBottom: `2px solid ${THEME.primary}30`, pb:1 }}>
          모델 예측 결과
        </Typography>
        
        <Grid container spacing={2} alignItems="stretch">
          {/* 1차 분석: 암 여부 예측 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="subtitle2" color={THEME.textSecondary} gutterBottom>
                1차 분석: 암 여부 예측
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="body2" color={THEME.textSecondary} sx={{ mb: 1 }}>
                  최종 진단 예측
                </Typography>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  sx={{ color: isCancer ? THEME.error : THEME.success, mb: 3 }}
                >
                  {isCancer ? '암 (Cancer)' : '정상 (Normal)'}
                </Typography>
                
                <Typography variant="body2" color={THEME.textSecondary} sx={{ mb: 1 }}>
                  암일 확률
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={cancerProbability}
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      flexGrow: 1,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        backgroundColor: cancerProbability > 80 ? '#d32f2f' : cancerProbability > 60 ? '#f59e0b' : THEME.primary,
                      }
                    }} 
                  />
                  <Typography variant="body1" fontWeight="bold" sx={{ color: THEME.primary, minWidth: '50px' }}>
                    {cancerProbability.toFixed(2)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
          
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* 2차 분석: 암종 식별 */}
          <Grid item xs={12} md={5.5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="subtitle2" color={THEME.textSecondary} gutterBottom>
                2차 분석: 암종 식별
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="body2" color={THEME.textSecondary} sx={{ mb: 1 }}>
                  가장 유력한 암 종류
                </Typography>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  sx={{ color: THEME.secondary, mb: 1 }}
                >
                  {cancerType}
                </Typography>
                {cancerTypeProb !== null && (
                   <Typography variant="body2" color={THEME.textSecondary}>
                    (확률: {cancerTypeProb.toFixed(2)}%)
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* [2. 추가] API 응답(result)에서 biomarkers 데이터를 가져와 BiomarkerCard에 전달합니다. */}
      <Box sx={{ mt: 2 }}>
        <BiomarkerCard biomarkerData={result.biomarkers} />
      </Box>

    </Box>
  );
};

export default OmicsResultDisplay;