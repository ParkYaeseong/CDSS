// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatbotProvider } from './contexts/ChatbotContext';

// 기존 Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RadiologistPanel from './pages/RadiologistPanel';
import DashboardPage from './pages/DashboardPage';
import NursePanel from './pages/NursePanel';
import LabResultPage from './pages/LabResultPage';
import OmicsResultPage from './pages/OmicsResultPage';
import PredictionPage from './pages/PredictionPage';
import AboutPage from './pages/AboutPage';
import OurTeamPage from './pages/OurTeamPage';
import VisionTechPage from './pages/VisionTechPage';
import AdminPanel from './pages/AdminPanel';
import ClinicalDataInputPage from './pages/ClinicalDataInputPage';
import ClinicalPredictionPage from './pages/ClinicalPredictionPage';

// Components
import PrivateRouteWithRole from './components/PrivateRouteWithRole';
import Layout from './components/Layout/Layout';
import FloatingMenuButton from './components/FloatingMenuButton';
import FloatingMessageButton from './components/Messages/FloatingMessageButton';
import FloatingChatbot from './components/Chatbot/FloatingChatbot';

// 메인 앱 컨텐츠 컴포넌트
function AppContent() {
  const { isAuthenticated } = useAuth(); // 인증 상태 확인
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [messageKey, setMessageKey] = useState(0);

  const handleMessageClick = () => {
    console.log('메시지 버튼 클릭됨');
    if (isMessageOpen) {
      setIsMessageOpen(false);
      setTimeout(() => {
        setMessageKey(prev => prev + 1);
        setIsMessageOpen(true);
      }, 100);
    } else {
      setMessageKey(prev => prev + 1);
      setIsMessageOpen(true);
    }
  };

  const handleChatbotClick = () => {
    console.log('챗봇 버튼 클릭됨');
    setIsChatbotOpen(true);
  };

  const handleMessageClose = () => {
    console.log('메시지 창 닫힘');
    setIsMessageOpen(false);
  };

  const handleChatbotClose = () => {
    console.log('챗봇 창 닫힘');
    setIsChatbotOpen(false);
  };

  return (
    <Layout>
      {/* 로그인된 사용자에게만 플로팅 메뉴 버튼 표시 */}
      {isAuthenticated && (
        <>
          {/* 통합 플로팅 메뉴 버튼 */}
          <FloatingMenuButton 
            onMessageClick={handleMessageClick}
            onChatbotClick={handleChatbotClick}
          />
          
          {/* 메시지 컴포넌트 - key prop으로 강제 재렌더링 */}
          {isMessageOpen && (
            <FloatingMessageButton 
              key={messageKey}
              onClose={handleMessageClose} 
            />
          )}
          
          {/* 챗봇 컴포넌트 - 조건부 렌더링 */}
          <FloatingChatbot 
            isOpen={isChatbotOpen} 
            onClose={handleChatbotClose} 
          />
        </>
      )}

      <Routes>
        {/* 기본 페이지들 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/team" element={<OurTeamPage />} />
        <Route path="/vision" element={<VisionTechPage />} />
        <Route path="/clinical-data-input" element={<ClinicalDataInputPage />} />
        <Route path="/clinical-prediction" element={<ClinicalPredictionPage />} />

        {/* 권한이 필요한 페이지들 */}
        <Route
          path="/radiologist-panel"
          element={
            <PrivateRouteWithRole role="radio">
              <RadiologistPanel />
            </PrivateRouteWithRole>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRouteWithRole role="doctor">
              <DashboardPage />
            </PrivateRouteWithRole>
          }
        />
        <Route
          path="/prediction"
          element={
            <PrivateRouteWithRole role="doctor">
              <PredictionPage />
            </PrivateRouteWithRole>
          }
        />
        <Route
          path="/omics/result/:requestId"
          element={
            <PrivateRouteWithRole role="nurse">
              <OmicsResultPage />
            </PrivateRouteWithRole>
          }
        />
        <Route
          path="/nurse-panel"
          element={
            <PrivateRouteWithRole role="nurse">
              <NursePanel />
            </PrivateRouteWithRole>
          }
        />
        <Route
          path="/lab-result/:patientId"
          element={
            <PrivateRouteWithRole role="nurse">
              <LabResultPage />
            </PrivateRouteWithRole>
          }
        />
        <Route
          path="/admin-panel"
          element={
            <PrivateRouteWithRole role="staff">
              <AdminPanel />
            </PrivateRouteWithRole>
          }
        />
      </Routes>
    </Layout>
  );
}

// 메인 App 컴포넌트
function App() {
  return (
    <AuthProvider>
      <ChatbotProvider>
        <Router basename="/cdss">
          <AppContent />
        </Router>
      </ChatbotProvider>
    </AuthProvider>
  );
}

export default App;
