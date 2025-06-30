import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBullseye, FaEye, FaShieldAlt, FaBolt, FaSearch, FaUserMd, FaBrain } from 'react-icons/fa';
import '../styles/AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      {/* 히어로 섹션 - 통합 */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="primary-text">CDSS,</span> 암 진단의 블랙박스를 열다
          </h1>
          <br></br>
          <br></br>
          <h2 className="hero-subtitle">
            단순 예측을 넘어, <span className="accent-text">신뢰할 수 있는 진단 파트너로</span>
          </h2>
          <p className="hero-description">
            저희는 6개의 전문 AI 모델이 협업하는 자동화 진단 파이프라인을 통해 높은 정확도는 물론, 예측의 구체적인 근거까지 제시하여 데이터 기반 정밀의료의 새로운 기준을 제시합니다.
          </p>
          
          {/* 핵심 가치 - 히어로 섹션에 통합 */}
          <div className="values-container">
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">
                  <FaBullseye />
                </div>
                <h3>정확성</h3>
                <p>6개의 전문 AI 모델이 협업하여 단일 모델 대비 높은 정확도를 달성합니다.</p>
              </div>

              <div className="value-card">
                <div className="value-icon">
                  <FaEye />
                </div>
                <h3>투명성</h3>
                <p>XAI 기술로 AI의 판단 근거를 시각적으로 제시하여 의료진의 이해를 돕습니다.</p>
              </div>

              <div className="value-card">
                <div className="value-icon">
                  <FaShieldAlt />
                </div>
                <h3>신뢰성</h3>
                <p>다단계 검증 시스템으로 오진 가능성을 최소화하고 일관된 결과를 제공합니다.</p>
              </div>

              <div className="value-card">
                <div className="value-icon">
                  <FaBolt />
                </div>
                <h3>효율성</h3>
                <p>자동화된 파이프라인으로 빠른 진단 결과와 치료 계획 수립을 지원합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 진단 파이프라인 */}
      <section className="pipeline-section">
        <div className="hero-title">
          <h2>Our Automated Diagnostic Pipeline</h2>
        </div>
        <div className="section-header">
          <p>사용자가 데이터를 업로드하면 저희 시스템은 아래 3단계의 자동화된 파이프라인을 통해 실속하고 신뢰도 높은 분석 결과를 제공합니다.</p>
        </div>
        
        <div className="pipeline-steps">
          <div className="step-card">
            <div className="step-icon medical-icon">
              <FaSearch />
            </div>
            <h3>1단계: 병변 스크리닝</h3>
            <p>6개의 입출력 '전문 모델'이 동시에 업로드된 데이터를 감지하여 암의 특징이 보이는지 1차적으로 스크리닝합니다.</p>
          </div>

          <div className="step-card">
            <div className="step-icon brain-icon">
              <FaUserMd />
            </div>
            <h3>2단계: 종양 통제 및 관찰</h3>
            <p>6개 모델의 결과를 종합하여 '정상', '암 의심(명확)', '암 의심(모호)' 세 가지 카테고리로 상황을 판단합니다.</p>
          </div>

          <div className="step-card">
            <div className="step-icon analysis-icon">
              <FaBrain />
            </div>
            <h3>3단계: 특화 분석 및 XAI</h3>
            <p>암이 명확하게 의심될 경우, 해당 암 종에 특화된 모델이 심층 분석을 수행하고, 판단의 핵심 근거를 시각적으로 제시합니다.</p>
          </div>
        </div>
      </section>

      {/* 기술 스택 */}
  <section className="tech-section">
    <div className="hero-title">
      <h2 style={{ textAlign: 'center' }}>기술 스택</h2>
    </div>

    <div className="tech-grid">
      <div className="tech-category">
        <h3 style={{ textAlign: 'center' }}>Frontend</h3>
        <div className="tech-items">
          <div className="tech-item">
            <span className="tech-name">React</span>
            <span className="tech-desc">SPA 사용자 인터페이스</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Material-UI (MUI)</span>
            <span className="tech-desc">UI 컴포넌트 라이브러리</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Tailwind CSS</span>
            <span className="tech-desc">스타일링 프레임워크</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">React Router DOM</span>
            <span className="tech-desc">라우팅 관리</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">React Context API</span>
            <span className="tech-desc">상태 관리</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Axios</span>
            <span className="tech-desc">API 통신</span>
          </div>
        </div>
      </div>

      <div className="tech-category">
        <h3 style={{ textAlign: 'center' }}>Backend</h3>
        <div className="tech-items">
          <div className="tech-item">
            <span className="tech-name">Django</span>
            <span className="tech-desc">웹 프레임워크</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Django REST Framework</span>
            <span className="tech-desc">API 개발 프레임워크</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Celery</span>
            <span className="tech-desc">비동기 작업 처리</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Django Simple JWT</span>
            <span className="tech-desc">JWT 인증</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">drf-yasg</span>
            <span className="tech-desc">API 문서화 (Swagger/ReDoc)</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">MySQL</span>
            <span className="tech-desc">관계형 데이터베이스</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Redis</span>
            <span className="tech-desc">메시지 브로커 & 캐시</span>
          </div>
        </div>
      </div>

      <div className="tech-category">
        <h3 style={{ textAlign: 'center' }}>딥러닝 & 의료 AI</h3>
        <div className="tech-items">
          <div className="tech-item">
            <span className="tech-name">PyTorch</span>
            <span className="tech-desc">딥러닝 모델 구현 및 학습</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">MONAI</span>
            <span className="tech-desc">의료 영상 딥러닝 프레임워크</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">SwinUNETR</span>
            <span className="tech-desc">3D Vision Transformer 모델</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">3D U-Net</span>
            <span className="tech-desc">3D 의료 영상 세분화 모델</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">TensorFlow</span>
            <span className="tech-desc">머신러닝 플랫폼</span>
          </div>
        </div>
      </div>

      <div className="tech-category">
        <h3 style={{ textAlign: 'center' }}>머신러닝 & 데이터 분석</h3>
        <div className="tech-items">
          <div className="tech-item">
            <span className="tech-name">scikit-learn</span>
            <span className="tech-desc">데이터 전처리 및 ML 모델</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">XGBoost</span>
            <span className="tech-desc">그래디언트 부스팅</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">LightGBM</span>
            <span className="tech-desc">경량 그래디언트 부스팅</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">RandomForest</span>
            <span className="tech-desc">앙상블 학습 알고리즘</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">SVM</span>
            <span className="tech-desc">서포트 벡터 머신</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Imbalanced-learn</span>
            <span className="tech-desc">데이터 불균형 처리 (SMOTE)</span>
          </div>
        </div>
      </div>

      <div className="tech-category">
        <h3 style={{ textAlign: 'center' }}>의료 영상 처리</h3>
        <div className="tech-items">
          <div className="tech-item">
            <span className="tech-name">SimpleITK</span>
            <span className="tech-desc">의료 영상 파일 처리</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Nibabel</span>
            <span className="tech-desc">NIfTI 파일 처리</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">NiiVue</span>
            <span className="tech-desc">3D 의료 영상 뷰어</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">DCMTK</span>
            <span className="tech-desc">DICOM 파일 처리</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Orthanc Server</span>
            <span className="tech-desc">PACS 서버</span>
          </div>
        </div>
      </div>

      <div className="tech-category">
        <h3 style={{ textAlign: 'center' }}>설명 가능한 AI (XAI)</h3>
        <div className="tech-items">
          <div className="tech-item">
            <span className="tech-name">SHAP</span>
            <span className="tech-desc">특징 중요도 분석</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Grad-CAM</span>
            <span className="tech-desc">딥러닝 모델 시각적 해석</span>
          </div>
        </div>
      </div>

      <div className="tech-category">
        <h3 style={{ textAlign: 'center' }}>데이터 시각화</h3>
        <div className="tech-items">
          <div className="tech-item">
            <span className="tech-name">Recharts</span>
            <span className="tech-desc">React 차트 라이브러리</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Matplotlib</span>
            <span className="tech-desc">Python 시각화</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Seaborn</span>
            <span className="tech-desc">통계 데이터 시각화</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Plotly</span>
            <span className="tech-desc">인터랙티브 차트</span>
          </div>
        </div>
      </div>

      <div className="tech-category">
        <h3 style={{ textAlign: 'center' }}>외부 API 연동</h3>
        <div className="tech-items">
          <div className="tech-item">
            <span className="tech-name">공공데이터포털</span>
            <span className="tech-desc">병원/약국/응급실 정보</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">DUR API</span>
            <span className="tech-desc">약물 병용금기 정보</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">PubMed/EPMC API</span>
            <span className="tech-desc">논문 검색 및 요약</span>
          </div>
          <div className="tech-item">
            <span className="tech-name">Google Gemini API</span>
            <span className="tech-desc">AI 챗봇 서비스</span>
          </div>
        </div>
      </div>
    </div>
  </section>

      {/* 목표 */}
      <section className="goal-section">
        <div className="goal-content">
          <h2 style={{ textAlign: 'center' }}>우리의 목표</h2>
          <p>
            단순한 AI 도구가 아닌, 의료진이 신뢰하고 의지할 수 있는 <strong>진단 파트너</strong>를 만드는 것입니다.
            연구실을 넘어 실제 임상 현장에서 활용되는 정밀의료 시스템을 구축하여, 
            환자와 의료진 모두에게 도움이 되는 혁신적인 솔루션을 제공합니다.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
