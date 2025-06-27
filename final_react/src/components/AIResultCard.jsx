import React from 'react';
import { Typography } from '@mui/material'; // UI 라이브러리 사용 예시
import '../styles/PatientCard.css';

function AIResultCard({ result }) { // props로 result 객체를 직접 받습니다.
  
  // 데이터가 없거나, 로딩중이거나, 에러가 발생한 경우의 UI 처리
  if (!result) {
    return <Typography color="text.secondary">AI 분석 결과가 없거나 분석 중입니다.</Typography>;
  }
  
  if (result.error_message) {
    return <Typography color="error">분석 오류: {result.error_message}</Typography>;
  }

  return (
    <div className="patient-card-content"> {/* CSS 클래스명 통일 예시 */}
      <p><strong>진단 요약:</strong> {result.result_summary ?? '정보 없음'}</p>
      <p><strong>암 의심 확률:</strong> {
        typeof result.classification_probability === 'number'
          ? `${(result.classification_probability * 100).toFixed(1)}%`
          : '정보 없음'
      }</p>
      
      {result.gemini_interpretation && (
          <p><strong>AI 소견:</strong> {result.gemini_interpretation}</p>
      )}

      {result.completion_timestamp && (
        <small style={{ display: 'block', marginTop: '10px', color: '#888' }}>
          분석 완료: {new Date(result.completion_timestamp).toLocaleString()}
        </small>
      )}
    </div>
  );
}

export default AIResultCard;