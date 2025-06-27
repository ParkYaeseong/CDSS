// final_react/src/components/nursing/calendar/CalendarManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, TextField, Button, FormControl,
  InputLabel, Select, MenuItem, Card, CardContent, Chip, IconButton
} from '@mui/material';
import { Delete } from '@mui/icons-material';

export default function CalendarManagement() {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    type: 'task',
    description: ''
  });

  // 기본 간호 일정 생성
  useEffect(() => {
    const today = new Date();
    const defaultEvents = [
      {
        id: 1,
        title: '오전 회진',
        date: today.toISOString().split('T')[0],
        time: '09:00',
        type: 'meeting',
        description: '의료진과 함께하는 환자 상태 점검'
      },
      {
        id: 2,
        title: '간호 컨퍼런스',
        date: today.toISOString().split('T')[0],
        time: '14:00',
        type: 'education',
        description: '주간 간호 사례 검토 및 토론'
      },
      {
        id: 3,
        title: 'CPR 교육',
        date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
        time: '10:00',
        type: 'education',
        description: '심폐소생술 재인증 교육'
      }
    ];
    setEvents(defaultEvents);
  }, []);

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      alert('제목, 날짜, 시간은 필수입니다.');
      return;
    }

    const event = {
      id: Date.now(),
      ...newEvent,
      createdAt: new Date().toLocaleString('ko-KR')
    };

    setEvents([...events, event]);
    setNewEvent({
      title: '',
      date: '',
      time: '',
      type: 'task',
      description: ''
    });
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const getEventTypeColor = (type) => {
    const colors = {
      task: '#E0969F',
      meeting: '#2196f3',
      education: '#4caf50',
      emergency: '#f44336'
    };
    return colors[type] || '#E0969F';
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#8B4A52' }}>
        📅 일정 관리
      </Typography>

      {/* 일정 추가 폼 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
            새 일정 추가
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="일정 제목"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="날짜"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="시간"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>일정 유형</InputLabel>
                <Select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  label="일정 유형"
                >
                  <MenuItem value="task">업무</MenuItem>
                  <MenuItem value="meeting">회의</MenuItem>
                  <MenuItem value="education">교육</MenuItem>
                  <MenuItem value="emergency">응급</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddEvent}
                sx={{ 
                  bgcolor: '#E0969F',
                  '&:hover': { bgcolor: '#C8797F' },
                  height: '56px'
                }}
              >
                일정 추가
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="설명"
                multiline
                rows={2}
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 일정 목록 */}
      <Box sx={{
        bgcolor: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        borderRadius: 1
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
            📋 일정 목록
          </Typography>
          {events.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              등록된 일정이 없습니다.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {events.map((event) => (
                <Grid item xs={12} md={6} key={event.id}>
                  <Card sx={{ 
                    border: `1px solid ${getEventTypeColor(event.type)}30`,
                    borderLeft: `4px solid ${getEventTypeColor(event.type)}`
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                            {event.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            📅 {event.date} ⏰ {event.time}
                          </Typography>
                          <Chip 
                            label={event.type} 
                            size="small" 
                            sx={{ 
                              bgcolor: getEventTypeColor(event.type),
                              color: 'white',
                              mb: 1
                            }}
                          />
                          {event.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {event.description}
                            </Typography>
                          )}
                        </Box>
                        <IconButton 
                          onClick={() => deleteEvent(event.id)}
                          sx={{ color: '#f44336' }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
}
