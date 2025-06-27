// final_react/src/components/nursing/layout/PatientFilter.jsx
import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';

function PatientFilter({ patients, selectedPatient, setSelectedPatient, onRefresh }) {
  const handlePatientChange = (e) => {
    setSelectedPatient(e.target.value);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2, 
      mb: 3,
      p: 2,
      bgcolor: '#f8fafc',
      borderRadius: 1,
      border: '1px solid #e2e8f0'
    }}>
      <Typography variant="h6" fontWeight="600" sx={{ minWidth: 'fit-content' }}>
        환자 선택:
      </Typography>
      <FormControl sx={{ minWidth: 300 }}>
        <InputLabel>환자를 선택하세요</InputLabel>
        <Select
          value={selectedPatient}
          onChange={handlePatientChange}
          label="환자를 선택하세요"
          size="small"
        >
          <MenuItem value="">전체 환자</MenuItem>
          {patients.map(patient => (
            <MenuItem key={patient.id} value={patient.patient_id}>
              {patient.patient_id} - {patient.name} ({patient.age}세, {patient.gender === 'M' ? '남' : '여'})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button 
        variant="outlined" 
        startIcon={<Refresh />}
        onClick={onRefresh}
        sx={{ 
          color: '#3b82f6',
          borderColor: '#3b82f6',
          '&:hover': {
            bgcolor: '#3b82f6',
            color: 'white'
          }
        }}
      >
        새로고침
      </Button>
    </Box>
  );
}

export default PatientFilter;
