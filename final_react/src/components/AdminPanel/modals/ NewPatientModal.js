// src/components/AdminPanel/modals/NewPatientModal.jsx
import React, { useState } from 'react';
import {
  Modal, Box, Typography, TextField, Button, Grid, FormControl,
  InputLabel, Select, MenuItem, IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { THEME_COLORS } from '../../Common/theme';
import PatientService from '../../../services/patient.service';

function NewPatientModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    fname: '', lname: '', DOB: '', sex: '', phone_cell: '', street: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await PatientService.createPatientProfile(newPatientData);
      
      onSuccess();
      onClose();
      
      setNewPatientData({
        fname: '', lname: '', DOB: '', sex: '',
        phone_cell: '', street: ''
      });
      
      alert('환자가 성공적으로 등록되었습니다!');
      
    } catch (error) {
      alert(`환자 등록에 실패했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        bgcolor: THEME_COLORS.surface,
        borderRadius: 2,
        boxShadow: 24,
        p: 0,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${THEME_COLORS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" fontWeight="bold" color={THEME_COLORS.primary}>
            새 환자 등록 (Django)
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="성 (Last Name) *"
                name="lname"
                value={newPatientData.lname}
                onChange={handleInputChange}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="이름 (First Name) *"
                name="fname"
                value={newPatientData.fname}
                onChange={handleInputChange}
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="생년월일 *"
                name="DOB"
                type="date"
                value={newPatientData.DOB}
                onChange={handleInputChange}
                required
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>성별 *</InputLabel>
                <Select
                  name="sex"
                  value={newPatientData.sex}
                  onChange={handleInputChange}
                  label="성별 *"
                >
                  <MenuItem value="">선택하세요</MenuItem>
                  <MenuItem value="Male">남성</MenuItem>
                  <MenuItem value="Female">여성</MenuItem>
                  <MenuItem value="Other">기타</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="연락처"
                name="phone_cell"
                value={newPatientData.phone_cell}
                onChange={handleInputChange}
                placeholder="010-1234-5678"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="주소"
                name="street"
                value={newPatientData.street}
                onChange={handleInputChange}
                placeholder="서울시 강남구 테헤란로 123"
                size="small"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={onClose}>
              취소
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '등록 중...' : '환자 등록'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

export default NewPatientModal;
