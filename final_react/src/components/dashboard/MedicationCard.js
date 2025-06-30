//src/components/dashboard/MedicationCard.jsx

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, List, ListItemButton, ListItemText,
  Button, CircularProgress, Box, Chip, IconButton
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { getPatientPrescriptions } from '../../services/cdss.service.js';

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

export default function MedicationCard({ patient, onMenuChange }) {
  const [medications, setMedications] = useState([]);
  const [prescriptionInfo, setPrescriptionInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patient) {
      setMedications([]);
      setPrescriptionInfo(null);
      return;
    }

    const loadPatientMedications = async () => {
      setLoading(true);
      try {
        console.log('🔍 대시보드에서 환자 처방 조회 시작:', patient.id);
        
        // Django API 호출 (서비스 함수 사용)
        const prescriptions = await getPatientPrescriptions(patient.id);
        console.log('✅ Django API 처방 조회 성공:', prescriptions);
        
        if (prescriptions.length > 0) {
          const latestPrescription = prescriptions[0];
          setMedications(latestPrescription.drugs || []);
          setPrescriptionInfo({
            timestamp: latestPrescription.timestamp,
            doctorId: latestPrescription.doctor_id
          });
        } else {
          console.log('📝 해당 환자의 처방이 없음');
          setMedications([]);
          setPrescriptionInfo(null);
        }
      } catch (error) {
        console.error('Django API 실패, localStorage 백업 사용:', error);
        // localStorage 백업 사용
        const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
        const patientPrescriptions = prescriptions.filter(p => p.patient_id === patient.id);
        
        if (patientPrescriptions.length > 0) {
          const latestPrescription = patientPrescriptions[patientPrescriptions.length - 1];
          setMedications(latestPrescription.drugs || []);
          setPrescriptionInfo({
            timestamp: latestPrescription.timestamp,
            doctorId: latestPrescription.doctor_id
          });
        } else {
          setMedications([]);
          setPrescriptionInfo(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPatientMedications();

    // 처방 업데이트 이벤트 리스너
    const handlePrescriptionUpdate = () => {
      console.log('🔄 처방 업데이트 이벤트 수신');
      loadPatientMedications();
    };

    window.addEventListener('prescriptionUpdated', handlePrescriptionUpdate);

    return () => {
      window.removeEventListener('prescriptionUpdated', handlePrescriptionUpdate);
    };
  }, [patient]);

  const formatSimpleDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const handlePrescriptionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onMenuChange) {
      onMenuChange('drug-interaction');
    }
  };

  if (!patient) return null;
  
  return (
    <Card sx={{
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
          💊 처방약 목록 {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Typography>
        
        {medications.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 3, 
            color: THEME_COLORS.text.secondary 
          }}>
            <Typography variant="body2" fontSize="0.8rem">
              처방된 약물이 없습니다.
            </Typography>
            <Typography variant="caption" fontSize="0.7rem">
              약물 처방 메뉴에서 처방을 추가해주세요.
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ p: 0 }}>
            {medications.map((med, index) => (
              <ListItemButton key={med.prescriptionId || index} sx={{ 
                px: 0, 
                py: 0.5, 
                minHeight: 32,
                '&:hover': {
                  bgcolor: `${THEME_COLORS.secondary}10`
                }
              }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold" fontSize="0.8rem">
                          {med.name}
                        </Typography>
                        {med.code && (
                          <Chip 
                            label={med.code} 
                            size="small" 
                            sx={{ 
                              fontSize: '0.6rem', 
                              height: 18,
                              bgcolor: `${THEME_COLORS.secondary}20`,
                              color: THEME_COLORS.primary
                            }} 
                          />
                        )}
                      </Box>
                      {prescriptionInfo && (
                        <Typography variant="caption" sx={{ 
                          fontSize: '0.65rem',
                          color: THEME_COLORS.text.secondary,
                          fontStyle: 'italic'
                        }}>
                          {formatSimpleDate(prescriptionInfo.timestamp)}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={`${med.dosage} | ${med.frequency} | ${med.duration}`}
                  primaryTypographyProps={{ fontSize: '0.8rem', color: THEME_COLORS.text.primary }}
                  secondaryTypographyProps={{ fontSize: '0.7rem', color: THEME_COLORS.text.secondary }}
                />
                <IconButton 
                  size="small" 
                  sx={{ 
                    p: 0.5,
                    color: THEME_COLORS.primary,
                    '&:hover': {
                      bgcolor: `${THEME_COLORS.secondary}20`
                    }
                  }}
                  onClick={handlePrescriptionClick}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
        
        <Button 
          variant="outlined" 
          fullWidth 
          startIcon={<Add />} 
          sx={{ 
            mt: 1, 
            height: 32, 
            fontSize: '0.75rem',
            borderColor: THEME_COLORS.secondary,
            color: THEME_COLORS.primary,
            '&:hover': {
              borderColor: THEME_COLORS.primary,
              bgcolor: `${THEME_COLORS.secondary}10`
            }
          }}
          onClick={handlePrescriptionClick}
        >
          처방 추가
        </Button>
      </CardContent>
    </Card>
  );
}
