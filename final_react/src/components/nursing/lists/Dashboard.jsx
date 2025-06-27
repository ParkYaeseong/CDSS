// final_react/src/components/nursing/lists/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, 
  CircularProgress, Chip
} from '@mui/material';
import { 
  TrendingUp, Assignment, Person, Schedule 
} from '@mui/icons-material';
import { nursingApiService } from '../../../services/nursingApi';

function Dashboard({ selectedPatient }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChartData();
  }, [selectedPatient]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      setChartData({
        totalLogs: 15,
        avgDaily: 2.5,
        mostCommonType: '경과 기록',
        activeDays: 6
      });
    } catch (error) {
      console.error('차트 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  const statCards = [
    {
      title: '총 간호일지',
      value: chartData?.totalLogs || 0,
      unit: '개',
      icon: <Assignment />,
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    {
      title: '일평균 작성',
      value: chartData?.avgDaily || 0,
      unit: '개',
      icon: <TrendingUp />,
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      title: '가장 많은 유형',
      value: chartData?.mostCommonType || '-',
      unit: '',
      icon: <Person />,
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      title: '활동 일수',
      value: chartData?.activeDays || 0,
      unit: '일',
      icon: <Schedule />,
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    }
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        📊 간호 현황 대시보드
      </Typography>
      
      {selectedPatient && (
        <Chip 
          label={`환자: ${selectedPatient}`}
          sx={{ mb: 3, bgcolor: '#3b82f6', color: 'white' }}
        />
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              bgcolor: stat.bgColor,
              border: `1px solid ${stat.color}20`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 25px ${stat.color}30`
              }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2.5 }}>
                <Box sx={{ 
                  mr: 2, 
                  fontSize: '2.5rem', 
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={stat.color}>
                    {stat.value}{stat.unit}
                  </Typography>
                  <Typography variant="body2" color="#6b7280" fontWeight="500">
                    {stat.title}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ border: '1px solid #e2e8f0' }}>
        <Box sx={{ 
          bgcolor: '#3b82f6', 
          color: 'white', 
          p: 2.5,
          borderRadius: '8px 8px 0 0'
        }}>
          <Typography variant="h6" fontWeight="600">
            📈 차트 영역
          </Typography>
        </Box>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            📈 차트 영역
          </Typography>
          <Typography variant="body1" color="text.secondary">
            차트 컴포넌트가 여기에 표시됩니다.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plotly.js나 Chart.js를 사용하여 구현할 수 있습니다.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;
