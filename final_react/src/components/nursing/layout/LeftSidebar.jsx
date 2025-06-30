// final_react/src/components/nursing/layout/LeftSidebar.jsx
import React from 'react';
import { Box, Typography, List, ListItemButton, ListItemText } from '@mui/material';
import {
  Dashboard as DashboardIcon, NoteAdd, List as ListIcon, People as PeopleIcon,
  Medication, Healing, School, CalendarToday, Science as ScienceIcon, Biotech, Input
} from '@mui/icons-material';

export default function LeftSidebar({ selectedMenu, onMenuSelect }) {
  const menuItems = [
    { id: 'dashboard', label: '간호 대시보드', icon: <DashboardIcon /> },
    { id: 'nursing-form', label: '간호일지 작성', icon: <NoteAdd /> },
    { id: 'nursing-list', label: '간호일지 목록', icon: <ListIcon /> },
    { id: 'nursing-patients', label: '간호 환자 관리', icon: <PeopleIcon /> },
    { id: 'clinical-data-input', label: '임상 데이터 입력', icon: <Input /> },
    { id: 'medication-management', label: '투약 관리', icon: <Medication /> },
    { id: 'wound-care', label: '상처 관리', icon: <Healing /> },
    { id: 'patient-education', label: '환자 교육', icon: <School /> },
    { id: 'calendar', label: '일정 관리', icon: <CalendarToday /> },
    { id: 'omics-analysis', label: '오믹스 분석', icon: <Biotech /> },
    { id: 'lab-management', label: '오믹스 결과 목록', icon: <ScienceIcon /> },
  ];

  return (
    <Box sx={{ 
      width: 200, 
      height: '100vh', 
      bgcolor: '#E0969F',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #e2e8f0'
    }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" fontWeight="bold" fontSize="1.1rem">
          🏥 간호사 패널
        </Typography>
      </Box>
      
      <List sx={{ flexGrow: 1, p: 0, overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={selectedMenu === item.id}
            onClick={() => onMenuSelect(item.id)}
            sx={{
              py: 1,
              px: 1.5,
              minHeight: 40,
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRight: '3px solid #C8797F'
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <Box sx={{ mr: 1.5, fontSize: '1rem' }}>{item.icon}</Box>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ fontSize: '0.875rem' }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.8rem', opacity: 0.8 }}>
          📅 오늘 일정
        </Typography>
        <Box sx={{ 
          bgcolor: 'rgba(255,255,255,0.1)', 
          p: 1, 
          borderRadius: 1,
          fontSize: '0.7rem'
        }}>
          <Typography variant="caption" fontSize="0.75rem" display="block">
            2025년 6월 24일 (화)
          </Typography>
          <Typography variant="caption" display="block" fontSize="0.7rem" sx={{ mt: 0.5 }}>
            • 회진: 09:00
          </Typography>
          <Typography variant="caption" display="block" fontSize="0.7rem">
            • 컨퍼런스: 14:00
          </Typography>
          <Typography variant="caption" display="block" fontSize="0.7rem">
            • 교육: 16:00
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
