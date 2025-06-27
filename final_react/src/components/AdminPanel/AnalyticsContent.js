// src/components/AdminPanel/AnalyticsContent.jsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { THEME_COLORS } from '../Common/theme';

function AnalyticsContent() {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
        📊 분석 도구
      </Typography>
      <Card sx={{ 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <CardContent>
          <Typography color={THEME_COLORS.text.secondary}>
            분석 도구 기능이 준비 중입니다.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AnalyticsContent;
