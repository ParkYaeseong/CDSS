// src/pages/OmicsResultPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useNavigate 임포트
import OmicsService from '../services/omics.service';
import { useAuth } from '../contexts/AuthContext';

import BiomarkerCard from '../components/BiomarkerCard';
import PCADetailModal from '../components/PCADetailModal';

// --- Helper Components (기존과 동일) ---
const StatusIndicator = ({ status }) => {
    const statusConfig = {
        'COMPLETED': { icon: '✅', color: 'text-green-600', label: '분석 완료' },
        'FAILED': { icon: '❌', color: 'text-red-600', label: '분석 실패' },
        'PROCESSING': { icon: '⏳', color: 'text-blue-600', label: '분석 중' },
        'QUEUED': { icon: '... ', color: 'text-gray-600', label: '대기 중' },
        'PENDING': { icon: '📎', color: 'text-yellow-600', label: '파일 업로드 중' },
        'default': { icon: '❔', color: 'text-gray-500', label: '알 수 없음' },
    };
    const config = statusConfig[status] || statusConfig.default;
    return (
        <div className={`flex items-center font-bold ${config.color}`}>
            <span>{config.icon}</span>
            <span className="ml-2">{config.label}</span>
        </div>
    );
};

const ResultCard = ({ result }) => {
    const predictionText = result.binary_cancer_prediction === 0 ? '정상 (Normal)' : '암 (Cancer)';
    const predictionColor = result.binary_cancer_prediction === 0 ? 'text-blue-600' : 'text-red-600';
    const probabilityPercentage = (result.binary_probability * 100).toFixed(2);
    // [핵심 수정] 백엔드에서 보낸 'predicted_cancer_type' 키를 직접 사용합니다.
    const predictedCancerType = result.predicted_cancer_type || 'N/A';
    
    // [신규] 해당 암종의 확률을 probabilities 객체에서 찾아옵니다.
    const cancerTypeProbability = result.probabilities && result.probabilities[predictedCancerType]
        ? (result.probabilities[predictedCancerType] * 100).toFixed(2)
        : null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">모델 예측 결과</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1차 분석 결과 */}
                <div className='space-y-4'>
                    <p className="text-md font-medium text-gray-600">1차 분석: 암 여부 예측</p>
                     <div>
                        <p className="text-sm font-medium text-gray-500">최종 진단 예측</p>
                        <p className={`text-2xl font-bold ${predictionColor}`}>{predictionText}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">암일 확률</p>
                        <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                            <div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${probabilityPercentage}%` }}></div>
                        </div>
                        <p className="text-right text-lg font-semibold text-indigo-600 mt-1">{probabilityPercentage}%</p>
                    </div>
                </div>
                {/* 2차 분석 결과 */}
                <div className='space-y-4'>
                    <p className="text-md font-medium text-gray-600">2차 분석: 암종 식별</p>
                    <div>
                        <p className="text-sm font-medium text-gray-500">가장 유력한 암 종류</p>
                        <p className="text-2xl font-bold text-teal-600">{predictedCancerType}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RequestInfoCard = ({ request }) => (
    // 기존과 동일
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">분석 요청 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
                <p className="font-medium text-gray-500">환자 이름</p>
                <p className="text-gray-900">{request.patient?.name || 'N/A'}</p>
            </div>
            <div>
                <p className="font-medium text-gray-500">분석 요청 ID</p>
                <p className="text-gray-900 break-all">{request.id || 'N/A'}</p>
            </div>
            <div>
                <p className="font-medium text-gray-500">분석 상태</p>
                <StatusIndicator status={request.status} />
            </div>
            <div>
                <p className="font-medium text-gray-500">요청일</p>
                <p className="text-gray-900">{new Date(request.request_timestamp).toLocaleString()}</p>
            </div>
        </div>
    </div>
);


const OmicsResultPage = () => {
    const { requestId } = useParams();
    const navigate = useNavigate(); // [신규] 돌아가기 버튼을 위해 useNavigate 훅 사용
    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated, isAuthLoading } = useAuth();
    const pollingIntervalRef = useRef(null); // 폴링을 위한 Ref

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAuthenticated) {
            setError('로그인이 필요합니다. 다시 로그인해주세요.');
            setLoading(false);
            return;
        }
        if (!requestId) {
            setError('분석 요청 ID가 URL에 제공되지 않았습니다.');
            setLoading(false);
            return;
        }

        // 폴링 중지 함수
        const stopPolling = () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };

        const pollForResult = async () => {
            try {
                // [수정] omics.service.js에 정의된 함수를 사용합니다.
                const response = await OmicsService.getOmicsFormattedResult(requestId);
                
                // 성공적으로 데이터를 받으면 폴링을 멈추고 상태 업데이트
                stopPolling();
                setResultData(response.data);
                setLoading(false);
                setError(null);

            } catch (err) {
                // 404 에러는 아직 결과가 준비되지 않은 것이므로, 계속 폴링합니다.
                if (err.response && err.response.status === 404) {
                    console.log("Result not ready yet, still polling...");
                    // 아직 로딩중 상태를 유지합니다.
                    setLoading(true); 
                } else {
                    // 그 외 다른 에러는 폴링을 멈추고 에러를 표시합니다.
                    console.error("Error fetching omics result:", err);
                    const errorMessage = err.response?.data?.detail || err.response?.data?.error || '분석 결과를 불러오는 데 실패했습니다.';
                    setError(errorMessage);
                    stopPolling();
                    setLoading(false);
                }
            }
        };

        // 페이지 로드 시 즉시 한 번 호출하고, 5초마다 반복
        pollForResult();
        pollingIntervalRef.current = setInterval(pollForResult, 5000);

        // 컴포넌트가 언마운트될 때 interval 정리
        return () => {
            stopPolling();
        };

    }, [requestId, isAuthenticated, isAuthLoading]);
    
    // [제거] PCA 관련 로직은 나중에 추가할 수 있으므로 일단 단순화
    // const handlePCAClick = ...

    if (loading || isAuthLoading) {
        return (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md flex items-center max-w-4xl mx-auto my-8">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-800 mr-3"></div>
                <div>
                    <p className="font-bold">분석이 아직 진행 중입니다.</p>
                    <p>결과가 나올 때까지 자동으로 확인합니다. 잠시만 기다려주세요.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md max-w-4xl mx-auto my-8" role="alert">
                <p className="font-bold">오류 발생</p>
                <p>{error}</p>
            </div>
        );
    }

    if (!resultData) {
        return <div className="text-center p-4 max-w-4xl mx-auto my-8">데이터가 없습니다.</div>;
    }

    // [수정] resultData.status를 확인하여 실패 시 다른 화면을 보여줍니다.
    if (resultData.status === 'FAILED') {
        return (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md max-w-4xl mx-auto my-8">
                <p className="font-bold">분석 실패</p>
                <p>오류 메시지: {resultData.error_message || "서버에 기록된 오류 메시지가 없습니다."}</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* [신규] 페이지 제목과 돌아가기 버튼 */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">오믹스 분석 결과 상세</h2>
                    <button
                        onClick={() => navigate('/nurse-panel')} // 클릭 시 간호사 패널 또는 원하는 목록 페이지로 이동
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <i className="fas fa-list mr-2"></i>
                        목록으로 돌아가기
                    </button>
                </div>

                <RequestInfoCard request={resultData} />

                {resultData.status === 'COMPLETED' ? (
                    <>
                        <ResultCard result={resultData} />
                        <BiomarkerCard biomarkerData={resultData.biomarkers} />
                        {/* SHAP 그래프가 있다면 여기에 표시 */}
                    </>
                ) : resultData.status === 'FAILED' ? (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
                        <p className="font-bold">분석 실패</p>
                        <p>오류 메시지: {resultData.error_message || "서버에 기록된 오류 메시지가 없습니다."}</p>
                    </div>
                ) : (
                    // 이 부분은 폴링 로직에 의해 거의 보이지 않지만, 예외 상황을 위해 남겨둡니다.
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-800 mr-3"></div>
                        <div>
                            <p className="font-bold">분석 상태 확인 중...</p>
                            <p>데이터를 불러오고 있습니다.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OmicsResultPage;