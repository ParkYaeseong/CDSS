import React from 'react';
import { Box } from '@mui/material';
import NursingRecordViewer from '../nursing/NursingRecordViewer';

const THEME_COLORS = {
  background: '#f8fafc'
};

export default function NursingContent({ selectedPatient }) {
  return (
    // minHeight의 '100vh'를 '100%'로 변경합니다.
    <Box sx={{ bgcolor: THEME_COLORS.background, height: '100%', p: 2 }}>
      <NursingRecordViewer selectedPatient={selectedPatient} />
    </Box>
  );
}