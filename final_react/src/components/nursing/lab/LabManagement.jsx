// final_react/src/components/nursing/lab/LabManagement.jsx
import React from 'react';
import {
  Box, Card, CardContent, Typography, FormControl, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, CircularProgress, Chip, Modal, Paper, TextField
} from '@mui/material';
import { Warning, HourglassEmpty, CheckCircle } from '@mui/icons-material';

export default function LabManagement({
  labOrders, selectedStatus, setSelectedStatus, isOrderLoading,
  selectedOrder, setSelectedOrder, setShowCollectionModal, setShowResultModal,
  showCollectionModal, showResultModal, collectionNotes, setCollectionNotes,
  resultForm, setResultForm, handleCollectSample, handleAddResult
}) {

  const getStatusBadge = (status, priority) => {
    let color = '#3b82f6';
    let statusText = '';
    
    switch(status) {
      case 'ordered': 
        color = priority === 'stat' ? '#ef4444' : '#f59e0b';
        statusText = '검체채취 대기'; 
        break;
      case 'collected': 
        color = '#3b82f6';
        statusText = '채취완료'; 
        break;
      case 'processing': 
        color = '#6366f1';
        statusText = '처리중'; 
        break;
      case 'completed': 
        color = '#10b981';
        statusText = '완료'; 
        break;
      default: 
        statusText = status;
    }
    
    return (
      <Chip 
        label={statusText} 
        sx={{ 
          bgcolor: color,
          color: 'white',
          fontWeight: '600',
          fontSize: '0.75rem'
        }}
        size="small"
      />
    );
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'stat': 
        return <Warning sx={{ color: '#ef4444' }} titleAccess="STAT" />;
      case 'urgent': 
        return <HourglassEmpty sx={{ color: '#f59e0b' }} titleAccess="긴급" />;
      default: 
        return <CheckCircle sx={{ color: '#10b981' }} titleAccess="일반" />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3, bgcolor: '#f9fafb' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: '#8B4A52' }}>
        🔬 검사실 관리
      </Typography>
      
      {/* 검사 주문 목록 */}
      <Card sx={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ 
          bgcolor: '#374151', 
          color: 'white', 
          p: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" fontWeight="600">
            📝 검사 주문 목록
          </Typography>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ 
                bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
              }}
            >
              <MenuItem value="ordered">주문됨</MenuItem>
              <MenuItem value="collected">채취완료</MenuItem>
              <MenuItem value="processing">처리중</MenuItem>
              <MenuItem value="completed">완료</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <CardContent sx={{ bgcolor: 'white', p: 0 }}>
          {isOrderLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: '#3b82f6' }} />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f3f4f6' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#374151', fontWeight: '600' }}>우선순위</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: '600' }}>환자명</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: '600' }}>검사명</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: '600' }}>상태</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: '600' }}>주문시간</TableCell>
                    <TableCell sx={{ color: '#374151', fontWeight: '600' }}>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', p: 4 }}>
                        <Typography color="#6b7280">
                          해당 상태의 검사 주문이 없습니다.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    labOrders.map((order) => (
                      <TableRow 
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: selectedOrder?.id === order.id ? '#e0e7ff' : 'transparent',
                          '&:hover': { bgcolor: '#f9fafb' }
                        }}
                      >
                        <TableCell>{getPriorityIcon(order.priority)}</TableCell>
                        <TableCell>
                          <Typography fontWeight="600" color="#374151">
                            {order.patient_name}
                          </Typography>
                        </TableCell>
                        <TableCell>{order.test_name}</TableCell>
                        <TableCell>{getStatusBadge(order.status, order.priority)}</TableCell>
                        <TableCell>
                          <Typography variant="caption" color="#6b7280">
                            {new Date(order.ordered_at).toLocaleString('ko-KR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {order.status === 'ordered' && (
                              <Button 
                                size="small"
                                variant="contained"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setSelectedOrder(order); 
                                  setShowCollectionModal(true); 
                                }}
                                sx={{ 
                                  bgcolor: '#f59e0b',
                                  '&:hover': { bgcolor: '#d97706' }
                                }}
                              >
                                채취
                              </Button>
                            )}
                            {order.status === 'collected' && (
                              <Button 
                                size="small"
                                variant="contained"
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setSelectedOrder(order); 
                                  setShowResultModal(true); 
                                }}
                                sx={{ 
                                  bgcolor: '#10b981',
                                  '&:hover': { bgcolor: '#059669' }
                                }}
                              >
                                결과입력
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 검체 채취 모달 */}
      <Modal open={showCollectionModal} onClose={() => setShowCollectionModal(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 450,
          bgcolor: 'white',
          border: '2px solid #E0969F',
          borderRadius: 2,
          boxShadow: 24,
        }}>
          <Box sx={{ bgcolor: '#E0969F', color: 'white', p: 2.5 }}>
            <Typography variant="h6" fontWeight="600">
              🧪 검체 채취
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#F5E6E8' }}>
              <Typography variant="h6" color="#8B4A52">
                환자: {selectedOrder?.patient_name}
              </Typography>
              <Typography color="#6b7280">
                검사: {selectedOrder?.test_name}
              </Typography>
            </Paper>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="채취 관련 메모"
              value={collectionNotes}
              onChange={(e) => setCollectionNotes(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#E0969F' },
                  '&:hover fieldset': { borderColor: '#C8797F' },
                  '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, p: 2.5, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowCollectionModal(false)} sx={{ color: '#6b7280' }}>
              취소
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCollectSample}
              sx={{ bgcolor: '#E0969F', '&:hover': { bgcolor: '#C8797F' } }}
            >
              채취 완료
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* 결과 입력 모달 */}
      <Modal open={showResultModal} onClose={() => setShowResultModal(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 450,
          bgcolor: 'white',
          border: '2px solid #E0969F',
          borderRadius: 2,
          boxShadow: 24,
        }}>
          <Box sx={{ bgcolor: '#E0969F', color: 'white', p: 2.5 }}>
            <Typography variant="h6" fontWeight="600">
              📋 검사 결과 입력
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 2, mb: 2, bgcolor: '#F5E6E8' }}>
              <Typography variant="h6" color="#8B4A52">
                환자: {selectedOrder?.patient_name}
              </Typography>
              <Typography color="#6b7280">
                검사: {selectedOrder?.test_name}
              </Typography>
            </Paper>
            <TextField
              fullWidth
              label="검사 결과 값 *"
              value={resultForm.result_value}
              onChange={(e) => setResultForm({...resultForm, result_value: e.target.value})}
              required
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#E0969F' },
                  '&:hover fieldset': { borderColor: '#C8797F' },
                  '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                }
              }}
            />
            <TextField
              fullWidth
              label="정상 범위"
              value={resultForm.reference_range}
              onChange={(e) => setResultForm({...resultForm, reference_range: e.target.value})}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#E0969F' },
                  '&:hover fieldset': { borderColor: '#C8797F' },
                  '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                }
              }}
            />
            <TextField
              fullWidth
              label="단위"
              value={resultForm.unit}
              onChange={(e) => setResultForm({...resultForm, unit: e.target.value})}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#E0969F' },
                  '&:hover fieldset': { borderColor: '#C8797F' },
                  '&.Mui-focused fieldset': { borderColor: '#E0969F' }
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, p: 2.5, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowResultModal(false)} sx={{ color: '#6b7280' }}>
              취소
            </Button>
            <Button 
              variant="contained" 
              onClick={handleAddResult}
              disabled={!resultForm.result_value}
              sx={{ bgcolor: '#E0969F', '&:hover': { bgcolor: '#C8797F' } }}
            >
              결과 저장
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
