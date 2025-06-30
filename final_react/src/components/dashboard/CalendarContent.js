//src/components/dashboard/CalendarContent.jsx

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import PatientCalendar from '../PatientCalendar';

const THEME_COLORS = {
  primary: '#007C80',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0'
};

export default function CalendarContent({ selectedPatient }) {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh', overflow: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
        환자 예약 캘린더
      </Typography>
      <Card sx={{ 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <CardContent>
          <PatientCalendar 
            selectedPatient={selectedPatient} 
            onDateChange={(date) => console.log('선택된 날짜:', date)} 
          />
        </CardContent>
      </Card>
    </Box>
  );
}
