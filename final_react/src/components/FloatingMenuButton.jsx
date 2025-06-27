// src/components/FloatingMenuButton.jsx
import React, { useState } from 'react';
import './FloatingMenu.css';

function FloatingMenuButton({ onMessageClick, onChatbotClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSubButtonClick = (callback, buttonName) => {
    console.log(`${buttonName} 서브 버튼 클릭됨`);
    if (callback) {
      callback();
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="floating-menu-wrapper">
      {/* 서브 버튼들 - 메인 버튼보다 먼저 렌더링 */}
      <div className={`floating-menu-container ${isMenuOpen ? 'open' : ''}`}>
        <button 
          className="floating-sub-button floating-chatbot-sub"
          onClick={() => handleSubButtonClick(onChatbotClick, '챗봇')}
          title="챗봇"
        >
          🤖
        </button>
        
        <button 
          className="floating-sub-button floating-message-sub"
          onClick={() => handleSubButtonClick(onMessageClick, '메시지')}
          title="메시지"
        >
          💬
        </button>
      </div>

      {/* 메인 + 버튼 */}
      <button 
        className={`floating-main-button ${isMenuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
      >
        <span className="plus-icon">+</span>
      </button>
    </div>
  );
}

export default FloatingMenuButton;
