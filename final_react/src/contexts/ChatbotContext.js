// src/contexts/ChatbotContext.js
import React, { createContext, useState, useContext } from 'react';

// 1. ChatbotContext를 생성합니다.
const ChatbotContext = createContext();

// 2. 다른 컴포넌트에서 이 컨텍스트를 쉽게 사용할 수 있도록 커스텀 훅을 만들어 내보냅니다.
export const useChatbot = () => {
  return useContext(ChatbotContext);
};

// 3. 컨텍스트의 상태를 제공할 Provider 컴포넌트입니다.
export const ChatbotProvider = ({ children }) => {
  // 챗봇에게 전달할 컨텍스트(상황 정보)를 상태로 관리합니다.
  const [chatbotContext, setChatbotContext] = useState(null);

  const value = {
    chatbotContext,
    setChatbotContext,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};
