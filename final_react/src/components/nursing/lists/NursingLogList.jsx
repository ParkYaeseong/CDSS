import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Modal, IconButton, Stack, Pagination,
  FormControl, Select, MenuItem, InputLabel, Tooltip
} from '@mui/material';
import { 
  Search, Add, Visibility, Edit, Delete, MoreVert,
  Description, Person, CheckCircle, Schedule
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
  
  // [게시판 페이징 상태]
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

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

  // [필터링 및 정렬 로직]
  const filteredLogs = nursingLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === '' || log.log_type === filterType;
    
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // [페이징 계산]
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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
      {/* [헤더 섹션] */}
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
              <Typography variant="h5" fontWeight="bold" sx={{ mr: 2, color: '#374151' }}>
                간호일지 게시판
              </Typography>
              <Typography variant="h6" color="#E0969F" fontWeight="600">
                {filteredLogs.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                개의 게시글
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
                새 글 작성
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

          {/* [검색 및 필터 섹션] */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            mb: 2
          }}>
            <TextField
              placeholder="제목, 내용, 환자명 검색..."
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
            
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="카테고리"
                sx={{
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#E0969F' },
                  '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                }}
              >
                {logTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>표시 개수</InputLabel>
              <Select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(e.target.value)}
                label="표시 개수"
                sx={{
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#E0969F' },
                  '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                }}
              >
                <MenuItem value={5}>5개</MenuItem>
                <MenuItem value={10}>10개</MenuItem>
                <MenuItem value={20}>20개</MenuItem>
                <MenuItem value={50}>50개</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* [게시판 테이블 섹션] */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F'
      }}>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151', width: '60px' }}>
                  번호
                </TableCell>
                <TableCell 
                  sx={{ fontWeight: 'bold', color: '#374151', cursor: 'pointer' }}
                  onClick={() => handleSort('log_type')}
                >
                  카테고리
                </TableCell>
                <TableCell 
                  sx={{ fontWeight: 'bold', color: '#374151', cursor: 'pointer' }}
                  onClick={() => handleSort('title')}
                >
                  제목
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  환자 정보
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  작성자
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  작성방식
                </TableCell>
                <TableCell 
                  sx={{ fontWeight: 'bold', color: '#374151', cursor: 'pointer' }}
                  onClick={() => handleSort('created_at')}
                >
                  작성일시
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  상태
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151', width: '120px' }}>
                  관리
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 8 }}>
                    <Description sx={{ fontSize: 60, color: '#E0969F', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#374151', mb: 1 }}>
                      간호일지가 없습니다
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      새로운 간호일지를 작성해보세요!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log, index) => (
                  <TableRow 
                    key={log.id}
                    sx={{ 
                      '&:hover': { bgcolor: '#f8f9fa' },
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    <TableCell sx={{ color: '#6b7280' }}>
                      {(page - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={getLogTypeDisplay(log.log_type)}
                        size="small"
                        sx={{ 
                          bgcolor: '#E0969F',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        fontWeight="500"
                        sx={{ 
                          color: '#374151',
                          cursor: 'pointer',
                          '&:hover': { color: '#E0969F' }
                        }}
                        onClick={() => handleViewDocument(log)}
                      >
                        {log.title || `${log.patient_name} - ${getLogTypeDisplay(log.log_type)}`}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="500" sx={{ color: '#374151' }}>
                          {log.patient_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.patient_age}세 {log.patient_gender}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#374151' }}>
                        {log.nurse_name || '기본 간호사'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip 
                          label={log.writing_mode === 'ai_generated' ? 'AI 생성' : '직접 작성'}
                          size="small"
                          sx={{ 
                            bgcolor: '#f3f4f6',
                            color: '#374151',
                            fontSize: '0.75rem'
                          }}
                        />
                        <Chip 
                          label={`신뢰도 ${log.ai_confidence_score || 100}%`}
                          size="small"
                          sx={{ 
                            bgcolor: '#e8f5e8',
                            color: '#2e7d32',
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#374151' }}>
                        {formatDate(log.created_at)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={log.status === 'approved' ? '승인' : '검토중'}
                        color={log.status === 'approved' ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                        icon={log.status === 'approved' ? <CheckCircle /> : <Schedule />}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="문서 보기">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewDocument(log)}
                            sx={{ 
                              color: '#E0969F',
                              '&:hover': { bgcolor: '#f3f4f6' }
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {log.status !== 'approved' && (
                          <Tooltip title="승인">
                            <IconButton 
                              size="small"
                              onClick={() => handleApprove(log.id)}
                              sx={{ 
                                color: '#059669',
                                '&:hover': { bgcolor: '#f3f4f6' }
                              }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="더보기">
                          <IconButton 
                            size="small"
                            sx={{ 
                              color: '#6b7280',
                              '&:hover': { bgcolor: '#f3f4f6' }
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* [페이징 섹션] */}
        {filteredLogs.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid #e5e7eb'
          }}>
            <Typography variant="body2" color="text.secondary">
              총 {filteredLogs.length}개 중 {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredLogs.length)}개 표시
            </Typography>
            
            <Pagination 
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
                  '&.Mui-selected': {
                    bgcolor: '#E0969F',
                    '&:hover': { bgcolor: '#C8797F' }
                  }
                }
              }}
            />
          </Box>
        )}
      </Box>

      {/* [간호일지 문서 모달] */}
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

      {/* [간호일지 직접 작성 모달] */}
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
                fetchNursingLogs();
              }}
              initialData={{ patient_id: selectedPatient }}
            />
          </Box>
        </Modal>
      )}
    </Box>
  );
}
