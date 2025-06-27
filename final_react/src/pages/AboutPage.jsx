// src/pages/AboutPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      <main className="about-main">
        {/* 비전 소개 */}
        <section className="section vision-section">
          <h1>📌 CDSS 프로젝트 비전</h1>
          <p>
            우리는 의료 데이터의 힘을 믿습니다.<br />
            CDSS는 유전체, 단백질, CT 영상을까지 다양한 의료 데이터를 통합 분석하여<br />
            단 하나의 목표, '환자, 의료진에게 가장 적합한 치료법 제시'를 위해 존재합니다.<br />
            데이터 기반의 추론이 아닌, 생명을 위한 추론, 이것이 우리의 비전입니다.
          </p>
        </section>

        {/* 핵심 가치 */}
        <section className="section value-section">
          <h2>💎 우리의 핵심 가치</h2>
          <ul>
            <li><strong>정확성</strong>: 다양한 데이터를 종합해 오진 가능성을 낮춥니다.</li>
            <li><strong>설명 가능성</strong>: 복잡한 AI 결과도 의료진이 이해할 수 있도록 시각화와 해석을 제공합니다.</li>
            <li><strong>환자 중심</strong>: 개인 맞춤형 치료 경로를 제안합니다.</li>
            <li><strong>현장성</strong>: 연구실을 넘어 실제 임상 현장에서 사용할 수 있는 수준의 시스템</li>
          </ul>
        </section>

        {/* 주요 기능 */}
        <section className="section feature-section">
          <h2>🌟 주요 기능</h2>
          <ul>
            <li><strong>다중 오믹스 기반 정밀 예측</strong>: 유전자, 단백질, CNV, 메틸레이션 등 다중 오믹스 데이터를 결합하여 암 발생 가능성을 예측합니다.</li>
            <li><strong>CT 기반 병변 분할</strong>: 3D CT 영상에서 각종 장기 및 종양 부위를 정확히 분할하고 시각화합니다.</li>
            <li><strong>논문 요약 및 근거 기반 설명</strong>: 최신 의학 논문을 검색 및 요약하여 보여줍니다.</li>
            <li><strong>의사 맞춤 대시보드</strong>: 의료진 역할(의사/간호사/영상의학과 등)에 따라 맞춤형 정보 제공공 </li>
            <li>CT 영상 기반 분할 결과 제공</li>
          </ul>
        </section>

        {/* 기술 스택 */}
        <section className="section tech-section">
          <h2>🛠 기술 스택</h2>
          <ul>
            <li><strong>프론트엔드</strong>: React, Tailwind CSS</li>
            <li><strong>백엔드</strong>: Django,Celery</li>
            <li><strong>AI/모델</strong>: PyTorch, TensorFlow, Segmentation, AI </li>
          </ul>
        </section>

        {/* 프로젝트 목표 */}
        <section className="goal-card">
          <h2>🎯 우리의 목표</h2>
          <p>
            우리의 목표는 단순한 인공지능 도구가 아닌 의료진에 도움이 되고, 믿고 의지 할수있는 동반자를 개발하고자 합니다.<br />
            연구실을 넘어, 실제 병원에서 사용되는 정밀의료<br />
            신뢰도 높은 정밀의료 CDSS를 만드는 것이 우리의 사명입니다.
          </p>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;
