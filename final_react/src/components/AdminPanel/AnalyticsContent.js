//src/components/AdminPanel/AnalyticsContent.jsx

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { THEME_COLORS } from '../Common/theme';

function AnalyticsContent() {
  return (
    <Box sx={{ p: 3, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: THEME_COLORS.primary }}>
        📊 분석 도구
      </Typography>
      <Card sx={{ 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        borderLeft: '4px solid #003d82', // 남색 포인트 추가
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color={THEME_COLORS.text.primary} sx={{ mb: 2 }}>
              📈 고급 분석 도구
            </Typography>
            <Typography color={THEME_COLORS.text.secondary} sx={{ mb: 3 }}>
              환자 데이터 분석 및 통계 기능이 준비 중입니다.
            </Typography>
            <Box sx={{ 
              bgcolor: `${THEME_COLORS.primary}08`, 
              p: 3, 
              borderRadius: 2,
              border: `1px solid ${THEME_COLORS.primary}20`
            }}>
              <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                • 환자 통계 분석
              </Typography>
              <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                • 진료 데이터 시각화
              </Typography>
              <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                • 병원 운영 지표 분석
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AnalyticsContent;
