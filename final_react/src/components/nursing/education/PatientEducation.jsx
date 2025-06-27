// final_react/src/components/nursing/education/PatientEducation.jsx
import React, { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Chip, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, Divider
} from '@mui/material';
import { ExpandMore, School, Download, Print } from '@mui/icons-material';

export default function PatientEducation({ patients, onRefresh }) {
  const [educationRecords, setEducationRecords] = useState([]);
  const [newEducation, setNewEducation] = useState({
    patientName: '',
    topic: '',
    method: '',
    duration: '',
    understanding: '',
    notes: ''
  });

  const educationTopics = [
    '고혈압 관리', '당뇨병 관리', '수술 후 관리', '약물 복용법',
    '식이요법', '운동요법', '상처 관리', '감염 예방', '퇴원 후 관리'
  ];

  const educationMethods = [
    '개별 교육', '집단 교육', '시범', '팜플렛 제공', '동영상 시청'
  ];

  const understandingLevels = [
    '완전 이해', '부분 이해', '이해 부족', '재교육 필요'
  ];

  const educationMaterials = [
    {
      category: '고혈압 관리',
      materials: [
        '혈압 측정 방법',
        '저염식 식단 가이드',
        '규칙적인 운동의 중요성',
        '스트레스 관리법'
      ]
    },
    {
      category: '당뇨병 관리',
      materials: [
        '혈당 측정 방법',
        '인슐린 주사법',
        '당뇨 식단 관리',
        '발 관리의 중요성'
      ]
    },
    {
      category: '수술 후 관리',
      materials: [
        '상처 관리 방법',
        '활동 제한 사항',
        '합병증 징후',
        '통증 관리법'
      ]
    }
  ];

  const handleAddEducation = () => {
    if (!newEducation.patientName || !newEducation.topic) {
      alert('환자명과 교육 주제는 필수입니다.');
      return;
    }

    const education = {
      id: Date.now(),
      ...newEducation,
      date: new Date().toLocaleDateString('ko-KR'),
      time: new Date().toLocaleTimeString('ko-KR'),
      educator: localStorage.getItem('nurseId') || '기본간호사'
    };

    setEducationRecords([...educationRecords, education]);
    setNewEducation({
      patientName: '',
      topic: '',
      method: '',
      duration: '',
      understanding: '',
      notes: ''
    });
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#8B4A52' }}>
        📚 환자 교육
      </Typography>

      {/* 교육 자료 라이브러리 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
            📖 교육 자료 라이브러리
          </Typography>
          {educationMaterials.map((category, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="600">
                  {category.category}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {category.materials.map((material, materialIndex) => (
                    <ListItem key={materialIndex} sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={material}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                      <Button 
                        size="small" 
                        startIcon={<Download />}
                        sx={{ color: '#E0969F', minWidth: 'auto', mr: 1 }}
                      >
                        다운로드
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<Print />}
                        sx={{ color: '#6b7280', minWidth: 'auto' }}
                      >
                        인쇄
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>

      {/* 환자 교육 기록 추가 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
            새 교육 기록 추가
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>환자 선택</InputLabel>
                <Select
                  value={newEducation.patientName}
                  onChange={(e) => setNewEducation({...newEducation, patientName: e.target.value})}
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
              <FormControl fullWidth>
                <InputLabel>교육 주제</InputLabel>
                <Select
                  value={newEducation.topic}
                  onChange={(e) => setNewEducation({...newEducation, topic: e.target.value})}
                  label="교육 주제"
                >
                  {educationTopics.map(topic => (
                    <MenuItem key={topic} value={topic}>
                      {topic}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>교육 방법</InputLabel>
                <Select
                  value={newEducation.method}
                  onChange={(e) => setNewEducation({...newEducation, method: e.target.value})}
                  label="교육 방법"
                >
                  {educationMethods.map(method => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 시간 (분)"
                type="number"
                value={newEducation.duration}
                onChange={(e) => setNewEducation({...newEducation, duration: e.target.value})}
                placeholder="예: 30"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>이해도</InputLabel>
                <Select
                  value={newEducation.understanding}
                  onChange={(e) => setNewEducation({...newEducation, understanding: e.target.value})}
                  label="이해도"
                >
                  {understandingLevels.map(level => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="교육 내용 및 환자 반응"
                multiline
                rows={3}
                value={newEducation.notes}
                onChange={(e) => setNewEducation({...newEducation, notes: e.target.value})}
                placeholder="교육한 구체적인 내용, 환자의 질문, 반응 등을 기록하세요..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleAddEducation}
                sx={{ 
                  bgcolor: '#E0969F',
                  '&:hover': { bgcolor: '#C8797F' }
                }}
              >
                교육 기록 추가
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* 교육 기록 목록 */}
      <Box sx={{
        bgcolor: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        borderRadius: 1
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
            📝 교육 기록 목록
          </Typography>
          {educationRecords.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              등록된 교육 기록이 없습니다.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {educationRecords.map((record) => (
                <Grid item xs={12} md={6} key={record.id}>
                  <Card sx={{ 
                    border: '1px solid #E0969F30',
                    borderLeft: '4px solid #E0969F'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" fontWeight="600">
                          {record.topic}
                        </Typography>
                        <Chip 
                          label={record.understanding}
                          size="small"
                          color={record.understanding === '완전 이해' ? 'success' : 
                                 record.understanding === '재교육 필요' ? 'error' : 'warning'}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        환자: {record.patientName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        방법: {record.method} | 시간: {record.duration}분
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        교육자: {record.educator}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        일시: {record.date} {record.time}
                      </Typography>
                      
                      {record.notes && (
                        <Typography variant="body2" sx={{ 
                          bgcolor: '#f9fafb',
                          p: 1,
                          borderRadius: 1,
                          border: '1px solid #e5e7eb'
                        }}>
                          {record.notes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
}
