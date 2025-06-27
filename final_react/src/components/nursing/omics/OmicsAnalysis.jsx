// final_react/src/components/nursing/omics/OmicsAnalysis.jsx
import React, { useState, useEffect } from 'react'; // useEffect, useState 추가
import { useNavigate } from 'react-router-dom'; // useNavigate 추가
import {
    Box, Typography, Grid, FormControl, InputLabel, Select,
    MenuItem, Button, CircularProgress // CircularProgress 추가 (로딩 인디케이터용)
} from '@mui/material';
import LabResultCard from '../../LabResultCard'; // LabResultCard 임포트 유지
import OmicsService from '../../../services/omics.service'; // OmicsService 임포트 추가

// 공통 Select 스타일 (기존과 동일)
const selectStyles = {
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#e5e7eb',
        '& legend': {
            display: 'none'
        }
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#E0969F'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#E0969F !important',
        outline: 'none'
    },
    '& .MuiSelect-select': {
        '&:focus': {
            backgroundColor: 'transparent'
        }
    },
    '&:focus-within': {
        outline: 'none',
        boxShadow: 'none'
    },
    '& .MuiInputLabel-root': {
        display: 'none'
    }
};

// [신규] 표준 오믹스 파일 요구사항을 상수로 정의
const STANDARD_OMICS_REQUIREMENTS = [
    {'type': 'RNA-seq', 'description': '유전자 발현 데이터 (RNA-seq)'},
    {'type': 'Methylation', 'description': '메틸레이션 데이터 (Methylation)'},
    {'type': 'Mutation', 'description': '유전자 변이 데이터 (Mutation)'},
    {'type': 'CNV', 'description': '유전자 복제수 변이 데이터 (CNV)'},
    {'type': 'miRNA', 'description': '마이크로RNA 데이터 (miRNA)'},
];

export default function OmicsAnalysis({
    patients, // NursePanel로부터 받은 환자 목록 (이 컴포넌트에서 환자 선택에 사용)
    selectedPatientForOmics, // NursePanel로부터 받은 선택된 환자 ID (초기값으로 사용)
    setSelectedPatientForOmics, // NursePanel로 선택된 환자 ID를 다시 전달하는 함수
}) {
    const navigate = useNavigate(); // useNavigate 훅 추가

    // OmicsAnalysis 컴포넌트 자체에서 관리할 상태들
    // localSelectedPatient: 이 컴포넌트 내에서 사용할 선택된 환자 객체
    const [localSelectedPatient, setLocalSelectedPatient] = useState(
        patients.find(p => p.id === selectedPatientForOmics?.id) || null
    );
    const [omicsRequest, setOmicsRequest] = useState(null); // omicsRequest 상태 추가 (분석 요청 ID)
    const [requirements, setRequirements] = useState(STANDARD_OMICS_REQUIREMENTS); // 요구사항 목록
    const [uploadedFiles, setUploadedFiles] = useState({}); // **로컬 상태로 정의**: 업로드된 파일 목록
    const [isLoading, setIsLoading] = useState(false); // 전체 로딩 상태
    const [error, setError] = useState(''); // 에러 메시지
    const [isUploading, setIsUploading] = useState({}); // 개별 파일 업로드 로딩 상태

    // prop으로 받은 selectedPatientForOmics가 변경될 때 localSelectedPatient 업데이트
    // 컴포넌트의 로컬 상태와 부모의 prop을 동기화
    useEffect(() => {
        const patientObj = patients.find(p => p.id === selectedPatientForOmics?.id) || null;
        setLocalSelectedPatient(patientObj);
        // 환자 변경 시 기존 omicsRequest 및 uploadedFiles 초기화 (새로운 분석 요청을 위해)
        setOmicsRequest(null);
        setUploadedFiles({});
    }, [selectedPatientForOmics, patients]);


    // 환자 선택 핸들러 (MUI Select에서 사용)
    const handlePatientSelect = (event) => {
        const patientId = event.target.value;
        const patientObj = patients.find(p => p.id === patientId);
        setSelectedPatientForOmics(patientObj); // 부모 컴포넌트의 상태 업데이트
        // setLocalSelectedPatient(patientObj); // useEffect가 처리하므로 여기서 직접 호출 불필요
    };

    // 1. 분석 요청 생성 핸들러
    const handleCreateRequest = async () => {
        console.log('DEBUG: handleCreateRequest - selectedPatient:', localSelectedPatient);
        if (!localSelectedPatient) {
            alert("환자를 선택해야 분석 요청을 생성할 수 있습니다.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await OmicsService.createOmicsRequest({
                patient: localSelectedPatient.id, // localSelectedPatient 사용
            });
            setOmicsRequest(response.data);
            alert(`분석 요청(ID: ...${response.data.id.slice(-6)})이 생성되었습니다. 이제 파일을 업로드해주세요.`);
        } catch (err) {
            const errorMsg = err.response?.data?.patient?.[0] || err.message || "분석 요청 생성에 실패했습니다.";
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. 파일 업로드 핸들러
    const handleFileUpload = async (file, requirement) => { // 파일과 요구사항 객체 통째로 받기
        if (!omicsRequest) { // 분석 요청이 먼저 생성되어야 함
            alert("먼저 '1. 분석 요청 생성' 버튼을 눌러주세요.");
            return;
        }
        if (!file) return;

        const { type: omicsType } = requirement; // requirement 객체에서 type 추출
        setIsUploading(prev => ({ ...prev, [omicsType]: true }));
        setError('');

        try {
            // 실제 파일 업로드 API 호출
            await OmicsService.uploadOmicsFile(omicsRequest.id, file, omicsType);
            setUploadedFiles(prev => ({ ...prev, [omicsType]: file })); // 업로드 성공 시 로컬 상태 업데이트
            alert(`'${file.name}' 파일(${omicsType}) 업로드 성공!`);
        } catch (err) {
            setError(err.message || "파일 업로드에 실패했습니다.");
            // 업로드 실패 시 파일 인풋 초기화
            const fileInput = document.getElementById(`file-input-${omicsType}`);
            if (fileInput) fileInput.value = "";
        } finally {
            setIsUploading(prev => ({ ...prev, [omicsType]: false }));
        }
    };

    // 분석 시작 가능 여부 (하나 이상의 파일이 업로드되었는지 확인)
    const isAnalysisStartable = omicsRequest && Object.keys(uploadedFiles).length > 0;

    // 3. 분석 시작 핸들러
    const handleStartAnalysis = async () => {
        console.log("DEBUG: handleStartAnalysis function started.");
        if (!isAnalysisStartable) {
            alert("적어도 하나 이상의 오믹스 파일을 업로드해야 합니다.");
            console.log("DEBUG: Analysis not startable.");
            return;
        };
        setIsLoading(true);
        setError('');
        try {
            console.log("DEBUG: Calling OmicsService.startAnalysisPipeline with ID:", omicsRequest.id);
            // 실제 분석 시작 API 호출
            await OmicsService.startAnalysisPipeline(omicsRequest.id);
            alert("분석 작업이 성공적으로 시작되었습니다. 결과 페이지로 이동합니다.");
            navigate(`/omics/result/${omicsRequest.id}`);
        } catch (err) {
            console.error("DEBUG: Error in handleStartAnalysis:", err);
            setError(err.message || "분석 시작에 실패했습니다.");
        } finally {
            setIsLoading(false);
            console.log("DEBUG: handleStartAnalysis function finished.");
        }
    };

    // 전체 컴포넌트 로딩 상태 (API 요청 시)
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: '#E0969F' }} />
                <Typography sx={{ ml: 2, color: '#E0969F' }}>처리 중...</Typography>
            </Box>
        );
    }

    // 환자가 선택되지 않은 경우 렌더링 (환자 선택 유도)
    if (!localSelectedPatient) {
        return (
            <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#8B4A52' }}>
                    🧬 오믹스 분석
                </Typography>
                <Box sx={{
                    bgcolor: 'white', borderRadius: 1, border: '1px solid #e5e7eb',
                    borderLeft: '4px solid #E0969F', mb: 3, p: 3, textAlign: 'center'
                }}>
                    <Typography variant="h6" sx={{ color: '#8B4A52', mb: 1 }}>
                        환자를 선택해주세요
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        오믹스 분석을 시작하려면 먼저 환자를 선택해야 합니다.
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>환자 선택</InputLabel>
                        <Select
                            value={selectedPatientForOmics?.id || ''} // prop으로 받은 환자 ID 사용
                            onChange={handlePatientSelect} // 새로운 핸들러 사용
                            label="환자 선택"
                            displayEmpty
                            sx={selectStyles}
                            MenuProps={{ disableScrollLock: true, PaperProps: { sx: { '& .MuiMenuItem-root': { '&:hover': { backgroundColor: '#F5E6E8' }, '&.Mui-selected': { backgroundColor: '#E0969F', color: 'white', '&:hover': { backgroundColor: '#C8797F' } } } } } }}
                        >
                            <MenuItem value="" disabled>
                                환자를 선택해주세요
                            </MenuItem>
                            {patients.map(p => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.name} (ID: {p.openemr_id})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>
        );
    }

    // 환자가 선택된 후의 메인 분석 UI 렌더링
    return (
        <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#8B4A52' }}>
                🧬 오믹스 분석
            </Typography>

            {/* 환자 정보 표시 섹션 */}
            <Box sx={{
                bgcolor: 'white',
                borderRadius: 1,
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #E0969F',
                mb: 3
            }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
                        🧬 현재 분석 환자
                    </Typography>
                    <Grid container spacing={3} alignItems="end">
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>환자 선택</InputLabel>
                                <Select
                                    value={localSelectedPatient?.id || ''}
                                    onChange={handlePatientSelect}
                                    label="환자 선택"
                                    displayEmpty
                                    sx={selectStyles}
                                    MenuProps={{
                                        disableScrollLock: true,
                                        PaperProps: {
                                            sx: {
                                                '& .MuiMenuItem-root': {
                                                    '&:hover': {
                                                        backgroundColor: '#F5E6E8'
                                                    },
                                                    '&.Mui-selected': {
                                                        backgroundColor: '#E0969F',
                                                        color: 'white',
                                                        '&:hover': {
                                                            backgroundColor: '#C8797F'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                >
                                    {/* 현재 선택된 환자를 기본으로 표시하고, 다른 환자도 선택 가능 */}
                                    {patients.map(p => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.name} (ID: {p.openemr_id})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                p: 2,
                                bgcolor: '#F5E6E8',
                                borderRadius: 1,
                                border: '1px solid #E0969F',
                                textAlign: 'center'
                            }}>
                                <Typography variant="body1" fontWeight="600" sx={{ color: '#8B4A52' }}>
                                    {localSelectedPatient
                                        ? `선택된 환자: ${localSelectedPatient.name}`
                                        : '환자를 선택해주세요'
                                    }
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    분석 종류: 종합 오믹스 분석 (자동 업로드 식별)
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* 분석 단계 섹션 */}
            <Box sx={{
                bgcolor: 'white',
                borderRadius: 1,
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #E0969F',
                mb: 3
            }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
                        📋 분석 단계
                    </Typography>

                    {/* 1. 분석 요청 생성 */}
                    <Box sx={{ mb: 3 }}>
                        <Button
                            onClick={handleCreateRequest}
                            disabled={isLoading || omicsRequest} // 로딩 중이거나 요청 생성되었으면 비활성화
                            variant="contained"
                            sx={{
                                bgcolor: '#E0969F',
                                '&:hover': { bgcolor: '#C8797F' },
                                '&:disabled': { bgcolor: '#f3f4f6', color: '#9ca3af' }
                            }}
                        >
                            1. 분석 요청 생성
                        </Button>
                        {omicsRequest && <Typography variant="body2" sx={{ ml: 2, color: '#10b981', display: 'inline' }}><i className="fas fa-check"></i> 요청 생성됨 (ID: ...{omicsRequest.id.slice(-6)})</Typography>}
                    </Box>

                    {/* 2. 파일 업로드 섹션 */}
                    {omicsRequest && ( // 분석 요청이 생성되었을 때만 파일 업로드 섹션 표시
                        <Box sx={{ mt: 4, borderTop: '1px solid #e5e7eb', pt: 3 }}>
                            <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#374151' }}>
                                📁 2. 분석용 파일 업로드 (가지고 있는 모든 파일을 올려주세요)
                            </Typography>
                            <Grid container spacing={3}>
                                {requirements.map(req => {
                                    const isUploaded = !!uploadedFiles[req.type]; // uploadedFiles 상태 사용
                                    const isThisUploading = !!isUploading[req.type];

                                    return (
                                        <Grid item xs={12} md={6} lg={4} key={req.type}>
                                            <Box sx={{
                                                p: 3,
                                                border: `2px dashed ${isUploaded ? '#10b981' : '#E0969F'}`,
                                                borderRadius: 2,
                                                textAlign: 'center',
                                                bgcolor: isUploaded ? '#e8f5e9' : '#fafafa',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    borderColor: isUploaded ? '#0b8b5a' : '#C8797F',
                                                    bgcolor: isUploaded ? '#d4edda' : '#F5E6E8'
                                                }
                                            }}>
                                                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: isUploaded ? '#0b8b5a' : '#8B4A52' }}>
                                                    {req.description} ({req.type})
                                                </Typography>
                                                <input
                                                    type="file"
                                                    accept=".csv,.tsv,.txt,.xlsx"
                                                    style={{ display: 'none' }}
                                                    id={`file-input-${req.type}`}
                                                    onChange={(e) => handleFileUpload(e.target.files[0], req)} // handleFileUpload 호출
                                                    disabled={isThisUploading || isLoading}
                                                />
                                                <label htmlFor={`file-input-${req.type}`}>
                                                    <Button
                                                        variant={isUploaded ? "contained" : "outlined"}
                                                        component="span"
                                                        sx={{
                                                            color: isUploaded ? 'white' : '#E0969F',
                                                            bgcolor: isUploaded ? '#E0969F' : 'transparent',
                                                            borderColor: '#E0969F',
                                                            '&:hover': {
                                                                bgcolor: isUploaded ? '#C8797F' : '#F5E6E8'
                                                            }
                                                        }}
                                                    >
                                                        {isThisUploading ? <CircularProgress size={20} color="inherit" /> : (isUploaded ? '파일 변경' : '파일 선택')}
                                                    </Button>
                                                </label>

                                                {uploadedFiles[req.type] ? ( // uploadedFiles 상태 사용
                                                    <Typography variant="caption" display="block" sx={{ mt: 1, color: '#8B4A52' }}>
                                                        선택된 파일: {uploadedFiles[req.type].name}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" display="block" sx={{ mt: 1, color: '#6b7280' }}>
                                                        선택된 파일 없음
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    )}

                    {/* 3. 분석 시작 버튼 */}
                    {omicsRequest && ( // 분석 요청이 생성되었을 때만 분석 시작 버튼 표시
                        <Box sx={{ mt: 4, borderTop: '1px solid #e5e7eb', pt: 3 }}>
                            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
                                🚀 3. 분석 시작
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleStartAnalysis} // handleStartAnalysis 호출
                                disabled={Boolean(!isAnalysisStartable || isLoading)} // Boolean()으로 명확히 true/false로 변환
                                sx={{
                                    bgcolor: '#E0969F',
                                    '&:hover': { bgcolor: '#C8797F' },
                                    '&:disabled': {
                                        bgcolor: '#f3f4f6',
                                        color: '#9ca3af'
                                    },
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.1rem'
                                }}
                            >
                                통합 오믹스 분석 시작
                            </Button>

                            {error && <Typography color="error" sx={{ mt: 2 }}>오류: {error}</Typography>}
                            <Typography variant="caption" display="block" sx={{ mt: 2, color: '#6b7280' }}>
                                분석에는 약 10-30분이 소요될 수 있습니다.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>


            {/* 분석 결과 섹션 (이전 분석 결과 표시) */}
            {localSelectedPatient && ( // localSelectedPatient 기준으로 렌더링
                <Box sx={{
                    bgcolor: 'white',
                    borderRadius: 1,
                    border: '1px solid #e5e7eb',
                    borderLeft: '4px solid #10b981'
                }}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#10b981' }}>
                            📈 분석 결과 (이전 분석)
                        </Typography>
                        {/* LabResultCard에 올바른 patient 객체 전달 */}
                        <LabResultCard patient={patients.find(p => p.id === localSelectedPatient.id)} />
                    </Box>
                </Box>
            )}
        </Box>
    );
}