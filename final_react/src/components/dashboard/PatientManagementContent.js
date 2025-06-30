//src/components/dashboard/PatientManagementContent.jsx

import React from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Card
} from '@mui/material';

const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0'
};

export default function PatientManagementContent({ patients, selectedPatient, onPatientSelect }) {
  // 나이 계산 함수
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // 환자 ID를 숫자로 변환하여 오름차순 정렬
  const sortedPatients = [...patients].sort((a, b) => {
    const numA = parseInt(a.openemr_id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.openemr_id.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh', overflow: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
        👥 환자 관리
      </Typography>
      <TableContainer component={Card} sx={{ 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: `${THEME_COLORS.primary}10` }}>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>환자ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>이름</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>나이</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>성별</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>연락처</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPatients.map((patient) => (
              <TableRow 
                key={patient.id} 
                sx={{ 
                  '&:hover': { bgcolor: `${THEME_COLORS.secondary}10` },
                  cursor: 'pointer',
                  backgroundColor: selectedPatient?.id === patient.id ? `${THEME_COLORS.primary}15` : 'transparent'
                }}
                onClick={() => onPatientSelect(patient)}
              >
                <TableCell sx={{ fontWeight: selectedPatient?.id === patient.id ? 'bold' : 'normal' }}>
                  {patient.openemr_id}
                </TableCell>
                <TableCell sx={{ fontWeight: selectedPatient?.id === patient.id ? 'bold' : 'normal' }}>
                  {patient.name}
                </TableCell>
                <TableCell>
                  {calculateAge(patient.date_of_birth)}세
                </TableCell>
                <TableCell>{patient.gender}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      📞 {patient.phone_number || '010-0000-0000'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
