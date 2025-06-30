// components/clinical/PatientSelector.jsx
import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Box,
} from '@mui/material';

const patientsWithClinicalData = {
  liver: ['강 경화'],
  stomach: ['이 선아'],
  kidney: ['신 장훈', '박 예성']
};

const PatientSelector = ({ 
  patients, 
  selectedPatient, 
  setSelectedPatient, 
  supportedCancerTypes,
  compact = false // 컴팩트 모드 추가
}) => {
  const getPatientCancerTypes = (patientName) => {
    const cancerTypes = [];
    
    // ✅ 정확한 이름 매칭만 수행
    Object.entries(patientsWithClinicalData).forEach(([cancerType, patients]) => {
        const hasData = patients.some(name => {
        // 공백 제거 후 정확히 일치하는 경우만
        const normalizedPatientName = patientName.replace(/\s+/g, '');
        const normalizedDataName = name.replace(/\s+/g, '');
        return normalizedDataName === normalizedPatientName;
        });
        
        if (hasData) {
        cancerTypes.push(cancerType);
        }
    });
    
    return cancerTypes;
    };

  const hasAnyClinicalData = (patientName) => {
    return getPatientCancerTypes(patientName).length > 0;
  };

  const getCancerTypeColor = (cancerType) => {
    const colors = {
      liver: '#C77954',
      kidney: '#8C6D9E',
      stomach: '#6A8EAE'
    };
    return colors[cancerType] || '#00897b';
  };

  const getCancerTypeIcon = (cancerType) => {
    const icons = {
      liver: '🫀',
      kidney: '🫘',
      stomach: '🫃'
    };
    return icons[cancerType] || '🏥';
  };

  // 컴팩트 모드일 때는 간단한 드롭다운만 표시
  if (compact) {
    return (
      <FormControl fullWidth size="small">
        <InputLabel>다른 환자 선택</InputLabel>
        <Select
          value={selectedPatient?.id || ''}
          onChange={(e) => {
            const patient = patients.find(p => p.id === e.target.value);
            setSelectedPatient(patient);
          }}
          label="다른 환자 선택"
        >
          <MenuItem value="">
            <em>선택 안함</em>
          </MenuItem>
          {patients.map(patient => {
            const patientCancerTypes = getPatientCancerTypes(patient.name);
            const hasData = hasAnyClinicalData(patient.name);
            return (
                <MenuItem key={patient.id} value={patient.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography sx={{ flexGrow: 1 }}>
                            {patient.name} (ID: {patient.openemr_id})
                        </Typography>
                        {hasData && patientCancerTypes.length > 0 && ( // ✅ 임상데이터가 있을 때만 표시
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {patientCancerTypes.map(cancerType => (
                                    <Chip
                                        key={cancerType}
                                        size="small"
                                        label={supportedCancerTypes[cancerType] || cancerType}
                                        sx={{ 
                                            fontSize: '0.7rem', 
                                            backgroundColor: getCancerTypeColor(cancerType), 
                                            color: 'white' 
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </MenuItem>
                );
            })}
        </Select>
      </FormControl>
    );
  }

  // 기존 전체 모드
  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>환자 선택</InputLabel>
        <Select
          value={selectedPatient?.id || ''}
          onChange={(e) => {
            const patient = patients.find(p => p.id === e.target.value);
            setSelectedPatient(patient);
          }}
          label="환자 선택"
        >
          {patients.map(patient => {
            const patientCancerTypes = getPatientCancerTypes(patient.name);
            return (
              <MenuItem key={patient.id} value={patient.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ flexGrow: 1 }}>
                    {patient.name} (ID: {patient.openemr_id})
                  </Typography>
                  {patientCancerTypes.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {patientCancerTypes.map(cancerType => (
                        <Chip
                          key={cancerType}
                          size="small"
                          label={supportedCancerTypes[cancerType] || cancerType}
                          sx={{ 
                            fontSize: '0.7rem', 
                            backgroundColor: getCancerTypeColor(cancerType), 
                            color: 'white' 
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {selectedPatient && (
        <Box sx={{ 
          p: 2, 
          backgroundColor: '#f5f5f5', 
          borderRadius: 1,
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            선택된 환자 정보
          </Typography>
          <Typography variant="body2">이름: {selectedPatient.name}</Typography>
          <Typography variant="body2">환자ID: {selectedPatient.openemr_id}</Typography>
          <Typography variant="body2">생년월일: {selectedPatient.date_of_birth}</Typography>
          <Typography variant="body2">성별: {selectedPatient.gender}</Typography>
          
          {hasAnyClinicalData(selectedPatient.name) ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                ✅ 임상데이터 보유 - 예측 분석 가능
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {getPatientCancerTypes(selectedPatient.name).map(cancerType => (
                  <Chip
                    key={cancerType}
                    size="small"
                    icon={<span>{getCancerTypeIcon(cancerType)}</span>}
                    label={supportedCancerTypes[cancerType] || cancerType}
                    sx={{ 
                      backgroundColor: getCancerTypeColor(cancerType), 
                      color: 'white' 
                    }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold', mt: 1 }}>
              ❌ 임상데이터 없음 - 예측 분석 불가
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PatientSelector;
