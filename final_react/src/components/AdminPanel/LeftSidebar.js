//src/components/AdminPanel/LeftSidebar.jsx

import React from 'react';
import { Box, List, ListItemButton, Typography } from '@mui/material';
import {
  Dashboard, Group, Person, VerifiedUser, Schedule, PersonAdd
} from '@mui/icons-material';

const menuItems = [
  { id: 'reception', label: '환자 접수', icon: <PersonAdd />, description: '신규 환자 접수 및 등록' },
  { id: 'appointments', label: '예약 관리', icon: <Schedule />, description: '진료 예약 관리' },
  { id: 'patients', label: '환자 관리', icon: <Group />, description: '환자 정보 조회 및 관리' },
  { id: 'flutter', label: '인증 코드 발급', icon: <Person />, description: '모바일 앱 연동 코드' },
];

function LeftSidebar({ selectedMenu, onMenuSelect, themeColor, accentColor, borderColor }) {
  return (
    <Box sx={{ 
      width: 240, // 간호사 패널과 동일
      flexShrink: 0,
      bgcolor: themeColor || '#003d82', 
      color: 'white', 
      p: 2, // 간호사 패널과 동일한 padding
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
      minWidth: 240,
      maxWidth: 240,
      overflow: 'auto' // 간호사 패널과 동일하게 스크롤 허용
    }}>
      {/* 진료과 정보 헤더 - 간호사 패널 스타일 적용 */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          원무과
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
          환자 접수 및 관리 시스템
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Schedule sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            운영시간: 평일 08:00-18:00
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            당직: 이원무 주임 
            <br />
            (내선 1234)
          </Typography>
        </Box>
      </Box>

      {/* 메뉴 리스트 - 간호사 패널과 동일한 스타일 */}
      <List sx={{ p: 0 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.id}
            selected={selectedMenu === item.id}
            onClick={() => {
              console.log('메뉴 클릭:', item.id);
              onMenuSelect(item.id);
            }}
            sx={{
              borderRadius: 2,
              mb: 1,
              p: 2, // 간호사 패널과 동일한 padding
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.2)',
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
                <Box sx={{ color: selectedMenu === item.id ? '#ffffff' : 'rgba(255,255,255,0.8)' }}>
                  {item.icon}
                </Box>
                <Typography fontWeight="600" fontSize="0.9rem"> {/* 간호사 패널과 동일한 폰트 크기 */}
                  {item.label}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ 
                opacity: 0.8, 
                mt: 0.5 // 간호사 패널과 동일한 margin
              }}>
                {item.description}
              </Typography>
            </Box>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default LeftSidebar;
