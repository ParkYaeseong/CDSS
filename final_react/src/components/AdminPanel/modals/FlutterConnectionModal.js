// src/components/AdminPanel/modals/FlutterConnectionModal.jsx
import React from 'react';
import { Modal, Box, Typography, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { THEME_COLORS } from '../../Common/theme';

function FlutterConnectionModal({ open, onClose, connectionInfo }) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        bgcolor: THEME_COLORS.surface,
        borderRadius: 2,
        boxShadow: 24,
        p: 0
      }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${THEME_COLORS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" fontWeight="bold" color={THEME_COLORS.primary}>
            🔗 Flutter 앱 연결 안내
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Typography variant="body2">
            Flutter 연결 정보가 표시됩니다.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              variant="contained"
              onClick={onClose}
              sx={{ bgcolor: THEME_COLORS.primary }}
            >
              ✅ 확인
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

export default FlutterConnectionModal;
