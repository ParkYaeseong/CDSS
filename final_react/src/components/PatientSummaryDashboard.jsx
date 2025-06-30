// src/components/PatientSummaryDashboard.jsx

import React from 'react';
import { Box, Paper, Typography, Grid, Chip, Divider, List, ListItem, ListItemText } from '@mui/material';
import { Person, Event, ReportProblem, Science, HistoryToggleOff, Wc } from '@mui/icons-material';

const themeColor = '#40B7C2';

const calculateAge = (birthDate) => {
  if (!birthDate) return 'N/A';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const SectionTitle = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
    {icon}
    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#444' }}>
      {title}
    </Typography>
  </Box>
);

export default function PatientSummaryDashboard({ patient }) {
  if (!patient) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          border: '2px dashed #e0e0e0',
          borderRadius: 3,
          bgcolor: '#f9f9f9',
          minHeight: 360
        }}
      >
        <Person sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#757575', fontWeight: 600 }}>
          환자 정보 요약
        </Typography>
        <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
          목록에서 환자를 선택하여<br />핵심 정보를 확인하세요.
        </Typography>
      </Paper>
    );
  }

  const age = calculateAge(patient.date_of_birth);
  const patientDetails = {
    ...patient,
    gender: 'Male',
    lastVisit: '2025-06-25 (소화기내과)',
    chiefComplaint: '지속적인 복부 팽만감 및 소화 불량',
    allergies: ['페니실린'],
    conditions: ['고혈압', '2형 당뇨'],
    recentScans: [
      { type: 'CT', date: '2025-06-15', bodyPart: '복부 (조영)' },
      { type: 'X-ray', date: '2025-06-15', bodyPart: '흉부 PA' },
      { type: 'MRI', date: '2024-11-02', bodyPart: '뇌' },
    ],
    labResults: [
        { name: 'eGFR', value: '85 mL/min/1.73m²', date: '2025-06-15' },
        { name: 'Creatinine', value: '1.1 mg/dL', date: '2025-06-15' },
    ]
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2.5, // Padding 약간 조절
        border: '1px solid #e0e0e0', 
        borderRadius: 3, 
        backgroundColor: '#fff',
        height: '100%'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: themeColor }}>
            {patientDetails.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            환자번호: {patientDetails.id}
          </Typography>
        </Box>
        <Chip 
          label={`${patientDetails.gender} / ${age}세`} 
          icon={<Wc />} 
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* === Flexbox로 레이아웃 재구성 === */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        
        {/* 주요 정보 */}
        <Box>
          <SectionTitle icon={<Event color="action" />} title="주요 정보" />
          <Typography variant="body2" sx={{ pl: 4 }}><strong>최근 방문:</strong> {patientDetails.lastVisit}</Typography>
          <Typography variant="body2" sx={{ pl: 4 }}><strong>주요 증상:</strong> {patientDetails.chiefComplaint}</Typography>
        </Box>

        {/* 특이사항 */}
        <Box>
          <SectionTitle icon={<ReportProblem color="error" />} title="특이사항" />
            <Box sx={{ pl: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>알레르기:</Typography>
                    {patientDetails.allergies.map(allergy => <Chip key={allergy} label={allergy} size="small" color="error" variant="outlined" sx={{ mr: 0.5 }} />)}
                </Box>
                <Box>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', mr: 1 }}>기저질환:</Typography>
                    {patientDetails.conditions.map(con => <Chip key={con} label={con} size="small" color="warning" variant="outlined" sx={{ mr: 0.5 }} />)}
                </Box>
            </Box>
        </Box>
        
        {/* 최근 영상검사 & 주요 Lab 결과를 담을 Flexbox 컨테이너 */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'flex-start' }}>
            
            {/* 최근 영상검사 (flex: 1) */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <SectionTitle icon={<HistoryToggleOff color="action" />} title="최근 영상검사" />
              <List dense sx={{ pt: 0 }}>
                  {patientDetails.recentScans.map(scan => (
                      <ListItem key={`${scan.type}-${scan.date}`} disablePadding>
                          <ListItemText 
                              primary={`${scan.date} - [${scan.type}] ${scan.bodyPart}`}
                              primaryTypographyProps={{ variant: 'body2' }}
                          />
                      </ListItem>
                  ))}
              </List>
            </Box>

            {/* 주요 Lab 결과 (flex: 1) */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <SectionTitle icon={<Science color="action" />} title="주요 Lab 결과" />
              <List dense sx={{ pt: 0 }}>
                  {patientDetails.labResults.map(lab => (
                       <ListItem key={lab.name} disablePadding>
                          <ListItemText
                              primary={`${lab.name}: ${lab.value}`}
                              secondary={lab.date}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: '500' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                          />
                      </ListItem>
                  ))}
              </List>
            </Box>

        </Box>
      </Box>
    </Paper>
  );
}