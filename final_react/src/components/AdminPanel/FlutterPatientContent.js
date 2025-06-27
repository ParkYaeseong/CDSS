// src/components/AdminPanel/FlutterPatientContent.jsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { THEME_COLORS } from '../Common/theme';
import FlutterPatientManagement from '../FlutterPatientManagement';

function FlutterPatientContent() {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
          <FlutterPatientManagement />
    </Box>
  );
}

export default FlutterPatientContent;

