// final_react/src/components/nursing/common/LoadingOverlay.jsx
import React from 'react';

function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>처리 중...</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
