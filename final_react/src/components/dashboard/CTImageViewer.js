//src/components/dashboard/CTImageViewer.jsx

import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, ToggleButtonGroup, ToggleButton,
  CircularProgress, List, ListItemButton, ListItemText, Chip, Paper
} from '@mui/material';
import {
  ViewInAr, ImageSearch, Hub
} from '@mui/icons-material';
import DiagnosisService from '../../services/diagnosis.service';

const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6',
  surface: '#ffffff',
  border: '#e2e8f0',
  surfaceHover: '#f1f5f9',
  text: {
    primary: '#1e293b',
    secondary: '#64748b'
  }
};

const StatusChip = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return { bg: '#4caf50', text: '#fff' };
      case 'PROCESSING': return { bg: '#ff9800', text: '#fff' };
      case 'FAILED': return { bg: '#f44336', text: '#fff' };
      case 'PENDING': return { bg: '#2196f3', text: '#fff' };
      case 'QUEUED': return { bg: '#007C80', text: '#fff' };
      case 'RECEIVED': return { bg: '#007C80', text: '#fff' };
      default: return { bg: '#9e9e9e', text: '#fff' };
    }
  };
  const colors = getStatusColor(status);
  return <Chip label={status || 'UNKNOWN'} size="small" sx={{ bgcolor: colors.bg, color: colors.text, fontSize: '0.7rem', height: 20, '& .MuiChip-label': { px: 1 } }} />;
};

const ViewerPlaceholder = ({ status, error }) => {
  const isLoading = ['PROCESSING', 'QUEUED', 'RECEIVED'].includes(status);
  const isError = ['FAILED', 'NIFTI_CONVERSION_FAILED', 'SEGMENTATION_FAILED', 'VIEWER_GENERATION_FAILED'].includes(status);

  return (
    <Paper sx={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#999', border: '1px dashed #ccc', borderRadius: 2, textAlign: 'center', px: 2 }}>
      {isLoading && (
        <>
          <StatusChip status={status} />
          <CircularProgress sx={{ mt: 2 }} />
          <Typography variant="body2" color="text.secondary" mt={2}>
            분석 결과를 생성 중입니다.
          </Typography>
        </>
      )}
      {isError && (
        <>
          <StatusChip status={status} />
          <Typography variant="body2" color="error" mt={1}>뷰어 로딩 실패</Typography>
          {error && <Typography variant="caption" color="text.secondary">{error}</Typography>}
        </>
      )}
      {!isLoading && !isError && (
        <Typography variant="body2" color="text.secondary">데이터 없음</Typography>
      )}
    </Paper>
  );
};

const ViewerBlock = ({ title, url, status, error }) => (
  <Box sx={{ width: '100%' }}>
    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, textAlign: 'center' }}>{title}</Typography>
    {url ? (
      <iframe src={url} title={title} width="100%" height="480px" style={{ border: '1px solid #ccc', borderRadius: 8 }} />
    ) : (
      <ViewerPlaceholder status={status} error={error} />
    )}
  </Box>
);

// 분석기록 선택 컴포넌트
function AnalysisSelector({ analysisHistory, selectedAnalysis, onAnalysisSelect, loading }) {
  if (!analysisHistory || analysisHistory.length === 0) {
    return null;
  }

  // 분석 선택 시 상세 정보 가져오기
  const handleAnalysisSelect = async (analysis) => {
    try {
      console.log('분석 선택:', analysis.id);
      // 상세 정보 가져오기 (result 객체 포함)
      const detailResponse = await DiagnosisService.getDiagnosisRequestDetail(analysis.id);
      if (detailResponse?.data) {
        console.log('상세 정보 가져옴:', detailResponse.data);
        onAnalysisSelect(detailResponse.data);
      } else {
        console.log('상세 정보 없음, 기본 분석 사용');
        onAnalysisSelect(analysis);
      }
    } catch (error) {
      console.error('상세 정보 가져오기 실패:', error);
      onAnalysisSelect(analysis);
    }
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ 
        mb: 1, fontSize: '0.8rem', color: THEME_COLORS.primary
      }}>
        📜 분석 기록 선택
      </Typography>
      
      <List sx={{ 
        maxHeight: 120, overflowY: 'auto', 
        border: `1px solid ${THEME_COLORS.border}`, 
        borderRadius: 1, bgcolor: THEME_COLORS.surfaceHover, p: 0
      }}>
        {analysisHistory.map((analysis) => (
          <ListItemButton 
            key={analysis.id} 
            selected={selectedAnalysis?.id === analysis.id}
            onClick={() => handleAnalysisSelect(analysis)}
            sx={{
              py: 0.5, px: 1, minHeight: 32,
              '&.Mui-selected': {
                bgcolor: `${THEME_COLORS.primary}20`,
                '&:hover': { bgcolor: `${THEME_COLORS.primary}30` }
              }
            }}
          >
            <ListItemText 
              primary={
                <Typography fontSize="0.7rem" fontWeight="medium">
                  {new Date(analysis.request_timestamp).toLocaleString('ko-KR')}
                </Typography>
              }
              secondary={
                <Typography fontSize="0.6rem" color={THEME_COLORS.text.secondary}>
                  ID: {analysis.id.substring(0, 8)}... | {analysis.analysis_type}
                </Typography>
              }
            />
            <StatusChip status={analysis.status} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default function CTImageViewer({ 
  currentRequest, loading, error, 
  analysisHistory, selectedAnalysis, onAnalysisSelect, showAnalysisSelector 
}) {
  const [activeViewer, setActiveViewer] = useState('INTEGRATED');

  const getOhifUrl = (uid) => `http://35.188.47.40:8042/ohif/viewer?StudyInstanceUIDs=${uid}`;

  const getViewerProps = () => {
    if (!selectedAnalysis) {
      return { title: 'CT 뷰어', url: null, status: 'PENDING', error: null };
    }
    
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://35.188.47.40';
    const getFullUrl = (path) => path ? `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}` : '';
    
    switch(activeViewer) {
      case 'TOTAL':
        return {
          title: '🎨 전체 장기 분할',
          url: getFullUrl(selectedAnalysis.result?.visualization_3d_html_path),
          status: selectedAnalysis.status,
          error: selectedAnalysis.result?.error_message,
        };
      case 'OHIF':
        return {
          title: '📈 OHIF 뷰어',
          url: selectedAnalysis.study_uid ? getOhifUrl(selectedAnalysis.study_uid) : '',
          status: selectedAnalysis.status,
          error: null,
        };
      case 'INTEGRATED':
      default:
        return {
          title: '🔬 통합 뷰어',
          url: getFullUrl(selectedAnalysis.result?.integrated_viewer_html_path),
          status: selectedAnalysis.status,
          error: selectedAnalysis.result?.error_message,
        };
    }
  };

  const currentViewer = getViewerProps();

  return (
    <Card sx={{ 
      mb: 1, bgcolor: THEME_COLORS.surface,
      border: `1px solid ${THEME_COLORS.border}`,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <ToggleButtonGroup
            value={activeViewer}
            exclusive
            onChange={(event, newViewer) => {
              if (newViewer !== null) {
                setActiveViewer(newViewer);
              }
            }}
            aria-label="viewer selection"
            size="small"
          >
            <ToggleButton value="INTEGRATED" aria-label="integrated viewer">
              <ViewInAr sx={{ mr: 0.5, fontSize: '1rem' }} /> 통합
            </ToggleButton>
            <ToggleButton value="OHIF" aria-label="ohif viewer">
              <ImageSearch sx={{ mr: 0.5, fontSize: '1rem' }} /> OHIF
            </ToggleButton>
            <ToggleButton value="TOTAL" aria-label="total segmentation">
              <Hub sx={{ mr: 0.5, fontSize: '1rem' }} /> 전체 장기
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {showAnalysisSelector && (
          <AnalysisSelector
            analysisHistory={analysisHistory}
            selectedAnalysis={selectedAnalysis}
            onAnalysisSelect={onAnalysisSelect}
            loading={loading}
          />
        )}
        
        {loading && (
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <CircularProgress size={40} sx={{ color: THEME_COLORS.primary }} />
            <Typography sx={{ mt: 2, color: THEME_COLORS.text.secondary, fontSize: '0.8rem' }}>
              CT 분석 데이터 로딩 중...
            </Typography>
          </Box>
        )}
        
        {!loading && (
          <ViewerBlock
            title={currentViewer.title}
            url={currentViewer.url}
            status={currentViewer.status}
            error={currentViewer.error || error}
          />
        )}
      </CardContent>
    </Card>
  );
}
