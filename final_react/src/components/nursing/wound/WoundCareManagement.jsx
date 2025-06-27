// final_react/src/components/nursing/wound/WoundCareManagement.jsx
import React, { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';

export default function WoundCareManagement({ patients, onRefresh }) {
  const [woundRecords, setWoundRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    patientName: '',
    location: '',
    size: '',
    depth: '',
    appearance: '',
    treatment: '',
    notes: ''
  });

  const woundAppearances = [
    '깨끗함', '감염 징후', '삼출물 있음', '건조함', '육아조직 형성'
  ];

  const treatmentOptions = [
    '드레싱 교체', '상처 세척', '항생제 연고 적용', '압박 붕대', '습윤 드레싱'
  ];

  const handleAddRecord = () => {
    if (!newRecord.patientName || !newRecord.location) {
      alert('환자명과 상처 위치는 필수입니다.');
      return;
    }

    const record = {
      id: Date.now(),
      ...newRecord,
      date: new Date().toLocaleDateString('ko-KR'),
      time: new Date().toLocaleTimeString('ko-KR')
    };

    setWoundRecords([...woundRecords, record]);
    setNewRecord({
      patientName: '',
      location: '',
      size: '',
      depth: '',
      appearance: '',
      treatment: '',
      notes: ''
    });
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#8B4A52' }}>
        🩹 상처 관리
      </Typography>

      {/* 상처 평가 가이드 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
            📋 상처 평가 가이드
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: '#F5E6E8', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: '#8B4A52' }}>
                    상처 크기 측정
                  </Typography>
                  <Typography variant="body2">
                    • 길이 x 너비 x 깊이 (cm)<br/>
                    • 가장 긴 부분과 가장 넓은 부분 측정<br/>
                    • 깊이는 멸균 면봉으로 측정
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: '#1976d2' }}>
                    감염 징후 체크
                  </Typography>
                  <Typography variant="body2">
                    • 발적, 부종, 열감<br/>
                    • 화농성 분비물<br/>
                    • 악취<br/>
                    • 발열
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 상처 기록 추가 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
            새 상처 기록 추가
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>환자 선택</InputLabel>
                <Select
                  value={newRecord.patientName}
                  onChange={(e) => setNewRecord({...newRecord, patientName: e.target.value})}
                  label="환자 선택"
                >
                  {patients.map(patient => (
                    <MenuItem key={patient.id} value={patient.name}>
                      {patient.name} ({patient.patient_id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="상처 위치"
                value={newRecord.location}
                onChange={(e) => setNewRecord({...newRecord, location: e.target.value})}
                placeholder="예: 좌측 발목"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="상처 크기 (cm)"
                value={newRecord.size}
                onChange={(e) => setNewRecord({...newRecord, size: e.target.value})}
                placeholder="예: 3x2x1"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>상처 상태</InputLabel>
                <Select
                  value={newRecord.appearance}
                  onChange={(e) => setNewRecord({...newRecord, appearance: e.target.value})}
                  label="상처 상태"
                >
                  {woundAppearances.map(appearance => (
                    <MenuItem key={appearance} value={appearance}>
                      {appearance}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>치료 방법</InputLabel>
                <Select
                  value={newRecord.treatment}
                  onChange={(e) => setNewRecord({...newRecord, treatment: e.target.value})}
                  label="치료 방법"
                >
                  {treatmentOptions.map(treatment => (
                    <MenuItem key={treatment} value={treatment}>
                      {treatment}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="추가 메모"
                multiline
                rows={3}
                value={newRecord.notes}
                onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                placeholder="상처 상태, 환자 반응, 특이사항 등을 기록하세요..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleAddRecord}
                sx={{ 
                  bgcolor: '#E0969F',
                  '&:hover': { bgcolor: '#C8797F' }
                }}
              >
                상처 기록 추가
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 상처 기록 목록 */}
      <Box sx={{
        bgcolor: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        borderRadius: 1
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
            📝 상처 관리 기록
          </Typography>
          {woundRecords.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              등록된 상처 기록이 없습니다.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f9fafb' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>날짜/시간</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>환자</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>위치</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>크기</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>상태</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>치료</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#374151' }}>메모</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {woundRecords.map((record) => (
                    <TableRow key={record.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                      <TableCell>
                        <Typography variant="body2">
                          {record.date}<br/>
                          <Typography variant="caption" color="text.secondary">
                            {record.time}
                          </Typography>
                        </Typography>
                      </TableCell>
                      <TableCell>{record.patientName}</TableCell>
                      <TableCell>{record.location}</TableCell>
                      <TableCell>{record.size || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={record.appearance}
                          size="small"
                          sx={{ 
                            bgcolor: record.appearance === '감염 징후' ? '#fee2e2' : '#F5E6E8',
                            color: record.appearance === '감염 징후' ? '#dc2626' : '#8B4A52'
                          }}
                        />
                      </TableCell>
                      <TableCell>{record.treatment}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {record.notes || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Box>
  );
}
