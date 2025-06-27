// src/components/AdminPanel/VerificationContent.jsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { THEME_COLORS } from '../Common/theme';
import PatientVerificationCodeGenerator from '../PatientVerificationCodeGenerator';

function VerificationContent() {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
        🔐 인증 코드 발급
      </Typography>
      <Card sx={{ 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <CardContent>
          <PatientVerificationCodeGenerator />
        </CardContent>
      </Card>
    </Box>
  );
}

export default VerificationContent;
