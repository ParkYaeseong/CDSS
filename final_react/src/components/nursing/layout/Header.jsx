// final_react/src/components/nursing/layout/Header.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

function Header() {
  return (
    <Box sx={{ 
      textAlign: 'center', 
      mb: 3,
      p: 3,
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      borderRadius: 2
    }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
        🏥 간호일지 AI 자동완성 시스템
      </Typography>
      <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
        AI 기반 간호일지 작성 및 관리 시스템
      </Typography>
    </Box>
  );
}

export default Header;
