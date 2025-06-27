// src/components/DrugInteractionCard.jsx

import React, { useState } from 'react';
import { checkDrugInteraction } from '../services/cdss.service.js'; // 이 파일의 checkDrugInteraction 함수 중요!
import { TextField, Button, List, ListItem, ListItemText, CircularProgress, Typography, Box, Alert, Divider } from '@mui/material'; // Divider 임포트 추가

function DrugInteractionCard() {
  const [drugInput, setDrugInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckInteraction = async () => {
    const drugList = drugInput.split('\n').map(drug => drug.trim()).filter(Boolean);

    if (drugList.length < 1) {
      setError('최소 1개 이상의 약물을 입력해주세요.');
      setResult(null); // 이전 결과 지우기
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null); // 이전 결과 초기화

    try {
      // cdss.service.js에서 이미 response.data를 반환하도록 수정했으므로,
      // 'data' 변수는 이제 백엔드 API의 실제 응답 JSON 객체가 됩니다.
      const data = await checkDrugInteraction(drugList);
      
      // 디버깅: API에서 받은 실제 데이터 확인
      console.log("API Response Data (from service):", data); 
      
      setResult(data); // 이 'data'를 직접 result 상태에 저장합니다.
    } catch (err) {
      console.error("Error checking drug interaction in component:", err); // 컴포넌트에서 에러 로깅
      // 서비스에서 에러 객체 전체를 던지므로, err.response를 통해 백엔드 에러 확인 가능
      if (err.response && err.response.status === 404) {
        // 백엔드가 404와 함께 { "message": "..." }를 보낼 때
        setResult(err.response.data); 
      } else {
        // 기타 네트워크 오류 또는 서비스에서 던진 일반 Error
        setError(err.message || '오류가 발생했습니다. 자세한 내용은 콘솔을 확인하세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        검사할 약물 목록을 한 줄에 하나씩 입력하세요.
      </Typography>
      <TextField
        multiline
        rows={4}
        fullWidth
        variant="outlined"
        value={drugInput}
        onChange={(e) => setDrugInput(e.target.value)}
        placeholder="예: 니트로글리세린 (1개 조회)&#10;또는&#10;아스피린&#10;와파린 (2개 이상 상호작용 검사)"
      />
      <Button
        variant="contained"
        onClick={handleCheckInteraction}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : '병용금기 검사'}
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      
      {/* result 상태에 데이터가 있을 때만 결과를 표시 */}
      {result && (
        <Box mt={2}>
          {/* 디버깅을 위한 result 상태값 출력 (필요 없으면 이 부분을 제거하세요) */}
          {/* <Typography variant="caption" color="text.secondary">
            Result State (For Debugging): {JSON.stringify(result, null, 2)}
          </Typography>
          <Divider sx={{ my: 1 }} /> */}

          {/* 결과 표시 로직 */}
          {/* Case 1: 단일 약물 조회 결과 (contraindicated_with 배열이 있는 경우) */}
          {result.contraindicated_with && Array.isArray(result.contraindicated_with) ? (
            <Alert severity="info">
              <strong>'{result.drug_name}'의 병용금기 정보 ({result.total_count}건)</strong>
              {result.contraindicated_with.length > 0 ? (
                <List dense>
                  {result.contraindicated_with.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={item.ingredient_name}
                        secondary={item.reason}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" sx={{ mt: 1 }}>해당 약물에 대한 병용금기 정보가 없습니다.</Typography>
              )}
            </Alert>
          ) : 
          /* Case 2: 다중 약물 상호작용 검사 결과 (interactions 배열이 있는 경우) */
          result.interactions && Array.isArray(result.interactions) ? (
            result.interactions.length > 0 ? (
              <Alert severity="warning">
                <strong>주의! 다음 약물들 간의 병용금기 정보가 있습니다:</strong>
                <List dense>
                  {result.interactions.map((interaction, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`[${interaction.pair.join(', ')}]`}
                        secondary={interaction.reason}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            ) : (
              <Alert severity="success">입력된 약물 간의 병용금기 정보가 없습니다.</Alert>
            )
          ) : 
          /* Case 3: 기타 메시지 (예: 단일 조회 결과 없거나, API에서 메시지만 보낼 경우) */
          result.message ? (
              <Alert severity="success">{result.message}</Alert>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

export default DrugInteractionCard;