// src/components/MedicalRecords/MedicalRecordsList.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, Box, TextField, Grid
} from '@mui/material';
import { Visibility, Close } from '@mui/icons-material';
import { medicalRecordsService } from '../../services/medicalRecords.service';

export default function MedicalRecordsList({ selectedPatient }) {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      fetchMedicalRecords();
    }
  }, [selectedPatient]);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordsService.getMedicalRecords(selectedPatient?.id);
      if (response.success) {
        setMedicalRecords(response.medical_records);
      }
    } catch (error) {
      console.error('진료기록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (recordId) => {
    try {
      const response = await medicalRecordsService.getMedicalRecordDetail(recordId);
      if (response.success) {
        setSelectedRecord(response.medical_record);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error('진료기록 상세 조회 실패:', error);
    }
  };

  const getRecordTypeColor = (type) => {
    switch (type) {
      case 'consultation': return 'primary';
      case 'surgery': return 'error';
      case 'examination': return 'warning';
      case 'prescription': return 'success';
      default: return 'default';
    }
  };

  const getRecordTypeText = (type) => {
    switch (type) {
      case 'consultation': return '진료';
      case 'surgery': return '수술';
      case 'examination': return '검사';
      case 'prescription': return '처방';
      default: return type;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          📋 진료기록 조회
        </Typography>

        {selectedPatient ? (
          <>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              환자: {selectedPatient.name} (ID: {selectedPatient.openemr_id})
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>진료일</TableCell>
                    <TableCell>진료유형</TableCell>
                    <TableCell>담당의</TableCell>
                    <TableCell>주요 진단</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {medicalRecords.length > 0 ? (
                    medicalRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.visit_date).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getRecordTypeText(record.record_type)}
                            color={getRecordTypeColor(record.record_type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{record.doctor_name}</TableCell>
                        <TableCell>{record.primary_diagnosis}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.status === 'completed' ? '완료' : '진행중'}
                            color={record.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetail(record.id)}
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {loading ? '진료기록을 불러오는 중...' : '진료기록이 없습니다.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            환자를 선택해주세요.
          </Typography>
        )}
      </CardContent>

      {/* 진료기록 상세 다이얼로그 */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          진료기록 상세 정보
          <IconButton
            onClick={() => setDetailDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="진료일"
                    value={new Date(selectedRecord.visit_date).toLocaleDateString('ko-KR')}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="담당의"
                    value={selectedRecord.doctor_name}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="진료유형"
                    value={getRecordTypeText(selectedRecord.record_type)}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="상태"
                    value={selectedRecord.status === 'completed' ? '완료' : '진행중'}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="주요 진단"
                    value={selectedRecord.primary_diagnosis}
                    fullWidth
                    multiline
                    rows={2}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="주호소"
                    value={selectedRecord.chief_complaint || ''}
                    fullWidth
                    multiline
                    rows={2}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="현병력"
                    value={selectedRecord.present_illness || ''}
                    fullWidth
                    multiline
                    rows={3}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="신체검사"
                    value={selectedRecord.physical_examination || ''}
                    fullWidth
                    multiline
                    rows={3}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="치료계획"
                    value={selectedRecord.treatment_plan || ''}
                    fullWidth
                    multiline
                    rows={3}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="처방"
                    value={selectedRecord.prescription || ''}
                    fullWidth
                    multiline
                    rows={2}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="의사 소견"
                    value={selectedRecord.doctor_notes || ''}
                    fullWidth
                    multiline
                    rows={3}
                    disabled
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
