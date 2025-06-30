//src/components/dashboard/MedicalRecords.jsx

import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Chip } from '@mui/material';
import { getPatientMedicalRecords } from '../../data/patientData';

const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6',
  surface: '#ffffff',
  border: '#e2e8f0',
  text: {
    primary: '#1e293b',
    secondary: '#64748b'
  }
};

export default function MedicalRecords({ patient }) {
  const [records, setRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    chiefComplaint: '',
    presentIllness: '',
    physicalExam: '',
    assessment: '',
    plan: ''
  });

  useEffect(() => {
    if (patient) {
      const patientRecords = getPatientMedicalRecords(patient.openemr_id);
      const sortedRecords = patientRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecords(sortedRecords);
    } else {
      setRecords([]);
    }
  }, [patient]);

  const handleInputChange = (field, value) => {
    setNewRecord(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addRecord = () => {
    const hasContent = Object.values(newRecord).some(value => value.trim());
    
    if (hasContent) {
      const now = new Date();
      const today = new Date().toISOString().split('T')[0];
      
      const newRecordData = {
        id: Date.now(),
        date: today,
        time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
        chiefComplaint: newRecord.chiefComplaint,
        presentIllness: newRecord.presentIllness,
        physicalExam: newRecord.physicalExam,
        assessment: newRecord.assessment,
        plan: newRecord.plan
      };
      
      setRecords([newRecordData, ...records]);
      
      setNewRecord({
        chiefComplaint: '',
        presentIllness: '',
        physicalExam: '',
        assessment: '',
        plan: ''
      });
    }
  };

  const clearRecord = () => {
    setNewRecord({
      chiefComplaint: '',
      presentIllness: '',
      physicalExam: '',
      assessment: '',
      plan: ''
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!patient) {
    return (
      <Card sx={{ 
        mb: 1,
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ 
            mb: 1, 
            fontSize: '0.9rem',
            color: THEME_COLORS.primary,
            borderBottom: `2px solid ${THEME_COLORS.secondary}`,
            pb: 0.5
          }}>
            🩺 진료 기록
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            환자를 선택해주세요.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      mb: 1,
      bgcolor: THEME_COLORS.surface,
      border: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      height: 'fit-content',
      maxHeight: '80vh'
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ 
          mb: 1, 
          fontSize: '0.9rem',
          color: THEME_COLORS.primary,
          borderBottom: `2px solid ${THEME_COLORS.secondary}`,
          pb: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0
        }}>
          🩺 진료 기록
          <Chip 
            label={`${patient.name} (${records.length}건)`}
            size="small"
            sx={{ 
              bgcolor: `${THEME_COLORS.primary}20`, 
              color: THEME_COLORS.primary,
              fontSize: '0.7rem',
              height: 18
            }}
          />
        </Typography>
        
        {/* 기존 진료기록 목록 - 스크롤 가능 */}
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          mb: 2,
          minHeight: 0
        }}>
          {records.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1, fontSize: '0.9rem' }}>
              진료 기록이 없습니다.
            </Typography>
          ) : (
            records.map((record) => (
              <Box key={record.id} sx={{ 
                mb: 1, 
                p: 1.5, 
                bgcolor: `${THEME_COLORS.primary}08`, 
                borderRadius: 1,
                border: `1px solid ${THEME_COLORS.primary}20`,
                flexShrink: 0
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color={THEME_COLORS.text.secondary} sx={{ fontSize: '0.8rem' }}>
                    {formatDate(record.date)} {record.time}
                  </Typography>
                </Box>
                
                <Box sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {record.chiefComplaint && (
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                      <strong>주소:</strong> {record.chiefComplaint}
                    </Typography>
                  )}
                  {record.presentIllness && (
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                      <strong>현병력:</strong> {record.presentIllness}
                    </Typography>
                  )}
                  {record.physicalExam && (
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                      <strong>신체검사:</strong> {record.physicalExam}
                    </Typography>
                  )}
                  {record.assessment && (
                    <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                      <strong>평가/진단:</strong> {record.assessment}
                    </Typography>
                  )}
                  {record.plan && (
                    <Typography variant="body2" sx={{ 
                      borderTop: `1px solid ${THEME_COLORS.border}`,
                      pt: 0.5,
                      mt: 0.5,
                      fontStyle: 'italic',
                      color: THEME_COLORS.text.secondary,
                      fontSize: '0.85rem'
                    }}>
                      <strong>계획/처방:</strong> {record.plan}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
        
        {/* 새 진료기록 입력 양식 - 하단 고정 */}
        <Box sx={{ 
          border: `2px solid ${THEME_COLORS.primary}30`,
          borderRadius: 2,
          p: 1.5,
          bgcolor: `${THEME_COLORS.primary}05`,
          flexShrink: 0
        }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ 
            mb: 1.5, 
            color: THEME_COLORS.primary,
            fontSize: '0.9rem'
          }}>
            📝 새 진료기록 작성
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* 주소 (Chief Complaint) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem',
                mb: 0.5,
                display: 'block'
              }}>
                주소 (C.C)
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="환자가 호소하는 주요 증상을 입력하세요"
                value={newRecord.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.5 },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>

            {/* 현병력 (Present Illness) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem',
                mb: 0.5,
                display: 'block'
              }}>
                현병력 (P.I)
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="현재 질병의 경과, 증상의 변화 등을 입력하세요"
                value={newRecord.presentIllness}
                onChange={(e) => handleInputChange('presentIllness', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>

            {/* 신체검사 (Physical Examination) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem',
                mb: 0.5,
                display: 'block'
              }}>
                신체검사 (P.E)
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="신체검사 소견을 입력하세요"
                value={newRecord.physicalExam}
                onChange={(e) => handleInputChange('physicalExam', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.5 },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>

            {/* 평가/진단 (Assessment) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem',
                mb: 0.5,
                display: 'block'
              }}>
                평가/진단 (Assessment)
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="진단명 또는 임상적 판단을 입력하세요"
                value={newRecord.assessment}
                onChange={(e) => handleInputChange('assessment', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.5 },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>

            {/* 계획/처방 (Plan) */}
            <Box>
              <Typography variant="caption" sx={{ 
                fontWeight: 'bold', 
                color: THEME_COLORS.text.primary,
                fontSize: '0.8rem',
                mb: 0.5,
                display: 'block'
              }}>
                계획/처방 (Plan)
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="치료 계획, 처방약, 추후 관리 방안 등을 입력하세요"
                value={newRecord.plan}
                onChange={(e) => handleInputChange('plan', e.target.value)}
                sx={{ 
                  '& .MuiInputBase-input': { fontSize: '0.85rem' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: THEME_COLORS.border
                  }
                }}
              />
            </Box>
          </Box>

          {/* 버튼 영역 */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            <Button
              variant="contained"
              onClick={addRecord}
              disabled={!Object.values(newRecord).some(value => value.trim())}
              size="small"
              sx={{ 
                bgcolor: THEME_COLORS.primary,
                color: 'white',
                fontSize: '0.8rem',
                '&:hover': {
                  bgcolor: THEME_COLORS.secondary
                },
                '&:disabled': {
                  bgcolor: THEME_COLORS.border
                }
              }}
            >
              기록 저장
            </Button>
            <Button
              variant="outlined"
              onClick={clearRecord}
              size="small"
              sx={{ 
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text.secondary,
                fontSize: '0.8rem',
                '&:hover': {
                  borderColor: THEME_COLORS.primary,
                  bgcolor: `${THEME_COLORS.primary}10`
                }
              }}
            >
              전체 초기화
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
