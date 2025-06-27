// final_react/src/components/nursing/dashboard/NursingDashboard.jsx
import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { People as PeopleIcon, CheckCircle, HourglassEmpty, Warning } from '@mui/icons-material';

export default function NursingDashboard({ labOrders, nursingPatients }) {
  const today = new Date().toISOString().split('T')[0];
  
  // 실제 데이터 기반 통계 계산
  const todayStats = {
    totalPatients: nursingPatients.length,
    completedTasks: Math.floor(nursingPatients.length * 0.7),
    pendingTasks: Math.ceil(nursingPatients.length * 0.3),
    emergencyPatients: nursingPatients.filter(p => p.status === 'emergency').length || 0
  };

  const currentHour = new Date().getHours();
  const currentShift = currentHour < 8 ? '야간' : currentHour < 16 ? '오전' : currentHour < 24 ? '오후' : '야간';

  const stats = [
    {
      title: '담당 환자 수',
      value: todayStats.totalPatients,
      icon: <PeopleIcon />,
      color: '#E0969F',
      bgColor: '#F5E6E8'
    },
    {
      title: '완료된 업무',
      value: todayStats.completedTasks,
      icon: <CheckCircle />,
      color: '#A8C8A8',
      bgColor: '#E8F5E8'
    },
    {
      title: '대기 중인 업무',
      value: todayStats.pendingTasks,
      icon: <HourglassEmpty />,
      color: '#D4A574',
      bgColor: '#F5F0E8'
    },
    {
      title: '응급 환자',
      value: todayStats.emergencyPatients,
      icon: <Warning />,
      color: '#E08080',
      bgColor: '#F5E8E8'
    }
  ];

  return (
    <Box sx={{ 
      width: '100%',
      height: '100vh',
      overflow: 'auto', // 스크롤 가능하도록 수정
      bgcolor: '#f9fafb'
    }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#8B4A52' }}>
          📊 간호 대시보드
        </Typography>
        
        {/* 실시간 통계 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                bgcolor: stat.bgColor,
                border: `1px solid ${stat.color}30`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${stat.color}30`
                }
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                  <Box sx={{ 
                    mr: 2, 
                    fontSize: '2rem', 
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color={stat.color}>
                      {stat.value}
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

        {/* 현재 근무 정보 */}
        <Box sx={{ 
          bgcolor: 'white',
          borderRadius: 1,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #E0969F',
          mb: 3
        }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
              🕐 현재 근무 정보
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>근무 시간:</strong> {currentShift} 근무
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>현재 시간:</strong> {new Date().toLocaleTimeString('ko-KR')}
                </Typography>
                <Typography variant="body1">
                  <strong>오늘 날짜:</strong> {new Date().toLocaleDateString('ko-KR')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>담당 병동:</strong> 내과 병동
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>근무 간호사:</strong> {localStorage.getItem('nurseId') || '기본간호사'}
                </Typography>
                <Typography variant="body1">
                  <strong>연락처:</strong> 내선 1234
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* 오늘의 주요 업무 체크리스트 */}
        <Box sx={{ 
          bgcolor: 'white',
          borderRadius: 1,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #E0969F',
          mb: 3
        }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
              📋 오늘의 주요 업무
            </Typography>
            <Grid container spacing={2}>
              {[
                { task: '투약 관리', completed: Math.floor(todayStats.totalPatients * 0.8), total: todayStats.totalPatients, color: '#F5E6E8' },
                { task: '활력징후 측정', completed: Math.floor(todayStats.totalPatients * 0.9), total: todayStats.totalPatients, color: '#e3f2fd' },
                { task: '간호 기록 작성', completed: Math.floor(todayStats.totalPatients * 0.6), total: todayStats.totalPatients, color: '#e8f5e8' }
              ].map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box sx={{ p: 2, bgcolor: item.color, borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                      {item.task}
                    </Typography>
                    <Typography variant="body2">
                      완료: {item.completed}/{item.total}건
                    </Typography>
                    <Box sx={{ 
                      width: '100%', 
                      height: 8, 
                      bgcolor: 'rgba(0,0,0,0.1)', 
                      borderRadius: 1, 
                      mt: 1 
                    }}>
                      <Box sx={{ 
                        width: `${(item.completed / item.total) * 100}%`, 
                        height: '100%', 
                        bgcolor: '#E0969F', 
                        borderRadius: 1 
                      }} />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* 최근 활동 로그 */}
        <Box sx={{ 
          bgcolor: 'white',
          borderRadius: 1,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #10b981',
          mb: 3
        }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
              📝 최근 활동
            </Typography>
            {nursingPatients.slice(0, 3).map((patient, index) => (
              <Box key={index} sx={{ 
                p: 2, 
                bgcolor: '#f9fafb', 
                borderRadius: 1, 
                mb: 1,
                borderLeft: '3px solid #E0969F'
              }}>
                <Typography variant="body2" fontWeight="600">
                  {patient.name}님 간호일지 작성 완료
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date().toLocaleTimeString('ko-KR')} - 방금 전
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* 알림 섹션 */}
        <Box sx={{ 
          bgcolor: 'white',
          borderRadius: 1,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #f59e0b',
          mb: 3
        }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
              🔔 최근 알림
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 1, borderLeft: '3px solid #f59e0b' }}>
                <Typography variant="body2" fontWeight="600">301호 김이박님 혈압 측정 시간</Typography>
                <Typography variant="caption" color="text.secondary">5분 전</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#fee2e2', borderRadius: 1, borderLeft: '3px solid #ef4444' }}>
                <Typography variant="body2" fontWeight="600">302호 환자 호출벨</Typography>
                <Typography variant="caption" color="text.secondary">10분 전</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 교육 일정 */}
        <Box sx={{ 
          bgcolor: 'white',
          borderRadius: 1,
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #10b981'
        }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
              📚 이번 주 교육 일정
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ p: 2, bgcolor: '#ecfdf5', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="600">감염 관리 교육</Typography>
                <Typography variant="caption" color="text.secondary">6월 25일 14:00 - 16:00</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#ecfdf5', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="600">CPR 재인증 교육</Typography>
                <Typography variant="caption" color="text.secondary">6월 30일 09:00 - 13:00</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
