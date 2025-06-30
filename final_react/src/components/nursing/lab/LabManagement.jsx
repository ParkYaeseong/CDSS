import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, FormControl, Select, MenuItem,
  Button, CircularProgress, Chip, Modal, Paper, TextField, InputLabel,
  Grid, Pagination, IconButton, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert
} from '@mui/material';
import { 
  Search, ExpandMore, Visibility, Download, Share, Assessment,
  Refresh, CloudDownload, LibraryBooks
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PatientService from '../../../services/patient.service';
import OmicsService from '../../../services/omics.service';

export default function LabManagement() {
  const navigate = useNavigate();
  
  // 환자 목록 상태
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  // 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(10);
  
  // 오믹스 분석 결과 상태
  const [omicsResults, setOmicsResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient?.id) {
      fetchPatientOmicsResults(selectedPatient.id);
    } else {
      setOmicsResults([]);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await PatientService.getAllPatients();
      if (response.success && Array.isArray(response.data)) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error('환자 목록 조회 실패:', error);
      setError('환자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPatientOmicsResults = async (patientId) => {
    setLoadingResults(true);
    setError('');
    try {
      const analyses = await OmicsService.getPatientAnalyses(patientId);
      
      const completedAnalyses = analyses
        .filter(analysis => analysis.status === 'COMPLETED')
        .map((analysis, index) => ({
          ...analysis,
          analysis_number: `분석 #${index + 1}`,
          analysis_id: analysis.id.slice(-6),
          analysis_date: analysis.request_timestamp || new Date().toISOString()
        }));
      
      setOmicsResults(completedAnalyses);
    } catch (error) {
      console.error('환자 오믹스 결과 조회 실패:', error);
      setError(`${selectedPatient.name}님의 오믹스 분석 결과를 불러오는데 실패했습니다.`);
    } finally {
      setLoadingResults(false);
    }
  };

  const handlePatientChange = (event) => {
    const patientId = event.target.value;
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient);
    setCurrentPage(1);
  };

  // 상세 결과 페이지로 이동
  const handleViewDetails = (analysisId) => {
    navigate(`/omics/result/${analysisId}`);
  };

  // 결과 필터링
  const filteredResults = omicsResults.filter(result => {
    const matchesSearch = !searchTerm || 
      result.analysis_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(result.analysis_date).toLocaleDateString('ko-KR').includes(searchTerm);
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + resultsPerPage);

  const getStatusChip = (status) => {
    return (
      <Chip 
        label="완료"
        sx={{ 
          bgcolor: '#4caf50',
          color: 'white',
          fontWeight: '600',
          fontSize: '0.75rem'
        }}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: '#f8f9fa',
      minHeight: '100vh',
      overflow: 'auto'
    }}>
      <Box sx={{ p: 3, overflow: 'auto' }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              borderLeft: '4px solid #E0969F'
            }}
          >
            {error}
          </Alert>
        )}

        {/* 검색 영역 */}
        <Card sx={{ 
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
          borderLeft: '4px solid #E0969F'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>
              오믹스 결과 목록
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="분석 번호, 날짜로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="분석 번호, 날짜로 검색"
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: '#E0969F' }} />
                  }}
                  sx={{ 
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E0969F' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E0969F' }
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#E0969F' }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => selectedPatient && fetchPatientOmicsResults(selectedPatient.id)}
                  disabled={loadingResults || !selectedPatient}
                  sx={{ 
                    height: '56px',
                    borderColor: '#E0969F',
                    color: '#E0969F',
                    borderRadius: 1,
                    '&:hover': { 
                      borderColor: '#C8797F', 
                      bgcolor: '#fce4ec',
                      color: '#C8797F'
                    }
                  }}
                >
                  새로고침
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 환자 선택 드롭다운 */}
        <Card sx={{ 
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
          borderLeft: '4px solid #E0969F'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>
              환자 선택
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              {selectedPatient ? 
                `${selectedPatient.name || selectedPatient.display_name}님이 선택되었습니다.` : 
                '분석 결과를 확인할 환자를 선택해주세요.'
              }
            </Typography>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: '#6c757d',
                '&.Mui-focused': { color: '#E0969F' }
              }}>
                환자 선택
              </InputLabel>
              <Select
                value={selectedPatient?.id || ''}
                onChange={handlePatientChange}
                label="환자 선택"
                disabled={loadingPatients}
                sx={{ 
                  bgcolor: 'white',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ced4da' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E0969F' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E0969F' }
                }}
              >
                <MenuItem value="" disabled>
                  <em>환자를 선택해주세요</em>
                </MenuItem>
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    <Box>
                      <Typography fontWeight="600" color="#333">
                        {patient.name || patient.display_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
                      </Typography>
                      <Typography variant="caption" color="#666">
                        ID: {patient.openemr_id || patient.flutter_patient_id || patient.id}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* 결과 목록 테이블 */}
        <Card sx={{ 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
          borderLeft: '4px solid #E0969F'
        }}>
          <Box sx={{ 
            bgcolor: 'white', 
            color: '#E0969F', 
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Typography variant="h6" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#000'  }}>
              오믹스 분석 결과 목록
            </Typography>
            <Typography variant="body2" color="#666">
              총 {filteredResults.length}건의 결과
            </Typography>
          </Box>
          
          <CardContent sx={{ p: 0 }}>
            {!selectedPatient ? (
              <Box sx={{ textAlign: 'center', p: 6 }}>
                <LibraryBooks sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" color="#666" sx={{ mb: 1 }}>
                  환자를 선택해주세요
                </Typography>
                <Typography variant="body2" color="#999">
                  위의 드롭다운에서 환자를 선택하시면 해당 환자의 오믹스 분석 결과를 확인할 수 있습니다.
                </Typography>
              </Box>
            ) : loadingResults ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6 }}>
                <CircularProgress sx={{ color: '#E0969F', mr: 2 }} />
                <Typography color="#666">오믹스 분석 결과를 불러오는 중...</Typography>
              </Box>
            ) : paginatedResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 6 }}>
                <LibraryBooks sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" color="#666" sx={{ mb: 1 }}>
                  분석 결과가 없습니다
                </Typography>
                <Typography variant="body2" color="#999">
                  {selectedPatient.name}님의 오믹스 분석 결과가 아직 없습니다.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ bgcolor: 'white' }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                    <TableRow>
                      <TableCell sx={{ 
                        color: '#495057', 
                        fontWeight: '600', 
                        fontSize: '14px',
                        borderBottom: '2px solid #dee2e6',
                        py: 2
                      }}>
                        분석 번호
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#495057', 
                        fontWeight: '600', 
                        fontSize: '14px',
                        borderBottom: '2px solid #dee2e6',
                        py: 2
                      }}>
                        상태
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#495057', 
                        fontWeight: '600', 
                        fontSize: '14px',
                        borderBottom: '2px solid #dee2e6',
                        py: 2
                      }}>
                        생성일
                      </TableCell>
                      <TableCell sx={{ 
                        color: '#495057', 
                        fontWeight: '600', 
                        fontSize: '14px',
                        borderBottom: '2px solid #dee2e6',
                        py: 2
                      }}>
                        작업
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedResults.map((result, index) => (
                      <TableRow 
                        key={result.id}
                        sx={{ 
                          '&:hover': { bgcolor: '#f8f9fa' },
                          borderLeft: '4px solid #E0969F'
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Typography fontWeight="600" color="#495057" fontSize="14px">
                            {result.analysis_number}
                          </Typography>
                          <Typography variant="caption" color="#6c757d">
                            ID: {result.analysis_id}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          {getStatusChip(result.status)}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" color="#6c757d" fontSize="13px">
                            {new Date(result.analysis_date).toLocaleDateString('ko-KR')}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={() => handleViewDetails(result.id)}
                            sx={{
                              bgcolor: '#E0969F',
                              color: 'white',
                              fontSize: '12px',
                              py: 0.5,
                              px: 1.5,
                              '&:hover': { 
                                bgcolor: '#C8797F'
                              }
                            }}
                          >
                            📋 상세 결과
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages}
              page={currentPage}
              onChange={(event, page) => setCurrentPage(page)}
              sx={{
                '& .MuiPaginationItem-root': {
                  '&.Mui-selected': {
                    bgcolor: '#E0969F',
                    color: 'white'
                  }
                }
              }}
              size="large"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
