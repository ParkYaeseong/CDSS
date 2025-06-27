// src/components/AdminPanel/AppointmentContent.jsx
import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { THEME_COLORS } from '../Common/theme';
import AppointmentManagementTable from '../Appointments/AppointmentManagementTable';

function AppointmentContent() {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      <AppointmentManagementTable />
    </Box>
  );
}

export default AppointmentContent;
