// src/components/DrugInteractionComponent.jsx - 중복 처방 허용 버전

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  ClickAwayListener,
  Button,
  Portal,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Search,
  Delete,
  Warning,
  Save,
  Print,
  LocalPharmacy,
  Person
} from '@mui/icons-material';
import { 
  checkDrugInteraction, 
  searchDrugs, 
  savePrescription as savePrescriptionAPI,
  getPatientPrescriptions
} from '../services/cdss.service.js';

// 다른 페이지와 동일한 색상 테마 적용
const THEME_COLORS = {
  primary: '#007C80',       // 진한 청록색
  secondary: '#14b8a6',     // 중간 청록색
  accent: '#5eead4',        // 밝은 청록색
  background: '#f8fafc',    // 배경색
  surface: '#ffffff',       // 카드 배경
  surfaceHover: '#f1f5f9',  // 호버 색상
  border: '#e2e8f0',        // 테두리 색상
  borderLight: '#f1f5f9',   // 연한 테두리
  text: {
    primary: '#1e293b',     // 기본 텍스트
    secondary: '#64748b',   // 보조 텍스트
    light: '#94a3b8'        // 연한 텍스트
  },
  status: {
    success: '#10b981',     // 성공 색상
    warning: '#f59e0b',     // 경고 색상
    error: '#ef4444',       // 에러 색상
    info: '#007C80'         // 정보 색상
  }
};

function DrugInteractionComponent({ selectedPatient }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [prescribedDrugs, setPrescribedDrugs] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [contraindications, setContraindications] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [inputPosition, setInputPosition] = useState({ top: 0, left: 0, width: 0 });
  // 정렬 관련 상태
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortedPrescribedDrugs, setSortedPrescribedDrugs] = useState([]);
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // 나이 계산 함수
  const calculateAge = useCallback((dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }, []);

  // 날짜별 정렬 함수
  const sortPrescriptionsByDate = useCallback((drugs, order = 'desc') => {
    const sorted = [...drugs].sort((a, b) => {
      const dateA = new Date(a.prescriptionId || 0);
      const dateB = new Date(b.prescriptionId || 0);
      
      if (order === 'desc') {
        return dateB - dateA; // 최신순
      } else {
        return dateA - dateB; // 오래된순
      }
    });
    
    return sorted;
  }, []);

  // 정렬 토글 함수
  const handleSortToggle = useCallback(() => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    const sorted = sortPrescriptionsByDate(prescribedDrugs, newOrder);
    setSortedPrescribedDrugs(sorted);
  }, [sortOrder, prescribedDrugs, sortPrescriptionsByDate]);

  // 날짜 포맷팅 함수
  const formatPrescriptionDate = useCallback((drug) => {
    let dateValue = null;
    
    if (drug.prescribedDate) {
      dateValue = new Date(drug.prescribedDate);
    } else if (drug.prescriptionId) {
      dateValue = new Date(drug.prescriptionId);
    } else {
      return '날짜 없음';
    }
    
    if (isNaN(dateValue.getTime())) {
      return '날짜 없음';
    }
    
    return dateValue.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, []);

  // 선택된 환자의 기존 처방 불러오기
  useEffect(() => {
    if (selectedPatient) {
      loadPatientPrescriptions();
    } else {
      setPrescribedDrugs([]);
      setInteractions([]);
      setContraindications({});
      setSortedPrescribedDrugs([]);
    }
  }, [selectedPatient]);

  // 처방 목록 변경 시 자동 정렬
  useEffect(() => {
    const sorted = sortPrescriptionsByDate(prescribedDrugs, sortOrder);
    setSortedPrescribedDrugs(sorted);
  }, [prescribedDrugs, sortOrder, sortPrescriptionsByDate]);

  // 환자별 처방 불러오기
  const loadPatientPrescriptions = useCallback(async () => {
    if (!selectedPatient) return;
    
    try {
      console.log('🔍 약물 처방에서 환자 처방 조회 시작:', selectedPatient.id);
      
      const prescriptions = await getPatientPrescriptions(selectedPatient.id);
      console.log('✅ Django API 처방 조회 성공:', prescriptions);
      
      if (prescriptions.length > 0) {
        const latestPrescription = prescriptions[0];
        
        const drugsWithDates = (latestPrescription.drugs || []).map(drug => ({
          ...drug,
          prescribedDate: drug.prescribedDate || new Date().toISOString(),
          prescriptionId: drug.prescriptionId || Date.now()
        }));
        
        setPrescribedDrugs(drugsWithDates);
        
        if (drugsWithDates.length > 1) {
          await checkInteractions(drugsWithDates);
        }
        
        console.log('📋 약물 처방에서 처방 불러오기 완료:', latestPrescription);
      } else {
        console.log('📝 해당 환자의 처방이 없음');
        setPrescribedDrugs([]);
        setInteractions([]);
        setContraindications({});
      }
    } catch (error) {
      console.error('Django API 실패, localStorage 백업 사용:', error);
      const prescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
      const patientPrescriptions = prescriptions.filter(p => p.patient_id === selectedPatient.id);
      
      if (patientPrescriptions.length > 0) {
        const latestPrescription = patientPrescriptions[patientPrescriptions.length - 1];
        
        const drugsWithDates = (latestPrescription.drugs || []).map(drug => ({
          ...drug,
          prescribedDate: drug.prescribedDate || new Date().toISOString(),
          prescriptionId: drug.prescriptionId || Date.now()
        }));
        
        setPrescribedDrugs(drugsWithDates);
        
        if (drugsWithDates.length > 1) {
          await checkInteractions(drugsWithDates);
        }
      }
    }
  }, [selectedPatient]);

  // 입력창 위치 계산
  const updateInputPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setInputPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  // 디바운싱된 검색 함수
  const debouncedSearch = useCallback(async (query) => {
    if (query.length < 1) {
      setSearchResults([]);
      setShowResults(false);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchDrugs(query);
      setSearchResults(results);
      setShowResults(true);
      updateInputPosition();
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [updateInputPosition]);

  // 검색 기능
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, debouncedSearch]);

  // 스크롤 및 리사이즈 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      if (showResults) {
        updateInputPosition();
      }
    };

    const handleResize = () => {
      if (showResults) {
        updateInputPosition();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [showResults, updateInputPosition]);

  // ✅ 약물 선택 (중복 처방 허용)
  const handleDrugSelect = useCallback(async (drug, event) => {
    event.stopPropagation();
    
    // 중복 체크 제거 - 같은 약물도 다시 처방 가능
    const currentTime = new Date();
    const newPrescription = {
      ...drug,
      prescriptionId: currentTime.getTime(), // 고유한 timestamp
      prescribedDate: currentTime.toISOString(),
      dosage: '1정',
      frequency: '1일 1회',
      duration: '7일',
      route: '경구',
      instructions: '식후 복용',
      patientId: selectedPatient?.id
    };
    
    const updatedDrugs = [...prescribedDrugs, newPrescription];
    setPrescribedDrugs(updatedDrugs);
    
    await getDrugContraindications(drug.name);
    
    if (updatedDrugs.length > 1) {
      await checkInteractions(updatedDrugs);
    }
    
    setSearchQuery('');
    setShowResults(false);
  }, [prescribedDrugs, selectedPatient]);

  // 처방 저장 함수
  const savePrescription = async () => {
    if (!selectedPatient || prescribedDrugs.length === 0) {
      alert('환자를 선택하고 처방할 약물을 추가해주세요.');
      return;
    }

    setSaveLoading(true);
    try {
      const prescriptionData = {
        patient_id: selectedPatient.id,
        patient_name: selectedPatient.name,
        patient_openemr_id: selectedPatient.openemr_id,
        drugs: prescribedDrugs,
        interactions: interactions,
        contraindications: contraindications,
        doctor_id: 'current_doctor_id'
      };
      
      const response = await savePrescriptionAPI(prescriptionData);
      
      const existingPrescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
      const updatedPrescriptions = [...existingPrescriptions, {
        ...prescriptionData,
        id: response.id,
        timestamp: response.timestamp
      }];
      localStorage.setItem('prescriptions', JSON.stringify(updatedPrescriptions));
      
      const event = new CustomEvent('prescriptionUpdated', { 
        detail: prescriptionData 
      });
      window.dispatchEvent(event);
      
      alert(`${selectedPatient.name} 환자의 처방이 저장되었습니다.`);
      console.log('✅ 처방 저장 완료:', response);
      
      setPrescribedDrugs([]);
      setInteractions([]);
      setContraindications([]);
      
    } catch (error) {
      console.error('처방 저장 오류:', error);
      alert('처방 저장 중 오류가 발생했습니다.');
    } finally {
      setSaveLoading(false);
    }
  };

  // 개별 약물 병용금기 정보 조회
  const getDrugContraindications = async (drugName) => {
    try {
      const data = await checkDrugInteraction([drugName]);
      if (data.contraindicated_with && data.contraindicated_with.length > 0) {
        setContraindications(prev => ({
          ...prev,
          [drugName]: data.contraindicated_with
        }));
      }
    } catch (error) {
      console.error('병용금기 정보 조회 오류:', error);
    }
  };

  // 약물 제거
  const handleRemoveDrug = async (drugCode) => {
    const drugToRemove = prescribedDrugs.find(drug => drug.code === drugCode);
    const updatedDrugs = prescribedDrugs.filter(drug => drug.code !== drugCode);
    setPrescribedDrugs(updatedDrugs);
    
    if (drugToRemove) {
      setContraindications(prev => {
        const newContra = { ...prev };
        delete newContra[drugToRemove.name];
        return newContra;
      });
    }
    
    if (updatedDrugs.length > 1) {
      await checkInteractions(updatedDrugs);
    } else {
      setInteractions([]);
    }
  };

  // 상호작용 검사
  const checkInteractions = async (drugs) => {
    try {
      const drugNames = drugs.map(drug => drug.name);
      const data = await checkDrugInteraction(drugNames);
      
      if (data.interactions && data.interactions.length > 0) {
        setInteractions(data.interactions);
      } else {
        setInteractions([]);
      }
    } catch (error) {
      console.error('상호작용 검사 오류:', error);
      setInteractions([]);
    }
  };

  return (
    <Box sx={{ 
      bgcolor: THEME_COLORS.background, 
      minHeight: '100vh', 
      p: 2 
    }}>
      {/* 환자 정보 표시 및 저장 버튼 */}
      {selectedPatient ? (
        <Card sx={{ 
          mb: 2,
          bgcolor: THEME_COLORS.surface,
          border: `1px solid ${THEME_COLORS.border}`,
          borderLeft: `4px solid ${THEME_COLORS.primary}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <Person sx={{ color: THEME_COLORS.primary, fontSize: '1.2rem' }} />
                <Typography variant="subtitle1" sx={{ 
                  color: THEME_COLORS.primary, 
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}>
                  처방 대상 환자
                </Typography>
                <Chip 
                  label={`${selectedPatient.name} (${selectedPatient.openemr_id})`}
                  size="small"
                  sx={{ 
                    bgcolor: `${THEME_COLORS.secondary}20`,
                    color: THEME_COLORS.primary,
                    fontSize: '0.75rem'
                  }}
                />
                <Typography variant="body2" sx={{ 
                  color: THEME_COLORS.text.secondary,
                  fontSize: '0.8rem'
                }}>
                  {calculateAge(selectedPatient.date_of_birth)}세, {selectedPatient.gender}
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={saveLoading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                  onClick={savePrescription}
                  disabled={saveLoading || prescribedDrugs.length === 0}
                  sx={{
                    bgcolor: THEME_COLORS.primary,
                    color: 'white',
                    fontSize: '0.8rem',
                    '&:hover': {
                      bgcolor: THEME_COLORS.secondary,
                    },
                    '&:disabled': {
                      bgcolor: THEME_COLORS.text.light,
                    }
                  }}
                >
                  {saveLoading ? '저장 중...' : '처방 저장'}
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Print />}
                  sx={{
                    borderColor: THEME_COLORS.primary,
                    color: THEME_COLORS.primary,
                    fontSize: '0.8rem',
                    '&:hover': {
                      borderColor: THEME_COLORS.secondary,
                      bgcolor: `${THEME_COLORS.secondary}10`,
                    }
                  }}
                >
                  처방전 출력
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2,
            bgcolor: `${THEME_COLORS.status.warning}10`,
            borderLeft: `4px solid ${THEME_COLORS.status.warning}`,
            '& .MuiAlert-icon': {
              color: THEME_COLORS.status.warning,
            }
          }}
        >
          <Typography variant="body2" fontSize="0.8rem">
            대시보드에서 환자를 먼저 선택해주세요.
          </Typography>
        </Alert>
      )}

      {/* 약물 검색 카드 */}
      <Card sx={{ 
        mb: 2,
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ 
            mb: 2, 
            fontSize: '0.9rem',
            color: THEME_COLORS.primary,
            borderBottom: `2px solid ${THEME_COLORS.secondary}`,
            pb: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Search /> 약물 검색
          </Typography>
          
          <ClickAwayListener onClickAway={() => setShowResults(false)}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                ref={inputRef}
                fullWidth
                size="small"
                placeholder="약물명을 입력하세요 (예: 아스피린)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!selectedPatient}
                InputProps={{
                  startAdornment: searchLoading ? (
                    <CircularProgress size={20} sx={{ mr: 1, color: THEME_COLORS.primary }} />
                  ) : (
                    <Search sx={{ mr: 1, color: THEME_COLORS.text.secondary }} />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.875rem',
                    bgcolor: THEME_COLORS.surface,
                    '& fieldset': {
                      borderColor: THEME_COLORS.border,
                    },
                    '&:hover fieldset': {
                      borderColor: THEME_COLORS.secondary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: THEME_COLORS.primary,
                    },
                  },
                }}
              />
              
              {/* 검색 결과 드롭다운 */}
              {showResults && (
                <Portal>
                  <Paper
                    sx={{
                      position: 'absolute',
                      top: inputPosition.top,
                      left: inputPosition.left,
                      width: inputPosition.width,
                      maxHeight: 300,
                      overflow: 'auto',
                      zIndex: 9999,
                      border: `1px solid ${THEME_COLORS.border}`,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    {searchResults.length === 0 ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color={THEME_COLORS.text.secondary} fontSize="0.8rem">
                          검색 결과가 없습니다
                        </Typography>
                      </Box>
                    ) : (
                      searchResults.map((drug) => (
                        <Box
                          key={drug.code}
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            borderBottom: `1px solid ${THEME_COLORS.borderLight}`,
                            '&:hover': {
                              bgcolor: THEME_COLORS.surfaceHover,
                            },
                            '&:last-child': {
                              borderBottom: 'none',
                            }
                          }}
                          onClick={(e) => handleDrugSelect(drug, e)}
                        >
                          <Typography variant="body2" sx={{ 
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            color: THEME_COLORS.text.primary
                          }}>
                            {drug.name}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: THEME_COLORS.text.secondary,
                            fontSize: '0.7rem'
                          }}>
                            코드: {drug.code}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Paper>
                </Portal>
              )}
            </Box>
          </ClickAwayListener>
        </CardContent>
      </Card>

      {/* 처방 목록 카드 */}
      <Card sx={{ 
        mb: 2, 
        bgcolor: THEME_COLORS.surface,
        border: `1px solid ${THEME_COLORS.border}`,
        borderLeft: `4px solid ${THEME_COLORS.primary}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ 
            p: 2, 
            borderBottom: `1px solid ${THEME_COLORS.border}`, 
            bgcolor: THEME_COLORS.surfaceHover,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 600, 
              color: THEME_COLORS.primary,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <LocalPharmacy /> 처방 내역
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {prescribedDrugs.length > 0 && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSortToggle}
                    sx={{
                      fontSize: '0.7rem',
                      minWidth: 'auto',
                      px: 1,
                      py: 0.5,
                      borderColor: THEME_COLORS.primary,
                      color: THEME_COLORS.primary,
                      '&:hover': {
                        borderColor: THEME_COLORS.secondary,
                        bgcolor: `${THEME_COLORS.secondary}10`,
                      }
                    }}
                  >
                    {sortOrder === 'desc' ? '최신순 ▼' : '오래된순 ▲'}
                  </Button>
                  <Chip 
                    label={`${prescribedDrugs.length}건`} 
                    size="small"
                    sx={{ 
                      fontSize: '0.7rem', 
                      height: 20,
                      bgcolor: `${THEME_COLORS.secondary}20`,
                      color: THEME_COLORS.primary
                    }}
                  />
                </>
              )}
            </Box>
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: `${THEME_COLORS.secondary}10` }}>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '5%',
                    color: THEME_COLORS.primary
                  }}>순번</TableCell>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '15%',
                    color: THEME_COLORS.primary
                  }}>처방일시</TableCell>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '10%',
                    color: THEME_COLORS.primary
                  }}>코드</TableCell>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '20%',
                    color: THEME_COLORS.primary
                  }}>약물명</TableCell>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '8%',
                    color: THEME_COLORS.primary
                  }}>용량</TableCell>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '8%',
                    color: THEME_COLORS.primary
                  }}>횟수</TableCell>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '8%',
                    color: THEME_COLORS.primary
                  }}>일수</TableCell>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '8%',
                    color: THEME_COLORS.primary
                  }}>투여경로</TableCell>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '13%',
                    color: THEME_COLORS.primary
                  }}>복용법</TableCell>
                  <TableCell sx={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    py: 1, 
                    px: 2, 
                    width: '5%',
                    color: THEME_COLORS.primary
                  }}>삭제</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPrescribedDrugs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ 
                      py: 4, 
                      color: THEME_COLORS.text.secondary, 
                      fontSize: '0.8rem' 
                    }}>
                      {selectedPatient ? '처방할 약물을 검색하여 추가해주세요' : '환자를 먼저 선택해주세요'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedPrescribedDrugs.map((drug, index) => (
                    <TableRow 
                      key={drug.prescriptionId} 
                      sx={{ 
                        '&:nth-of-type(even)': { backgroundColor: THEME_COLORS.surfaceHover },
                        '&:hover': { backgroundColor: `${THEME_COLORS.secondary}10` }
                      }}
                    >
                      <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 2 }}>{index + 1}</TableCell>
                      <TableCell sx={{ 
                        fontSize: '0.7rem', 
                        py: 1, 
                        px: 2,
                        color: THEME_COLORS.text.secondary,
                        whiteSpace: 'nowrap'
                      }}>
                        {formatPrescriptionDate(drug)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 2 }}>{drug.code}</TableCell>
                      <TableCell sx={{ 
                        fontSize: '0.75rem', 
                        py: 1, 
                        px: 2, 
                        fontWeight: 500,
                        color: THEME_COLORS.text.primary
                      }}>
                        {drug.name}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 2 }}>{drug.dosage}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 2 }}>{drug.frequency}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 2 }}>{drug.duration}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 2 }}>{drug.route}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 2 }}>{drug.instructions}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 2 }}>
                        <IconButton 
                          size="small"
                          onClick={() => handleRemoveDrug(drug.code)}
                          sx={{ 
                            color: THEME_COLORS.status.error,
                            '&:hover': {
                              bgcolor: `${THEME_COLORS.status.error}10`
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 병용금기 정보 */}
      {Object.keys(contraindications).map((drugName) => (
        <Alert 
          key={drugName} 
          severity="warning" 
          sx={{ 
            mb: 2,
            bgcolor: `${THEME_COLORS.status.warning}10`,
            borderLeft: `4px solid ${THEME_COLORS.status.warning}`,
            '& .MuiAlert-icon': {
              color: THEME_COLORS.status.warning,
            },
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 600, 
            mb: 1,
            fontSize: '0.85rem',
            color: THEME_COLORS.text.primary
          }}>
            <Warning sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
            {drugName}과(와) 함께 처방하면 안 되는 약물들:
          </Typography>
          {contraindications[drugName].map((item, index) => (
            <Box key={index} sx={{ ml: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 500,
                fontSize: '0.8rem',
                color: THEME_COLORS.text.primary
              }}>
                • {item.ingredient_name}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: THEME_COLORS.text.secondary, 
                ml: 2,
                fontSize: '0.7rem'
              }}>
                사유: {item.reason}
              </Typography>
            </Box>
          ))}
        </Alert>
      ))}

      {/* 다중 약물 상호작용 */}
      {interactions.length > 0 && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            bgcolor: `${THEME_COLORS.status.error}10`,
            borderLeft: `4px solid ${THEME_COLORS.status.error}`,
            '& .MuiAlert-icon': {
              color: THEME_COLORS.status.error,
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 600, 
            mb: 1,
            fontSize: '0.85rem',
            color: THEME_COLORS.text.primary
          }}>
            <Warning sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
            처방된 약물들 간의 상호작용이 발견되었습니다:
          </Typography>
          {interactions.map((interaction, index) => (
            <Box key={index} sx={{ ml: 2, mb: 1 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 500,
                fontSize: '0.8rem',
                color: THEME_COLORS.text.primary
              }}>
                • {interaction.pair.join(' + ')}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: THEME_COLORS.text.secondary, 
                ml: 2,
                fontSize: '0.7rem'
              }}>
                위험: {interaction.reason}
              </Typography>
            </Box>
          ))}
        </Alert>
      )}
    </Box>
  );
}

export default DrugInteractionComponent;
