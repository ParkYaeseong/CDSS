// src/components/Appointments/AppointmentManagementTable.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Button, Dialog, DialogTitle, 
  DialogContent, TextField, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Grid, Box, Paper, Avatar,
  Tooltip, Pagination, InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import moment from 'moment';
import { appointmentService } from '../../services/appointment.service';
import PatientService from '../../services/patient.service';
import './AppointmentManagement.css';

export default function AppointmentManagementTable() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter, dateFilter]);

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
      console.log('환자 목록 조회 응답:', response); // 디버깅
      if (response.success) {
        setPatients(response.data);
        // 환자 ID 형태 확인
        if (response.data && response.data.length > 0) {
          console.log('첫 번째 환자 ID:', response.data[0].id);
          console.log('ID 타입:', typeof response.data[0].id);
          console.log('ID 길이:', response.data[0].id.length);
        }
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    if (dateFilter !== 'all') {
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

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  };

  const handleCreateAppointment = async () => {
    try {
      // 필수 필드 검증
      if (!appointmentForm.patient_id || !appointmentForm.doctor_id || 
          !appointmentForm.appointment_date || !appointmentForm.appointment_time) {
        alert('필수 필드를 모두 입력해주세요.');
        return;
      }

      const appointmentDateTime = new Date(`${appointmentForm.appointment_date}T${appointmentForm.appointment_time}`);
      
      // ✅ 환자 ID를 문자열 그대로 전송 (parseInt 제거)
      const appointmentData = {
        patient: appointmentForm.patient_id,  // ✅ 문자열 그대로 전송
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

      console.log('전송할 예약 데이터:', appointmentData);
      console.log('환자 ID 타입:', typeof appointmentData.patient);
      console.log('환자 ID 길이:', appointmentData.patient.length);

      const response = await appointmentService.createAppointment(appointmentData);
      if (response.success) {
        await fetchAppointments();
        setOpenDialog(false);
        resetForm();
        window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        alert('예약이 성공적으로 생성되었습니다.');
      } else {
        console.error('예약 생성 실패:', response);
        // ✅ 더 상세한 오류 정보 표시
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
        patient: appointmentForm.patient_id,  // ✅ 수정 시에도 문자열 그대로
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
      appointment_date: appointmentDate.toISOString().split('T')[0],
      appointment_time: appointmentDate.toTimeString().slice(0, 5)
    });
    setOpenDialog(true);
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

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Box className="appointment-management-container">
      {/* 헤더 */}
      <Box className="management-header">
        <Box>
          <Typography variant="h4" className="management-title">
            📋 예약 관리 시스템
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            모든 예약을 효율적으로 관리하세요
          </Typography>
        </Box>
        <Box className="header-actions">
          <Tooltip title="새로고침">
            <IconButton onClick={fetchAppointments} disabled={loading} className="refresh-btn">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
            className="add-btn"
          >
            새 예약 등록
          </Button>
        </Box>
      </Box>

      {/* 필터 섹션 */}
      <Card className="filter-card">
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="환자명, 의사명, 진료과로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="pending">대기중</MenuItem>
                  <MenuItem value="confirmed">확정</MenuItem>
                  <MenuItem value="in_progress">진료중</MenuItem>
                  <MenuItem value="completed">완료</MenuItem>
                  <MenuItem value="cancelled">취소</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>기간</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="today">오늘</MenuItem>
                  <MenuItem value="week">이번 주</MenuItem>
                  <MenuItem value="month">이번 달</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" justifyContent="flex-end" gap={1}>
                <Chip 
                  label={`총 ${filteredAppointments.length}건`} 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={`대기중 ${filteredAppointments.filter(a => a.status === 'pending').length}건`} 
                  style={{ backgroundColor: '#ff9800', color: 'white' }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 예약 테이블 */}
      <Card className="table-card">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>환자</TableCell>
                <TableCell>담당의</TableCell>
                <TableCell>예약일시</TableCell>
                <TableCell>진료과</TableCell>
                <TableCell>유형</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>진료사유</TableCell>
                <TableCell align="center">관리</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentAppointments.map((appointment) => (
                <TableRow key={appointment.id} className="appointment-row">
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar className="patient-avatar">
                        {appointment.patient_name?.charAt(0) || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {appointment.patient_name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {appointment.patient_id || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {appointment.doctor_name || 'Unknown'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {moment(appointment.appointment_datetime).format('MM월 DD일')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {moment(appointment.appointment_datetime).format('HH:mm')} ({appointment.duration}분)
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={appointment.department || 'N/A'} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getAppointmentTypeText(appointment.appointment_type)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(appointment.status)}
                      size="small"
                      style={{ 
                        backgroundColor: getStatusColor(appointment.status),
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" className="reason-text">
                      {appointment.reason || appointment.chief_complaint || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5} justifyContent="center">
                      {appointment.status === 'pending' && (
                        <>
                          <Tooltip title="승인">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="취소">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="수정">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {currentAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" style={{ padding: '2rem' }}>
                    <Typography color="textSecondary">
                      {loading ? '로딩 중...' : '예약이 없습니다.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination 
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => setCurrentPage(page)}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* 예약 생성/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAppointment ? '예약 수정' : '새 예약 등록'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>환자 선택</InputLabel>
                <Select
                  value={appointmentForm.patient_id}
                  onChange={(e) => {
                    console.log('선택된 환자 전체 ID:', e.target.value); // 디버깅
                    console.log('환자 ID 길이:', e.target.value.length); // UUID는 36자
                    console.log('환자 ID 타입:', typeof e.target.value);
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
                      <span style={{fontSize: '0.8em', color: 'gray'}}> [{patient.id}]</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>담당 의사</InputLabel>
                <Select
                  value={appointmentForm.doctor_id}
                  onChange={(e) => {
                    console.log('선택된 의사 ID:', e.target.value); // 디버깅
                    const selectedDoctor = doctors.find(d => d.id === parseInt(e.target.value));
                    console.log('선택된 의사 정보:', selectedDoctor); // 디버깅
                    setAppointmentForm(prev => ({
                      ...prev,
                      doctor_id: e.target.value
                    }));
                  }}
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      {doctor.name.replace(/\s*의사$/, '')} ({doctor.department || '내과'})
                      <span style={{fontSize: '0.8em', color: 'gray'}}> [ID: {doctor.id}]</span>
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
          >
            {selectedAppointment ? '수정' : '생성'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
