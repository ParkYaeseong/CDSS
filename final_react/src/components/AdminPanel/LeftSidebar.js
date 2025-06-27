// src/components/AdminPanel/LeftSidebar.jsx
import React from 'react';
import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import {
  Dashboard, Group, Person, VerifiedUser, Schedule, PersonAdd
} from '@mui/icons-material';
import { THEME_COLORS } from '../Common/theme';

const menuItems = [
  { id: 'dashboard', label: '통합 대시보드', icon: <Dashboard /> },
  { id: 'reception', label: '환자 접수', icon: <PersonAdd /> },
  { id: 'appointments', label: '예약 관리', icon: <Schedule /> },
  { id: 'patients', label: '환자 관리', icon: <Group /> },
  { id: 'flutter', label: '인증 코드 발급', icon: <Person /> },
];

function LeftSidebar({ selectedMenu, onMenuSelect }) {
  return (
    <Box sx={{ 
      width: 200, 
      height: '100vh', 
      bgcolor: THEME_COLORS.primary, 
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      borderRight: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
    }}>
      <Box sx={{ 
        p: 1.5, 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        bgcolor: THEME_COLORS.primary
      }}>
        <Typography variant="h6" fontWeight="bold" fontSize="1rem">
          🏥 원무과 매니저
        </Typography>
      </Box>
      
      <List sx={{ flexGrow: 1, p: 0, overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={selectedMenu === item.id}
            onClick={() => {
              console.log('메뉴 클릭:', item.id); // 디버깅용
              onMenuSelect(item.id);
            }}
            sx={{
              py: 1,
              px: 1.5,
              minHeight: 40,
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRight: `3px solid ${THEME_COLORS.secondary}`,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {/* 아이콘 렌더링 수정 */}
            <Box sx={{ 
              mr: 1.5, 
              fontSize: '1.2rem', 
              color: selectedMenu === item.id ? THEME_COLORS.secondary : 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '24px',
              minHeight: '24px'
            }}>
              {item.icon}
            </Box>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ fontSize: '0.875rem' }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* 하단 일정 부분은 동일 */}
      <Box sx={{ 
        p: 1.5, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        bgcolor: 'rgba(0,0,0,0.1)'
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.75rem', color: THEME_COLORS.secondary }}>
          📅 오늘 일정
        </Typography>
        <Box sx={{ 
          bgcolor: 'rgba(255,255,255,0.1)', 
          p: 1, 
          borderRadius: 1,
          fontSize: '0.7rem',
          border: `1px solid ${THEME_COLORS.secondary}20`
        }}>
          <Typography variant="caption" fontSize="0.7rem">
            2025년 6월 25일 (수)
          </Typography>
          <Typography variant="caption" display="block" fontSize="0.7rem">
            • 회진: 09:00 ✓
          </Typography>
          <Typography variant="caption" display="block" fontSize="0.7rem">
            • 컨퍼런스: 14:00
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default LeftSidebar;
