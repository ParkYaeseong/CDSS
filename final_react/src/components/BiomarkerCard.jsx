// src/components/BiomarkerCard.jsx

import React from 'react';

// 바이오마커 이름을 더 읽기 쉽게 변환하는 함수
const formatBiomarkerName = (rawName) => {
  if (typeof rawName !== 'string' || !rawName.startsWith('pred_')) {
    return rawName;
  }
  const parts = rawName.split('_');
  if (parts.length < 3) {
    return rawName;
  }
  const omicsType = parts[1].toUpperCase();
  const cancerType = parts[2];
  return `${cancerType}에 대한 ${omicsType} 예측 기여도`;
};

const BiomarkerCard = ({ biomarkerData }) => {
  // biomarkerData가 배열인지, 비어있지 않은지 확인합니다.
  if (!Array.isArray(biomarkerData) || biomarkerData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">주요 바이오마커 정보</h3>
        <p className="text-gray-500 mt-4">표시할 바이오마커 정보가 없습니다.</p>
      </div>
    );
  }

  // [수정] value가 문자열일 수 있으므로, 숫자로 변환하여 최대값을 계산합니다.
  const maxAbsValue = Math.max(...biomarkerData.map(b => Math.abs(parseFloat(b.value))), 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">
        주요 바이오마커 (예측 기여도)
      </h3>
      <div className="space-y-4 text-sm">
        {/* 이제 단순 배열을 직접 map으로 순회합니다. */}
        {biomarkerData.map((marker, index) => {
            const value = parseFloat(marker.value);
            const isPositive = value > 0;
            const barWidth = maxAbsValue > 0 ? (Math.abs(value) / maxAbsValue) * 100 : 0;

            return (
                <div key={index} className="flex items-center p-1 rounded-md">
                    <div className="w-1/3 truncate pr-2 font-medium text-gray-700" title={marker.name}>
                        {formatBiomarkerName(marker.name)}
                    </div>
                    <div className="w-2/3">
                        <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-5 relative">
                                <div
                                    className={`h-5 rounded-full ${isPositive ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>
                            <span className={`font-semibold w-20 text-right ${isPositive ? 'text-red-600' : 'text-blue-600'}`}>
                                {value.toFixed(4)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
      {/* 범례는 그대로 유지합니다. */}
      <div className="flex justify-end space-x-4 mt-4 text-xs text-gray-600">
          <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-red-500 mr-1.5"></div><span>암 예측 확률 증가</span></div>
          <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-blue-500 mr-1.5"></div><span>정상 예측 확률 증가</span></div>
      </div>
    </div>
  );
};

export default BiomarkerCard;