//src/components/AdminPanel/VerificationContent.jsx

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { THEME_COLORS } from '../Common/theme';
import PatientVerificationCodeGenerator from '../PatientVerificationCodeGenerator';

function VerificationContent() {
  return (
    <Box sx={{ p: 3, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      {/* 헤더 */}
      <Box sx={{ 
        bgcolor: THEME_COLORS.surface,
        borderRadius: 2,
        border: `1px solid ${THEME_COLORS.border}`,
        borderLeft: '4px solid #003d82', // 남색 포인트 추가
        mb: 3,
        p: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: THEME_COLORS.primary }}>
          🔐 인증 코드 발급 시스템
        </Typography>
        <Typography variant="body2" color={THEME_COLORS.text.secondary}>
          환자 인증을 위한 보안 코드를 생성하고 관리합니다.
        </Typography>
      </Box>
      
      {/* 인증 코드 발급 컴포넌트 */}
      <Card sx={{ 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        borderLeft: '4px solid #ffc107', // 노란색 포인트 추가 (보안/인증 의미)
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 3 }}>
          <PatientVerificationCodeGenerator />
        </CardContent>
      </Card>
    </Box>
  );
}

export default VerificationContent;
