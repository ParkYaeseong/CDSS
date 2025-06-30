//src/components/dashboard/LeftSidebar.jsx

import React, { useState } from 'react';
import { Box, Typography, List, ListItemButton } from '@mui/material';
import {
  Dashboard, Person, Psychology, CalendarToday, LocalPharmacy,
  Search, Assignment, Science, Schedule
} from '@mui/icons-material';

const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6'
};

export default function LeftSidebar({ selectedMenu, onMenuSelect }) {
  const menuItems = [
    { 
      id: 'dashboard', 
      label: '의료진 대시보드', 
      icon: <Dashboard />, 
      description: '환자 현황 및 업무 요약' 
    },
    { 
      id: 'clinical-prediction', 
      label: '임상 예측 분석', 
      icon: <Psychology />, 
      description: 'AI 기반 임상 예측' 
    },
    { 
      id: 'calendar', 
      label: '환자 예약 캘린더', 
      icon: <CalendarToday />, 
      description: '진료 일정 관리' 
    },
    { 
      id: 'drug-interaction', 
      label: '약물 처방', 
      icon: <LocalPharmacy />, 
      description: '약물 상호작용 검사' 
    },
    { 
      id: 'paper-search', 
      label: '논문 AI 검색', 
      icon: <Search />, 
      description: '최신 의학 논문 검색' 
    },
    { 
      id: 'nursing', 
      label: '간호 기록', 
      icon: <Assignment />, 
      description: '간호 기록 조회' 
    },
    { 
      id: 'lab', 
      label: '검사 결과', 
      icon: <Science />, 
      description: '검사 결과 분석' 
    }
  ];

  return (
    <Box sx={{ 
      width: 240,
      flexShrink: 0,
      bgcolor: THEME_COLORS.primary, 
      color: 'white', 
      p: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
      overflow: 'hidden' // 스크롤 제거
    }}>
      {/* 진료과 정보 헤더 */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, flexShrink: 0 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          의료진 패널
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
          환자 진료 및 
          <br></br>의료 관리 시스템
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Schedule sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            진료시간: 09:00 - 18:00
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            당직: 김의사 과장 
            <br></br>(내선 1234)
          </Typography>
        </Box>
      </Box>

      {/* 메뉴 리스트 */}
      <List sx={{ 
        p: 0, 
        flexGrow: 1, 
        overflow: 'hidden', // 스크롤 제거
        display: 'flex',
        flexDirection: 'column'
      }}>
        {menuItems.map(menu => (
          <ListItemButton 
            key={menu.id} 
            selected={selectedMenu === menu.id} 
            onClick={() => onMenuSelect(menu.id)}
            sx={{
              borderRadius: 2,
              mb: 1,
              p: 1.5, // 패딩 조정
              flexShrink: 0, // 각 메뉴 항목 크기 고정
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                  // 기존의 borderRight 제거하거나 수정
                  // borderRight: `3px solid ${THEME_COLORS.secondary}`, // 이 부분을 제거하거나
                  borderRight: 'none', // 완전히 제거하려면 이렇게
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {menu.icon}
                <Typography fontWeight="600" fontSize="0.8rem"> {/* 폰트 크기 조정 */}
                  {menu.label}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, fontSize: '0.65rem' }}> {/* 폰트 크기 조정 */}
                {menu.description}
              </Typography>
            </Box>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
