// src/components/nursing/NursingRecordViewer.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, 
  Button, CircularProgress, Alert, Avatar, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { 
  Visibility, Description, Person, AccessTime,
  CheckCircle, Schedule, Assignment, LocalHospital
} from '@mui/icons-material';
import { nursingApiService } from '../../services/nursingApi';

const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: {
    primary: '#1e293b',
    secondary: '#64748b'
  }
};

export default function NursingRecordViewer({ selectedPatient }) {
  const [nursingLogs, setNursingLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      fetchNursingLogs();
    } else {
      setNursingLogs([]);
    }
  }, [selectedPatient]);

  const fetchNursingLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('간호일지 조회 - 환자 ID:', selectedPatient.id);
      const response = await nursingApiService.getNursingLogs(selectedPatient.id);
      
      if (response.data) {
        // 최신순으로 정렬
        const sortedLogs = Array.isArray(response.data) 
          ? response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          : [];
        setNursingLogs(sortedLogs);
        console.log('간호일지 데이터 로드 완료:', sortedLogs);
      }
    } catch (err) {
      console.error('간호일지 목록 로드 오류:', err);
      setError('간호일지 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLogTypeDisplay = (logType) => {
    const types = {
      'initial_assessment': '초기 사정',
      'progress_note': '경과 기록',
      'medication_record': '투약 기록',
      'patient_education': '환자 교육',
      'discharge_planning': '퇴원 계획',
      'vital_signs': '활력징후',
      'nursing_care': '간호처치'
    };
    return types[logType] || logType;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'pending': return '검토중';
      case 'draft': return '임시저장';
      default: return '알 수 없음';
    }
  };

  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedLog(null);
  };

  if (!selectedPatient) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: THEME_COLORS.primary }}>
          📝 간호 기록 조회
        </Typography>
        <Card sx={{ 
          bgcolor: THEME_COLORS.surface,
          border: `1px solid ${THEME_COLORS.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          py: 6
        }}>
          <CardContent>
            <Assignment sx={{ fontSize: 60, color: THEME_COLORS.primary, mb: 2 }} />
            <Typography variant="h6" sx={{ color: THEME_COLORS.text.primary, mb: 1 }}>
              환자를 선택해주세요
            </Typography>
            <Typography variant="body2" color="text.secondary">
              좌측에서 환자를 선택하시면 해당 환자의 간호기록을 조회할 수 있습니다.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: THEME_COLORS.primary }}>
          📝 {selectedPatient.name} 환자의 간호 기록
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <CircularProgress sx={{ color: THEME_COLORS.primary }} />
          <Typography sx={{ ml: 2 }}>간호일지를 불러오는 중...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: THEME_COLORS.primary }}>
          📝 {selectedPatient.name} 환자의 간호 기록
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={fetchNursingLogs}
          sx={{ color: THEME_COLORS.primary, borderColor: THEME_COLORS.primary }}
        >
          다시 시도
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: THEME_COLORS.primary }}>
          📝 간호 기록 조회
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            icon={<Person />}
            label={`환자: ${selectedPatient.name}`}
            sx={{ 
              bgcolor: THEME_COLORS.primary,
              color: 'white',
              fontWeight: 'bold'
            }}
          />
          <Chip 
            label={`총 ${nursingLogs.length}건의 기록`}
            sx={{ 
              bgcolor: THEME_COLORS.secondary,
              color: 'white'
            }}
          />
        </Box>
      </Box>

      {/* 간호일지 목록 */}
      {nursingLogs.length === 0 ? (
        <Card sx={{ 
          bgcolor: THEME_COLORS.surface,
          border: `1px solid ${THEME_COLORS.border}`,
          textAlign: 'center',
          py: 6
        }}>
          <CardContent>
            <Description sx={{ fontSize: 60, color: THEME_COLORS.text.secondary, mb: 2 }} />
            <Typography variant="h6" sx={{ color: THEME_COLORS.text.primary, mb: 1 }}>
              간호일지가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              해당 환자의 간호일지가 아직 작성되지 않았습니다.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {nursingLogs.map((log) => (
            <Grid item xs={12} md={6} lg={4} key={log.id}>
              <Card sx={{ 
                bgcolor: THEME_COLORS.surface,
                border: `1px solid ${THEME_COLORS.border}`,
                borderLeft: `4px solid ${getStatusColor(log.status)}`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
                },
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* 헤더 */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2
                  }}>
                    <Chip 
                      label={getLogTypeDisplay(log.log_type)}
                      size="small"
                      sx={{ 
                        bgcolor: THEME_COLORS.primary,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {formatDate(log.created_at)}
                      </Typography>
                      <Chip 
                        label={getStatusText(log.status)}
                        size="small"
                        sx={{ 
                          bgcolor: getStatusColor(log.status),
                          color: 'white',
                          fontSize: '0.7rem',
                          mt: 0.5
                        }}
                      />
                    </Box>
                  </Box>

                  {/* 내용 */}
                  <Box sx={{ mb: 2, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Avatar sx={{ 
                        bgcolor: `${THEME_COLORS.primary}20`,
                        color: THEME_COLORS.primary,
                        width: 36,
                        height: 36,
                        mr: 1.5
                      }}>
                        <LocalHospital fontSize="small" />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                          {log.title || `${getLogTypeDisplay(log.log_type)}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          작성자: {log.nurse_name || '간호사'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* 메타 정보 */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                      <Chip 
                        label={log.writing_mode === 'ai_generated' ? 'AI 생성' : '직접 작성'}
                        size="small"
                        sx={{ 
                          bgcolor: log.writing_mode === 'ai_generated' ? '#e3f2fd' : '#f3f4f6',
                          color: log.writing_mode === 'ai_generated' ? '#1976d2' : '#374151',
                          fontSize: '0.7rem'
                        }}
                      />
                      {log.ai_confidence_score && (
                        <Chip 
                          label={`신뢰도: ${log.ai_confidence_score}%`}
                          size="small"
                          sx={{ 
                            bgcolor: '#e8f5e8',
                            color: '#2e7d32',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>

                    {/* 간략한 내용 미리보기 */}
                    {log.content && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.8rem',
                          lineHeight: 1.4
                        }}
                      >
                        {log.content}
                      </Typography>
                    )}
                  </Box>

                  {/* 액션 버튼 */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    mt: 'auto'
                  }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetail(log)}
                      sx={{ 
                        color: THEME_COLORS.primary,
                        borderColor: THEME_COLORS.primary,
                        '&:hover': {
                          bgcolor: THEME_COLORS.primary,
                          color: 'white'
                        },
                        fontSize: '0.75rem'
                      }}
                    >
                      상세보기
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 상세보기 다이얼로그 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        {selectedLog && (
          <>
            <DialogTitle sx={{ 
              bgcolor: THEME_COLORS.primary, 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Description />
              간호일지 상세보기
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    기본 정보
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Assignment /></ListItemIcon>
                      <ListItemText 
                        primary="유형" 
                        secondary={getLogTypeDisplay(selectedLog.log_type)} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Person /></ListItemIcon>
                      <ListItemText 
                        primary="작성자" 
                        secondary={selectedLog.nurse_name || '간호사'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><AccessTime /></ListItemIcon>
                      <ListItemText 
                        primary="작성일시" 
                        secondary={formatDate(selectedLog.created_at)} 
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    상태 정보
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: getStatusColor(selectedLog.status) }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="승인 상태" 
                        secondary={getStatusText(selectedLog.status)} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Schedule /></ListItemIcon>
                      <ListItemText 
                        primary="작성 방식" 
                        secondary={selectedLog.writing_mode === 'ai_generated' ? 'AI 생성' : '직접 작성'} 
                      />
                    </ListItem>
                    {selectedLog.ai_confidence_score && (
                      <ListItem>
                        <ListItemIcon><CheckCircle /></ListItemIcon>
                        <ListItemText 
                          primary="AI 신뢰도" 
                          secondary={`${selectedLog.ai_confidence_score}%`} 
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                간호일지 내용
              </Typography>
              <Card sx={{ 
                bgcolor: '#f8fafc', 
                border: `1px solid ${THEME_COLORS.border}`,
                mt: 1
              }}>
                <CardContent>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {selectedLog.content || '내용이 없습니다.'}
                  </Typography>
                </CardContent>
              </Card>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button 
                onClick={handleCloseDetail}
                variant="outlined"
                sx={{ 
                  color: THEME_COLORS.primary,
                  borderColor: THEME_COLORS.primary 
                }}
              >
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
