//src/components/AdminPanel/PatientManagementContent.jsx

import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Stack, Pagination,
  FormControl, Select, MenuItem, InputLabel, Tooltip
} from '@mui/material';
import {
  Add, Search, Edit, Refresh, Visibility, MoreVert, Person
} from '@mui/icons-material';
import { THEME_COLORS } from '../Common/theme';

function PatientManagementContent({ 
  patients, 
  loading, 
  error, 
  stats, 
  searchTerm, 
  setSearchTerm, 
  onRefresh, 
  onAddPatient, 
  onFlutterConnect, 
  onVisitRegister 
}) {
  // 페이징 상태 (간호일지와 동일)
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('openemr_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [sourceFilter, setSourceFilter] = useState('');

  // 환자 검색 필터링 (원본 코드와 동일한 로직)
  const filteredPatients = patients.filter(patient => {
    if (!patient) return false;
    
    const displayName = patient.display_name || patient.name || 
                       `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const searchLower = searchTerm.toLowerCase();
    
    let matchesSearch = displayName.toLowerCase().includes(searchLower) ||
           (patient.openemr_id && patient.openemr_id.toString().includes(searchTerm)) ||
           (patient.flutter_patient_id && patient.flutter_patient_id.toString().includes(searchTerm)) ||
           (patient.id && patient.id.toString().includes(searchTerm)) ||
           (patient.email && patient.email.toLowerCase().includes(searchLower)) ||
           (patient.username && patient.username.toLowerCase().includes(searchLower));

    let matchesSource = true;
    if (sourceFilter) {
      matchesSource = patient.source === sourceFilter;
    }

    return matchesSearch && matchesSource;
  });

  // 정렬 적용
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // 페이징 계산 (간호일지와 동일)
  const totalPages = Math.ceil(sortedPatients.length / rowsPerPage);
  const paginatedPatients = sortedPatients.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Typography>환자 목록을 불러오는 중...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* 헤더 섹션 - 간호일지와 동일한 스타일 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #003d82', // 남색 포인트
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
                통합 환자 관리 게시판
              </Typography>
              <Typography variant="h6" color="#003d82" fontWeight="600">
                {filteredPatients.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                명의 환자
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={onRefresh}
                disabled={loading}
                sx={{ 
                  color: '#003d82',
                  borderColor: '#003d82',
                  '&:hover': {
                    borderColor: '#0066cc',
                    bgcolor: '#f9fafb'
                  }
                }}
              >
                {loading ? '새로고침 중...' : '새로고침'}
              </Button>
            </Box>
          </Box>

          {/* 검색 및 필터 섹션 - 간호일지와 동일한 스타일 */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            mb: 2
          }}>
            <TextField
              placeholder="환자명, 환자번호, 이메일, 사용자명으로 검색..."
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
                  '&:hover fieldset': { borderColor: '#003d82' },
                  '&.Mui-focused fieldset': { borderColor: '#003d82' }
                }
              }}
            />
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>소스</InputLabel>
              <Select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                label="소스"
                sx={{
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#003d82' },
                  '&.Mui-focused fieldset': { borderColor: '#003d82' }
                }}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="django">Django</MenuItem>
                <MenuItem value="flutter">Flutter</MenuItem>
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
                  '&:hover fieldset': { borderColor: '#003d82' },
                  '&.Mui-focused fieldset': { borderColor: '#003d82' }
                }}
              >
                <MenuItem value={5}>5개</MenuItem>
                <MenuItem value={10}>10개</MenuItem>
                <MenuItem value={20}>20개</MenuItem>
                <MenuItem value={50}>50개</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {searchTerm && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              "{searchTerm}" 검색 결과: {filteredPatients.length}명
            </Typography>
          )}
        </Box>
      </Box>

      {/* 게시판 테이블 섹션 - 간호일지와 동일한 스타일 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #003d82'
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
                  onClick={() => handleSort('openemr_id')}
                >
                  환자번호
                </TableCell>
                <TableCell 
                  sx={{ fontWeight: 'bold', color: '#374151', cursor: 'pointer' }}
                  onClick={() => handleSort('name')}
                >
                  환자 정보
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  소스/타입
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  생년월일
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  성별
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  연락처
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  이메일
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151', width: '120px' }}>
                  관리
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 8 }}>
                    <Person sx={{ fontSize: 60, color: '#003d82', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#374151', mb: 1 }}>
                      {searchTerm ? '검색 결과가 없습니다' : '등록된 환자가 없습니다'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      새로운 환자를 등록해보세요!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPatients.map((patient, index) => {
                  const patientKey = patient.id || patient.openemr_id || patient.flutter_patient_id || index;
                  
                  return (
                    <TableRow 
                      key={patientKey}
                      sx={{ 
                        '&:hover': { bgcolor: '#f8f9fa' },
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      <TableCell sx={{ color: '#6b7280' }}>
                        {(page - 1) * rowsPerPage + index + 1}
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500" sx={{ color: '#374151' }}>
                            {patient.openemr_id || patient.flutter_patient_id || 'N/A'}
                          </Typography>
                          {patient.flutter_patient_id && patient.openemr_id && (
                            <Typography variant="caption" color="text.secondary">
                              Flutter: {patient.flutter_patient_id}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500" sx={{ color: '#374151' }}>
                            {patient.display_name || patient.name || '정보 없음'}
                          </Typography>
                          {patient.username && (
                            <Typography variant="caption" color="text.secondary">
                              @{patient.username}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Chip 
                            label={patient.source === 'flutter' ? 'Flutter' : 'Django'}
                            size="small"
                            sx={{ 
                              bgcolor: patient.source === 'flutter' ? '#fff3cd' : '#e8f5e8',
                              color: patient.source === 'flutter' ? '#856404' : '#2e7d32',
                              fontSize: '0.75rem'
                            }}
                          />
                          {patient.is_linked && (
                            <Chip 
                              label="연결됨" 
                              size="small"
                              sx={{ 
                                bgcolor: '#d4edda',
                                color: '#155724',
                                fontSize: '0.75rem'
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {patient.date_of_birth || '정보 없음'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {patient.gender === 'MALE' ? '남성' : 
                           patient.gender === 'FEMALE' ? '여성' : 
                           patient.gender === 'OTHER' ? '기타' :
                           patient.gender || '정보 없음'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {patient.phone_number || '정보 없음'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          {patient.email || '정보 없음'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="상세 보기">
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: '#003d82',
                                '&:hover': { bgcolor: '#f3f4f6' }
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="내원 등록">
                            <IconButton 
                              size="small"
                              onClick={() => onVisitRegister(patient)}
                              sx={{ 
                                color: '#059669',
                                '&:hover': { bgcolor: '#f3f4f6' }
                              }}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {patient.source === 'django' && !patient.is_linked && (
                            <Tooltip title="Flutter 연결">
                              <IconButton 
                                size="small"
                                onClick={() => onFlutterConnect(patient)}
                                sx={{ 
                                  color: '#d97706',
                                  '&:hover': { bgcolor: '#f3f4f6' }
                                }}
                              >
                                <Edit fontSize="small" />
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이징 섹션 - 간호일지와 동일한 스타일 */}
        {filteredPatients.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid #e5e7eb'
          }}>
            <Typography variant="body2" color="text.secondary">
              총 {filteredPatients.length}명 중 {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredPatients.length)}명 표시
            </Typography>
            
            <Pagination 
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
                  '&.Mui-selected': {
                    bgcolor: '#003d82',
                    '&:hover': { bgcolor: '#0066cc' }
                  }
                }
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default PatientManagementContent;
