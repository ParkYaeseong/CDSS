// src/components/PatientVerificationCodeGenerator.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Button, TextField, Grid, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, Alert, Divider
} from '@mui/material';
import { Security, Search, Refresh, ContentCopy } from '@mui/icons-material';

export default function PatientVerificationCodeGenerator() {
  const [patientId, setPatientId] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [recentCodes, setRecentCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPatientId, setSearchPatientId] = useState('');
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchRecentCodes();
    searchPatients();
  }, []);

  const fetchRecentCodes = async () => {
    try {
      // 최근 발급된 인증 코드 목록 조회 (실제 API 구현 필요)
      const mockData = [
        {
          id: 1,
          patient_id: 'P000123',
          patient_name: '김환자',
          verification_code: '123456',
          created_at: '2025-06-20 10:30:00',
          expires_at: '2025-06-21 10:30:00',
          is_used: false
        },
        {
          id: 2,
          patient_id: 'P000124',
          patient_name: '이환자',
          verification_code: '789012',
          created_at: '2025-06-20 09:15:00',
          expires_at: '2025-06-21 09:15:00',
          is_used: true
        }
      ];
      setRecentCodes(mockData);
    } catch (error) {
      console.error('최근 코드 조회 실패:', error);
    }
  };

  const searchPatients = async () => {
    try {
      // 환자 검색 API (실제 구현 필요)
      const mockPatients = [
        { patient_id: 'P000123', name: '김환자', phone: '010-1234-5678' },
        { patient_id: 'P000124', name: '이환자', phone: '010-2345-6789' },
        { patient_id: 'P000125', name: '박환자', phone: '010-3456-7890' }
      ];
      setPatients(mockPatients);
    } catch (error) {
      console.error('환자 검색 실패:', error);
    }
  };

  const generateVerificationCode = async () => {
    if (!patientId.trim()) {
      alert('환자 ID를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/accounts/generate-verification-code/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_id: patientId.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setGeneratedCode(data);
        setPatientId('');
        fetchRecentCodes(); // 목록 새로고침
      } else {
        alert(`오류: ${data.error}`);
      }
    } catch (error) {
      console.error('인증 코드 생성 실패:', error);
      alert('인증 코드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('클립보드에 복사되었습니다.');
    });
  };

  const filteredPatients = patients.filter(patient =>
    patient.patient_id.toLowerCase().includes(searchPatientId.toLowerCase()) ||
    patient.name.includes(searchPatientId)
  );

  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      {/* 인증 코드 발급 섹션 */}
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🔐 환자 인증 코드 발급
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              label="환자 검색"
              value={searchPatientId}
              onChange={(e) => setSearchPatientId(e.target.value)}
              fullWidth
              placeholder="환자 ID 또는 이름으로 검색"
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ mb: 2 }}
            />
            
            {searchPatientId && (
              <Paper sx={{ maxHeight: 200, overflow: 'auto' }}>
                {filteredPatients.map((patient) => (
                  <Box
                    key={patient.patient_id}
                    sx={{
                      p: 2,
                      borderBottom: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => {
                      setPatientId(patient.patient_id);
                      setSearchPatientId('');
                    }}
                  >
                    <Typography variant="subtitle2">
                      {patient.patient_id} - {patient.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.phone}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}
          </Box>

          <TextField
            label="환자 ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            fullWidth
            placeholder="예: P000123"
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            onClick={generateVerificationCode}
            disabled={loading || !patientId.trim()}
            startIcon={<Security />}
            fullWidth
            size="large"
          >
            {loading ? '생성 중...' : '인증 코드 생성'}
          </Button>
          
          {generatedCode && (
            <Alert severity="success" sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                ✅ 인증 코드 생성 완료
              </Typography>
              <Typography variant="body1">
                <strong>환자:</strong> {generatedCode.patient_name} ({generatedCode.patient_id})
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="h4" color="primary" sx={{ mr: 1 }}>
                  {generatedCode.verification_code}
                </Typography>
                <Button
                  size="small"
                  onClick={() => copyToClipboard(generatedCode.verification_code)}
                  startIcon={<ContentCopy />}
                >
                  복사
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                이 코드를 환자에게 전달하여 모바일 앱 회원가입 시 사용하도록 안내해주세요.
                (유효기간: 24시간)
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 최근 발급 코드 목록 */}
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              📋 최근 발급된 인증 코드
            </Typography>
            <Button
              size="small"
              onClick={fetchRecentCodes}
              startIcon={<Refresh />}
            >
              새로고침
            </Button>
          </Box>
          
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>환자 ID</TableCell>
                  <TableCell>환자명</TableCell>
                  <TableCell>인증 코드</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>발급시간</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>{code.patient_id}</TableCell>
                    <TableCell>{code.patient_name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {code.verification_code}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => copyToClipboard(code.verification_code)}
                        >
                          <ContentCopy fontSize="small" />
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={code.is_used ? '사용됨' : '미사용'}
                        color={code.is_used ? 'default' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(code.created_at).toLocaleString('ko-KR')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
