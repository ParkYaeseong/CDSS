// src/components/AdminPanel/modals/VisitModal.jsx
import React, { useState } from 'react';
import {
  Modal, Box, Typography, TextField, Button, Grid, IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { THEME_COLORS } from '../../Common/theme';

function VisitModal({ open, onClose, patient }) {
  const [loading, setLoading] = useState(false);
  const [visitData, setVisitData] = useState({
    reason: '', chief_complaint: '', history: '', examination: '',
    assessment: '', plan: '', vital_signs: {
      temperature: '', blood_pressure: '', heart_rate: '',
      respiratory_rate: '', weight: '', height: ''
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('vital_')) {
      const vitalName = name.replace('vital_', '');
      setVisitData(prev => ({
        ...prev,
        vital_signs: { ...prev.vital_signs, [vitalName]: value }
      }));
    } else {
      setVisitData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 내원 정보 저장 로직
      onClose();
      alert('내원 정보가 성공적으로 저장되었습니다.');
    } catch (error) {
      alert('내원 정보 저장에 실패했습니다.');
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
        width: 800,
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
            {patient?.display_name || '환자'} - 내원 정보 입력
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="내원 사유"
                name="reason"
                value={visitData.reason}
                onChange={handleInputChange}
                required
                size="small"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={onClose}>
              취소
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

export default VisitModal;
