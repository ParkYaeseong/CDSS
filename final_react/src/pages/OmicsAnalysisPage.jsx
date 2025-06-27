// final_react/src/pages/OmicsAnalysisPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OmicsService from '../services/omics.service';
import '../styles/MedicalDashboard.css';
import { List, ListItem, ListItemText, Button } from '@mui/material'; // MUI 컴포넌트 추가

const STANDARD_OMICS_REQUIREMENTS = [
    { 'type': 'RNA-seq', 'description': '유전자 발현 데이터 (RNA-seq)' },
    { 'type': 'Methylation', 'description': '메틸레이션 데이터 (Methylation)' },
    { 'type': 'Mutation', 'description': '유전자 변이 데이터 (Mutation)' },
    { 'type': 'CNV', 'description': '유전자 복제수 변이 데이터 (CNV)' },
    { 'type': 'miRNA', 'description': '마이크로RNA 데이터 (miRNA)' },
];

const OmicsAnalysisPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // --- State 선언부 ---
    const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
    const [omicsRequest, setOmicsRequest] = useState(null);
    const [requirements, setRequirements] = useState(STANDARD_OMICS_REQUIREMENTS);
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState({});

    const [previousAnalyses, setPreviousAnalyses] = useState([]); // 이전 분석 목록 저장 상태
    const [isListLoading, setIsListLoading] = useState(false);   // 목록 로딩 상태
    
    const [analysisStatus, setAnalysisStatus] = useState('IDLE');
    const pollingIntervalRef = useRef(null);

    // --- Effects ---
    useEffect(() => {
        if (!location.state?.patient) {
            alert("환자 정보 없이 접근할 수 없습니다. 패널에서 다시 시도해주세요.");
            navigate('/nurse-panel');
        }
    }, [location.state, navigate]);
    
    // ▼▼▼ 1. [데이터 로딩 useEffect 추가] 선택된 환자가 바뀔 때마다 이전 분석 목록을 가져옵니다. ▼▼▼
    useEffect(() => {
        // selectedPatient 객체가 있고, 그 안에 id(UUID)가 있을 때만 API를 호출합니다.
        if (selectedPatient?.id) {
            setIsListLoading(true); // 목록 로딩 시작

            // 서비스 파일을 호출하여 특정 환자의 분석 목록을 가져옵니다.
            OmicsService.getOmicsRequestsByPatient(selectedPatient.id)
                .then(response => {
                    setPreviousAnalyses(response.data); // 성공 시 상태에 저장
                })
                .catch(err => {
                    console.error("이전 오믹스 분석 목록 로딩 실패:", err);
                    setPreviousAnalyses([]); // 에러 발생 시 목록 비우기
                })
                .finally(() => {
                    setIsListLoading(false); // 목록 로딩 종료
                });
        } else {
            setPreviousAnalyses([]); // 선택된 환자가 없으면 목록을 비웁니다.
        }
    }, [selectedPatient]); // `selectedPatient`가 바뀔 때마다 이 로직이 다시 실행됩니다.
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // --- 폴링 로직을 처리하는 useEffect ---
    useEffect(() => {
        const stopPolling = () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };

        if (analysisStatus === 'POLLING' && omicsRequest?.id) {
            const pollForResult = async () => {
                try {
                    console.log(`Polling for result... Request ID: ${omicsRequest.id}`);
                    const response = await OmicsService.getOmicsFormattedResult(omicsRequest.id);
                    const resultData = response.data;
                    
                    if (resultData.status === 'COMPLETED' || resultData.status === 'FAILED') {
                        stopPolling();
                        setAnalysisStatus(resultData.status);
                        alert("분석이 완료되었습니다. 결과 페이지로 이동합니다.");
                        navigate(`/omics/result/${omicsRequest.id}`);
                    }
                } catch (err) {
                    if (err.response && err.response.status === 404) {
                        console.log("Result not ready yet. Continuing to poll.");
                    } else {
                        console.error("Error during polling:", err);
                        setError("결과를 가져오는 중 오류가 발생했습니다: " + (err.message || "서버 통신 실패"));
                        setAnalysisStatus('FAILED');
                        stopPolling();
                    }
                }
            };
            
            pollingIntervalRef.current = setInterval(pollForResult, 5000);
        }

        return () => {
            stopPolling();
        };
    }, [analysisStatus, omicsRequest?.id, navigate]);


    // --- 핸들러 함수들 (기존과 동일) ---
    const handleCreateRequest = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await OmicsService.createOmicsRequest({ patient: selectedPatient.id });
            setOmicsRequest(response.data);
            alert(`분석 요청(ID: ...${response.data.id.slice(-6)})이 생성되었습니다.`);
        } catch (err) {
            setError(err.message || "분석 요청 생성에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (file, requirement) => {
        if (!omicsRequest) {
            alert("먼저 '분석 요청 생성' 버튼을 눌러주세요.");
            return;
        }
        if (!file) return;

        const { type: omicsType } = requirement;
        setIsUploading(prev => ({ ...prev, [omicsType]: true }));
        try {
            await OmicsService.uploadOmicsFile(omicsRequest.id, file, omicsType);
            setUploadedFiles(prev => ({ ...prev, [omicsType]: file }));
        } catch (err) {
            setError(err.message || "파일 업로드에 실패했습니다.");
            document.getElementById(`file-input-${omicsType}`).value = "";
        } finally {
            setIsUploading(prev => ({ ...prev, [omicsType]: false }));
        }
    };
    
    const isAnalysisStartable = omicsRequest && Object.keys(uploadedFiles).length > 0;

    const handleStartAnalysis = async () => {
        if (!isAnalysisStartable) return;
        setIsLoading(true);
        setError('');
        try {
            await OmicsService.startAnalysisPipeline(omicsRequest.id);
            setAnalysisStatus('POLLING');
        } catch (err) {
            setError(err.message || "분석 시작에 실패했습니다.");
            setIsLoading(false);
        }
    };

    // --- 렌더링 ---
    if (analysisStatus === 'POLLING') {
        // (폴링 중 화면은 기존과 동일)
        return (
            <div className="medical-dashboard">
                <div className="main-content">
                    <div className="content-card text-center">
                        <div className="card-body p-5">
                            <h3 className="card-title text-xl font-bold">분석이 진행 중입니다...</h3>
                            <div className="spinner-border text-primary my-4" style={{width: '3rem', height: '3rem'}} role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="text-muted">서버에서 오믹스 데이터를 분석하고 있습니다.<br/>결과가 나오면 자동으로 페이지가 이동됩니다. 이 페이지를 벗어나지 마세요.</p>
                            {error && <p className="mt-4 text-danger">{error}</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="medical-dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <h1 className="page-title"><i className="fas fa-microscope"></i> 오믹스 분석 요청</h1>
                    <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}><i className="fas fa-arrow-left"></i> 이전으로 돌아가기</button>
                </div>
            </div>
            <div className="main-content">
                <div className="content-card">
                    <div className="card-header"><h3 className="card-title">분석 정보</h3></div>
                    <div className="card-body">
                        <p><strong>환자:</strong> {selectedPatient?.name} (ID: {selectedPatient?.openemr_id})</p>
                        <p><strong>분석 종류:</strong> 종합 오믹스 분석 (자동 암종 식별)</p>
                    </div>
                </div>

                <div className="content-card mt-4">
                    <div className="card-header"><h3 className="card-title">분석 단계</h3></div>
                    <div className="card-body">
                        {/* (분석 단계 관련 JSX는 기존과 동일) */}
                        <div className="mb-3">
                            <button onClick={handleCreateRequest} disabled={isLoading || omicsRequest} className="btn btn-primary">
                                1. 분석 요청 생성
                            </button>
                            {omicsRequest && <span className="ms-3 text-success"><i className="fas fa-check"></i> 요청 생성됨 (ID: ...{omicsRequest.id.slice(-6)})</span>}
                        </div>
                        {omicsRequest && (
                            <div className="mt-4 border-top pt-3">
                                {/* ... 파일 업로드 부분 ... */}
                                <h5 className="mb-3">2. 분석용 파일 업로드 (가지고 있는 모든 파일을 올려주세요)</h5>
                                {requirements.map(req => {
                                    // ... 파일 업로드 아이템 렌더링 ...
                                    const isUploaded = !!uploadedFiles[req.type];
                                    const isThisUploading = !!isUploading[req.type];
                                    return (
                                        <div key={req.type} className={`file-upload-item p-2 mb-2 border rounded ${isUploaded ? 'bg-light-success' : ''}`}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <p className="mb-0">
                                                    {isUploaded ? <i className="fas fa-check-circle text-success me-2"></i> : <i className="fas fa-times-circle text-danger me-2"></i>} 
                                                    {req.description} <strong>({req.type})</strong>
                                                </p>
                                                <input type="file" id={`file-input-${req.type}`} className="d-none" onChange={(e) => handleFileUpload(e.target.files[0], req)} disabled={isThisUploading || isLoading} />
                                                <label htmlFor={`file-input-${req.type}`} className={`btn btn-sm ${isUploaded ? 'btn-secondary' : 'btn-outline-primary'}`}>
                                                    {isThisUploading ? '업로드 중...' : (isUploaded ? '파일 변경' : '파일 선택')}
                                                </label>
                                            </div>
                                            {isUploaded && <small className="text-muted d-block mt-1 ms-4">파일명: {uploadedFiles[req.type].name}</small>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {omicsRequest && (
                            <div className="mt-4 border-top pt-3">
                                <button onClick={handleStartAnalysis} disabled={!isAnalysisStartable || isLoading} className="btn btn-success btn-lg">
                                    3. 분석 시작
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ▼▼▼ 2. [이전 분석 결과 목록 카드 추가] 이 JSX 블록 전체를 여기에 추가합니다. ▼▼▼ */}
                <div className="content-card mt-4">
                    <div className="card-header"><h3 className="card-title">📈 이전 분석 결과</h3></div>
                    <div className="card-body">
                        {isListLoading ? (
                            // 1. 목록 로딩 중일 때
                            <div className="d-flex justify-content-center">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : previousAnalyses.length > 0 ? (
                            // 2. 불러온 결과(62건)가 있을 때
                            <List dense sx={{ padding: 0 }}>
                                {previousAnalyses.map(res => (
                                    <ListItem
                                        key={res.id}
                                        className="p-0"
                                        secondaryAction={
                                            <Button
                                                size="small"
                                                edge="end"
                                                onClick={() => navigate(`/omics/result/${res.id}`)}
                                            >
                                                결과 보기
                                            </Button>
                                        }
                                    >
                                        <ListItemText
                                            primary={`분석 요청 (${res.status})`}
                                            secondary={`요청 시간: ${new Date(res.request_timestamp).toLocaleString()}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            // 3. 불러온 결과가 없을 때
                            <p className="text-muted">이전 분석 결과가 없습니다.</p>
                        )}
                    </div>
                </div>
                {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}

                {isLoading && <p className="mt-3">처리 중...</p>}
                {error && <p className="mt-3 text-danger">{error}</p>}
            </div>
        </div>
    );
};

export default OmicsAnalysisPage;