import React, { useEffect, useState } from 'react';

function CTImageCard() {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    // 📌 여기 수정하면 됩니다: CT 썸네일 URL API 연동
    setImageUrl('https://via.placeholder.com/150?text=CT+Image');
  }, []);

  return (
    <div className="patient-card">
      <h3>🖼️ CT 이미지</h3>
      <img src={imageUrl} alt="CT" style={{ width: '100%', borderRadius: '8px' }} />
    </div>
  );
}

export default CTImageCard;
