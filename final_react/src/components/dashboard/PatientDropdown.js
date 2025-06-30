//src/components/dashboard/PatientDropdown.jsx

import React from 'react';
import {
  Box, Typography, FormControl, Select, MenuItem, IconButton, Badge
} from '@mui/material';
import {
  Notifications, Settings
} from '@mui/icons-material';

const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: {
    primary: '#1e293b',
    secondary: '#64748b'
  }
};

export default function PatientDropdown({ patients, selectedPatient, onPatientSelect }) {
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

  return (
    <Box sx={{ 
      height: 60, 
      bgcolor: THEME_COLORS.background, 
      borderBottom: `1px solid ${THEME_COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      px: 2,
      gap: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      flexShrink: 0
    }}>
      <Typography variant="h6" fontWeight="bold" sx={{ minWidth: 'fit-content', color: THEME_COLORS.text.primary }}>
        환자 선택:
      </Typography>
      <FormControl sx={{ minWidth: 200 }}>
        <Select
          value={selectedPatient?.id || ''}
          onChange={(e) => {
            const patient = patients.find(p => p.id === e.target.value);
            onPatientSelect(patient);
          }}
          displayEmpty
          size="small"
          sx={{ 
            bgcolor: THEME_COLORS.surface,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: THEME_COLORS.border
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: THEME_COLORS.secondary
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: THEME_COLORS.primary
            }
          }}
        >
          <MenuItem value="" disabled>
            환자를 선택하세요
          </MenuItem>
          {patients.map((patient) => (
            <MenuItem key={patient.id} value={patient.id}>
              {patient.name} ({patient.openemr_id})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selectedPatient && (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Typography variant="body2" color={THEME_COLORS.text.secondary}>
            {calculateAge(selectedPatient.date_of_birth)}세 {selectedPatient.gender}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
