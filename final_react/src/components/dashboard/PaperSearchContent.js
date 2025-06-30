//src/components/dashboard/PaperSearchContent.jsx

import React from 'react';
import { Box } from '@mui/material';
import PaperSearchCard from '../PaperSearchCard';

const THEME_COLORS = {
  background: '#f8fafc'
};

export default function PaperSearchContent() {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh', overflow: 'auto' }}>
      <PaperSearchCard />
    </Box>
  );
}
