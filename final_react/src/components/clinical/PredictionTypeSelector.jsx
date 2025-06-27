// components/clinical/PredictionTypeSelector.jsx
import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';

const predictionTypes = [
  { id: 'cancer-risk', label: '암 위험도 분류', icon: '⚠️', description: '저위험/고위험 분류' },
  { id: 'survival-rate', label: '생존율 예측', icon: '📊', description: '1년, 3년, 5년 생존율' },
  { id: 'treatment-effect', label: '치료 효과 예측', icon: '💊', description: '최적 치료법 추천' }
];

const PredictionTypeSelector = ({ selectedPredictionType, setSelectedPredictionType }) => {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
        예측 분석 유형
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {predictionTypes.map(type => (
          <Card
            key={type.id}
            variant="outlined"
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: selectedPredictionType === type.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
              backgroundColor: selectedPredictionType === type.id ? '#f3f8ff' : 'white',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                transform: 'translateY(-1px)',
                boxShadow: 2,
              }
            }}
            onClick={() => setSelectedPredictionType(type.id)}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '1.2rem', mr: 1 }}>{type.icon}</Typography>
                <Typography variant="subtitle2" fontWeight="bold">
                  {type.label}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {type.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default PredictionTypeSelector;
