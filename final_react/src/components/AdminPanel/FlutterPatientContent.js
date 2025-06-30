//src/components/AdminPanel/FlutterPatientContent.jsx

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { THEME_COLORS } from '../Common/theme';
import FlutterPatientManagement from '../FlutterPatientManagement';

function FlutterPatientContent() {
  return (
    <Box sx={{ p: 3, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      {/* 예약 관리 테이블 섹션 - 간호일지와 동일한 구조 */}
      <FlutterPatientManagement />
    </Box>
  );
}

export default FlutterPatientContent;
