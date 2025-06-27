// src/components/Messages/MessageWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent,
  TextField,
  IconButton,
  Avatar,
  Typography,
  Box,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Send as SendIcon, 
  Close as CloseIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { messageService } from '../../services/message.service';
import './Message.css';

function MessageWindow({ isOpen, onClose, selectedUser, currentUser, onMessageRead }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

    // src/components/Messages/MessageWindow.jsx의 fetchMessages 메서드 수정
  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('메시지 조회 시작 - 선택된 사용자:', selectedUser);
      
      const response = await messageService.getMessages();
      console.log('메시지 응답:', response);
      
      if (response.success) {
        // ✅ Django 응답 구조에 맞게 수정
        const receivedMessages = (response.messages?.received || [])
          .filter(msg => msg.sender_id === selectedUser.id)
          .map(msg => ({
            ...msg,
            sender: 'bot', // 상대방이 보낸 메시지
            messageSource: 'received',
            // ✅ created_at을 timestamp로 변환
            timestamp: msg.created_at || msg.timestamp
          }));
        
        const sentMessages = (response.messages?.sent || [])
          .filter(msg => msg.recipient_id === selectedUser.id)
          .map(msg => ({
            ...msg,
            sender: 'user', // 내가 보낸 메시지
            messageSource: 'sent',
            // ✅ created_at을 timestamp로 변환
            timestamp: msg.created_at || msg.timestamp
          }));
        
        // ✅ 시간순으로 정렬 (timestamp 또는 created_at 사용)
        const allMessages = [...receivedMessages, ...sentMessages]
          .sort((a, b) => new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at));
        
        console.log('필터링된 메시지:', allMessages);
        setMessages(allMessages);
      } else {
        console.error('메시지 조회 실패:', response);
        setMessages([]);
      }
    } catch (error) {
      console.error('메시지 조회 실패:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const response = await messageService.getMessages();
      if (response.success) {
        const unreadMessages = response.messages.received.filter(
          msg => msg.sender?.id === selectedUser.id && !msg.is_read
        );
        
        for (const message of unreadMessages) {
          await messageService.markAsRead(message.id);
        }
        
        // 읽음 처리 후 알람 카운트 업데이트
        if (unreadMessages.length > 0 && onMessageRead) {
          await onMessageRead();
        }
      }
    } catch (error) {
      console.error('메시지 읽음 처리 실패:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    // 임시 메시지 생성
    const tempMessage = { 
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: newMessage,
      created_at: new Date().toISOString(),
      messageSource: 'temp'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    const messageToSend = newMessage;
    setNewMessage('');
    setIsSending(true);

    try {
      const messageData = {
        recipient_id: selectedUser.id,
        subject: `${currentUser?.name || currentUser?.username || '사용자'}님의 메시지`,
        content: messageToSend,
        message_type: 'general'
      };

      const response = await messageService.sendMessage(messageData);
      if (response.success) {
        // 임시 메시지 제거 후 서버에서 최신 메시지 가져오기
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        setTimeout(() => {
          fetchMessages();
        }, 500);
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = async () => {
    // 메시지창 닫을 때 알람 카운트 업데이트
    if (onMessageRead) {
      await onMessageRead();
    }
    onClose();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
      'radiologist': '방사선사'
    };
    return labels[userType] || '사용자';
  };

  useEffect(() => {
    if (isOpen && selectedUser) {
      fetchMessages();
      // 메시지창이 열릴 때 읽지 않은 메시지 읽음 처리
      markMessagesAsRead();
    }
  }, [isOpen, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!selectedUser || !currentUser) {
    return null;
  }

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        className: 'modern-message-dialog',
        sx: { 
          height: '85vh',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      {/* 헤더 */}
      <Box className="modern-message-header">
        <IconButton onClick={handleClose} className="back-button">
          <BackIcon />
        </IconButton>
        
        <Box className="user-info-section">
          <Avatar 
            className="user-avatar-large"
            style={{ backgroundColor: getUserTypeColor(selectedUser?.user_type) }}
          >
            {selectedUser?.name?.charAt(0) || selectedUser?.username?.charAt(0) || '?'}
          </Avatar>
          <Box className="user-details">
            <Typography variant="h6" className="user-name-large">
              {selectedUser?.name || selectedUser?.username || '사용자'}
            </Typography>
            <Typography variant="body2" className="user-status-text">
              온라인 • {getUserTypeLabel(selectedUser?.user_type)}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={handleClose} className="close-button">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* 메시지 영역 */}
      <DialogContent className="modern-messages-container">
        <div className="message-list">
          {messages.map((message, index) => {
            const isMyMessage = message.sender === 'user';
            
            // ✅ timestamp 또는 created_at 사용
            const messageTime = message.timestamp || message.created_at;
            
            const showDate = index === 0 || 
              new Date(messages[index - 1]?.timestamp || messages[index - 1]?.created_at).toDateString() !== 
              new Date(messageTime).toDateString();

            return (
              <React.Fragment key={message.id || index}>
                {showDate && (
                  <div className="date-separator">
                    <span className="date-text">
                      {new Date(messageTime).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                
                <div className={`message-item ${isMyMessage ? 'user' : 'bot'}`}>
                  {!isMyMessage && (
                    <Avatar 
                      className="message-avatar"
                      style={{ 
                        backgroundColor: getUserTypeColor(selectedUser?.user_type),
                        width: '32px',
                        height: '32px'
                      }}
                    >
                      {selectedUser?.name?.charAt(0) || selectedUser?.username?.charAt(0) || '?'}
                    </Avatar>
                  )}
                  <div className="message-content">
                    <div className="message-bubble">
                      {message.content}
                    </div>
                    <div className="message-time">
                      {formatTime(messageTime)}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          
          {/* 전송 중 표시 */}
          {isSending && (
            <div className="message-item bot">
              <CircularProgress size={20} />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </DialogContent>

      {/* 입력 영역 */}
      <Box className="modern-input-container">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="메시지를 입력하세요..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSending}
          multiline
          maxRows={3}
          className="modern-message-input"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="send-button"
                  style={{
                    backgroundColor: (newMessage.trim() && !isSending) ? '#007AFF' : '#E5E5EA',
                    color: (newMessage.trim() && !isSending) ? 'white' : '#8E8E93',
                    width: '36px',
                    height: '36px',
                    borderRadius: '18px'
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
    </Dialog>
  );
}

export default MessageWindow;
