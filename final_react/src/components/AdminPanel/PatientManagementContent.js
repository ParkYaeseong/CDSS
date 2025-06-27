// src/components/AdminPanel/PatientManagementContent.jsx
import React from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, CircularProgress, Alert
} from '@mui/material';
import { Add, Search, Edit } from '@mui/icons-material';
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
  // 환자 검색 필터링 (원본 코드와 동일한 로직)
  const filteredPatients = patients.filter(patient => {
    if (!patient) return false;
    
    const displayName = patient.display_name || patient.name || 
                       `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const searchLower = searchTerm.toLowerCase();
    
    return displayName.toLowerCase().includes(searchLower) ||
           (patient.openemr_id && patient.openemr_id.toString().includes(searchTerm)) ||
           (patient.flutter_patient_id && patient.flutter_patient_id.toString().includes(searchTerm)) ||
           (patient.id && patient.id.toString().includes(searchTerm)) ||
           (patient.email && patient.email.toLowerCase().includes(searchLower)) ||
           (patient.username && patient.username.toLowerCase().includes(searchLower));
  });

  return (
    <Box sx={{ p: 3, bgcolor: THEME_COLORS.background, minHeight: '100vh' }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color={THEME_COLORS.text.primary}>
          통합 환자 관리 (Django + Flutter)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            onClick={onRefresh}
            disabled={loading}
            sx={{ 
              borderColor: THEME_COLORS.secondary,
              color: THEME_COLORS.secondary,
              borderRadius: 2
            }}
          >
            {loading ? '새로고침 중...' : '새로고침'}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={onAddPatient}
            sx={{ 
              bgcolor: THEME_COLORS.primary,
              borderRadius: 2,
              '&:hover': { bgcolor: THEME_COLORS.secondary }
            }}
          >
            새 환자 등록
          </Button>
        </Box>
      </Box>

      {/* 검색 바 */}
      <Card sx={{ 
        mb: 3, 
        bgcolor: THEME_COLORS.surface, 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: 'none'
      }}>
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="환자명, 환자번호, 이메일, 사용자명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: THEME_COLORS.text.secondary }} />
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: THEME_COLORS.border,
                },
                '&:hover fieldset': {
                  borderColor: THEME_COLORS.secondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: THEME_COLORS.secondary,
                },
              },
            }}
          />
          {searchTerm && (
            <Typography variant="body2" color={THEME_COLORS.text.secondary} sx={{ mt: 1 }}>
              "{searchTerm}" 검색 결과: {filteredPatients.length}명
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 환자 통계 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface, 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: 'none',
            textAlign: 'center',
            '&:hover': { 
              transform: 'translateY(-4px)', 
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color={THEME_COLORS.primary}>
                {patients.length}
              </Typography>
              <Typography variant="body1" color={THEME_COLORS.text.secondary} fontWeight={500}>
                전체 환자
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface, 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: 'none',
            textAlign: 'center',
            '&:hover': { 
              transform: 'translateY(-4px)', 
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color={THEME_COLORS.secondary}>
                {stats.django_count}
              </Typography>
              <Typography variant="body1" color={THEME_COLORS.text.secondary} fontWeight={500}>
                Django 환자
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface, 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: 'none',
            textAlign: 'center',
            '&:hover': { 
              transform: 'translateY(-4px)', 
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color={THEME_COLORS.status.warning}>
                {stats.flutter_count}
              </Typography>
              <Typography variant="body1" color={THEME_COLORS.text.secondary} fontWeight={500}>
                Flutter 환자
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: THEME_COLORS.surface, 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: 'none',
            textAlign: 'center',
            '&:hover': { 
              transform: 'translateY(-4px)', 
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color={THEME_COLORS.status.success}>
                {stats.linked_count}
              </Typography>
              <Typography variant="body1" color={THEME_COLORS.text.secondary} fontWeight={500}>
                연결된 환자
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
          <Button onClick={onRefresh} size="small" sx={{ ml: 1 }}>
            다시 시도
          </Button>
        </Alert>
      )}

      {/* 환자 테이블 */}
      <Card sx={{ 
        bgcolor: THEME_COLORS.surface, 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: 'none'
      }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ 
              height: 300, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2
            }}>
              <CircularProgress sx={{ color: THEME_COLORS.primary }} />
              <Typography color={THEME_COLORS.text.secondary}>
                통합 환자 정보를 불러오는 중...
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: `${THEME_COLORS.primary}08` }}>
                    <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>환자번호</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>성명</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>소스/타입</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>생년월일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>성별</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>연락처</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>이메일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: THEME_COLORS.primary }}>관리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient, index) => {
                      const patientKey = patient.id || patient.openemr_id || patient.flutter_patient_id || index;
                      
                      return (
                        <TableRow 
                          key={patientKey}
                          sx={{ 
                            '&:hover': { bgcolor: `${THEME_COLORS.secondary}08` },
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {patient.openemr_id || patient.flutter_patient_id || 'N/A'}
                              </Typography>
                              {patient.flutter_patient_id && patient.openemr_id && (
                                <Typography variant="caption" color={THEME_COLORS.text.secondary}>
                                  Flutter: {patient.flutter_patient_id}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {patient.display_name || patient.name || '정보 없음'}
                              </Typography>
                              {patient.username && (
                                <Typography variant="caption" color={THEME_COLORS.text.secondary}>
                                  @{patient.username}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip 
                                label={patient.source === 'flutter' ? 'Flutter' : 'Django'}
                                color={patient.source === 'flutter' ? 'warning' : 'primary'}
                                size="small"
                                sx={{ borderRadius: 2 }}
                              />
                              {patient.is_linked && (
                                <Chip 
                                  label="연결됨" 
                                  sx={{ 
                                    bgcolor: THEME_COLORS.status.success, 
                                    color: 'white',
                                    borderRadius: 2
                                  }} 
                                  size="small" 
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {patient.date_of_birth || '정보 없음'}
                          </TableCell>
                          <TableCell>
                            {patient.gender === 'MALE' ? '남성' : 
                             patient.gender === 'FEMALE' ? '여성' : 
                             patient.gender === 'OTHER' ? '기타' :
                             patient.gender || '정보 없음'}
                          </TableCell>
                          <TableCell>
                            {patient.phone_number || '정보 없음'}
                          </TableCell>
                          <TableCell>
                            {patient.email || '정보 없음'}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Button 
                                size="small"
                                variant="outlined"
                                onClick={() => onVisitRegister(patient)}
                                sx={{ 
                                  fontSize: '0.7rem',
                                  borderRadius: 2,
                                  borderColor: THEME_COLORS.border,
                                  '&:hover': { borderColor: THEME_COLORS.secondary }
                                }}
                              >
                                내원 등록
                              </Button>
                              
                              {patient.source === 'django' && !patient.is_linked ? (
                                <Button 
                                  size="small"
                                  variant="contained"
                                  onClick={() => onFlutterConnect(patient)}
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    borderRadius: 2,
                                    bgcolor: THEME_COLORS.status.warning,
                                    '&:hover': { bgcolor: THEME_COLORS.status.warning }
                                  }}
                                >
                                  Flutter 연결
                                </Button>
                              ) : patient.is_linked ? (
                                <Chip 
                                  label="✓ 연결됨" 
                                  sx={{ 
                                    bgcolor: THEME_COLORS.status.success, 
                                    color: 'white',
                                    borderRadius: 2
                                  }} 
                                  size="small" 
                                />
                              ) : null}
                              
                              <IconButton size="small" sx={{ color: THEME_COLORS.primary }}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color={THEME_COLORS.text.secondary}>
                          {searchTerm ? '검색 결과가 없습니다.' : '등록된 환자가 없습니다.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default PatientManagementContent;
