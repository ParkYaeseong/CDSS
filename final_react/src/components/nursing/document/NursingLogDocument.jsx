// NursingLogDocument.jsx 수정
import React from 'react';
import {
  Box, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableRow, Button
} from '@mui/material';
import { Close, Edit, Print } from '@mui/icons-material';

function NursingLogDocument({ nursingLog, onClose, onUpdate }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getLogTypeLabel = (type) => {
    const types = {
      'initial_assessment': '초기 사정',
      'progress_note': '경과 기록',
      'medication_record': '투약 기록',
      'patient_education': '환자 교육',
      'discharge_planning': '퇴원 계획'
    };
    return types[type] || type;
  };

  return (
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: 900,
      maxHeight: '90vh',
      overflow: 'auto',
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 24,
      outline: 'none'
    }}>
      {/* 헤더 */}
      <Box sx={{ 
        p: 3, 
        bgcolor: '#E0969F',
        color: 'white',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h5" fontWeight="bold">
          📋 간호일지
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={onUpdate}
            sx={{ color: 'white', minWidth: 'auto', p: 1 }}
          >
            <Edit />
          </Button>
          <Button
            onClick={() => window.print()}
            sx={{ color: 'white', minWidth: 'auto', p: 1 }}
          >
            <Print />
          </Button>
          <Button
            onClick={onClose}
            sx={{ color: 'white', minWidth: 'auto', p: 1 }}
          >
            <Close />
          </Button>
        </Box>
      </Box>

      <Box sx={{ p: 4, bgcolor: '#f8f9fa' }}>
        {/* 문서 형태의 간호일지 */}
        <Paper sx={{ 
          p: 4, 
          bgcolor: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}>
          {/* 문서 제목 */}
          <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #333', pb: 2 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
              간호일지
            </Typography>
          </Box>

          {/* 기본 정보 테이블 */}
          <TableContainer sx={{ mb: 4 }}>
            <Table sx={{ border: '2px solid #333' }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ 
                    bgcolor: '#f5f5f5', 
                    fontWeight: 'bold', 
                    border: '1px solid #333',
                    width: '150px'
                  }}>
                    환자/성명
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #333' }}>
                    {nursingLog.patient_name || nursingLog.patient_id}
                  </TableCell>
                  <TableCell sx={{ 
                    bgcolor: '#f5f5f5', 
                    fontWeight: 'bold', 
                    border: '1px solid #333',
                    width: '100px'
                  }}>
                    작성일
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #333', width: '150px' }}>
                    {formatDate(nursingLog.created_at)}
                  </TableCell>
                  <TableCell sx={{ 
                    bgcolor: '#f5f5f5', 
                    fontWeight: 'bold', 
                    border: '1px solid #333',
                    width: '100px'
                  }}>
                    장소
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #333', width: '100px' }}>
                    {nursingLog.department || '병동'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* 일지 정보 */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Typography variant="body1">
              <strong>일지 유형:</strong> {getLogTypeLabel(nursingLog.log_type)}
            </Typography>
            <Typography variant="body1">
              <strong>제목:</strong> {nursingLog.title}
            </Typography>
          </Box>

          {/* SOAP 기록 테이블 */}
          <TableContainer>
            <Table sx={{ border: '2px solid #333' }}>
              <TableBody>
                {/* 교과내용 헤더 */}
                <TableRow>
                  <TableCell 
                    colSpan={2} 
                    sx={{ 
                      bgcolor: '#f5f5f5', 
                      fontWeight: 'bold', 
                      border: '1px solid #333',
                      textAlign: 'center',
                      fontSize: '16px'
                    }}
                  >
                    내용
                  </TableCell>
                </TableRow>
                
                {/* S - 주관적 자료 */}
                <TableRow>
                  <TableCell sx={{ 
                    bgcolor: '#f5f5f5', 
                    fontWeight: 'bold', 
                    border: '1px solid #333',
                    width: '120px',
                    verticalAlign: 'top'
                  }}>
                    1. 질문
                    <br />
                    1) 주관적 자료 (S)
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #333', p: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {nursingLog.subjective || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* O - 객관적 자료 */}
                <TableRow>
                  <TableCell sx={{ 
                    bgcolor: '#f5f5f5', 
                    fontWeight: 'bold', 
                    border: '1px solid #333',
                    verticalAlign: 'top'
                  }}>
                    2) 객관적 자료 (O)
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #333', p: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {nursingLog.objective || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* A - 사정 */}
                <TableRow>
                  <TableCell sx={{ 
                    bgcolor: '#f5f5f5', 
                    fontWeight: 'bold', 
                    border: '1px solid #333',
                    verticalAlign: 'top'
                  }}>
                    3) 사정 (A)
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #333', p: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {nursingLog.assessment || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* P - 계획 */}
                <TableRow>
                  <TableCell sx={{ 
                    bgcolor: '#f5f5f5', 
                    fontWeight: 'bold', 
                    border: '1px solid #333',
                    verticalAlign: 'top'
                  }}>
                    4) 계획 (P)
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #333', p: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {nursingLog.plan || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* 특이사항 */}
                <TableRow>
                  <TableCell sx={{ 
                    bgcolor: '#f5f5f5', 
                    fontWeight: 'bold', 
                    border: '1px solid #333',
                    verticalAlign: 'top'
                  }}>
                    특이사항
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #333', p: 2 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {nursingLog.special_notes || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* 작성자 정보 */}
          <Box sx={{ mt: 4, textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              작성일: {formatDate(nursingLog.created_at)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              작성자: {nursingLog.created_by || '간호사'}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default NursingLogDocument;
