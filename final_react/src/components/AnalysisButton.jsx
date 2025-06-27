import React from 'react';
import { Button, CircularProgress, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

// 각 분석의 상태에 따라 다른 아이콘과 비활성화 로직을 갖는 버튼
export default function AnalysisButton({ analysis, onClick, baseRequestStatus }) {
  const { key, name, status } = analysis;

  // 버튼의 비활성화 조건:
  // 1. 기본 CT 분석이 완료되지 않았을 때
  // 2. 해당 추가 분석이 이미 '처리 중(PROCESSING)' 또는 'QUEUED'일 때
  const isDisabled = baseRequestStatus !== 'COMPLETED' || status === 'PROCESSING' || status === 'QUEUED';

  const getStatusIcon = () => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'PROCESSING':
      case 'QUEUED':
        return <CircularProgress size={20} />;
      case 'FAILED':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        // 아직 실행 전이거나, 재실행 가능한 실패 상태일 때
        return <PlayCircleOutlineIcon fontSize="small" />;
    }
  };

  return (
    <Button
      variant="outlined"
      onClick={() => onClick(key)}
      disabled={isDisabled}
      startIcon={getStatusIcon()}
      fullWidth
    >
      {name}
    </Button>
  );
}