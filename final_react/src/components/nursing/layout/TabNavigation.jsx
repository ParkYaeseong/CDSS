// final_react/src/components/nursing/layout/TabNavigation.jsx
import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';

function TabNavigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'form', label: '📝 간호일지 작성' },
    { id: 'list', label: '📋 간호일지 목록' },
    { id: 'patients', label: '👥 환자 관리' },
    { id: 'dashboard', label: '📊 통계 대시보드' }
  ];

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ 
      borderBottom: 1, 
      borderColor: 'divider',
      mb: 3,
      bgcolor: 'white',
      borderRadius: '8px 8px 0 0'
    }}>
      <Tabs 
        value={activeTab} 
        onChange={handleChange}
        sx={{
          '& .MuiTab-root': {
            fontWeight: 600,
            fontSize: '0.9rem',
            textTransform: 'none',
            minHeight: 48
          },
          '& .Mui-selected': {
            color: '#3b82f6'
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#3b82f6'
          }
        }}
      >
        {tabs.map(tab => (
          <Tab 
            key={tab.id}
            label={tab.label}
            value={tab.id}
          />
        ))}
      </Tabs>
    </Box>
  );
}

export default TabNavigation;
