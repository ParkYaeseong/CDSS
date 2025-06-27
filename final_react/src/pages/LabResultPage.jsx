import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function LabResultPage() {
  const { patientId } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    // 📌 여기 수정하면 됩니다: 백엔드에서 환자 검사결과 가져오는 fetch API
    setResult({
      name: '김이박',
      hb: 13.4,
      wbc: 7200,
      plt: 240000,
      crp: 0.3,
      date: '2025-06-06',
    });
  }, [patientId]);

  if (!result) return <p>로딩 중...</p>;

  return (
    <div style={{ padding: '60px' }}>
      <h2>🧪 {result.name}님의 검사 결과</h2>
      <ul>
        <li>Hb: {result.hb}</li>
        <li>WBC: {result.wbc}</li>
        <li>PLT: {result.plt}</li>
        <li>CRP: {result.crp}</li>
        <li>검사일: {result.date}</li>
      </ul>
    </div>
  );
}

export default LabResultPage;
