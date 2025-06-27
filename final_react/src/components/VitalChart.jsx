// src/components/VitalChart.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Tabs, Tab, Chip
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, ReferenceLine
} from 'recharts';
import { getPatientVitalData } from '../data/patientData';

const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6',
  accent: '#5eead4',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  surface: '#ffffff',
  border: '#e2e8f0'
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ pt: 1, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 화려한 커스텀 툴팁
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        p: 2.5,
        border: `2px solid ${THEME_COLORS.primary}`,
        borderRadius: 3,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(15px)',
        fontSize: '0.85rem',
        minWidth: 180,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${THEME_COLORS.primary}, ${THEME_COLORS.secondary})`,
          borderRadius: '3px 3px 0 0'
        }
      }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ 
          mb: 1.5, 
          color: THEME_COLORS.primary,
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          📅 {label}
        </Typography>
        {payload.map((entry, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5, 
            mb: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: `${entry.color}10`
          }}>
            <Box sx={{ 
              width: 14, 
              height: 14, 
              borderRadius: '50%', 
              bgcolor: entry.color,
              boxShadow: `0 0 12px ${entry.color}60`,
              border: '2px solid white'
            }} />
            <Typography variant="caption" sx={{ 
              color: '#333', 
              fontWeight: 600,
              fontSize: '0.8rem',
              flex: 1
            }}>
              {entry.name}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: entry.color, 
              fontWeight: 'bold',
              fontSize: '0.85rem',
              textShadow: `0 0 8px ${entry.color}40`
            }}>
              {entry.value}
              {entry.name === '체온' ? '°C' : 
               entry.name === '혈압' ? 'mmHg' : 
               entry.name === '맥박' ? 'bpm' : 
               entry.name === '산소포화도' ? '%' : ''}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

// 단순한 바이탈 사인 요약 카드
const VitalSummaryCard = ({ title, value, unit, status, color }) => (
  <Box sx={{ 
    p: 2,
    bgcolor: '#ffffff',
    border: `1px solid #e2e8f0`,
    borderRadius: 1,
    textAlign: 'center',
    minHeight: 80,
    minWidth: 120,
    maxWidth: 140,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  }}>
    <Typography variant="h6" fontWeight="bold" sx={{ 
      color: color, 
      mb: 0.5,
      fontSize: '1.1rem'
    }}>
      {value}{unit}
    </Typography>
    <Typography variant="caption" color="text.secondary" fontWeight="medium" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Chip 
      label={status} 
      size="small" 
      sx={{ 
        height: 18,
        fontSize: '0.65rem',
        bgcolor: status === '정상' ? '#dcfce7' : status === '높음' ? '#fef3c7' : '#fecaca',
        color: status === '정상' ? '#166534' : status === '높음' ? '#92400e' : '#dc2626'
      }} 
    />
  </Box>
);

export default function VitalChart({ patient }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [currentPatient, setCurrentPatient] = useState(null);
  
  // 환자 변경 감지 및 페이드인 애니메이션 처리
   useEffect(() => {
    if (patient) {
      if (patient !== currentPatient) {
        setIsVisible(false);
        setCurrentPatient(patient);
        
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 150);
        
        return () => clearTimeout(timer);
      }
    }
  }, [patient, currentPatient]);

  // ✅ 초기 로딩 시 isVisible 설정
  useEffect(() => {
    if (patient && !currentPatient) {
      setCurrentPatient(patient);
      setIsVisible(true);
    }
  }, [patient, currentPatient]);

  if (!patient) {
    return (
      <Card sx={{ 
        mb: 1,
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CardContent sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ 
            color: THEME_COLORS.primary,
            fontSize: '0.9rem',
            borderBottom: `2px solid ${THEME_COLORS.secondary}`,
            pb: 0.5,
            mb: 1
          }}>
            📊 바이탈 사인 모니터링
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              환자를 선택해주세요.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  const vitalData = getPatientVitalData(patient.openemr_id);
  
  // ✅ 디버깅 로그 추가
  console.log('환자 정보:', patient);
  console.log('환자 ID:', patient?.openemr_id);
  console.log('바이탈 데이터:', vitalData);
  console.log('isVisible 상태:', isVisible);
  
  // ✅ 데이터 검증 강화
  if (!vitalData || !Array.isArray(vitalData) || vitalData.length === 0) {
    return (
      <Card sx={{ 
        mb: 1,
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CardContent sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ 
            color: THEME_COLORS.primary,
            fontSize: '0.9rem',
            borderBottom: `2px solid ${THEME_COLORS.secondary}`,
            pb: 0.5,
            mb: 1
          }}>
            📊 바이탈 사인 모니터링
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              해당 환자({patient.name}, ID: {patient.openemr_id})의 바이탈 사인 데이터가 없습니다.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const latestData = vitalData[vitalData.length - 1];
  
  const getVitalStatus = (value, type) => {
    switch (type) {
      case '혈압':
        if (value < 120) return '정상';
        if (value < 140) return '주의';
        return '높음';
      case '맥박':
        if (value >= 60 && value <= 80) return '정상';
        if (value < 60) return '낮음';
        return '높음';
      case '체온':
        if (value >= 36.0 && value <= 37.0) return '정상';
        if (value < 36.0) return '낮음';
        return '높음';
      case '산소포화도':
        if (value >= 95) return '정상';
        if (value >= 90) return '주의';
        return '낮음';
      default:
        return '정상';
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Card sx={{ 
      mb: 1,
      bgcolor: THEME_COLORS.surface,
      border: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      height: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
    //   opacity: isVisible ? 1 : 0,
    //   transition: 'opacity 1s ease-in-out'
    }}>
      <CardContent sx={{ 
        p: 1.5, 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        '&:last-child': { pb: 1.5 }
      }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ 
          mb: 1.5, 
          fontSize: '0.9rem',
          color: THEME_COLORS.primary,
          borderBottom: `2px solid ${THEME_COLORS.secondary}`,
          pb: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0
        }}>
          📊 바이탈 사인 모니터링
          <Chip 
            label={patient.name} 
            size="small" 
            sx={{ 
              bgcolor: `${THEME_COLORS.primary}20`, 
              color: THEME_COLORS.primary,
              fontWeight: 'bold',
              fontSize: '0.7rem',
              height: 20
            }} 
          />
        </Typography>

        {/* 가운데 정렬 및 간격 조절된 바이탈 사인 요약 카드들 */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
          flexShrink: 0
        }}>
          <VitalSummaryCard
            title="혈압"
            value={latestData.혈압}
            unit="mmHg"
            status={getVitalStatus(latestData.혈압, '혈압')}
            color={THEME_COLORS.error}
          />
          <VitalSummaryCard
            title="맥박"
            value={latestData.맥박}
            unit="bpm"
            status={getVitalStatus(latestData.맥박, '맥박')}
            color={THEME_COLORS.primary}
          />
          <VitalSummaryCard
            title="체온"
            value={latestData.체온}
            unit="°C"
            status={getVitalStatus(latestData.체온, '체온')}
            color={THEME_COLORS.warning}
          />
          <VitalSummaryCard
            title="산소포화도"
            value={latestData.산소포화도}
            unit="%"
            status={getVitalStatus(latestData.산소포화도, '산소포화도')}
            color={THEME_COLORS.info}
          />
        </Box>

        {/* 차트 영역 - 남은 공간을 모두 사용 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{
                minHeight: 36,
                '& .MuiTab-root': {
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  minHeight: 36,
                  py: 0.5
                },
                '& .Mui-selected': {
                  color: THEME_COLORS.primary
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: THEME_COLORS.primary,
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab label="트렌드 분석" />
              <Tab label="심혈관 지표" />
              <Tab label="혈액 검사" />
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, pt: 1 }}>
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 2, 
                height: '100%',
                // opacity: isVisible ? 1 : 0,
                // transition: 'opacity 1.5s ease-in-out 0.3s'
              }}>
                {/* 혈압 그래프 - ✅ Y축 범위 좁힘 */}
                <Box sx={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: 2, 
                  p: 1.5,
                  bgcolor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                    mb: 1, 
                    color: '#ff6b6b',
                    textAlign: 'center',
                    flexShrink: 0
                  }}>
                    혈압 (mmHg)
                  </Typography>
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                          <linearGradient id="bloodPressureAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10, fill: '#666' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={[115, 130]} // ✅ 범위를 115-130으로 좁힘 (기존 100-150)
                          tick={{ fontSize: 10, fill: '#666' }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <Box sx={{
                                  bgcolor: 'white',
                                  p: 1.5,
                                  border: '1px solid #ff6b6b',
                                  borderRadius: 1,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}>
                                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#ff6b6b' }}>
                                    {label}: {payload[0].value}mmHg
                                  </Typography>
                                </Box>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine 
                          y={120} 
                          stroke="#ff6b6b" 
                          strokeDasharray="3 3" 
                          strokeOpacity={0.5}
                        />
                        <Area
                          type="cardinal"
                          dataKey="혈압"
                          stroke="transparent"
                          fill="url(#bloodPressureAreaGrad)"
                          isAnimationActive={isVisible}
                          animationDuration={1800}
                          animationEasing="ease-out"
                          tension={1.5}
                        />
                        <Line 
                          type="cardinal"
                          dataKey="혈압" 
                          stroke="#ff6b6b"
                          strokeWidth={4}
                          dot={{ 
                            fill: "#ff6b6b", 
                            strokeWidth: 3, 
                            stroke: "#fff",
                            r: 5
                          }}
                          activeDot={{ 
                            r: 8, 
                            stroke: "#ff6b6b", 
                            strokeWidth: 3,
                            fill: "#fff"
                          }}
                          isAnimationActive={isVisible}
                          animationDuration={1800}
                          animationEasing="ease-out"
                          tension={1.5}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>

                {/* 맥박 그래프 - ✅ Y축 범위 좁힘 */}
                <Box sx={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: 2, 
                  p: 1.5,
                  bgcolor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                    mb: 1, 
                    color: '#4ecdc4',
                    textAlign: 'center',
                    flexShrink: 0
                  }}>
                    맥박 (bpm)
                  </Typography>
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                          <linearGradient id="pulseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10, fill: '#666' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={[65, 85]} // ✅ 범위를 65-85로 좁힘 (기존 60-95)
                          tick={{ fontSize: 10, fill: '#666' }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <Box sx={{
                                  bgcolor: 'white',
                                  p: 1.5,
                                  border: '1px solid #4ecdc4',
                                  borderRadius: 1,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}>
                                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#4ecdc4' }}>
                                    {label}: {payload[0].value}bpm
                                  </Typography>
                                </Box>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine 
                          y={80} 
                          stroke="#4ecdc4" 
                          strokeDasharray="3 3" 
                          strokeOpacity={0.5}
                        />
                        <Area
                          type="cardinal"
                          dataKey="맥박"
                          stroke="transparent"
                          fill="url(#pulseAreaGrad)"
                          isAnimationActive={isVisible}
                          animationDuration={1800}
                          animationEasing="ease-out"
                          animationBegin={200}
                          tension={1.5}
                        />
                        <Line 
                          type="cardinal"
                          dataKey="맥박" 
                          stroke="#4ecdc4"
                          strokeWidth={4}
                          dot={{ 
                            fill: "#4ecdc4", 
                            strokeWidth: 3, 
                            stroke: "#fff",
                            r: 5
                          }}
                          activeDot={{ 
                            r: 8, 
                            stroke: "#4ecdc4", 
                            strokeWidth: 3,
                            fill: "#fff"
                          }}
                          isAnimationActive={isVisible}
                          animationDuration={1800}
                          animationEasing="ease-out"
                          animationBegin={200}
                          tension={1.5}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>

                {/* 체온 그래프 - ✅ Y축 범위 좁힘 */}
                <Box sx={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: 2, 
                  p: 1.5,
                  bgcolor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                    mb: 1, 
                    color: '#ffa726',
                    textAlign: 'center',
                    flexShrink: 0
                  }}>
                    체온 (°C)
                  </Typography>
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                          <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffa726" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ffa726" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10, fill: '#666' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={[36.1, 37.1]} // ✅ 범위를 36.1-37.1로 좁힘 (기존 36.0-37.5)
                          tick={{ fontSize: 10, fill: '#666' }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <Box sx={{
                                  bgcolor: 'white',
                                  p: 1.5,
                                  border: '1px solid #ffa726',
                                  borderRadius: 1,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}>
                                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#ffa726' }}>
                                    {label}: {payload[0].value}°C
                                  </Typography>
                                </Box>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine 
                          y={37.0} 
                          stroke="#ffa726" 
                          strokeDasharray="3 3" 
                          strokeOpacity={0.5}
                        />
                        <Area
                          type="cardinal"
                          dataKey="체온"
                          stroke="transparent"
                          fill="url(#tempAreaGrad)"
                          isAnimationActive={isVisible}
                          animationDuration={1800}
                          animationEasing="ease-out"
                          animationBegin={400}
                          tension={1.5}
                        />
                        <Line 
                          type="cardinal"
                          dataKey="체온" 
                          stroke="#ffa726"
                          strokeWidth={4}
                          dot={{ 
                            fill: "#ffa726", 
                            strokeWidth: 3, 
                            stroke: "#fff",
                            r: 5
                          }}
                          activeDot={{ 
                            r: 8, 
                            stroke: "#ffa726", 
                            strokeWidth: 3,
                            fill: "#fff"
                          }}
                          isAnimationActive={isVisible}
                          animationDuration={1800}
                          animationEasing="ease-out"
                          animationBegin={400}
                          tension={1.5}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>

                {/* 산소포화도 그래프 - ✅ Y축 범위 좁힘 */}
                <Box sx={{ 
                  border: '1px solid #e8e8e8', 
                  borderRadius: 2, 
                  p: 1.5,
                  bgcolor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                    mb: 1, 
                    color: '#42a5f5',
                    textAlign: 'center',
                    flexShrink: 0
                  }}>
                    산소포화도 (%)
                  </Typography>
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                          <linearGradient id="oxygenAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#42a5f5" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#42a5f5" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10, fill: '#666' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={[94, 100]} // ✅ 범위를 94-100으로 좁힘 (기존 90-100)
                          tick={{ fontSize: 10, fill: '#666' }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <Box sx={{
                                  bgcolor: 'white',
                                  p: 1.5,
                                  border: '1px solid #42a5f5',
                                  borderRadius: 1,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}>
                                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#42a5f5' }}>
                                    {label}: {payload[0].value}%
                                  </Typography>
                                </Box>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine 
                          y={95} 
                          stroke="#42a5f5" 
                          strokeDasharray="3 3" 
                          strokeOpacity={0.5}
                        />
                        <Area
                          type="cardinal"
                          dataKey="산소포화도"
                          stroke="transparent"
                          fill="url(#oxygenAreaGrad)"
                          isAnimationActive={isVisible}
                          animationDuration={1800}
                          animationEasing="ease-out"
                          animationBegin={600}
                          tension={1.5}
                        />
                        <Line 
                          type="cardinal"
                          dataKey="산소포화도" 
                          stroke="#42a5f5"
                          strokeWidth={4}
                          dot={{ 
                            fill: "#42a5f5", 
                            strokeWidth: 3, 
                            stroke: "#fff",
                            r: 5
                          }}
                          activeDot={{ 
                            r: 8, 
                            stroke: "#42a5f5", 
                            strokeWidth: 3,
                            fill: "#fff"
                          }}
                          isAnimationActive={isVisible}
                          animationDuration={1800}
                          animationEasing="ease-out"
                          animationBegin={600}
                          tension={1.5}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              </Box>
            </TabPanel>

            {/* 심혈관 지표 탭 */}
            <TabPanel value={activeTab} index={1}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vitalData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="areaBloodPressure" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="areaPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="areaOxygen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#42a5f5" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#42a5f5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#666' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#666' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="cardinal" 
                    dataKey="혈압" 
                    stackId="1"
                    stroke="#ff6b6b" 
                    fill="url(#areaBloodPressure)"
                    strokeWidth={2}
                    isAnimationActive={isVisible}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    tension={0.8}
                  />
                  <Area 
                    type="cardinal" 
                    dataKey="맥박" 
                    stackId="2"
                    stroke="#4ecdc4" 
                    fill="url(#areaPulse)"
                    strokeWidth={2}
                    isAnimationActive={isVisible}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    animationBegin={200}
                    tension={0.8}
                  />
                  <Area 
                    type="cardinal" 
                    dataKey="산소포화도" 
                    stackId="3"
                    stroke="#42a5f5" 
                    fill="url(#areaOxygen)"
                    strokeWidth={2}
                    isAnimationActive={isVisible}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    animationBegin={400}
                    tension={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabPanel>

            {/* 혈액 검사 탭 */}
            <TabPanel value={activeTab} index={2}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vitalData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="barWBC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="barRBC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#666' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#666' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="WBC" 
                    fill="url(#barWBC)"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={isVisible}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Bar 
                    dataKey="RBC" 
                    fill="url(#barRBC)"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={isVisible}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={200}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabPanel>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
