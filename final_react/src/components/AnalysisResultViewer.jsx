import React, { useState, useEffect } from 'react';
import { CircularProgress, Typography, Box, Alert, List, ListItem, ListItemText } from '@mui/material';
// [수정] default export된 서비스 객체를 import 합니다.
import DiagnosisService from '../services/diagnosis.service';
import OmicsService from '../services/omics.service';

// 재사용 가능한 바이오마커 카드 (변경 없음)
const BiomarkerCard = ({ biomarkers }) => (
  <Box mt={2}>
    <Typography variant="subtitle1" fontWeight="bold">주요 바이오마커 (예측 기여도)</Typography>
    <List dense>
      {biomarkers.map((marker, index) => (
        <ListItem key={index} disableGutters>
          <ListItemText 
            primary={marker.feature}
            secondary={`기여도: ${marker.shap_value?.toFixed(4)}`}
            primaryTypographyProps={{ 
              fontWeight: 'medium', 
              color: marker.shap_value > 0 ? 'error.main' : 'primary.main' 
            }}
            secondaryTypographyProps={{
              color: marker.shap_value > 0 ? 'error.main' : 'primary.main' 
            }}
          />
        </ListItem>
      ))}
    </List>
  </Box>
);

export default function AnalysisResultViewer({ request, requestType }) {
  const [currentRequest, setCurrentRequest] = useState(request);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentRequest(request);
    setError(null);

    // [수정] status 체크 로직을 최신화합니다.
    if (request && !['COMPLETED', 'FAILED'].includes(request.status)) {
      const interval = setInterval(async () => {
        try {
          let response;
          // [수정] requestType에 따라 각 서비스의 함수를 호출합니다.
          if (requestType === 'diagnosis') {
            response = await DiagnosisService.getDiagnosisRequestDetail(request.id);
          } else if (requestType === 'omics') {
            response = await OmicsService.getOmicsRequestDetail(request.id);
          }

          if (response && response.data) {
            const updatedRequest = response.data;
            setCurrentRequest(updatedRequest);
            if (['COMPLETED', 'FAILED'].includes(updatedRequest.status)) {
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
          setError("결과를 업데이트하는 중 오류가 발생했습니다.");
          clearInterval(interval);
        }
      }, 5000); 

      return () => clearInterval(interval);
    }
  }, [request, requestType]);

  if (!currentRequest) {
    return <Typography color="text.secondary">표시할 분석 정보가 없습니다.</Typography>;
  }

  const { status, result } = currentRequest;
  
  // [수정] status 체크 로직을 최신화합니다.
  if (!['COMPLETED', 'FAILED'].includes(status)) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={24} />
        <Typography>AI 분석이 진행 중입니다... (상태: {status})</Typography>
      </Box>
    );
  }

  if (status === 'FAILED' || result?.error_message) {
    return <Alert severity="error">분석 실패: {result?.error_message || '알 수 없는 오류'}</Alert>;
  }

  if (status === 'COMPLETED' && result) {
    return (
      <div>
        <Alert severity="success" sx={{ mb: 2 }}>
          <strong>진단 요약: {result.result_summary || '정보 없음'}</strong>
        </Alert>
        <Typography>
          <strong>암 의심 확률: </strong> 
          {typeof result.classification_probability === 'number'
            ? `${(result.classification_probability * 100).toFixed(1)}%`
            : '정보 없음'}
        </Typography>
        
        {result.biomarkers && result.biomarkers.length > 0 && (
          <BiomarkerCard biomarkers={result.biomarkers} />
        )}
      </div>
    );
  }

  return <Typography color="text.secondary">결과를 표시할 수 없습니다.</Typography>;
}