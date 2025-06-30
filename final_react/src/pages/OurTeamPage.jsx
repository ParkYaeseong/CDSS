import React, { useState, useEffect, useRef } from 'react'; // useRef 추가
import '../styles/OurTeamPage.css';

// 이미지 import 및 teamMembers 데이터는 이전과 동일하게 유지
import yesungImage from '../image/박예성.jpg';
import sohyunImage from '../image/박소현.jpg';
import eunjungImage from '../image/배은정.jpg';
import minaImage from '../image/양미나.jpg';
import yunaImage from '../image/지유나.jpg';

const teamMembers = [
  {
    id: 'leader-py',
    image: yesungImage,
    name: '박예성',
    role: 'AI 연구 및 시스템 총괄 (Team Leader)',
    quote: '다양한 의료 데이터에 의미를 더해, 정밀 진단과 최적의 치료를 위한 길을 열어갑니다.',
    description:
      'CDSS 프로젝트의 전반적인 계획 수립 및 진행 관리를 총괄하며 팀을 이끌었습니다. 특히 CT 영상 분석 모델과 다중 오믹스 기반 예측 모델의 핵심 개발을 담당했고, 서버 시스템과의 유기적인 연동을 구현하여 AI 모델의 성능 최적화와 임상적 유효성 검증을 성공적으로 리딩했습니다.',
    skills: ['Medical AI',
      'Deep Learning',
      'Computer Vision',
      'Omics Data Analysis', 
      'Project Management',
      'System Architecture'],
  },
  
  {
    id: 'frontend-ps',
    image: sohyunImage,
    name: '박소현',
    role: 'AI 연구',
    quote: '멀티오믹스를 활용하여 암의 유무 판별을 넘어 암종 분류까지 규명하는 정밀 진단 모델을 구현했습니다',
    description:
      "멀티오믹스 데이터를 기반으로 '암/정상' 판별과 6종의 '암종'을 순차적으로 분류하는 2단계 AI 진단 파이프라인, 생성형 AI를 활용한 최신 논문을 검색·요약하고 공공 API로 실시간 약물 상호작용(DDI)을 검사할 수 있는 기능을 개발했습니다.",
    skills: ['멀티오믹스', 'CDSS', '생성형AI', 'React', '데이터시각화'],
  },

  {
    id: 'data-be',
    image: eunjungImage,
    name: '배은정',
    role: '프론트엔드 개발자 (Frontend Developer)',
    quote: '임상 데이터를 활용한 AI 모델 개발과 의료진을 위한 직관적인 데이터 시각화 시스템 구축을 담당합니다',
    description:
      '다양한 암종의 TCGA 데이터를 활용해 생존율 예측 및 위험도 분류 모델을 개발하고 성능을 최적화하였습니다.XAI 기반 예측 결과 해석과 데이터 시각화를 통해 임상 모델의 설명력을 강화하였습니다. React-Frontend와 Django-Backend를 연동한 CDSS를 구축하고 직관적인 UI/UX를 설계하였습니다.',
    skills: ['React', 'Python', 'Data Visualization', 'SHAP', 'CSS', 'UI/UX Design'],
  },
  {
    id: 'bio-ym',
    image: minaImage,
    name: '양미나',
    role: '풀스택 개발자 (Full Stack Developer)',
    quote: '역할별 맞춤 인터페이스로 의료진의 업무 효율성을 극대화합니다',
    description:
      'Django 기반 서버 개발, 간호일지 자동 작성을 위한 AI 모델을 개발했습니다. 공공데이터 API를 연동하여 Flutter 기능을 구축했고, React 기반 프론트엔드에서 전체 UI/UX를 설계했습니다. 백엔드와 프론트엔드 간의 API 연동을 최적화하여 헬스케어 통합 플랫폼을 완성했습니다. ',
    skills: ['React', 'Django', 'Flutter', 'API Development', 'Database Management', 'UI/UX Design', 'Server Configuration'],
  },
  {
    id: 'planning-jy',
    image: yunaImage,
    name: '지유나',
    role: '프로젝트 매니저 (Project Manager)',
    quote: '성공적인 프로젝트는 명확한 방향과 원활한 소통에서 시작됩니다.',
    description:
      'CDSS 헬스케어 플랫폼의 PM으로서 기획, 데이터 통합, 일정 관리, 팀 역할 조율을 총괄하였습니다. Flutter·React·Django 기반 멀티플랫폼에서 풀스택 개발을 직접 수행하며 기술 구현했습니다. PACS, FHIR, EMR 등 병원 시스템 연동과 역할 기반 UI 설계로 실제 진료 흐름을 구현했습니다.',
    skills: ['CDSS', 'ProjectManagement', 'HealthcareAI', 'MultimodalData', 'SystemArchitecture', 'EMR', 'FHIR', 'PACS', 'UXStrategy', 'Flutter', 'React', 'Djanog'],
  },
];


export default function OurTeamPage() {
    const [selectedMember, setSelectedMember] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const showcaseRef = useRef(null);

    const handleMemberSelect = (member) => {
        if (selectedMember && selectedMember.id === member.id) {
            showcaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        setIsAnimating(true);
        setTimeout(() => {
            setSelectedMember(member);
            setIsAnimating(false);
        }, 150);
    };

    useEffect(() => {
        if (selectedMember && showcaseRef.current) {
            setTimeout(() => {
                showcaseRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }, 200);
        }
    }, [selectedMember]);

    return (
        <div className="team-page-container">
            <header className="team-header">
                <h1>TEAM MEANING</h1>
                <p className="team-slogan">
                    데이터의 숨은 의미를 찾아, 생명의 가치를 더합니다.
                </p>
                <p className="team-intro">
                    <strong>팀 Meaning</strong>은 방대한 의료 데이터 속 '의미(Meaning)'를 찾아 암 조기 진단과 정밀 의료 혁신을 추구합니다. <br></br>CT 영상, 임상 정보, 다중 오믹스를 통합 분석하여, 의료진에게 설명 가능한 AI 기반 예측과 인사이트를 제공하고 <br></br>환자 맞춤형 치료를 실현하는 것이 우리의 목표입니다.
                </p>
            </header>

            <section className="team-grid-section">
                <div className="team-layout-container">
                    {/* 첫 번째 줄 (3명) */}
                    <div className="team-row">
                        {teamMembers.slice(0, 3).map((member) => (
                            <div
                                key={member.id}
                                className={`member-card ${selectedMember && selectedMember.id === member.id ? 'active' : ''}`}
                                onClick={() => handleMemberSelect(member)}
                            >
                                <img src={member.image} alt={member.name} className="card-image" />
                                <div className="card-info">
                                    <span className="card-name">{member.name}</span>
                                    <p className="card-role">{member.role.split('(')[0].trim()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* 두 번째 줄 (2명) */}
                    <div className="team-row">
                        {teamMembers.slice(3, 5).map((member) => (
                            <div
                                key={member.id}
                                className={`member-card ${selectedMember && selectedMember.id === member.id ? 'active' : ''}`}
                                onClick={() => handleMemberSelect(member)}
                            >
                                <img src={member.image} alt={member.name} className="card-image" />
                                <div className="card-info">
                                    <span className="card-name">{member.name}</span>
                                    <p className="card-role">{member.role.split('(')[0].trim()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {selectedMember && (
                <section
                    ref={showcaseRef}
                    key={selectedMember.id}
                    className={`member-showcase ${isAnimating ? 'fade-out' : 'fade-in'}`}
                >
                    <div className="showcase-image-wrapper">
                        <img src={selectedMember.image} alt={selectedMember.name} />
                    </div>
                    <div className="detail-text-wrapper">
                        <p className="detail-quote">"{selectedMember.quote}"</p>
                        <h2 className="detail-name">{selectedMember.name}</h2>
                        <h3 className="detail-role">{selectedMember.role}</h3>
                        <p className="detail-description">{selectedMember.description}</p>
                        <div className="skills-container">
                            {selectedMember.skills.map((skill, index) => (
                                <span key={skill} className="skill-tag" style={{ animationDelay: `${index * 0.1}s` }}>
                                    #{skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {!selectedMember && (
                <div className="selection-prompt">
                    <p>팀원을 선택하여 자세한 정보를 확인하세요.</p>
                </div>
            )}
        </div>
    );
}