// src/components/AdminPanel/DashboardContent.jsx
import React from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Chip, Grid, 
  FormControl, Select, MenuItem 
} from '@mui/material';
import { THEME_COLORS } from '../Common/theme';
import '../../styles/AdminPanel.css';


function DashboardContent({ stats }) {
  return (
    <Box sx={{ p: 2, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      {/* 상단 알림 배너 */}
      <Card sx={{ 
        mb: 3,
        background: `linear-gradient(135deg, ${THEME_COLORS.primary}15, ${THEME_COLORS.secondary}10)`,
        border: `1px solid ${THEME_COLORS.secondary}30`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label="NEW" color="secondary" size="small" />
            <Box>
              <Typography variant="h6" fontWeight="bold" color={THEME_COLORS.primary}>
                새로워진 원무과 병원 매니저!
              </Typography>
              <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                Django + Flutter 통합 환자 관리 시스템
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 통합 환자 통계 */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
        통합 환자 현황
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface,
            border: `1px solid ${THEME_COLORS.border}`,
            borderRadius: 2,
            '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s' }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color={THEME_COLORS.primary}>
                {stats.django_count + stats.flutter_count}
              </Typography>
              <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                전체 환자
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface,
            border: `1px solid ${THEME_COLORS.border}`,
            borderRadius: 2,
            '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s' }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color={THEME_COLORS.secondary}>
                {stats.django_count}
              </Typography>
              <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                Django 환자
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface,
            border: `1px solid ${THEME_COLORS.border}`,
            borderRadius: 2,
            '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s' }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color={THEME_COLORS.status.warning}>
                {stats.flutter_count}
              </Typography>
              <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                Flutter 환자
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface,
            border: `1px solid ${THEME_COLORS.border}`,
            borderRadius: 2,
            '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s' }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color={THEME_COLORS.status.success}>
                45
              </Typography>
              <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                오늘 접수
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 메인 컨텐츠 그리드 */}
      <Grid container spacing={2}>
        {/* 병원 진료 시간 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface,
            border: `1px solid ${THEME_COLORS.border}`,
            borderRadius: 2,
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" color={THEME_COLORS.primary}>
                  병원 진료 시간
                </Typography>
                <Button size="small" variant="outlined" sx={{ borderColor: THEME_COLORS.secondary }}>
                  전체 시간
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: `${THEME_COLORS.secondary}10` }}>
                  <Typography variant="body2" fontWeight="bold">내과</Typography>
                  <Typography variant="body2" color={THEME_COLORS.text.secondary}>오전 09:00 - 오후 06:00</Typography>
                  <Chip label="진료중" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: `${THEME_COLORS.secondary}10` }}>
                  <Typography variant="body2" fontWeight="bold">정형외과</Typography>
                  <Typography variant="body2" color={THEME_COLORS.text.secondary}>오전 10:00 - 오후 07:00</Typography>
                  <Chip label="진료중" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: `${THEME_COLORS.secondary}10` }}>
                  <Typography variant="body2" fontWeight="bold">피부과</Typography>
                  <Typography variant="body2" color={THEME_COLORS.text.secondary}>오전 09:00 - 오후 05:00</Typography>
                  <Chip label="진료종료" color="error" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 진료실별 모니터링 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface,
            border: `1px solid ${THEME_COLORS.border}`,
            borderRadius: 2,
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" color={THEME_COLORS.primary}>
                  진료실별 모니터링 현황
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select defaultValue="realtime" size="small">
                    <MenuItem value="realtime">실시간 모니터링</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: `${THEME_COLORS.primary}10` }}>
                  <Typography variant="body2" fontWeight="bold">1번</Typography>
                  <Typography variant="body2">홍길동</Typography>
                  <Typography variant="body2">김철수</Typography>
                  <Chip label="진료중" color="warning" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: `${THEME_COLORS.primary}10` }}>
                  <Typography variant="body2" fontWeight="bold">2번</Typography>
                  <Typography variant="body2">김의사</Typography>
                  <Typography variant="body2">이영희</Typography>
                  <Chip label="진료중" color="warning" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: `${THEME_COLORS.primary}10` }}>
                  <Typography variant="body2" fontWeight="bold">3번</Typography>
                  <Typography variant="body2">이의사</Typography>
                  <Typography variant="body2">-</Typography>
                  <Chip label="대기중" color="info" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 자주 찾는 질문 */}
        <Grid item xs={12}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface,
            border: `1px solid ${THEME_COLORS.border}`,
            borderRadius: 2
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
                자주 찾는 질문
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label="병원매니저" variant="filled" color="primary" />
                <Chip label="환자 관리" variant="outlined" />
                <Chip label="예약 관리" variant="outlined" />
                <Chip label="수납 관리" variant="outlined" />
                <Chip label="기타 문의" variant="outlined" />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1, '&:hover': { bgcolor: THEME_COLORS.surfaceHover } }}>
                  <Typography variant="body2" fontWeight="bold" color={THEME_COLORS.primary}>Q.</Typography>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>Django + Flutter 통합 환자 관리 방법이 궁금해요!</Typography>
                  <Chip label="긴급" color="error" size="small" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1, '&:hover': { bgcolor: THEME_COLORS.surfaceHover } }}>
                  <Typography variant="body2" fontWeight="bold" color={THEME_COLORS.primary}>Q.</Typography>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>Flutter 환자와 기존 환자 연결은 어떻게 하나요?</Typography>
                  <Chip label="일반" color="default" size="small" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1, '&:hover': { bgcolor: THEME_COLORS.surfaceHover } }}>
                  <Typography variant="body2" fontWeight="bold" color={THEME_COLORS.primary}>Q.</Typography>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>통합 환자 데이터를 CDSS 시스템에서 수정하고싶어요.</Typography>
                  <Chip label="일반" color="default" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardContent;
