// src/components/Chatbot/FloatingChatbot.jsx
import React from 'react';
import ChatWindow from './ChatWindow';

/**
 * 플로팅 챗봇의 채팅창만 제어하는 컴포넌트입니다.
 * 버튼은 FloatingMenuButton에서 관리됩니다.
 */
function FloatingChatbot({ isOpen, onClose }) {
  return (
    <>
      {/* 챗봇 창 - 조건부 렌더링 */}
      {isOpen && <ChatWindow closeChat={onClose} />}
    </>
  );
}

export default FloatingChatbot;
