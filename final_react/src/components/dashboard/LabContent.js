//src/components/dashboard/LabContent.jsx

import React from 'react';
import { Box } from '@mui/material';
import ComprehensiveReport from '../clinical/ComprehensiveReport';

const THEME_COLORS = {
  background: '#f8fafc'
};

export default function LabContent({ selectedPatient }) {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh', overflow: 'auto' }}>
      <ComprehensiveReport selectedPatient={selectedPatient} />
    </Box>
  );
}
