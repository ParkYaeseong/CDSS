// src/components/PatientCalendar.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, IconButton, 
  Button, Chip, Avatar, Dialog, DialogTitle, DialogContent,
  List, ListItem, ListItemText, Divider, Grid
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, Today, Event,
  Person, AccessTime, Close, ViewWeek, ViewModule
} from '@mui/icons-material';
import { appointmentService } from '../services/appointment.service'; // 추가

// 색상 테마 (기존과 동일)
const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6',
  accent: '#5eead4',
  background: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    light: '#94a3b8'
  },
  calendar: {
    today: '#1976d2',
    selected: '#007C80',
    event: '#60a5fa',
    weekend: '#fafafa',
    eventColors: ['#4285f4', '#34a853', '#ea4335', '#fbbc04', '#9c27b0', '#ff9800']
  }
};

export default function PatientCalendar({ onDateChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [viewMode, setViewMode] = useState('month');
  const [loading, setLoading] = useState(false);

  // 예약 데이터 가져오기
  useEffect(() => {
    fetchAppointments();
  }, []);

  // 예약 업데이트 이벤트 리스너
  useEffect(() => {
    const handleAppointmentUpdate = () => {
      fetchAppointments();
    };

    // 커스텀 이벤트 리스너 등록
    window.addEventListener('appointmentUpdated', handleAppointmentUpdate);

    return () => {
      window.removeEventListener('appointmentUpdated', handleAppointmentUpdate);
    };
  }, []);

  // 실제 예약 데이터 가져오기
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointments();
      if (response.success) {
        // 예약 데이터를 달력에 맞는 형태로 변환
        const formattedAppointments = response.appointments.map(apt => ({
          id: apt.id,
          patient_name: apt.patient_name,
          doctor_name: apt.doctor_name,
          appointment_datetime: apt.appointment_datetime,
          duration: apt.duration || 30,
          appointment_type: apt.appointment_type,
          status: apt.status,
          reason: apt.reason,
          chief_complaint: apt.chief_complaint,
          department: apt.department,
          notes: apt.notes
        }));
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('예약 목록 조회 실패:', error);
      // 에러 시 빈 배열로 설정
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // 월 이동
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // 주간 이동
  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  // 네비게이션 핸들러
  const handleNavigation = (direction) => {
    if (viewMode === 'week') {
      navigateWeek(direction);
    } else {
      navigateMonth(direction);
    }
  };

  // 오늘로 이동
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // 뷰 모드 변경 핸들러
  const handleViewChange = (newView) => {
    setViewMode(newView);
  };

  // 월간 달력 그리드 생성
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      days.push(weekDays);
    }

    return days;
  };

  // 주간 달력 그리드 생성
  const generateWeekGrid = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }
    
    return [weekDays];
  };

  // 날짜별 예약 가져오기 (수정됨)
  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => {
      if (!apt.appointment_datetime) return false;
      const aptDateStr = new Date(apt.appointment_datetime).toISOString().split('T')[0];
      return aptDateStr === dateStr;
    });
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dayEvents = getAppointmentsForDate(date);
    setSelectedDayEvents(dayEvents);
    if (dayEvents.length > 0) {
      setShowEventDialog(true);
    }
    onDateChange && onDateChange(date);
  };

  // 날짜가 오늘인지 확인
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 날짜가 선택된 날짜인지 확인
  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // 현재 월의 날짜인지 확인
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // 주말인지 확인
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // 뷰 모드에 따른 그리드 생성
  const calendarGrid = viewMode === 'week' ? generateWeekGrid() : generateCalendarGrid();
  
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // 주간 보기일 때 날짜 범위 표시
  const getDateRangeText = () => {
    if (viewMode === 'week') {
      const weekGrid = generateWeekGrid();
      const firstDay = weekGrid[0][0];
      const lastDay = weekGrid[0][6];
      
      if (firstDay.getMonth() === lastDay.getMonth()) {
        return `${currentDate.getFullYear()}년 ${monthNames[firstDay.getMonth()]} ${firstDay.getDate()}일 - ${lastDay.getDate()}일`;
      } else {
        return `${currentDate.getFullYear()}년 ${monthNames[firstDay.getMonth()]} ${firstDay.getDate()}일 - ${monthNames[lastDay.getMonth()]} ${lastDay.getDate()}일`;
      }
    } else {
      return `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`;
    }
  };

  // 상태별 색상 가져오기
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#4caf50';
      case 'cancelled': return '#f44336';
      case 'completed': return '#2196f3';
      case 'in_progress': return '#9c27b0';
      default: return '#607d8b';
    }
  };

  // 상태 텍스트 가져오기
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'confirmed': return '확정';
      case 'cancelled': return '취소';
      case 'completed': return '완료';
      case 'in_progress': return '진료중';
      default: return status;
    }
  };

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: THEME_COLORS.background,
      overflow: 'hidden'
    }}>
      {/* 상단 툴바 */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${THEME_COLORS.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: THEME_COLORS.background,
        flexShrink: 0
      }}>
        {/* 좌측 네비게이션 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Today />}
            onClick={goToToday}
            sx={{
              color: THEME_COLORS.text.primary,
              borderColor: THEME_COLORS.border,
              '&:hover': { 
                borderColor: THEME_COLORS.primary,
                bgcolor: `${THEME_COLORS.primary}05`
              }
            }}
          >
            오늘
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => handleNavigation(-1)}
              sx={{ 
                color: THEME_COLORS.text.secondary,
                '&:hover': { bgcolor: THEME_COLORS.surface }
              }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton 
              onClick={() => handleNavigation(1)}
              sx={{ 
                color: THEME_COLORS.text.secondary,
                '&:hover': { bgcolor: THEME_COLORS.surface }
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>
          
          <Typography variant="h5" fontWeight="400" color={THEME_COLORS.text.primary}>
            {getDateRangeText()}
          </Typography>
        </Box>

        {/* 우측 뷰 모드 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'month' ? 'contained' : 'outlined'}
            startIcon={<ViewModule />}
            onClick={() => handleViewChange('month')}
            size="small"
            sx={{
              bgcolor: viewMode === 'month' ? THEME_COLORS.primary : 'transparent',
              borderColor: THEME_COLORS.border,
              color: viewMode === 'month' ? 'white' : THEME_COLORS.text.primary,
              '&:hover': {
                bgcolor: viewMode === 'month' ? THEME_COLORS.secondary : `${THEME_COLORS.primary}05`
              }
            }}
          >
            월
          </Button>
          <Button
            variant={viewMode === 'week' ? 'contained' : 'outlined'}
            startIcon={<ViewWeek />}
            onClick={() => handleViewChange('week')}
            size="small"
            sx={{
              bgcolor: viewMode === 'week' ? THEME_COLORS.primary : 'transparent',
              borderColor: THEME_COLORS.border,
              color: viewMode === 'week' ? 'white' : THEME_COLORS.text.primary,
              '&:hover': {
                bgcolor: viewMode === 'week' ? THEME_COLORS.secondary : `${THEME_COLORS.primary}05`
              }
            }}
          >
            주
          </Button>
        </Box>
      </Box>

      {/* 달력 영역 */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 요일 헤더 */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: `1px solid ${THEME_COLORS.border}`,
          bgcolor: THEME_COLORS.surface,
          flexShrink: 0
        }}>
          {weekDays.map((day, index) => (
            <Box
              key={day}
              sx={{
                p: 1.5,
                textAlign: 'center',
                borderRight: index < 6 ? `1px solid ${THEME_COLORS.border}` : 'none',
                color: index === 0 ? '#d32f2f' : THEME_COLORS.text.secondary,
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              {day}
            </Box>
          ))}
        </Box>

        {/* 달력 그리드 */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {calendarGrid.map((week, weekIndex) => (
            <Box
              key={weekIndex}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                flexGrow: viewMode === 'week' ? 1 : 'initial',
                minHeight: viewMode === 'week' ? 400 : 120,
                borderBottom: weekIndex < calendarGrid.length - 1 ? `1px solid ${THEME_COLORS.border}` : 'none'
              }}
            >
              {week.map((date, dayIndex) => {
                const dayAppointments = getAppointmentsForDate(date);
                const isCurrentMonthDate = isCurrentMonth(date);
                const isTodayDate = isToday(date);
                const isSelectedDate = isSelected(date);
                const isWeekendDate = isWeekend(date);

                return (
                  <Box
                    key={dayIndex}
                    onClick={() => handleDateClick(date)}
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      borderRight: dayIndex < 6 ? `1px solid ${THEME_COLORS.border}` : 'none',
                      bgcolor: isSelectedDate ? `${THEME_COLORS.calendar.selected}08` :
                               isWeekendDate ? THEME_COLORS.calendar.weekend :
                               THEME_COLORS.background,
                      '&:hover': {
                        bgcolor: isSelectedDate ? `${THEME_COLORS.calendar.selected}15` : 
                                 THEME_COLORS.surface
                      },
                      transition: 'background-color 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      minHeight: viewMode === 'week' ? 400 : 120,
                      opacity: viewMode === 'month' && !isCurrentMonthDate ? 0.4 : 1
                    }}
                  >
                    {/* 날짜 숫자 */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 0.5,
                      height: 32
                    }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isTodayDate ? 600 : 400,
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          bgcolor: isTodayDate ? THEME_COLORS.calendar.today : 'transparent',
                          color: isTodayDate ? 'white' : 
                                 !isCurrentMonthDate ? THEME_COLORS.text.light :
                                 dayIndex === 0 ? '#d32f2f' :
                                 THEME_COLORS.text.primary,
                          fontSize: '0.875rem'
                        }}
                      >
                        {date.getDate()}
                      </Typography>
                      {dayAppointments.length > 0 && (
                        <Chip
                          label={dayAppointments.length}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.7rem',
                            bgcolor: THEME_COLORS.primary,
                            color: 'white',
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      )}
                    </Box>

                    {/* 예약 표시 */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 0.25,
                      flexGrow: 1,
                      overflow: 'hidden'
                    }}>
                      {dayAppointments.slice(0, viewMode === 'week' ? 8 : 3).map((apt, index) => (
                        <Box
                          key={apt.id}
                          sx={{
                            bgcolor: getStatusColor(apt.status),
                            color: 'white',
                            px: 0.75,
                            py: viewMode === 'week' ? 0.5 : 0.25,
                            borderRadius: 0.5,
                            fontSize: viewMode === 'week' ? '0.8rem' : '0.75rem',
                            overflow: 'hidden',
                            lineHeight: 1.2,
                            minHeight: viewMode === 'week' ? 'auto' : 18, // auto로 변경
                            maxHeight: viewMode === 'week' ? '120px' : '60px', // 최대 높이 제한
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.9,
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayEvents([apt]);
                            setShowEventDialog(true);
                          }}
                        >
                          {viewMode === 'week' ? (
                            <Box>
                              {/* 시간과 환자명 */}
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                mb: 0.25,
                                fontWeight: 600
                              }}>
                                <Typography variant="caption" sx={{ 
                                  color: 'white', 
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}>
                                  {new Date(apt.appointment_datetime).toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                </Typography>
                                <Typography variant="caption" sx={{ 
                                  color: 'white', 
                                  fontSize: '0.7rem',
                                  opacity: 0.9
                                }}>
                                  {apt.duration}분
                                </Typography>
                              </Box>
                              
                              {/* 환자명 */}
                              <Typography sx={{ 
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                mb: 0.25,
                                overflow: 'hidden',
                                // textOverflow: 'ellipsis',
                                // whiteSpace: 'nowrap'
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                lineHeight: 1.2,
                                maxHeight: '2.4em',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {apt.patient_name}
                              </Typography>
                              
                              {/* 진료과 */}
                              <Typography sx={{ 
                                fontSize: '0.7rem',
                                opacity: 0.9,
                                mb: 0.25,
                                overflow: 'hidden',
                                // textOverflow: 'ellipsis', // 제거
                                // whiteSpace: 'nowrap' // 제거
                                whiteSpace: 'normal', // 추가
                                wordBreak: 'break-word', // 추가
                                lineHeight: 1.2,
                                maxHeight: '2.4em', // 최대 2줄
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {apt.department}
                              </Typography>
                              
                              {/* 진료사유 */}
                              {(apt.reason || apt.chief_complaint) && (
                                <Typography sx={{ 
                                  fontSize: '0.7rem',
                                  opacity: 0.85,
                                  fontStyle: 'italic',
                                  overflow: 'hidden',
                                  // textOverflow: 'ellipsis',
                                  // whiteSpace: 'nowrap',
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                  lineHeight: 1.3,
                                  borderTop: '1px solid rgba(255,255,255,0.2)',
                                  pt: 0.25,
                                  mt: 0.25,
                                  maxHeight: '3.9em',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical'
                                }}>
                                  사유: {apt.reason || apt.chief_complaint}
                                </Typography>
                              )}
                              
                              {/* 상태 표시 */}
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'flex-end',
                                mt: 0.25
                              }}>
                                <Typography sx={{ 
                                  fontSize: '0.65rem',
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                  px: 0.5,
                                  py: 0.1,
                                  borderRadius: 0.5,
                                  fontWeight: 500
                                }}>
                                  {getStatusText(apt.status)}
                                </Typography>
                              </Box>
                            </Box>
                          ) : (
                            // 월간 보기에서는 기존처럼 간단하게 표시
                            <Box sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {apt.patient_name}
                            </Box>
                          )}
                        </Box>
                      ))}
                      {dayAppointments.length > (viewMode === 'week' ? 8 : 3) && (
                        <Typography 
                          variant="caption" 
                          color={THEME_COLORS.text.secondary}
                          sx={{ 
                            fontSize: '0.7rem', 
                            px: 0.5,
                            cursor: 'pointer',
                            '&:hover': {
                              color: THEME_COLORS.primary
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayEvents(dayAppointments);
                            setShowEventDialog(true);
                          }}
                        >
                          +{dayAppointments.length - (viewMode === 'week' ? 8 : 3)}개 더 보기
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 예약 상세 다이얼로그 */}
      <Dialog 
        open={showEventDialog} 
        onClose={() => setShowEventDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Event sx={{ color: THEME_COLORS.primary }} />
              <Typography variant="h6" fontWeight="600">
                {selectedDate.toLocaleDateString('ko-KR', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })} 예약
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setShowEventDialog(false)}
              sx={{ color: THEME_COLORS.text.secondary }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          {selectedDayEvents.length > 0 ? (
            <List sx={{ p: 0 }}>
              {selectedDayEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getStatusColor(event.status),
                        mr: 2,
                        width: 40,
                        height: 40
                      }}
                    >
                      <Person />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight="600">
                            {event.patient_name}
                          </Typography>
                          <Chip 
                            label={getStatusText(event.status)}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(event.status),
                              color: 'white',
                              fontWeight: 500
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            color: THEME_COLORS.text.primary,
                            mb: 0.25
                          }}>
                            <AccessTime sx={{ fontSize: '1rem' }} />
                            {new Date(event.appointment_datetime).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })} ({event.duration}분)
                          </Typography>
                          <Typography variant="body2" color={THEME_COLORS.text.secondary}>
                            사유: {event.reason || event.chief_complaint || '-'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < selectedDayEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: THEME_COLORS.text.secondary
            }}>
              <Typography variant="body1">
                이 날짜에는 예약이 없습니다.
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
