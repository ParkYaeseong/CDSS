// final_react/src/components/nursing/lists/PatientList.jsx
import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, IconButton, Paper
} from '@mui/material';
import { 
  Refresh, Person, Search, Visibility, Edit, Delete,
  Female, Male
} from '@mui/icons-material';

function PatientList({ patients, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.birth_date?.includes(searchTerm)
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* 헤더 - 하얀 박스 + 포인트 색 줄 */}
      <Box sx={{ 
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        mb: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mr: 2, color: '#374151' }}>
                👥 간호 환자 관리
              </Typography>
              <Typography variant="h6" color="#E0969F" fontWeight="600">
                {filteredPatients.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                명의 환자
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefresh}
              sx={{ 
                color: '#E0969F',
                borderColor: '#E0969F',
                '&:hover': {
                  borderColor: '#C8797F',
                  bgcolor: '#f9fafb'
                }
              }}
            >
              새로고침
            </Button>
          </Box>

          {/* 검색 */}
          <TextField
            placeholder="환자명, 환자ID, 생년월일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              width: '100%',
              maxWidth: 400,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#f9fafb',
                '& fieldset': { borderColor: '#e5e7eb' },
                '&:hover fieldset': { borderColor: '#E0969F' },
                '&.Mui-focused fieldset': { borderColor: '#E0969F' }
              }
            }}
          />
        </Box>
      </Box>

      {/* 환자 테이블 - 하얀 박스 + 포인트 색 줄 */}
      <Box sx={{
        bgcolor: 'white',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #E0969F',
        borderRadius: 1
      }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#374151',
                    bgcolor: '#f9fafb',
                    minWidth: 200,
                    whiteSpace: 'nowrap'
                  }}
                >
                  환자
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#374151',
                    bgcolor: '#f9fafb',
                    minWidth: 120,
                    whiteSpace: 'nowrap'
                  }}
                >
                  환자ID
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#374151',
                    bgcolor: '#f9fafb',
                    minWidth: 120,
                    whiteSpace: 'nowrap'
                  }}
                >
                  나이/성별
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#374151',
                    bgcolor: '#f9fafb',
                    minWidth: 140,
                    whiteSpace: 'nowrap'
                  }}
                >
                  생년월일
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#374151',
                    bgcolor: '#f9fafb',
                    minWidth: 120,
                    whiteSpace: 'nowrap'
                  }}
                >
                  등록일
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#374151',
                    bgcolor: '#f9fafb',
                    minWidth: 150,
                    whiteSpace: 'nowrap'
                  }}
                >
                  상태
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#374151',
                    bgcolor: '#f9fafb',
                    minWidth: 150,
                    whiteSpace: 'nowrap'
                  }}
                >
                  작업
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Person sx={{ fontSize: 48, color: '#E0969F', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#374151', mb: 1 }}>
                      {searchTerm ? '검색 결과가 없습니다' : '등록된 환자가 없습니다'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? '다른 검색어를 시도해보세요' : '새로운 환자를 등록해보세요'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient, index) => (
                  <TableRow 
                    key={patient.id}
                    sx={{ 
                      '&:hover': { bgcolor: '#f9fafb' },
                      borderLeft: index % 2 === 0 ? '3px solid #F5E6E8' : 'none'
                    }}
                  >
                    <TableCell sx={{ 
                      minWidth: 200,
                      whiteSpace: 'normal',
                      wordWrap: 'break-word'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ 
                          bgcolor: '#F5E6E8',
                          color: '#8B4A52',
                          width: 40,
                          height: 40,
                          mr: 2,
                          fontSize: '1rem',
                          flexShrink: 0
                        }}>
                          {patient.name ? patient.name[0] : 'P'}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography 
                            variant="body1" 
                            fontWeight="600" 
                            sx={{ 
                              color: '#374151',
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              lineHeight: 1.4
                            }}
                          >
                            {patient.name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ 
                      minWidth: 120,
                      whiteSpace: 'normal',
                      wordWrap: 'break-word'
                    }}>
                      <Typography 
                        variant="body2" 
                        fontWeight="500" 
                        sx={{ 
                          color: '#E0969F',
                          whiteSpace: 'normal',
                          wordWrap: 'break-word'
                        }}
                      >
                        {patient.patient_id}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ 
                      minWidth: 120,
                      whiteSpace: 'normal'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {patient.age}세
                        </Typography>
                        {patient.gender === 'M' ? (
                          <Male sx={{ color: '#2196f3', fontSize: 16 }} />
                        ) : (
                          <Female sx={{ color: '#e91e63', fontSize: 16 }} />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ 
                      minWidth: 140,
                      whiteSpace: 'normal',
                      wordWrap: 'break-word'
                    }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          whiteSpace: 'normal',
                          wordWrap: 'break-word'
                        }}
                      >
                        {patient.birth_date}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ 
                      minWidth: 120,
                      whiteSpace: 'normal',
                      wordWrap: 'break-word'
                    }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          whiteSpace: 'normal',
                          wordWrap: 'break-word'
                        }}
                      >
                        {formatDate(patient.created_at)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ minWidth: 150 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip 
                          label="활성"
                          size="small"
                          sx={{ 
                            bgcolor: '#e8f5e8',
                            color: '#2e7d32',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                        <Chip 
                          label="간호중"
                          size="small"
                          sx={{ 
                            bgcolor: '#F5E6E8',
                            color: '#8B4A52',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ minWidth: 150 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <IconButton 
                          size="small"
                          sx={{ color: '#E0969F' }}
                          title="상세보기"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          sx={{ color: '#4caf50' }}
                          title="수정"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          sx={{ color: '#f44336' }}
                          title="삭제"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

export default PatientList;
