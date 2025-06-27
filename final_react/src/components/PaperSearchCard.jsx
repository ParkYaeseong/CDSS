// src/components/PaperSearchCard.jsx

import React, { useState } from 'react';
import {
  TextField, Button, Box, CircularProgress, Typography, List, ListItem, 
  ListItemText, Link, Alert, Divider, Card, CardContent, Chip
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { searchPapers } from '../services/paper.service';

// 동일한 색상 테마
const THEME_COLORS = {
  primary: '#007C80',
  secondary: '#14b8a6',
  accent: '#5eead4',
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceHover: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    light: '#94a3b8'
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#007C80'
  }
};

function PaperSearchCard() {
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query || !keyword) {
      setError('논문 주제와 본문 키워드를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setPapers([]);

    try {
      const responseData = await searchPapers({ query, keyword });
      
      console.log("API Response Data for Papers:", responseData); 
      
      if (Array.isArray(responseData)) {
        setPapers(responseData);
        console.log("Papers state set to:", responseData); 
        console.log("New papers.length:", responseData.length);
      } else if (responseData && responseData.results && Array.isArray(responseData.results)) {
        setPapers(responseData.results);
        console.log("Papers state set to (from results):", responseData.results);
        console.log("New papers.length (from results):", responseData.results.length);
      } else {
        console.warn("논문 API 응답 형식이 예상과 다릅니다. 받은 데이터:", responseData);
        setError('논문 데이터를 가져오는 데 실패했습니다. 응답 형식을 확인해주세요.');
        setPapers([]);
      }

    } catch (err) {
      console.error("논문 검색 실패:", err);
      setError(err.message || '논문 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2, 
      height: '100%',
      bgcolor: THEME_COLORS.background,
      p: 2
    }}>
      {/* 검색 입력 섹션 - 테두리 제거 */}
      <Card 
        elevation={0}
        sx={{ 
          bgcolor: THEME_COLORS.surface,
          border: 'none',
          boxShadow: 'none'
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ 
            mb: 2, 
            fontSize: '0.9rem',
            color: THEME_COLORS.primary,
            borderBottom: `2px solid ${THEME_COLORS.secondary}`,
            pb: 0.5
          }}>
            🔍 논문 AI 검색
          </Typography>
          
          <Typography variant="body2" color={THEME_COLORS.text.secondary} sx={{ mb: 2, fontSize: '0.8rem' }}>
            관련 논문을 검색하고 핵심 내용을 요약합니다.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="논문 주제 (예: pancreatic cancer)"
              variant="outlined"
              size="small"
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
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
                '& .MuiInputLabel-root': {
                  fontSize: '0.875rem',
                  color: THEME_COLORS.text.secondary,
                },
              }}
            />
            
            <TextField
              label="본문 키워드 (예: diagnosis)"
              variant="outlined"
              size="small"
              fullWidth
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={loading}
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
                '& .MuiInputLabel-root': {
                  fontSize: '0.875rem',
                  color: THEME_COLORS.text.secondary,
                },
              }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleSearch}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />}
              sx={{
                bgcolor: THEME_COLORS.primary,
                color: 'white',
                fontSize: '0.875rem',
                py: 1,
                '&:hover': {
                  bgcolor: THEME_COLORS.secondary,
                },
                '&:disabled': {
                  bgcolor: THEME_COLORS.text.light,
                },
              }}
            >
              {loading ? '검색 중...' : '논문 검색'}
            </Button>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2,
                fontSize: '0.8rem',
                '& .MuiAlert-icon': {
                  fontSize: '1rem',
                },
              }}
            >
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 검색 결과 섹션 - 테두리 제거 */}
      <Card 
        elevation={0}
        sx={{ 
          bgcolor: THEME_COLORS.surface,
          border: 'none',
          boxShadow: 'none',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ 
              fontSize: '0.9rem',
              color: THEME_COLORS.primary,
              borderBottom: `2px solid ${THEME_COLORS.secondary}`,
              pb: 0.5
            }}>
              📄 검색 결과
            </Typography>
            
            {papers.length > 0 && (
              <Chip 
                label={`${papers.length}개 논문`} 
                size="small"
                sx={{ 
                  fontSize: '0.7rem', 
                  height: 20,
                  bgcolor: `${THEME_COLORS.secondary}20`,
                  color: THEME_COLORS.primary
                }}
              />
            )}
          </Box>

          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              flex: 1,
              flexDirection: 'column',
              gap: 2
            }}>
              <CircularProgress sx={{ color: THEME_COLORS.primary }} />
              <Typography variant="body2" color={THEME_COLORS.text.secondary} fontSize="0.8rem">
                논문을 검색하고 있습니다...
              </Typography>
            </Box>
          ) : papers.length > 0 ? (
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto',
              border: `1px solid ${THEME_COLORS.border}`,
              borderRadius: 1,
              bgcolor: THEME_COLORS.surfaceHover
            }}>
              <List sx={{ p: 0 }}>
                {papers.map((paper, index) => (
                  <ListItem 
                    key={paper.pmcid || index} 
                    divider={index < papers.length - 1}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: `${THEME_COLORS.secondary}10`
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Link 
                          href={paper.epmc_link} 
                          target="_blank" 
                          rel="noopener" 
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            color: THEME_COLORS.primary,
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: THEME_COLORS.secondary
                            }
                          }}
                        >
                          {paper.title || '제목 없음'}
                        </Link>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography 
                            component="span" 
                            variant="body2" 
                            sx={{ 
                              color: THEME_COLORS.text.secondary,
                              fontSize: '0.75rem'
                            }}
                          >
                            PMCID: {paper.pmcid || 'N/A'}
                          </Typography>
                          
                          {paper.keyword_extracts && paper.keyword_extracts.length > 0 ? (
                            <Box sx={{ mt: 1 }}>
                              <Typography 
                                variant="caption" 
                                display="block" 
                                sx={{ 
                                  fontWeight: 'medium',
                                  color: THEME_COLORS.text.primary,
                                  fontSize: '0.75rem',
                                  mb: 0.5
                                }}
                              >
                                📋 핵심 요약:
                              </Typography>
                              {paper.keyword_extracts.map((extract, idx) => (
                                <Typography 
                                  key={idx} 
                                  variant="caption" 
                                  display="block" 
                                  sx={{ 
                                    color: THEME_COLORS.text.secondary,
                                    fontSize: '0.7rem',
                                    ml: 1,
                                    mb: 0.25,
                                    lineHeight: 1.4
                                  }}
                                >
                                  • {extract.korean_summary || '요약 없음'}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Typography 
                              variant="caption" 
                              display="block" 
                              sx={{ 
                                color: THEME_COLORS.text.light,
                                fontSize: '0.7rem',
                                mt: 1,
                                fontStyle: 'italic'
                              }}
                            >
                              본문에서 키워드를 포함한 문장을 찾지 못했습니다.
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            !error && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                flex: 1,
                flexDirection: 'column',
                gap: 1,
                color: THEME_COLORS.text.secondary
              }}>
                <Typography variant="body2" fontSize="0.8rem" textAlign="center">
                  검색 결과를 기다립니다.
                </Typography>
                <Typography variant="caption" fontSize="0.7rem" textAlign="center">
                  논문 주제와 키워드를 입력하고 검색 버튼을 클릭해주세요.
                </Typography>
              </Box>
            )
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default PaperSearchCard;
