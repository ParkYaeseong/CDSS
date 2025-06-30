// src/components/Messages/FloatingMessageButton.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  Box,
  Badge,
  IconButton,
  Paper,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { 
  Close as CloseIcon,
  Search as SearchIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import MessageWindow from './MessageWindow';
import { messageService } from '../../services/message.service';
import { useAuth } from '../../contexts/AuthContext';
import './Message.css';

function FloatingMessageButton({ onClose }) {
  const { user, isAuthenticated } = useAuth();
  const [isContactListOpen, setIsContactListOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState([]);

  // 컴포넌트가 마운트될 때마다 상태 초기화
  useEffect(() => {
    console.log('FloatingMessageButton 마운트됨');
    
    // 상태 초기화
    setIsContactListOpen(false);
    setIsMessageOpen(false);
    setSelectedUser(null);
    setSearchTerm('');
    setActiveTab(0);
    
    if (isAuthenticated) {
      fetchUsers();
      fetchUnreadCount();
      
      // 약간의 지연 후 연락처 목록 열기
      const timer = setTimeout(() => {
        setIsContactListOpen(true);
      }, 100);
      
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isAuthenticated]);

  // 컴포넌트가 언마운트될 때 정리
  useEffect(() => {
    return () => {
      console.log('FloatingMessageButton 언마운트됨');
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await messageService.searchUsers();
      if (response.success) {
        setUsers(response.users || []);
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    }
  };

  const fetchUnreadCount = async () => {
  try {
    const response = await messageService.getMessages();
    if (response.success) {
      setUnreadCount(response.unread_count || 0);
      
      const unreadUsers = response.messages?.received?.filter(msg => !msg.is_read) || [];
      const uniqueUnreadUsers = unreadUsers.reduce((acc, msg) => {
        // Flutter 환자 메시지 처리 (sender 객체가 없을 수 있음)
        const sender = msg.sender || {
          id: msg.sender_id,
          name: msg.sender_name,
          username: msg.sender_username,
          user_type: msg.sender_type
        };
        
        if (sender && sender.id && !acc.find(u => u && u.id === sender.id)) {
          acc.push(sender);
        }
        return acc;
      }, []);
      
      setUnreadMessages(uniqueUnreadUsers);
    }
  } catch (error) {
    console.error('읽지 않은 메시지 수 조회 실패:', error);
  }
};


  const getUserTypeColor = (userType) => {
    const colors = {
      'doctor': '#4CAF50',
      'nurse': '#2196F3', 
      'admin': '#FF9800',
      'staff': '#9C27B0',
      'patient': '#607D8B',
      'radiologist': '#E91E63'
    };
    return colors[userType] || '#757575';
  };

  const getUserTypeLabel = (userType) => {
    const labels = {
      'doctor': '의사',
      'nurse': '간호사',
      'admin': '관리자', 
      'staff': '원무과',
      'patient': '환자',
      'radio': '영상의학과',        // ← 추가
      'radiologist': '영상의학과'
    };
    return labels[userType] || '사용자';
  };

  const handleUserSelect = async (selectedUser) => {
    if (!selectedUser || !selectedUser.id) {
      console.error('유효하지 않은 사용자 객체:', selectedUser);
      return;
    }
    
    try {
      const response = await messageService.getMessages();
      if (response.success) {
        const unreadMessagesFromUser = response.messages.received.filter(
          msg => msg.sender?.id === selectedUser.id && !msg.is_read
        );
        
        for (const message of unreadMessagesFromUser) {
          await messageService.markAsRead(message.id);
        }
        
        if (unreadMessagesFromUser.length > 0) {
          await fetchUnreadCount();
        }
      }
    } catch (error) {
      console.error('메시지 읽음 처리 실패:', error);
    }
    
    setSelectedUser(selectedUser);
    setIsContactListOpen(false);
    setIsMessageOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getFilteredUsersByRole = (role) => {
    console.log('필터링 중:', role, '전체 사용자:', users); // 디버깅 로그
    const filtered = users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = role === 'all' || user.user_type === role;
      console.log(`사용자 ${user.username}: user_type=${user.user_type}, matchesRole=${matchesRole}`); // 디버깅 로그
      return matchesSearch && matchesRole;
    });
    console.log('필터링 결과:', filtered); // 디버깅 로그
    return filtered;
  };

  const getCurrentTabUsers = () => {
    switch (activeTab) {
      case 0:
        // 읽지 않은 메시지 발신자들 (안전한 처리)
        return (unreadMessages || []).filter(user => {
          // user가 유효한지 확인
          if (!user || typeof user !== 'object' || !user.id) {
            return false;
          }
          
          const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.username?.toLowerCase().includes(searchTerm.toLowerCase());
          return matchesSearch;
        });
      case 1:
        return getFilteredUsersByRole('doctor');
      case 2:
        return getFilteredUsersByRole('nurse');
      case 3:
        return getFilteredUsersByRole('patient');
      case 4:
        // 원무과 - 영상의학과와 동일한 방식으로 필터링
        return users.filter(user => {
          const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.username?.toLowerCase().includes(searchTerm.toLowerCase());
          const isStaff = user.user_type === 'staff';
          console.log(`원무과 필터링: ${user.username}, user_type=${user.user_type}, isStaff=${isStaff}`); // 디버깅 로그
          return matchesSearch && isStaff;
        });
      case 5:
        return users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             user.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const isRadiologist = ['radio', 'radiologist'].includes(user.user_type);
        return matchesSearch && isRadiologist;
      });
      default:
        return [];
    }
  };

  // 연락처 목록 닫기 핸들러 수정
  const handleContactListClose = () => {
    setIsContactListOpen(false);
    if (onClose) {
      onClose(); // App.js의 handleMessageClose 호출
    }
  };

  // 메시지 창 닫기 핸들러 수정
  const handleMessageClose = () => {
    setIsMessageOpen(false);
    setSelectedUser(null);
    // 메시지 창을 닫으면 연락처 목록으로 돌아가기
    setIsContactListOpen(true);
  };

  if (!isAuthenticated) {
    return null;
  }

  const currentUsers = getCurrentTabUsers();

  return (
    <>
      {/* 연락처 목록 다이얼로그 */}
      <Dialog
        open={isContactListOpen}
        onClose={handleContactListClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: 'contact-list-dialog',
          style: { borderRadius: '20px', overflow: 'hidden', height: '80vh' }
        }}
      >
        <DialogTitle 
          style={{ 
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            color: 'white',
            padding: '16px 20px'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" style={{ fontWeight: 'bold' }}>
              <MessageIcon style={{ marginRight: 8, verticalAlign: 'middle' }} />
              메시지
            </Typography>
            <IconButton 
              onClick={handleContactListClose}
              style={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box style={{ padding: '16px' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="이름 또는 사용자명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon style={{ marginRight: 8, color: '#666' }} />
              }}
              className="contact-search"
            />
          </Box>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            indicatorColor="primary"
            textColor="primary"
            style={{ borderBottom: '1px solid #e0e0e0' }}
          >
            <Tab 
              label={
                <Badge badgeContent={unreadMessages.length} color="error" max={99}>
                  알림
                </Badge>
              } 
            />
            <Tab label="의사" />
            <Tab label="간호사" />
            <Tab label="환자" />
            <Tab label="원무과" />
            <Tab label="영상의학과" />
          </Tabs>

          <Paper style={{ flex: 1, overflow: 'auto', borderRadius: 0 }}>
            <List>
              {currentUsers.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => handleUserSelect(user)}
                  className="contact-item"
                  style={{ 
                    borderBottom: '1px solid #f5f5f5',
                    padding: '12px 16px'
                  }}
                >
                  <ListItemAvatar className="contact-avatar">
                    <Avatar 
                      style={{ 
                        backgroundColor: getUserTypeColor(user.user_type),
                        border: '2px solid rgba(255,255,255,0.8)'
                      }}
                    >
                      {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    className="contact-info"
                    primary={
                      <Typography className="contact-name">
                        {user.name || user.username || 'Unknown User'}
                        {activeTab === 0 && (
                          <Badge 
                            color="error" 
                            variant="dot" 
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </Typography>
                    }
                    secondary={
                      <Typography className="contact-details">
                        @{user.username || 'unknown'} • {getUserTypeLabel(user.user_type)}
                        {user.email && ` • ${user.email}`}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {currentUsers.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography align="center" color="textSecondary">
                        {activeTab === 0 ? '읽지 않은 메시지가 없습니다' : '사용자를 찾을 수 없습니다'}
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </DialogContent>
      </Dialog>

      {/* 메시지창 */}
      <MessageWindow
        isOpen={isMessageOpen}
        onClose={handleMessageClose}
        selectedUser={selectedUser}
        currentUser={user}
        onMessageRead={fetchUnreadCount}
      />
    </>
  );
}

export default FloatingMessageButton;
