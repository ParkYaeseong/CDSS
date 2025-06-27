// src/components/Chatbot/ChatWindow.jsx
import React, { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { sendChatMessage } from '../../services/chatbot.service';
import './Chatbot.css';

function ChatWindow({ closeChat }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMessages([
      { sender: 'bot', text: '안녕하세요! AI 챗봇입니다. 무엇을 도와드릴까요?' },
    ]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    setIsSending(true);

    try {
      const botReply = await sendChatMessage(messageToSend);
      const botMessage = { sender: 'bot', text: botReply };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('챗봇 오류:', error);
      const errorMessage = { sender: 'bot', text: '죄송합니다, 오류가 발생했습니다.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot-window-container">
      <div className="chatbot-header">
        <h3>🤖 AI 챗봇</h3>
        <button onClick={closeChat} className="close-chatbot-button">✕</button>
      </div>
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chatbot-message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isSending && (
          <div className="chatbot-message bot">
            <CircularProgress size={20} />
          </div>
        )}
      </div>
      <div className="chatbot-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          disabled={isSending}
        />
        <button onClick={handleSend} disabled={isSending}>
          전송
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
