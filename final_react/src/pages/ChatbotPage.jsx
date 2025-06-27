// src/pages/ChatbotPage.jsx
import React, { useState } from 'react';
import '../styles/DashboardPage.css'; // 스타일시트 임포트

// [수정] Material-UI의 CircularProgress 컴포넌트 임포트
import { CircularProgress } from '@mui/material';

// [수정] 새로 만든 챗봇 서비스 함수 임포트
import { sendChatMessage } from '../services/chatbot.service'; 

function ChatbotPage({ defaultPrompt = '' }) {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '안녕하세요! AI 예측 결과에 대해 궁금한 점을 알려주세요.' },
  ]);
  const [input, setInput] = useState(defaultPrompt);
  const [isSending, setIsSending] = useState(false); // 메시지 전송 중 상태 추가

  const handleSend = async () => {
    // 입력이 비어있거나 이미 전송 중이면 함수 실행 중단
    if (!input.trim() || isSending) return; 

    const userMessageText = input; // 사용자 메시지 텍스트 저장
    const newUserMessage = { sender: 'user', text: userMessageText };
    
    // 사용자 메시지를 먼저 화면에 추가하고, 입력 필드 초기화
    setMessages((prev) => [...prev, newUserMessage]);
    setInput(''); 
    setIsSending(true); // 메시지 전송 시작 상태로 설정

    try {
      // [핵심 수정] fetch 대신 sendChatMessage 함수를 사용합니다.
      // 이 함수는 apiClient를 통해 JWT 토큰과 올바른 백엔드 URL로 요청을 보냅니다.
      const botReply = await sendChatMessage(userMessageText); // 챗봇 서비스 함수 호출

      // 챗봇 응답을 화면에 추가
      const botMessage = { sender: 'bot', text: botReply };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("챗봇 메시지 전송 실패 (프론트엔드):", error);
      // 오류 메시지를 화면에 표시
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `죄송합니다, 챗봇과 대화 중 오류가 발생했습니다: ${error.message}` },
      ]);
    } finally {
      setIsSending(false); // 메시지 전송 완료 상태로 설정
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🤖 CDSS 챗봇 - AI 설명 도우미</h1>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${msg.sender === 'user' ? 'user' : 'bot'}`}
          >
            {msg.text}
          </div>
        ))}
        {/* 챗봇 응답 대기 중 로딩 스피너 표시 */}
        {isSending && (
          <div className="chat-message bot">
            <CircularProgress size={20} /> 생각 중...
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => { // Enter 키를 눌렀을 때 메시지 전송
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          placeholder="AI 예측 결과에 대해 질문하세요..."
          disabled={isSending} // 메시지 전송 중에는 입력 필드 비활성화
        />
        <button onClick={handleSend} disabled={isSending}>
          {isSending ? '전송 중...' : '전송'}
        </button>
      </div>
    </div>
  );
}

export default ChatbotPage;