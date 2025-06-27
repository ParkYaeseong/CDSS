// src/components/AdminPanel/TopHeader.jsx
import React from 'react';
import { Box, Typography, IconButton, Avatar, Badge } from '@mui/material';
import { Notifications, Settings } from '@mui/icons-material';
import { THEME_COLORS } from '../Common/theme';

function TopHeader({ user }) {
  return (
    <Box sx={{ 
      height: 60, 
      bgcolor: THEME_COLORS.background,
      borderBottom: `1px solid ${THEME_COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      px: 2,
      gap: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1, color: THEME_COLORS.text.primary }}>
        원무과
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <IconButton sx={{ color: THEME_COLORS.text.secondary }}>
          <Badge badgeContent={3} color="error">
            <Notifications />
          </Badge>
        </IconButton>
        <IconButton sx={{ color: THEME_COLORS.text.secondary }}>
          <Settings />
        </IconButton>
        <Avatar sx={{ 
          bgcolor: THEME_COLORS.primary, 
          width: 32, 
          height: 32,
          border: `2px solid ${THEME_COLORS.secondary}`
        }}>
          {user?.username?.[0] || 'A'}
        </Avatar>
        <Typography variant="body2" color={THEME_COLORS.text.secondary}>
          {user?.username || '관리자'}님
        </Typography>
      </Box>
    </Box>
  );
}

export default TopHeader;
