import React, { useState, useEffect } from 'react';
import { getLabResults } from '../services/laboratory.service';
import { List, ListItem, ListItemText, Typography, CircularProgress } from '@mui/material';

export default function LabResultCard({ patient }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // patient prop이 유효하고, patient.id가 있을 때만 API를 호출합니다.
    if (!patient || !patient.id) {
      setResults([]); // 환자가 없으면 결과 목록을 비웁니다.
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        // 우리 시스템의 고유 ID(patient.id)로 검사 결과를 요청합니다.
        const data = await getLabResults(patient.id);
        // API 응답이 { results: [...] } 형태일 것을 가정하고, 없으면 빈 배열로 처리합니다.
        setResults(data.results || []); 
      } catch (err) {
        setError(err.message);
        setResults([]); // 에러 발생 시 목록 비우기
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [patient]); // patient prop이 바뀔 때마다 다시 데이터를 가져옵니다.

  if (loading) {
    return <CircularProgress size={24} />;
  }

  if (error) {
    return <Typography color="error" variant="body2">오류: {error}</Typography>;
  }
  
  if (results.length === 0) {
    return <Typography color="text.secondary" variant="body2">검사 결과가 없습니다.</Typography>;
  }

  return (
    <List dense>
      {results.map(res => (
        <ListItem key={res.id} sx={{ pl: 0, pr: 0 }}>
          <ListItemText 
            primary={res.test_name} 
            secondary={`${res.result} (${new Date(res.date).toLocaleDateString()})`} 
          />
        </ListItem>
      ))}
    </List>
  );
}