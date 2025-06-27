// final_react/src/components/nursing/lists/NursingLogList.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, 
  TextField, InputAdornment, Grid, Chip, Modal,
  Avatar, IconButton, Stack
} from '@mui/material';
import { 
  Search, Add, Visibility, Edit, Delete, MoreVert,
  Description, Person
} from '@mui/icons-material';

import { nursingApiService } from '../../../services/nursingApi';
import NursingLogDocument from '../document/NursingLogDocument';
import ManualNursingLogForm from '../forms/ManualNursingLogForm';

export default function NursingLogList({ selectedPatient }) {
  const [nursingLogs, setNursingLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDocument, setShowDocument] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const logTypes = [
    { value: '', label: '전체' },
    { value: 'initial_assessment', label: '초기 사정' },
    { value: 'progress_note', label: '경과 기록' },
    { value: 'medication_record', label: '투약 기록' },
    { value: 'patient_education', label: '환자 교육' },
    { value: 'discharge_planning', label: '퇴원 계획' }
  ];

  useEffect(() => {
    fetchNursingLogs();
  }, [selectedPatient]);

  const fetchNursingLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await nursingApiService.getNursingLogs(selectedPatient);
      if (response.data) {
        setNursingLogs(response.data);
      }
    } catch (err) {
      console.error('간호일지 목록 로드 오류:', err);
      setError('간호일지 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = nursingLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === '' || log.log_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
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
      'discharge_planning': '퇴원 계획'
    };
    return types[logType] || logType;
  };

  const handleViewDocument = (log) => {
    setSelectedLog(log);
    setShowDocument(true);
  };

  const handleCloseDocument = () => {
    setShowDocument(false);
    setSelectedLog(null);
  };

  const handleUpdateDocument = async (logId, updateData) => {
    try {
      await nursingApiService.updateNursingLog(logId, updateData);
      fetchNursingLogs();
      setSelectedLog(null);
    } catch (error) {
      throw error;
    }
  };

  const handleApprove = async (logId) => {
    try {
      await nursingApiService.approveNursingLog(logId);
      alert('간호일지가 승인되었습니다.');
      fetchNursingLogs();
    } catch (error) {
      console.error('승인 오류:', error);
      alert('승인 중 오류가 발생했습니다.');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Typography>간호일지 목록을 불러오는 중...</Typography>
    </Box>
  );
  
  if (error) return (
    <Box sx={{ p: 3 }}>
      <Typography color="error">{error}</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* 헤더 - 하얀 박스 + 포인트 색 줄 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mr: 2, color: '#374151' }}>
                📋 간호일지 목록
              </Typography>
              <Typography variant="h6" color="#E0969F" fontWeight="600">
                {filteredLogs.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                개의 일지
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
             <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCreateForm(true)}
                sx={{ 
                  bgcolor: '#E0969F',
                  '&:hover': { bgcolor: '#C8797F' }
                }}
              >
                직접 작성
              </Button>
              <Button
                variant="outlined"
                onClick={fetchNursingLogs}
                sx={{ 
                  color: '#E0969F',
                  borderColor: '#E0969F',
                  '&:hover': {
                    borderColor: '#C8797F',
                    bgcolor: '#f9fafb'
                  }
                }}
              >
                새로고침
              </Button>
            </Box>
          </Box>

          {/* 검색 및 필터 */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center'
          }}>
            <TextField
              placeholder="제목 또는 내용 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#E0969F' },
                  '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                }
              }}
            />
            
            <TextField
              select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              sx={{ 
                minWidth: 140,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#E0969F' },
                  '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                }
              }}
              SelectProps={{
                native: true,
              }}
            >
              {logTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </TextField>
          </Box>
        </Box>
      </Box>

      {/* 간호일지 카드 목록 */}
      <Grid container spacing={3}>
        {filteredLogs.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              bgcolor: 'white',
              borderRadius: 1,
              border: '1px solid #e5e7eb',
              borderLeft: '4px solid #E0969F'
            }}>
              <Description sx={{ fontSize: 60, color: '#E0969F', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#374151', mb: 1 }}>
                간호일지가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                새로운 간호일지를 작성해보세요!
              </Typography>
            </Box>
          </Grid>
        ) : (
          filteredLogs.map((log) => (
            <Grid item xs={12} lg={6} key={log.id}>
              {/* 하얀 박스 + 포인트 색 줄 디자인 */}
              <Box sx={{ 
                bgcolor: 'white',
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #E0969F',
                borderRadius: 1,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }
              }}>
                <Box sx={{ p: 3 }}>
                  {/* 카드 헤더 */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={getLogTypeDisplay(log.log_type)}
                        size="small"
                        sx={{ 
                          bgcolor: '#E0969F',
                          color: 'white',
                          mr: 1,
                          fontWeight: 600
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(log.created_at)}
                      </Typography>
                    </Box>
                    
                    <IconButton size="small" sx={{ color: '#9ca3af' }}>
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {/* 간호일지 정보 */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: '#f3f4f6',
                        color: '#374151',
                        width: 48,
                        height: 48,
                        mr: 2,
                        fontSize: '1.2rem'
                      }}>
                        <Description />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ 
                          color: '#374151',
                          fontSize: '1.1rem',
                          mb: 0.5
                        }}>
                          {log.title || `${log.patient_name} - ${getLogTypeDisplay(log.log_type)}`}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            작성방식:
                          </Typography>
                          <Chip 
                            label={log.writing_mode === 'ai_generated' ? 'AI 생성' : '직접 작성'}
                            size="small"
                            sx={{ 
                              bgcolor: '#f3f4f6',
                              color: '#374151',
                              fontSize: '0.75rem'
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            신뢰도:
                          </Typography>
                          <Chip 
                            label={`${log.ai_confidence_score || 100}%`}
                            size="small"
                            sx={{ 
                              bgcolor: '#e8f5e8',
                              color: '#2e7d32',
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        환자: {log.patient_name} ({log.patient_age}세 {log.patient_gender})
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        작성자: {log.nurse_name || '기본 간호사'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* 상태 및 액션 버튼 */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Chip 
                      label={log.status === 'approved' ? '승인' : '검토중'}
                      color={log.status === 'approved' ? 'success' : 'warning'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    
                    <Stack direction="row" spacing={1}>
                      <Button 
                        size="small" 
                        variant="contained"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDocument(log)}
                        sx={{ 
                          bgcolor: '#E0969F',
                          '&:hover': { bgcolor: '#C8797F' },
                          fontSize: '0.75rem',
                          px: 2
                        }}
                      >
                        문서 보기
                      </Button>
                      {log.status !== 'approved' && (
                        <Button 
                          size="small"
                          variant="outlined"
                          onClick={() => handleApprove(log.id)}
                          sx={{ 
                            color: '#E0969F',
                            borderColor: '#E0969F',
                            '&:hover': {
                              bgcolor: '#E0969F',
                              color: 'white'
                            },
                            fontSize: '0.75rem',
                            px: 2
                          }}
                        >
                          승인
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))
        )}
      </Grid>
      {/* 간호일지 문서 모달 */}
      {showDocument && selectedLog && (
        <Modal 
          open={showDocument} 
          onClose={handleCloseDocument}
          sx={{ zIndex: 1300 }}
        >
          <Box>
            <NursingLogDocument
              nursingLog={selectedLog}
              onClose={handleCloseDocument}
              onUpdate={handleUpdateDocument}
            />
          </Box>
        </Modal>
      )}

      {/* 간호일지 직접 작성 모달 추가 */}
      {showCreateForm && (
        <Modal 
          open={showCreateForm} 
          onClose={() => setShowCreateForm(false)}
          sx={{ zIndex: 1300 }}
        >
          <Box>
            <ManualNursingLogForm
              onClose={() => setShowCreateForm(false)}
              onSuccess={() => {
                setShowCreateForm(false);
                fetchNursingLogs(); // 목록 새로고침
              }}
              initialData={{ patient_id: selectedPatient }}
            />
          </Box>
        </Modal>
      )}
    </Box>
  );
}
