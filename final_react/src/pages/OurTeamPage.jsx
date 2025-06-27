import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OurTeamPage.css';

const teamMembers = [
  {
    image: '/images/yesung.png',
    name: '박예성',
    role: '팀장',
    description: '의료영상 및 오믹스 데이터를 분석하는 딥러닝 모델을 개발합니다.',
  },
  {
    image: '/images/sohyun.png',
    name: '박소현',
    role: '프론트엔드 개발자',
    description: '사용자 친화적인 UI/UX를 React로 개발하고 연결합니다.',
  },
  {
    image: '/images/eunjung.png',
    name: '배은정',
    role: '데이터 분석 & 시각화',
    description: 'AI 결과를 해석하고 의료진이 이해할 수 있도록 시각화합니다.',
  },
  {
    image: '/images/mina.png',
    name: '양미나',
    role: '바이오정보 담당',
    description: '오믹스 전처리, 유전체 데이터 파이프라인을 구축합니다.',
  },
  {
    image: '/images/yuna.png',
    name: '지유나',
    role: '기획 및 문서화',
    description: '전체 프로젝트 기획, 발표 자료 및 문서 작성을 맡고 있습니다.',
  },
];

export default function OurTeamPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-index'));
            setActiveIndex(idx);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.5 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* 상단 고정 홈 버튼 */}
      <div className="top-nav">
        <button onClick={() => navigate('/')}>홈</button>
      </div>

      {/* 인트로 섹션 */}
      <div className="team-intro">
        <h1>CDSS 프로젝트 팀원 소개</h1>
        <p className="sub">Clinical Decision Support System</p>
        <img src="/images/team_intro.png" alt="CDSS Intro" />
        <div className="scroll-indicator">↓</div>
      </div>

      {/* 스크롤 섹션 */}
      <div className="team-scroll-container">
        <div className="text-scroll-area">
          {teamMembers.map((member, idx) => (
            <section
              key={idx}
              className={`team-section ${activeIndex === idx ? 'active' : ''}`}
              data-index={idx}
              ref={(el) => (sectionRefs.current[idx] = el)}
            >
              <h2>{member.name}</h2>
              <h4>{member.role}</h4>
              <p>{member.description}</p>
            </section>
          ))}
        </div>

        <div className="image-fixed">
          <img src={teamMembers[activeIndex].image} alt={teamMembers[activeIndex].name} />
        </div>
      </div>
    </>
  );
}
