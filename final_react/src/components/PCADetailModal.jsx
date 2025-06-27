// src/components/PCADetailModal.jsx

import React from 'react';

const PCADetailModal = ({ data, isLoading, onClose }) => {
  // 모달 뒷 배경 클릭 시 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">PCA 컴포넌트 상세 정보</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : data && !data.error ? (
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">PCA Component</p>
                <p className="font-semibold text-blue-700">{data.pca_component_name}</p>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500">Derived from</p>
                <p className="font-semibold">{data.omics_source} Data</p>
              </div>

              <h4 className="text-md font-semibold mb-3">상위 10개 원본 특징 (Feature Loadings)</h4>
              <div className="space-y-2 text-sm">
                {/* 헤더 */}
                <div className="flex font-bold text-gray-600 border-b pb-1">
                    <div className="w-2/3">원본 특징 (Original Feature)</div>
                    <div className="w-1/3 text-right">기여도 (Loading Value)</div>
                </div>
                {/* 목록 */}
                {data.top_loadings?.map((item, index) => (
                  <div key={index} className="flex items-center border-b py-1.5">
                    <div className="w-2/3 truncate pr-2 font-mono" title={item.original_feature}>
                      {item.original_feature}
                    </div>
                    <div className={`w-1/3 text-right font-mono font-semibold ${item.loading_value > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {item.loading_value.toFixed(6)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-red-600 py-8">
              <p className="font-bold">오류</p>
              <p>{data?.error || "상세 정보를 불러올 수 없습니다."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PCADetailModal;