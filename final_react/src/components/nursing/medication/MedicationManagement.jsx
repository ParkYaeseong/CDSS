// final_react/src/components/nursing/medication/MedicationManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip
} from '@mui/material';

export default function MedicationManagement({ patients, onRefresh }) {
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({
    patientName: '',
    medicationName: '',
    dosage: '',
    frequency: '',
    time: '',
    notes: ''
  });

  const currentTime = new Date().toTimeString().slice(0, 5);
  
  // 실제 투약 스케줄 생성
  const generateMedicationSchedule = () => {
    const schedule = [];
    patients.forEach(patient => {
      const commonMeds = [
        { name: '혈압약', time: '08:00', frequency: '1일 1회' },
        { name: '항생제', time: '12:00', frequency: '1일 2회' },
        { name: '진통제', time: '18:00', frequency: '필요시' }
      ];
      
      commonMeds.forEach(med => {
        schedule.push({
          id: `${patient.id}-${med.name}`,
          patientName: patient.name,
          medicationName: med.name,
          time: med.time,
          frequency: med.frequency,
          status: med.time <= currentTime ? '완료' : '대기',
          patientId: patient.patient_id
        });
      });
    });
    return schedule;
  };

  useEffect(() => {
    setMedications(generateMedicationSchedule());
  }, [patients]);

  const handleAddMedication = () => {
    if (!newMedication.patientName || !newMedication.medicationName) {
      alert('환자명과 약물명은 필수입니다.');
      return;
    }

    const newMed = {
      id: Date.now(),
      ...newMedication,
      status: '대기',
      addedAt: new Date().toLocaleString('ko-KR')
    };

    setMedications([...medications, newMed]);
    setNewMedication({
      patientName: '',
      medicationName: '',
      dosage: '',
      frequency: '',
      time: '',
      notes: ''
    });
  };

  const updateMedicationStatus = (id, status) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, status, completedAt: new Date().toLocaleString('ko-KR') } : med
    ));
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#8B4A52' }}>
        💊 투약 관리
      </Typography>

      {/* 투약 추가 폼 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
            새 투약 추가
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ overflow:'visible', width: '120px', margin: '0 auto' }}>
                <InputLabel>환자 선택</InputLabel>
                <Select
                  value={newMedication.patientName}
                  onChange={(e) => setNewMedication({...newMedication, patientName: e.target.value})}
                  label="환자 선택"
                >
                  {patients.map(patient => (
                    <MenuItem key={patient.id} value={patient.name}>
                      {patient.name} ({patient.patient_id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="약물명"
                value={newMedication.medicationName}
                onChange={(e) => setNewMedication({...newMedication, medicationName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="용량"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                placeholder="예: 500mg"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="투약 시간"
                type="time"
                value={newMedication.time}
                onChange={(e) => setNewMedication({...newMedication, time: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="투약 빈도"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
                placeholder="예: 1일 2회"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddMedication}
                sx={{ 
                  bgcolor: '#E0969F',
                  '&:hover': { bgcolor: '#C8797F' },
                  height: '56px'
                }}
              >
                추가
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 투약 스케줄 테이블 */}
      <Box sx={{
        bgcolor: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        borderRadius: 1
      }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>시간</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>환자</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>약물명</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>용량</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>빈도</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>상태</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {medications.map((med) => (
                <TableRow key={med.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                  <TableCell>{med.time}</TableCell>
                  <TableCell>{med.patientName}</TableCell>
                  <TableCell>{med.medicationName}</TableCell>
                  <TableCell>{med.dosage || '-'}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>
                    <Chip 
                      label={med.status}
                      color={med.status === '완료' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {med.status !== '완료' && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => updateMedicationStatus(med.id, '완료')}
                        sx={{ 
                          bgcolor: '#E0969F',
                          '&:hover': { bgcolor: '#C8797F' }
                        }}
                      >
                        완료
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
