//src/components/Appointments/AppointmentManagementTable.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Modal, IconButton, Stack, Pagination,
  FormControl, Select, MenuItem, InputLabel, Tooltip, Dialog, DialogTitle, DialogContent, Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility, MoreVert, Schedule, CalendarToday
} from '@mui/icons-material';
import moment from 'moment';
import { appointmentService } from '../../services/appointment.service';
import PatientService from '../../services/patient.service';

const THEME_COLORS = {
  primary: '#003d82',
  secondary: '#0066cc',
  background: '#f8f9fa',
  surface: '#ffffff',
  border: '#dee2e6',
  text: {
    primary: '#212529',
    secondary: '#6c757d'
  }
};

export default function AppointmentManagementTable() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // 페이징 상태 (간호일지와 동일)
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('appointment_datetime');
  const [sortOrder, setSortOrder] = useState('desc');

  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    duration: 30,
    appointment_type: 'consultation',
    reason: '',
    chief_complaint: '',
    department: '',
    notes: '',
    status: 'pending'
  });

  const statusTypes = [
    { value: '', label: '전체' },
    { value: 'pending', label: '대기중' },
    { value: 'confirmed', label: '확정' },
    { value: 'in_progress', label: '진료중' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' }
  ];

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  // ... 기존 함수들 유지 ...
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointments();
      if (response.success) {
        setAppointments(response.appointments || []);
      }
    } catch (error) {
      console.error('예약 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await PatientService.getAllPatients();
      if (response.success) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error('환자 목록 조회 실패:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await appointmentService.getDoctors();
      if (response.success) {
        setDoctors(response.doctors || []);
      }
    } catch (error) {
      console.error('의사 목록 조회 실패:', error);
    }
  };

  // 필터링 및 정렬 로직 (간호일지와 동일)
  const filterAppointments = () => {
    let filtered = [...appointments];

    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    if (dateFilter) {
      const today = moment();
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(apt => 
            moment(apt.appointment_datetime).isSame(today, 'day')
          );
          break;
        case 'week':
          filtered = filtered.filter(apt => 
            moment(apt.appointment_datetime).isSame(today, 'week')
          );
          break;
        case 'month':
          filtered = filtered.filter(apt => 
            moment(apt.appointment_datetime).isSame(today, 'month')
          );
          break;
      }
    }

    // 정렬 적용
    filtered = filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredAppointments(filtered);
    setPage(1);
  };

  // 페이징 계산 (간호일지와 동일)
  const totalPages = Math.ceil(filteredAppointments.length / rowsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleCreateAppointment = async () => {
    try {
      if (!appointmentForm.patient_id || !appointmentForm.doctor_id || 
          !appointmentForm.appointment_date || !appointmentForm.appointment_time) {
        alert('필수 필드를 모두 입력해주세요.');
        return;
      }

      const appointmentDateTime = new Date(`${appointmentForm.appointment_date}T${appointmentForm.appointment_time}`);
      
      const appointmentData = {
        patient: appointmentForm.patient_id,
        doctor: parseInt(appointmentForm.doctor_id),
        appointment_datetime: appointmentDateTime.toISOString(),
        duration: parseInt(appointmentForm.duration) || 30,
        appointment_type: appointmentForm.appointment_type || 'consultation',
        reason: appointmentForm.reason || '',
        chief_complaint: appointmentForm.chief_complaint || '',
        department: appointmentForm.department || '',
        notes: appointmentForm.notes || '',
        status: appointmentForm.status || 'pending'
      };

      const response = await appointmentService.createAppointment(appointmentData);
      if (response.success) {
        await fetchAppointments();
        setOpenDialog(false);
        resetForm();
        window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        alert('예약이 성공적으로 생성되었습니다.');
      } else {
        console.error('예약 생성 실패:', response);
        if (response.details) {
          alert(`예약 생성 실패: ${JSON.stringify(response.details)}`);
        } else {
          alert(`예약 생성 실패: ${response.error}`);
        }
      }
    } catch (error) {
      console.error('예약 생성 오류:', error);
      alert('예약 생성에 실패했습니다.');
    }
  };

  const handleUpdateAppointment = async () => {
    try {
      const appointmentDateTime = new Date(`${appointmentForm.appointment_date}T${appointmentForm.appointment_time}`);
      
      const appointmentData = {
        patient: appointmentForm.patient_id,
        doctor: parseInt(appointmentForm.doctor_id),
        appointment_datetime: appointmentDateTime.toISOString(),
        duration: parseInt(appointmentForm.duration) || 30,
        appointment_type: appointmentForm.appointment_type || 'consultation',
        reason: appointmentForm.reason || '',
        chief_complaint: appointmentForm.chief_complaint || '',
        department: appointmentForm.department || '',
        notes: appointmentForm.notes || '',
        status: appointmentForm.status || 'pending'
      };

      const response = await appointmentService.updateAppointment(selectedAppointment.id, appointmentData);
      if (response.success) {
        await fetchAppointments();
        setOpenDialog(false);
        resetForm();
        window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        alert('예약이 성공적으로 수정되었습니다.');
      }
    } catch (error) {
      console.error('예약 수정 실패:', error);
      alert('예약 수정에 실패했습니다.');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('이 예약을 삭제하시겠습니까?')) {
      try {
        const response = await appointmentService.deleteAppointment(appointmentId);
        if (response.success) {
          await fetchAppointments();
          window.dispatchEvent(new CustomEvent('appointmentUpdated'));
          alert('예약이 삭제되었습니다.');
        }
      } catch (error) {
        console.error('예약 삭제 실패:', error);
        alert('예약 삭제에 실패했습니다.');
      }
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const response = await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      if (response.success) {
        await fetchAppointments();
        window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        alert(`예약 상태가 "${getStatusText(newStatus)}"로 변경되었습니다.`);
      }
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setAppointmentForm({
      patient_id: '',
      doctor_id: '',
      appointment_date: '',
      appointment_time: '',
      duration: 30,
      appointment_type: 'consultation',
      reason: '',
      chief_complaint: '',
      department: '',
      notes: '',
      status: 'pending'
    });
    setSelectedAppointment(null);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    const appointmentDate = new Date(appointment.appointment_datetime);
    setAppointmentForm({
      ...appointment,
      patient_id: appointment.patient_id || appointment.patient,
      doctor_id: appointment.doctor_id || appointment.doctor,
      appointment_date: appointmentDate.toISOString().split('T')[0],
      appointment_time: appointmentDate.toTimeString().slice(0, 5)
    });
    setOpenDialog(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#0891b2';
      case 'cancelled': return '#f44336';
      case 'completed': return '#4caf50';
      case 'in_progress': return '#9c27b0';
      default: return '#0891b2';
    }
  };

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

  const getAppointmentTypeText = (type) => {
    switch (type) {
      case 'consultation': return '진료';
      case 'checkup': return '검진';
      case 'surgery': return '수술';
      case 'emergency': return '응급';
      case 'follow_up': return '재진';
      default: return type;
    }
  };

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

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <Typography>예약 목록을 불러오는 중...</Typography>
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
                예약 관리 게시판
              </Typography>
              <Typography variant="h6" color="#003d82" fontWeight="600">
                {filteredAppointments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                개의 예약
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetForm();
                  setOpenDialog(true);
                }}
                sx={{ 
                  bgcolor: '#003d82',
                  '&:hover': { bgcolor: '#0066cc' }
                }}
              >
                새 예약 등록
              </Button>
              <Button
                variant="outlined"
                onClick={fetchAppointments}
                sx={{ 
                  color: '#003d82',
                  borderColor: '#003d82',
                  '&:hover': {
                    borderColor: '#0066cc',
                    bgcolor: '#f9fafb'
                  }
                }}
              >
                새로고침
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
              placeholder="환자명, 의사명, 진료과, 사유 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9ca3af' }} />
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
            
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="상태"
                sx={{
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#003d82' },
                  '&.Mui-focused fieldset': { borderColor: '#003d82' }
                }}
              >
                {statusTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>기간</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="기간"
                sx={{
                  bgcolor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#003d82' },
                  '&.Mui-focused fieldset': { borderColor: '#003d82' }
                }}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="today">오늘</MenuItem>
                <MenuItem value="week">이번 주</MenuItem>
                <MenuItem value="month">이번 달</MenuItem>
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
                  onClick={() => handleSort('status')}
                >
                  상태
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  환자 정보
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  담당의
                </TableCell>
                <TableCell 
                  sx={{ fontWeight: 'bold', color: '#374151', cursor: 'pointer' }}
                  onClick={() => handleSort('appointment_datetime')}
                >
                  예약일시
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  진료과/유형
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>
                  진료사유
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#374151', width: '120px' }}>
                  관리
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
                    <CalendarToday sx={{ fontSize: 60, color: '#003d82', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#374151', mb: 1 }}>
                      예약이 없습니다
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      새로운 예약을 등록해보세요!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAppointments.map((appointment, index) => (
                  <TableRow 
                    key={appointment.id}
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
                        label={getStatusText(appointment.status)}
                        size="small"
                        sx={{ 
                          bgcolor: getStatusColor(appointment.status),
                          color: 'white',
                          fontWeight: 600
                        }}
                        icon={appointment.status === 'completed' ? <CheckCircleIcon /> : <Schedule />}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="500" sx={{ color: '#374151' }}>
                          {appointment.patient_name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {appointment.patient_id || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#374151' }}>
                        {appointment.doctor_name || 'Unknown'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="500" sx={{ color: '#374151' }}>
                          {moment(appointment.appointment_datetime).format('MM월 DD일')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {moment(appointment.appointment_datetime).format('HH:mm')} ({appointment.duration}분)
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip 
                          label={appointment.department || 'N/A'}
                          size="small"
                          sx={{ 
                            bgcolor: '#f3f4f6',
                            color: '#374151',
                            fontSize: '0.75rem'
                          }}
                        />
                        <Chip 
                          label={getAppointmentTypeText(appointment.appointment_type)}
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
                        {appointment.reason || appointment.chief_complaint || '-'}
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
                        
                        {appointment.status === 'pending' && (
                          <Tooltip title="승인">
                            <IconButton 
                              size="small"
                              onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                              sx={{ 
                                color: '#059669',
                                '&:hover': { bgcolor: '#f3f4f6' }
                              }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="수정">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditAppointment(appointment)}
                            sx={{ 
                              color: '#003d82',
                              '&:hover': { bgcolor: '#f3f4f6' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
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

        {/* 페이징 섹션 - 간호일지와 동일한 스타일 */}
        {filteredAppointments.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderTop: '1px solid #e5e7eb'
          }}>
            <Typography variant="body2" color="text.secondary">
              총 {filteredAppointments.length}개 중 {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filteredAppointments.length)}개 표시
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

      {/* 예약 생성/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAppointment ? '예약 수정' : '새 예약 등록'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl sx={{ overflow:'visible', width: '120px', margin: '0 auto' }}>
                <InputLabel>환자 선택</InputLabel>
                <Select
                  value={appointmentForm.patient_id}
                  onChange={(e) => {
                    setAppointmentForm(prev => ({
                      ...prev,
                      patient_id: e.target.value
                    }));
                  }}
                >
                  {patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.display_name || patient.name} 
                      ({patient.openemr_id || patient.flutter_patient_id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl sx={{ overflow:'visible', width: '120px', margin: '0 auto' }}>
                <InputLabel>담당 의사</InputLabel>
                <Select
                  value={appointmentForm.doctor_id}
                  onChange={(e) => {
                    setAppointmentForm(prev => ({
                      ...prev,
                      doctor_id: e.target.value
                    }));
                  }}
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.name.replace(/\s*의사$/, '')} ({doctor.department || '내과'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="예약 날짜"
                value={appointmentForm.appointment_date}
                onChange={(e) => setAppointmentForm(prev => ({
                  ...prev,
                  appointment_date: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="예약 시간"
                value={appointmentForm.appointment_time}
                onChange={(e) => setAppointmentForm(prev => ({
                  ...prev,
                  appointment_time: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="진료과"
                value={appointmentForm.department}
                onChange={(e) => setAppointmentForm(prev => ({
                  ...prev,
                  department: e.target.value
                }))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>예약 유형</InputLabel>
                <Select
                  value={appointmentForm.appointment_type}
                  onChange={(e) => setAppointmentForm(prev => ({
                    ...prev,
                    appointment_type: e.target.value
                  }))}
                >
                  <MenuItem value="consultation">진료</MenuItem>
                  <MenuItem value="checkup">검진</MenuItem>
                  <MenuItem value="surgery">수술</MenuItem>
                  <MenuItem value="emergency">응급</MenuItem>
                  <MenuItem value="follow_up">재진</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="소요시간 (분)"
                value={appointmentForm.duration}
                onChange={(e) => setAppointmentForm(prev => ({
                  ...prev,
                  duration: parseInt(e.target.value) || 30
                }))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select
                  value={appointmentForm.status}
                  onChange={(e) => setAppointmentForm(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                >
                  <MenuItem value="pending">대기중</MenuItem>
                  <MenuItem value="confirmed">확정</MenuItem>
                  <MenuItem value="in_progress">진료중</MenuItem>
                  <MenuItem value="completed">완료</MenuItem>
                  <MenuItem value="cancelled">취소</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="진료 사유"
                value={appointmentForm.reason}
                onChange={(e) => setAppointmentForm(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="주호소"
                value={appointmentForm.chief_complaint}
                onChange={(e) => setAppointmentForm(prev => ({
                  ...prev,
                  chief_complaint: e.target.value
                }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="메모"
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Box p={2} display="flex" gap={1} justifyContent="flex-end">
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button 
            onClick={selectedAppointment ? handleUpdateAppointment : handleCreateAppointment}
            variant="contained"
            disabled={!appointmentForm.patient_id || !appointmentForm.doctor_id}
            sx={{ bgcolor: THEME_COLORS.primary }}
          >
            {selectedAppointment ? '수정' : '생성'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
