// final_react/src/components/clinical/ComprehensiveReport.jsx (신규 파일)

import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { predictionService } from '../../services/prediction.service';
import { marked } from 'marked'; 

const ComprehensiveReport = ({ selectedPatient }) => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    setError('');
    setReport('');

    try {
      const response = await predictionService.getComprehensiveReport(selectedPatient.id);
      const htmlContent = marked.parse(response.data.report);
      setReport(htmlContent);
    } catch (err) {
      const errorMessage = err.response?.data?.report || err.response?.data?.error || '보고서 생성에 실패했습니다.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 환자가 선택되면 자동으로 보고서 생성 시도
    generateReport();
  }, [selectedPatient]);

  return (
    <Paper sx={{ p: 3, mt: 2, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        AI 종합 결과 보고서
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        환자의 CT, 오믹스, 임상 데이터를 종합하여 AI가 생성한 소견서입니다.
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={generateReport} 
        disabled={loading || !selectedPatient}
        sx={{ mb: 2 }}
      >
        {loading ? '보고서 생성 중...' : '보고서 재생성'}
      </Button>

      <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, minHeight: 400, bgcolor: '#f9f9f9' }}>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          report ? 
          // dangerouslySetInnerHTML을 사용하여 HTML 콘텐츠를 렌더링합니다.
          <Typography component="div" dangerouslySetInnerHTML={{ __html: report }} sx={{
            '& h1, & h2, & h3': { mt: 2, mb: 1, borderBottom: '1px solid #ddd', pb: 0.5 },
            '& p': { lineHeight: 1.6 },
            '& ul, & ol': { pl: 2 },
            '& strong': { color: '#005f63' }
          }}/>
          : <Typography color="text.secondary">환자를 선택하고 보고서 생성을 시작하세요.</Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ComprehensiveReport;