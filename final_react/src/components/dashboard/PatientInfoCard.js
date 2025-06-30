//src/components/dashboard/PatientInfoCard.jsx

import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { getPatientBasicInfo } from '../../data/patientData';

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

export default function PatientInfoCard({ patient }) {
  if (!patient) return null;

  const basicInfo = getPatientBasicInfo(patient.openemr_id);
  
  // 성별 한글 변환
  const getGenderText = (gender) => {
    if (!gender) return '정보 없음';
    switch (gender.toLowerCase()) {
      case 'male':
      case 'm':
        return '남';
      case 'female':
      case 'f':
        return '여';
      default:
        return gender;
    }
  };

  // 나이 계산 함수
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '정보 없음';
    
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      
      // 유효한 날짜인지 확인
      if (isNaN(birthDate.getTime())) {
        return '정보 없음';
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age > 0 ? age : '정보 없음';
    } catch (error) {
      console.error('나이 계산 오류:', error);
      return '정보 없음';
    }
  };

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
          📋 환자 기본 정보
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, fontSize: '0.75rem' }}>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>이름</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {patient.name || patient.display_name || '정보 없음'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>키</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.height}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>체중</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.weight}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>혈액형</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.blood_type}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>성별</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {getGenderText(patient.sex || patient.gender)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>나이</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {calculateAge(patient.date_of_birth || patient.birth_date || patient.DOB)}세
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>알레르기</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.allergies}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color={THEME_COLORS.text.secondary}>흡연</Typography>
            <Typography variant="body2" fontWeight="medium" color={THEME_COLORS.text.primary}>
              {basicInfo.smoking}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
