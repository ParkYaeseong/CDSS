// src/pages/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoggedInHeader from '../components/Header/LoggedInHeader';
import '../styles/HomePage.css';
import mainBg from '../image/main_bg.png';
import { FaInstagram, FaTwitter, FaMicroscope, FaLaptopMedical, FaDatabase } from 'react-icons/fa';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleLearnMore = () => {
    navigate('/about');
  };

  const handleDashboardClick = () => {
    // 사용자 역할에 따라 적절한 대시보드로 이동
    switch (user?.user_type) {
      case 'doctor':
        navigate('/dashboard');
        break;
      case 'nurse':
        navigate('/nurse-panel');
        break;
      case 'radiologist':
        navigate('/radiologist-panel');
        break;
      case 'staff':
        navigate('/admin-panel');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div className="homepage">
      {/* 로그인된 사용자에게만 헤더 표시 */}
      {isAuthenticated && <LoggedInHeader />}
      
      <div className={`home-hero ${isAuthenticated ? 'page-with-header' : ''}`} 
           style={{ backgroundImage: `url(${mainBg})` }}>
        <div className="hero-simple-text">
          <div className="hero-icons">
            <FaMicroscope className="hero-icon" title="AI 진단" />
            <FaLaptopMedical className="hero-icon" title="정밀의료" />
            <FaDatabase className="hero-icon" title="데이터 통합" />
          </div>
          <h1 className="hero-title">정밀 의료를 위한 CDSS</h1>
          <p className="hero-subtitle">AI 기반 진단으로 환자 맞춤형 치료를 지원합니다.</p>
          
          <div className="hero-buttons">
            <button className="hero-button" onClick={handleLearnMore}>더 알아보기 →</button>
            
            {/* 로그인 상태에 따라 다른 버튼 표시 */}
            {isAuthenticated ? (
              <button className="hero-button primary" onClick={handleDashboardClick}>
                내 대시보드로 이동
              </button>
            ) : (
              <>
                <button className="hero-button secondary" onClick={() => navigate('/login')}>로그인</button>
                <button className="hero-button secondary" onClick={() => navigate('/register')}>회원가입</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scroll 하단 소개 섹션 */}
      <section className="home-details">
        <h2>우리는 어떻게 AI를 활용하나요?</h2>
        <p>
          CDSS는 CT, 유전체, 단백질 발현, 메틸레이션 등 다양한 오믹스 데이터를 AI 모델과 결합하여
          환자의 질병을 조기에 진단하고 예측합니다. <br />
          의사와 간호사는 통합 플랫폼을 통해 진단 결과와 약물 안전성 정보를 직관적으로 확인할 수 있습니다.
        </p>
        <h3>💡 우리의 비전</h3>
        <p>
          모든 의료 데이터를 통합하고, 누구나 신속하고 정확한 진료를 받을 수 있는 환경을 만드는 것이 우리의 목표입니다.
          CDSS는 의료진의 판단을 보조하고, 환자 맞춤형 치료를 가능하게 합니다.
        </p>
        
        {/* 추가 네비게이션 링크들 */}
        <div className="additional-links">
          <button className="link-button" onClick={() => navigate('/about')}>OurValue</button>
          <button className="link-button" onClick={() => navigate('/team')}>Team</button>
          <button className="link-button" onClick={() => navigate('/vision')}>AI</button>
        </div>
      </section>

      {/* 후기/성과 섹션 */}
      <section className="home-testimonials">
        <h2>📈 CDSS 모델 성능과 사용자 피드백</h2>
        <div className="testimonial-card">
          <p>
            "CDSS의 AI 모델은 CT 및 유전체 데이터를 바탕으로 92% 이상의 정확도로 암 진단을 수행했습니다.
            의료 현장에서 빠른 판단에 큰 도움이 되었습니다."
          </p>
          <span>— 서울대병원 영상의학과 교수</span>
        </div>
        <div className="testimonial-card">
          <p>
            "예측 모델의 민감도와 특이도가 높아, 조기 진단 및 재발 방지에 효과적이었습니다.
            간호사로서 환자 케어의 질이 높아졌음을 체감합니다."
          </p>
          <span>— 삼성서울병원 간호사</span>
        </div>
      </section>

      {/* 푸터 영역 */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>CDSS 병원</h3>
            <p>정밀 의료를 위한 AI 기반 진단 시스템</p>
          </div>
          <div className="footer-social">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram size={24} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter size={24} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
