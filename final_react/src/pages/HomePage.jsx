// src/pages/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoggedInHeader from '../components/Header/LoggedInHeader';
import '../styles/HomePage.css';
import mainBg from '../image/main_bg.png';
import { 
  FaInstagram, 
  FaTwitter, 
  FaMicroscope, 
  FaLaptopMedical, 
  FaDatabase,
  FaDna,
  FaBrain,
  FaChartLine,
  FaShieldAlt 
} from 'react-icons/fa';

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
      case 'radio':
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
        <div className="hero-overlay">
          <div className="hero-content-absolute-center">
            <div className="hero-text-absolute-center">
              <h1 className="hero-title-absolute-center">오믹스와 영상의학의 만남</h1>
              <h2 className="hero-subtitle-absolute-center">차세대 암 진단 CDSS</h2>
              <p className="hero-description-absolute-center">
                유전체, 단백질체, 메틸레이션 데이터와 CT 영상을 통합 분석하여<br />
                정확한 암 진단과 예후 예측을 제공하는 지능형 임상 의사결정 지원 시스템
              </p>
              
              <div className="hero-buttons-absolute-center">
                <button className="hero-btn-bold primary" onClick={handleLearnMore}>
                  더 알아보기 →
                </button>
                
                {isAuthenticated && (
                  <button className="hero-btn-bold secondary" onClick={handleDashboardClick}>
                    내 대시보드로 이동
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI 기술 소개 섹션 */}
      <section className="home-details-center">
        <div className="details-container-center">
          <h2 className="section-title-center">🧬 Multi-Modal AI Integration Platform</h2>
          <p className="section-intro-center">
            오믹스 데이터, 의료영상, 임상정보를 융합한 차세대 정밀의료 플랫폼으로<br />
            개인 맞춤형 암 진단 및 예후 예측 시스템을 구현했습니다.
          </p>

          {/* 핵심 기능 카드들 */}
          <div className="features-showcase">
            <div className="feature-card-elegant">
              <div className="feature-icon-elegant">
                <FaDna />
              </div>
              <h3>Multi-Omics Data Analytics</h3>
              <div className="feature-description">
                <p>유전체(Genomics), 전사체(Transcriptomics), CNV(Copy Number Variation), 돌연변이(Mutation),
                메틸레이션(Methylomics) 데이터를 통합 분석하는 고도화된 바이오인포매틱스 파이프라인</p>
                <ul className="feature-highlights">
                  <li>XGBoost & LightGBM 앙상블 모델링</li>
                  <li>분자적 바이오마커 식별 및 분석</li>
                  <li>개인별 유전적 위험도 평가</li>
                </ul>
              </div>
            </div>

            <div className="feature-card-elegant">
              <div className="feature-icon-elegant">
                <FaBrain />
              </div>
              <h3>Medical Imaging Intelligence</h3>
              <div className="feature-description">
                <p>딥러닝 기반 CT 영상 분석 시스템으로 미세 병변 탐지부터 
                정량적 영상 바이오마커 추출까지 완전 자동화된 영상의학 솔루션</p>
                <ul className="feature-highlights">
                  <li>CNN 기반 병변 자동 탐지</li>
                  <li>Radiomics 특징 추출 및 분석</li>
                  <li>3D 볼륨 렌더링 및 정량 분석</li>
                </ul>
              </div>
            </div>

            <div className="feature-card-elegant">
              <div className="feature-icon-elegant">
                <FaChartLine />
              </div>
              <h3>Clinical Decision Support</h3>
              <div className="feature-description">
                <p>임상 데이터를 활용하여  
                암 위험도 분류, 암 환자 생존율 예측, 치료효과 예측 모델을 구축해 개인 맞춤형 치료 전략을 제시</p>
                <ul className="feature-highlights">
                  <li>암 위험도 모델</li>
                  <li>생존율 예측 모델</li>
                  <li>치료효과 예측 모델</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 비전 섹션 */}
          <div className="vision-section-elegant">
            <h3 className="vision-title-elegant">💡 Precision Medicine Innovation</h3>
            <div className="vision-grid">
              <div className="vision-item">
                <h4>Data-Driven Healthcare</h4>
                <p>다중 오믹스 데이터와 의료영상의 융합을 통한 정밀의료 구현으로 
                개인별 최적화된 진단 및 치료 솔루션을 제공합니다.</p>
              </div>
              <div className="vision-item">
                <h4>AI-Powered Decision Support</h4>
                <p>임상의의 전문성을 증강시키는 지능형 의사결정 지원 시스템으로 
                진단 정확도 향상과 치료 효과 극대화를 목표로 합니다.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 네비게이션 링크들 */}
        <div className="navigation-links-center">
          <button className="nav-link-elegant" onClick={() => navigate('/about')}>
            <span>Our Value</span>
          </button>
          <button className="nav-link-elegant" onClick={() => navigate('/team')}>
            <span>Research Team</span>
          </button>
          <button className="nav-link-elegant" onClick={() => navigate('/vision')}>
            <span>AI Technology</span>
          </button>
        </div>
      </section>

      {/* 기술 성과 섹션 */}
      <section className="achievements-section">
        <div className="achievements-container">
          <h2 className="achievements-title">🏆 Research Achievements & Innovation</h2>
          <p className="achievements-subtitle">
            다학제적 접근을 통한 혁신적인 AI-CDSS 플랫폼 개발 성과
          </p>

          <div className="achievement-cards">
            <div className="achievement-card">
              <div className="achievement-icon">🧬</div>
              <h3>Multi-Omics Integration</h3>
              <p>
                유전체, 돌연변이, 메틸레이션 데이터의 통합 분석을 통한 <strong>분자적 표현형 프로파일링</strong> 시스템을 구축하여 
                개인별 암 위험도 평가 및 치료 타겟 발굴을 가능하게 했습니다.
              </p>
            </div>

            <div className="achievement-card">
              <div className="achievement-icon">🖼️</div>
              <h3>Radiomics & Deep Learning</h3>
              <p>
                CT 영상에서 추출한 <strong>정량적 영상 바이오마커</strong>와 
                딥러닝 모델을 결합하여 기존 육안 판독의 한계를 극복한 
                객관적이고 재현 가능한 영상 분석 시스템을 개발했습니다.
              </p>
            </div>

            <div className="achievement-card">
              <div className="achievement-icon">📊</div>
              <h3>Predictive Modeling</h3>
              <p>
                임상 변수를 활용한 
                모델로 <strong>암 위험도 분류, 환자 생존율 및 치료반응 예측 모델</strong>을 구현하였습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 영역 */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>CDSS Platform</h3>
            <p>AI-Powered Precision Medicine for Cancer Care</p>
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

