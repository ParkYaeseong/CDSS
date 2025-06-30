//src/components/dashboard/VitalChartComponent.jsx

import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import VitalChart from '../VitalChart';

const THEME_COLORS = {
  primary: '#007C80'
};

export default function VitalChartComponent({ patient }) {
  // 환자가 없으면 빈 상태 표시
  if (!patient) {
    return (
      <Card sx={{ mb: 1 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: THEME_COLORS.primary }}>
            바이탈 사인
          </Typography>
          <Typography variant="body2" color="text.secondary">
            환자를 선택해주세요.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // VitalChart 컴포넌트 렌더링
  return <VitalChart patient={patient} />;
}
