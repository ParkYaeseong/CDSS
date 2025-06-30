// final_react/src/components/omics/OmicsAnalysisViewer.jsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemButton, ListItemText, CircularProgress, Box, Alert } from '@mui/material';
// [확인] 변경된 서비스를 임포트합니다.
import OmicsService from '../../services/omics.service';
import OmicsResultDisplay from './OmicsResultDisplay';

const OmicsAnalysisViewer = ({ patientId }) => {
  // [확인] 상태 변수 이름이 더 명확하게 변경되었습니다. (analyses -> requests)
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      setError('');
      setResult(null);
      setSelectedRequestId(null);

      // [확인] 변경된 서비스 함수(getOmicsRequests)를 호출합니다.
      OmicsService.getOmicsRequests(patientId)
        .then(response => {
          setRequests(response.data);
          setLoading(false);
        })
        .catch(err => {
          setError('오믹스 분석 목록을 불러오는 데 실패했습니다.');
          setLoading(false);
        });
    }
  }, [patientId]);

  useEffect(() => {
    if (selectedRequestId) {
      setLoading(true);
      setError('');
      // [확인] 변경된 서비스 함수(getOmicsResult)를 호출합니다.
      OmicsService.getOmicsResult(selectedRequestId)
        .then(response => {
          setResult(response.data);
          setLoading(false);
        })
        .catch(err => {
          setError('분석 결과를 불러오는 데 실패했습니다.');
          setLoading(false);
        });
    }
  }, [selectedRequestId]);

  const handleSelectRequest = (id) => {
    setSelectedRequestId(id);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">오믹스 분석 결과</Typography>
        {/* ...이하 렌더링 로직... */}
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} mt={1}>
          <Box flex={1}>
            <Typography variant="subtitle2" color="text.secondary">분석 목록</Typography>
            <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #ddd', borderRadius: 1 }}>
              {requests.length > 0 ? requests.map(req => (
                <ListItemButton
                  key={req.id}
                  selected={selectedRequestId === req.id}
                  onClick={() => handleSelectRequest(req.id)}
                >
                  <ListItemText primary={req.cancer_type || '암종 분류'} secondary={`분석일: ${req.analysis_date}`} />
                </ListItemButton>
              )) : <Typography variant="body2" color="text.secondary" p={2}>완료된 분석이 없습니다.</Typography>}
            </List>
          </Box>
          <Box flex={2}>
            <OmicsResultDisplay result={result} loading={loading && !!selectedRequestId} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OmicsAnalysisViewer;