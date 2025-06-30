import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';
import { FaProjectDiagram, FaBrain, FaSearchPlus, FaUserMd, FaHeartbeat, FaPills, FaHeart } from 'react-icons/fa';
import '../styles/VisionTechPage.css';
import pancreasVideo from '../assets/videos/pancreas_demo.mp4';

// --- 기존 데이터 준비 ---

// '암 vs 정상' 모델 성능 비교 데이터 (Mutation 제외, AUC 높은 순 정렬)
const binaryModelPerformance = [
  { name: 'miRNA', auc: 0.996, accuracy: 97.2 },
  { name: 'Methylation', auc: 0.994, accuracy: 97.0 },
  { name: 'Gene Expression', auc: 0.993, accuracy: 96.4 },
  { name: 'CNV', auc: 0.967, accuracy: 94.4 },
].sort((a, b) => b.auc - a.auc);

// '암 vs 정상' 순위 차트용 톤온톤 색상 팔레트
const RANKING_PALETTE = ['#005f87', '#0077b6', '#008cce', '#36b4f0'];

// '암 vs 정상' 상세 분석용 데이터 (KPI, 혼동행렬, 정밀도/재현율, XAI Top5)
const detailedAnalysisData = {
  'miRNA': {
    kpis: { acc: '97.2%', f1: '0.91' },
    cm: { TP: 295, FN: 6, FP: 4, TN: 52 },
    pr: { cancer_p: 0.99, cancer_r: 0.98, normal_p: 0.90, normal_r: 0.93 },
    xaiTop5: [ { name: 'hsa-mir-122', value: 0.8, cancer: 'LIHC' }, { name: 'hsa-mir-21', value: 0.75, cancer: 'OV' }, { name: 'hsa-mir-182', value: 0.6, cancer: 'BRCA' }, { name: 'hsa-mir-183', value: 0.5, cancer: 'BRCA' }, { name: 'hsa-mir-200a', value: 0.4, cancer: 'STAD' } ],
  },
  'Gene Expression': {
    kpis: { acc: '96.4%', f1: '0.89' },
    cm: { TP: 296, FN: 6, FP: 7, TN: 54 },
    pr: { cancer_p: 0.98, cancer_r: 0.98, normal_p: 0.90, normal_r: 0.89 },
    xaiTop5: [ { name: 'COL1A1', value: 0.9, cancer: 'STAD' }, { name: 'SPP1', value: 0.8, cancer: 'LIHC' }, { name: 'THBS2', value: 0.72, cancer: 'BRCA' }, { name: 'FN1', value: 0.65, cancer: 'OV' }, { name: 'MMP9', value: 0.5, cancer: 'KIRC' } ],
  },
  'Methylation': {
    kpis: { acc: '97.0%', f1: '0.93' },
    cm: { TP: 233, FN: 7, FP: 2, TN: 58 },
    pr: { cancer_p: 0.99, cancer_r: 0.97, normal_p: 0.89, normal_r: 0.97 },
    xaiTop5: [ { name: 'cg10673833', value: 1.1, cancer: 'KIRC' }, { name: 'cg04949205', value: 0.95, cancer: 'BRCA' }, { name: 'cg23355152', value: 0.85, cancer: 'LUSC' }, { name: 'cg19421947', value: 0.7, cancer: 'LIHC' }, { name: 'cg10515322', value: 0.6, cancer: 'STAD' } ],
  }
};

// 다중 암종 모델 성능 데이터
const performanceData = [ 
  { cancer: 'BRCA', accuracy: '99.5%', auc: '0.998', f1: '0.99', accuracyVal: 99.5, aucVal: 99.8, f1Val: 99.0 }, 
  { cancer: 'KIRC', accuracy: '98.9%', auc: '0.992', f1: '0.97', accuracyVal: 98.9, aucVal: 99.2, f1Val: 97.0 }, 
  { cancer: 'LIHC', accuracy: '99.2%', auc: '0.997', f1: '0.99', accuracyVal: 99.2, aucVal: 99.7, f1Val: 99.0 }, 
  { cancer: 'LUSC', accuracy: '98.5%', auc: '0.990', f1: '0.99', accuracyVal: 98.5, aucVal: 99.0, f1Val: 99.0 }, 
  { cancer: 'OV',   accuracy: '99.0%', auc: '0.995', f1: '0.99', accuracyVal: 99.0, aucVal: 99.5, f1Val: 99.0 }, 
  { cancer: 'STAD', accuracy: '99.1%', auc: '0.996', f1: '0.99', accuracyVal: 99.1, aucVal: 99.6, f1Val: 99.0 } 
];

const CANCER_COLORS = { BRCA: '#2c7bb6', LIHC: '#d7191c', STAD: '#fdae61', LUSC: '#abd9e9', KIRC: '#a6d96a', OV: '#d494e1' };

const omicsImportanceData = [ 
  { name: 'Gene', value: 1.35 }, 
  { name: 'miRNA', value: 0.46 }, 
  { name: 'Meth', value: 0.22 }, 
  { name: 'CNV', value: 0.07 }, 
  { name: 'Mutation', value: 0.01 } 
];

const mirnaTop10Data = [ 
  { name: 'hsa-mir-122', value: 3.1, cancer: 'LIHC' }, 
  { name: 'hsa-mir-21', value: 2.0, cancer: 'OV' }, 
  { name: 'hsa-mir-142', value: 1.6, cancer: 'LUSC' }, 
  { name: 'hsa-mir-378a', value: 1.0, cancer: 'BRCA' }, 
  { name: 'hsa-mir-944', value: 0.9, cancer: 'STAD' }, 
  { name: 'hsa-mir-27b', value: 0.8, cancer: 'BRCA' }, 
  { name: 'hsa-mir-190b', value: 0.7, cancer: 'BRCA' }, 
  { name: 'hsa-mir-200c', value: 0.6, cancer: 'LIHC' }, 
  { name: 'hsa-mir-196a-1', value: 0.5, cancer: 'BRCA' }, 
  { name: 'hsa-let-7f-2', value: 0.45, cancer: 'LUSC' } 
];

const methTop10Data = [ 
  { name: 'cg06119575', value: 1.05, cancer: 'BRCA' }, 
  { name: 'cg25042226', value: 0.85, cancer: 'KIRC' }, 
  { name: 'cg23555120', value: 0.80, cancer: 'BRCA' }, 
  { name: 'cg05155595', value: 0.55, cancer: 'STAD' }, 
  { name: 'cg07354371', value: 0.48, cancer: 'LIHC' }, 
  { name: 'cg20442697', value: 0.40, cancer: 'LUSC' }, 
  { name: 'cg03693099', value: 0.38, cancer: 'LUSC' }, 
  { name: 'cg06105778', value: 0.37, cancer: 'LIHC' }, 
  { name: 'cg18913171', value: 0.36, cancer: 'LUSC' }, 
  { name: 'cg19201019', value: 0.35, cancer: 'KIRC' } 
];

const metaModelXaiData = [ 
  { name: 'pred_gene_BRCA', value: 2.5, cancer: 'BRCA' }, 
  { name: 'pred_gene_LIHC', value: 2.2, cancer: 'LIHC' }, 
  { name: 'pred_mirna_OV', value: 1.8, cancer: 'OV' }, 
  { name: 'pred_gene_STAD', value: 1.1, cancer: 'STAD' }, 
  { name: 'pred_gene_OV', value: 1.0, cancer: 'OV' }, 
  { name: 'pred_gene_LUSC', value: 0.8, cancer: 'LUSC' }, 
  { name: 'pred_gene_KIRC', value: 0.7, cancer: 'KIRC' }, 
  { name: 'pred_mirna_BRCA', value: 0.6, cancer: 'BRCA' }, 
  { name: 'pred_mirna_STAD', value: 0.55, cancer: 'STAD' }, 
  { name: 'pred_meth_KIRC', value: 0.5, cancer: 'KIRC' } 
];

// --- Clinical 모델 데이터 (정확한 수치로 수정) ---

// 간암 위험도 분류 모델 성능 데이터 (373명)
const liverRiskModelData = [
  { name: 'Random Forest', accuracy: 0.947, auc: 0.991 },
  { name: 'XGBoost', accuracy: 0.933, auc: 0.986 },
  { name: 'Logistic Regression', accuracy: 0.933, auc: 0.979 }
];

// 간암 생존율 예측 모델 성능 데이터 (C-index)
const liverSurvivalModelData = [
  { name: 'GBSA', cindex: 0.755 },
  { name: 'RSF', cindex: 0.734 },
  { name: 'Cox', cindex: 0.674 },
  { name: 'Cox_lifelines', cindex: 0.654 }
];

// 간암 치료효과 예측 모델 성능 데이터
const liverTreatmentModelData = [
  { name: 'XGBoost', accuracy: 0.693, auc: 0.718 },
  { name: 'LightGBM', accuracy: 0.693, auc: 0.757 },
  { name: 'Random Forest', accuracy: 0.667, auc: 0.703 }
];

// 신장암 위험도 분류 모델 성능 데이터 (288명)
const kidneyRiskModelData = [
  { name: 'XGBoost', accuracy: 0.914, auc: 0.973 },
  { name: 'Random Forest', accuracy: 0.879, auc: 0.938 },
  { name: 'Logistic Regression', accuracy: 0.810, auc: 0.875 }
];

// 신장암 생존율 예측 모델 성능 데이터 (C-index)
const kidneySurvivalModelData = [
  { name: 'RSF', cindex: 0.774 },
  { name: 'GBSA', cindex: 0.774 },
  { name: 'Cox', cindex: 0.688 },
  { name: 'Cox_lifelines', cindex: 0.820 }
];

// 신장암 치료효과 예측 모델 성능 데이터
const kidneyTreatmentModelData = [
  { name: 'Random Forest', accuracy: 0.914, auc: 0.919 },
  { name: 'LightGBM', accuracy: 0.879, auc: 0.926 },
  { name: 'XGBoost', accuracy: 0.810, auc: 0.886 }
];

// 위암 위험도 분류 모델 성능 데이터 (416명)
const gastricRiskModelData = [
  { name: 'Random Forest', accuracy: 0.940, auc: 0.979 },
  { name: 'XGBoost', accuracy: 0.940, auc: 0.972 },
  { name: 'Logistic Regression', accuracy: 0.892, auc: 0.952 }
];

// 위암 생존율 예측 모델 성능 데이터 (C-index)
const gastricSurvivalModelData = [
  { name: 'GBSA', cindex: 0.738 },
  { name: 'RSF', cindex: 0.712 },
  { name: 'Cox', cindex: 0.686 },
  { name: 'Cox_lifelines', cindex: 0.708 }
];

// 위암 치료효과 예측 모델 성능 데이터
const gastricTreatmentModelData = [
  { name: 'Random Forest', accuracy: 0.699, auc: 0.634 },
  { name: 'LightGBM', accuracy: 0.699, auc: 0.624 },
  { name: 'XGBoost', accuracy: 0.651, auc: 0.645 },
  { name: 'Ensemble', accuracy: 0.687, auc: 0.621 }
];

// Clinical 모델 색상 팔레트
const CLINICAL_COLORS = {
  liver: '#e74c3c',
  kidney: '#27ae60', 
  gastric: '#3498db',
  risk: '#e74c3c',
  survival: '#27ae60',
  treatment: '#3498db'
};

// --- 재사용 가능한 컴포넌트들 ---

// [신규 추가] Intersection Observer를 위한 커스텀 훅(재사용 가능한 로직 부품)
const useIntersectionObserver = (options) => {
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef(null); // useRef를 React.useRef로 명시적 호출

  useEffect(() => { // useEffect를 React.useEffect로 명시적 호출
    const target = targetRef.current;
    if (!target) return;

    // 감시 카메라(observer) 생성
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 감시 대상이 화면에 보이면
        if (entry.isIntersecting) {
          setIsVisible(true); // isVisible 상태를 true로 변경
          observer.unobserve(target); // 한번 보이면 더 이상 감시하지 않음
        }
      },
      options
    );

    // 감시 시작
    observer.observe(target);

    // 컴포넌트가 사라질 때 감시 종료
    return () => {
      observer.unobserve(target);
    };
  }, [options]);

  return [targetRef, isVisible];
};

// [신규 추가] 우리가 만든 훅을 사용하는 스크롤 애니메이션 섹션 컴포넌트
const AnimatedSection = ({ children, className = '' }) => {
  // 우리가 만든 감시 카메라 훅을 사용
  const [targetRef, isVisible] = useIntersectionObserver({
    threshold: 0.1, // 요소가 10% 보였을 때 실행
  });

  return (
    // 감시할 대상을 ref로 지정하고, isVisible 상태에 따라 클래스 추가
    <div ref={targetRef} className={`content-section ${className} ${isVisible ? 'is-visible' : ''}`}>
      {children}
    </div>
  );
};

const FeatureImportanceChart = ({ data, title }) => {
  if (!data || !Array.isArray(data)) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div className="chart-wrapper"> 
      <h4>{title}</h4> 
      <ResponsiveContainer width="100%" height={400}> 
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 30 }}> 
          <CartesianGrid strokeDasharray="3 3" /> 
          <XAxis type="number" /> 
          <YAxis type="category" dataKey="name" width={150} fontSize={12} tick={{ textAnchor: 'end' }} /> 
          <Tooltip formatter={(value) => value.toFixed(3)} /> 
          <Legend layout="vertical" align="right" verticalAlign="bottom" wrapperStyle={{ paddingLeft: 20 }} payload={Object.entries(CANCER_COLORS).map(([cancer, color]) => ({ id: cancer, value: cancer, type: 'rect', color: color, }))} /> 
          <Bar dataKey="value" name="평균 SHAP 값" barSize={42}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CANCER_COLORS[entry.cancer] || '#8884d8'} />
            ))}
          </Bar>
        </BarChart> 
      </ResponsiveContainer> 
    </div>
  );
};

const PerformanceTable = ({ data }) => {
  if (!data || !Array.isArray(data)) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div className="table-container"> 
      <table> 
        <thead> 
          <tr> 
            <th>암종 (Cancer Type)</th> 
            <th>정확도 (Accuracy)</th> 
            <th>AUC</th> 
            <th>F1-Score</th> 
          </tr> 
        </thead> 
        <tbody> 
          {data.map((row) => ( 
            <tr key={row.cancer}> 
              <td>{row.cancer}</td> 
              <td>{row.accuracy}</td> 
              <td>{row.auc}</td> 
              <td>{row.f1}</td> 
            </tr> 
          ))} 
        </tbody> 
      </table> 
    </div>
  );
};

const ScorecardGrid = ({ data }) => {
  if (!data || !Array.isArray(data)) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div className="scorecard-grid"> 
      {data.map((item) => { 
        const miniChartData = [ 
          { name: 'F1', value: item.f1Val }, 
          { name: 'AUC', value: item.aucVal }, 
          { name: 'Acc', value: item.accuracyVal }, 
        ]; 
        return ( 
          <div key={item.cancer} className="scorecard"> 
            <h4 className="scorecard-title">{item.cancer}</h4> 
            <div className="score-item-container"> 
              <div className="scorecard-item"> 
                <span className="score-value">{item.accuracy}</span> 
                <span className="score-label">Accuracy</span> 
              </div> 
              <div className="scorecard-item"> 
                <span className="score-value">{item.auc}</span> 
                <span className="score-label">AUC</span> 
              </div> 
              <div className="scorecard-item"> 
                <span className="score-value">{item.f1}</span> 
                <span className="score-label">F1-Score</span> 
              </div> 
            </div> 
            <div className="mini-chart-container"> 
              <ResponsiveContainer width="100%" height={80}> 
                <BarChart data={miniChartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}> 
                  <XAxis type="number" domain={[95, 100]} hide /> 
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={50} /> 
                  <Bar dataKey="value" fill="#0077b6" radius={[5, 5, 5, 5]} background={{ fill: '#eee', radius: 5 }} /> 
                </BarChart> 
              </ResponsiveContainer> 
            </div> 
          </div> 
        ); 
      })} 
    </div>
  );
};

const PerformanceRankingChart = () => ( 
  <div className="chart-wrapper"> 
    <h4>오믹스 데이터별 예측 성능 (AUC)</h4> 
    <ResponsiveContainer width="100%" height={250}> 
      <BarChart data={binaryModelPerformance} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 20 }}> 
        <CartesianGrid strokeDasharray="3 3" /> 
        <XAxis type="number" domain={[0, 1]} /> 
        <YAxis type="category" dataKey="name" width={120} /> 
        <Tooltip formatter={(value) => value.toFixed(4)} /> 
        <Bar dataKey="auc" name="AUC"> 
          {binaryModelPerformance.map((entry, index) => ( 
            <Cell key={entry.name} fill={RANKING_PALETTE[index % RANKING_PALETTE.length]} /> 
          ))} 
        </Bar> 
      </BarChart> 
    </ResponsiveContainer> 
  </div>
);

const ConfusionMatrix = ({ data }) => {
  if (!data) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div className="cm-wrapper">
      <h4>모델 성능</h4>
      <table className="confusion-matrix">
        <tbody>
          <tr>
            <td className="cm-label"></td>
            <td className="cm-header">실제: 암</td>
            <td className="cm-header">실제: 정상</td>
          </tr>
          <tr>
            <td className="cm-header">예측: 암</td>
            <td className="cm-cell">
              <span className="tp-value">{data.TP}</span>
            </td>
            <td className="cm-cell">
              <span className="fp-value">{data.FP}</span>
            </td>
          </tr>
          <tr>
            <td className="cm-header">예측: 정상</td>
            <td className="cm-cell">
              <span className="fn-value">{data.FN}</span>
            </td>
            <td className="cm-cell">
              <span className="tn-value">{data.TN}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Clinical 모델 성능 차트 컴포넌트들
const ClinicalModelChart = ({ data, title, metric, color, cancerType }) => {
  if (!data || !Array.isArray(data)) {
    return <div className="loading-state">데이터를 불러오는 중...</div>;
  }

  // 색상 팔레트 개선 (그라데이션 최소화)
  const chartColors = {
    accuracy: ['#0077b6', '#023e8a', '#03045e'],
    cindex: ['#2a9d8f', '#264653', '#1b4332'],
    auc: ['#e63946', '#d00000', '#9d0208']
  };

  const colors = chartColors[metric] || ['#0077b6', '#023e8a', '#03045e'];

  return (
    <div className="enhanced-chart-wrapper">
      <div className="chart-header-clean">
        <h4 className="chart-title-clean">{title}</h4>
        <div className="chart-subtitle-clean">
          {cancerType === 'liver' && '간암 환자 373명 데이터 기반'}
          {cancerType === 'kidney' && '신장암 환자 288명 데이터 기반'}
          {cancerType === 'gastric' && '위암 환자 416명 데이터 기반'}
        </div>
      </div>
      
      <div className="chart-container-clean">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 30, right: 30, left: 30, bottom: 80 }}>
            <defs>
              {data.map((entry, index) => (
                <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity={0.95}/>
                  <stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity={0.85}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#e8e8e8" opacity={0.8} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 12, fill: '#333333', fontWeight: 500 }}
              axisLine={{ stroke: '#cccccc', strokeWidth: 1 }}
              tickLine={{ stroke: '#cccccc', strokeWidth: 1 }}
            />
            <YAxis 
              domain={[0, 1]} 
              tick={{ fontSize: 12, fill: '#333333', fontWeight: 500 }}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              axisLine={{ stroke: '#cccccc', strokeWidth: 1 }}
              tickLine={{ stroke: '#cccccc', strokeWidth: 1 }}
            />
            <Tooltip 
              formatter={(value) => [`${(value * 100).toFixed(1)}%`, metric === 'cindex' ? 'C-index' : 'Accuracy']}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #cccccc',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '14px',
                fontWeight: '500'
              }}
              cursor={{ fill: 'rgba(0, 119, 182, 0.05)' }}
            />
            <Bar dataKey={metric} radius={[4, 4, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* 성능 요약 테이블 */}
      <div className="performance-summary-table">
        <table className="summary-table">
          <thead>
            <tr>
              <th>모델</th>
              <th>성능</th>
              <th>순위</th>
            </tr>
          </thead>
          <tbody>
            {data
              .sort((a, b) => b[metric] - a[metric])
              .map((item, index) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{(item[metric] * 100).toFixed(1)}%</td>
                  <td>{index + 1}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Clinical 모델 통합 성능 비교 차트
const ClinicalModelComparison = () => {
  // 암종별로 그룹화된 데이터 구조로 변경
  const groupedComparisonData = [
    // 위험도 분류 모델들
    { category: '위험도 분류', liver: 0.947, kidney: 0.914, gastric: 0.940, type: 'accuracy' },
    // 생존율 예측 모델들  
    { category: '생존율 예측', liver: 0.755, kidney: 0.774, gastric: 0.738, type: 'cindex' },
    // 치료효과 예측 모델들
    { category: '치료효과 예측', liver: 0.693, kidney: 0.914, gastric: 0.699, type: 'accuracy' }
  ];

  return (
    <div className="enhanced-comparison-wrapper">
      <div className="comparison-header-clean">
        <h4 className="comparison-title-clean">암종별 Clinical 모델 성능 종합 비교</h4>
        <p className="comparison-subtitle-clean">3개 암종, 3개 모델 유형별 최고 성능 비교</p>
      </div>
      
      <div className="comparison-chart-container-clean">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={groupedComparisonData} margin={{ top: 30, right: 30, left: 30, bottom: 60 }}>
            <defs>
              <linearGradient id="liver-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e63946" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#e63946" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="kidney-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2a9d8f" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#2a9d8f" stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="gastric-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#457b9d" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#457b9d" stopOpacity={0.7}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#e8e8e8" opacity={0.8} />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 12, fill: '#333333', fontWeight: 500 }}
              axisLine={{ stroke: '#cccccc', strokeWidth: 1 }}
            />
            <YAxis 
              domain={[0, 1]} 
              tick={{ fontSize: 12, fill: '#333333', fontWeight: 500 }}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              axisLine={{ stroke: '#cccccc', strokeWidth: 1 }}
            />
            <Tooltip 
              formatter={(value, name) => [
                `${(value * 100).toFixed(1)}%`, 
                name === 'liver' ? '간암' : name === 'kidney' ? '신장암' : '위암'
              ]}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #cccccc',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '14px',
                fontWeight: '500'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: '500' }}
              iconType="rect"
            />
            <Bar dataKey="liver" fill="url(#liver-gradient)" name="간암" radius={[3, 3, 0, 0]} />
            <Bar dataKey="kidney" fill="url(#kidney-gradient)" name="신장암" radius={[3, 3, 0, 0]} />
            <Bar dataKey="gastric" fill="url(#gastric-gradient)" name="위암" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* 암종별 성능 요약 테이블 */}
      <div className="cancer-performance-table">
        <h5>암종별 최고 성능 요약</h5>
        <table className="performance-table">
          <thead>
            <tr>
              <th>암종</th>
              <th>위험도 분류</th>
              <th>생존율 예측</th>
              <th>치료효과 예측</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>간암</td>
              <td>94.7%</td>
              <td>C-index 0.755</td>
              <td>69.3%</td>
            </tr>
            <tr>
              <td>신장암</td>
              <td>91.4%</td>
              <td>C-index 0.774</td>
              <td>91.4%</td>
            </tr>
            <tr>
              <td>위암</td>
              <td>94.0%</td>
              <td>C-index 0.738</td>
              <td>69.9%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CleanClinicalModelCard = ({ title, patientCount, deathCount, followupPeriod, metrics }) => {
  return (
    <div className="clean-clinical-card">
      <div className="card-header-clean">
        <h3 className="card-title-clean">{title}</h3>
        <div className="patient-stats-clean">
          <span className="stat-item-clean">환자 수: {patientCount}</span>
          <span className="stat-item-clean">사망 환자: {deathCount}</span>
          <span className="stat-item-clean">추적기간: {followupPeriod}</span>
        </div>
      </div>
      
      <div className="metrics-table-clean">
        <table>
          <thead>
            <tr>
              <th>모델 유형</th>
              <th>최고 성능 알고리즘</th>
              <th>Test 성능</th>
              <th>특징</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <tr key={index}>
                <td>{metric.type}</td>
                <td className="algorithm-name">{metric.algorithm}</td>
                <td className="metric-value-clean">{metric.performance}</td>
                <td>{metric.feature}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="card-footer-clean">
        <div className="feature-list">
          <span className="feature-item">CDSS 호환</span>
          <span className="feature-item">XAI 지원</span>
          <span className="feature-item">실시간 예측</span>
        </div>
      </div>
    </div>
  );
};


const CleanClinicalOverview = () => {
  const [selectedCancer, setSelectedCancer] = useState('liver');
  
  const clinicalModels = {
    liver: {
      title: "간암 (LIHC) 모델",
      patientCount: "373명",
      deathCount: "132명",
      followupPeriod: "602일",
      metrics: [
        { type: "위험도 분류", algorithm: "Random Forest", performance: "94.7% (AUC 0.991)", feature: "높은 예측 정확도" },
        { type: "생존율 예측", algorithm: "GBSA", performance: "C-index 0.755", feature: "생존 기간 예측" },
        { type: "치료효과 예측", algorithm: "XGBoost", performance: "69.3% (AUC 0.718)", feature: "치료 반응 예측" }
      ]
    },
    kidney: {
      title: "신장암 (KIRC) 모델",
      patientCount: "288명",
      deathCount: "44명",
      followupPeriod: "768일",
      metrics: [
        { type: "위험도 분류", algorithm: "XGBoost", performance: "91.4% (AUC 0.973)", feature: "높은 예측 정확도" },
        { type: "생존율 예측", algorithm: "RSF/GBSA", performance: "C-index 0.774", feature: "두 알고리즘 동일 성능" },
        { type: "치료효과 예측", algorithm: "Random Forest", performance: "91.4% (AUC 0.919)", feature: "치료 반응 예측" }
      ]
    },
    gastric: {
      title: "위암 (STAD) 모델",
      patientCount: "416명",
      deathCount: "172명",
      followupPeriod: "450일",
      metrics: [
        { type: "위험도 분류", algorithm: "Random Forest", performance: "94.0% (AUC 0.979)", feature: "저/고위험군 분류" },
        { type: "생존율 예측", algorithm: "GBSA", performance: "C-index 0.738", feature: "생존 기간 예측" },
        { type: "치료효과 예측", algorithm: "Random Forest", performance: "69.9% (AUC 0.634)", feature: "치료 반응 예측" }
      ]
    }
  };

  return (
    <div className="clean-clinical-overview">
      <div className="overview-header-clean">
        <h3 className="overview-title-clean">Clinical AI 모델 성능 개요</h3>
        <p className="overview-description-clean">3개 암종별 특화된 AI 모델의 종합 성능 분석</p>
      </div>
      
      {/* 탭 선택기 */}
      <div className="modern-tab-selector">
        <button 
          onClick={() => setSelectedCancer('liver')} 
          className={`tab-button ${selectedCancer === 'liver' ? 'active' : ''}`}
        >
          간암
        </button>
        <button 
          onClick={() => setSelectedCancer('kidney')} 
          className={`tab-button ${selectedCancer === 'kidney' ? 'active' : ''}`}
        >
          신장암
        </button>
        <button 
          onClick={() => setSelectedCancer('gastric')} 
          className={`tab-button ${selectedCancer === 'gastric' ? 'active' : ''}`}
        >
          위암
        </button>
      </div>
      
      {/* 선택된 암종의 카드만 표시 */}
      <div className="clinical-card-single">
        <CleanClinicalModelCard {...clinicalModels[selectedCancer]} />
      </div>
    </div>
  );
};

{/* 주요 발견사항 */}
<div className="key-findings">
  <h6>주요 발견사항</h6>
  <ul>
    <li><strong>신장암:</strong> 치료효과 예측에서 가장 높은 성능 (91.4%)</li>
    <li><strong>간암:</strong> 위험도 분류에서 최고 성능 (94.7%)</li>
    <li><strong>위암:</strong> 높은 사망률(41.3%)에도 불구하고 안정적 예측 성능</li>
    <li><strong>모든 암종:</strong> C-index 0.7 이상의 우수한 생존율 예측 성능</li>
  </ul>
</div>

{/* XAI 분석 섹션 추가 */}
<div className="xai-analysis-section">
  <h3>XAI 분석 - 설명 가능한 AI</h3>
  <div className="xai-content">
    <div className="xai-item">
      <h4>SHAP 분석</h4>
      <p>모델 해석 및 임상적 근거 제시</p>
      <ul>
        <li>임상 특성 중 상위 5개 인자 식별</li>
        <li>각 환자별 개별 예측 이유 제시</li>
        <li>암종별 중요 임상 변수 순위화</li>
      </ul>
    </div>
    <div className="xai-item">
      <h4>Feature Importance</h4>
      <p>예측에 가장 중요한 임상 변수들을 시각적으로 제시하여 의료진의 의사결정을 지원합니다.</p>
    </div>
  </div>
</div>

// [수정] 모든 기능이 포함된 완전한 상세 분석 탭 컴포넌트
const DetailedAnalysisTabs = () => {
  const [activeTab, setActiveTab] = useState('miRNA');
  const currentData = detailedAnalysisData[activeTab];

  // 재사용 가능한 메트릭 카드 컴포넌트
  const MetricCard = ({ title, value, description }) => (
    <div className="metric-card">
      <h4>{title}</h4>
      {value && <p className="metric-value">{value}</p>}
      {description && <p className="metric-description">{description}</p>}
    </div>
  );

  if (!currentData) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div>
      <div className="omics-selector">
        <button onClick={() => setActiveTab('miRNA')} className={activeTab === 'miRNA' ? 'active' : ''}>miRNA</button>
        <button onClick={() => setActiveTab('Gene Expression')} className={activeTab === 'Gene Expression' ? 'active' : ''}>Gene</button>
        <button onClick={() => setActiveTab('Methylation')} className={activeTab === 'Methylation' ? 'active' : ''}>Meth</button>
      </div>

      <div className="tab-content">
        {/* 2x2 그리드 컨테이너 */}
        <div className="analysis-grid-container">
          {/* 1. 핵심 지표 */}
          <div className="metric-card kpi-card">
               <h4>핵심 지표 (KPIs)</h4>
               <div className="kpi-item">
                  <span className="kpi-value">{currentData.kpis?.acc || 'N/A'}</span>
                  <span className="kpi-label">Accuracy</span>
               </div>
               <div className="kpi-item">
                  <span className="kpi-value">{currentData.kpis?.f1 || 'N/A'}</span>
                  <span className="kpi-label">F1-Score</span>
               </div>
          </div>

          {/* 2. 혼동 행렬 */}
          <div className="metric-card">
              <ConfusionMatrix data={currentData.cm} />
          </div>

          {/* 3. 재현율 */}
          <MetricCard
            title="재현율 (Recall)"
            value={currentData.pr?.cancer_r ? `${(currentData.pr.cancer_r * 100).toFixed(1)}%` : 'N/A'}
            description={`실제 '암' 샘플 중 우리 모델이 '암'이라고 올바르게 예측한 비율입니다. 암 환자를 놓치지 않는 능력을 의미합니다.`}
          />

          {/* 4. 정밀도 */}
          <MetricCard
            title="정밀도 (Precision)"
            value={currentData.pr?.cancer_p ? `${(currentData.pr.cancer_p * 100).toFixed(1)}%` : 'N/A'}
            description={`우리 모델이 '암'이라고 예측한 것들 중 실제 '암'이었던 비율입니다.`}
          />
        </div>

        <FeatureImportanceChart title={`${activeTab} Top 5 예측 인자`} data={currentData.xaiTop5} />
      </div>
    </div>
  );
};

// --- [신규] CT U-Net 관련 데이터 및 컴포넌트 ---

// U-Net 학습 그래프용 데이터
const unetTrainingData = [
  { epoch: 1, trainLoss: 1.45, valLoss: 1.42, dice: 0.42, iou: 0.42 },
  { epoch: 10, trainLoss: 0.65, valLoss: 0.68, dice: 0.58, iou: 0.50 },
  { epoch: 20, trainLoss: 0.52, valLoss: 0.55, dice: 0.61, iou: 0.54 },
  { epoch: 30, trainLoss: 0.48, valLoss: 0.50, dice: 0.65, iou: 0.58 },
  { epoch: 40, trainLoss: 0.45, valLoss: 0.47, dice: 0.67, iou: 0.60 },
  { epoch: 50, trainLoss: 0.43, valLoss: 0.45, dice: 0.68, iou: 0.61 },
  { epoch: 60, trainLoss: 0.42, valLoss: 0.44, dice: 0.69, iou: 0.615 },
  { epoch: 70, trainLoss: 0.415, valLoss: 0.435, dice: 0.695, iou: 0.618 },
  { epoch: 80, trainLoss: 0.41, valLoss: 0.43, dice: 0.70, iou: 0.62 },
  { epoch: 90, trainLoss: 0.405, valLoss: 0.428, dice: 0.702, iou: 0.622 },
  { epoch: 100, trainLoss: 0.40, valLoss: 0.425, dice: 0.705, iou: 0.625 },
];

// U-Net 학습 그래프 3종 세트 컴포넌트
const UnetTrainingCharts = ({ data }) => {
  return (
    <div className="unet-charts-grid">
      {/* 1. Model Loss 그래프 */}
      <div className="chart-wrapper-small">
        <h5 className="chart-title-small">Model Loss</h5>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 5, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="epoch" label={{ value: 'Epochs', position: 'insideBottom', offset: -10 }} />
            <YAxis label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} domain={[0.4, 1.5]} />
            <Tooltip />
            <Legend verticalAlign="top" />
            <Line type="monotone" dataKey="trainLoss" name="Training Loss" stroke="#3b82f6" dot={false} />
            <Line type="monotone" dataKey="valLoss" name="Validation Loss" stroke="#f97316" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Dice Coefficient 그래프 */}
      <div className="chart-wrapper-small">
        <h5 className="chart-title-small">Validation Dice Coefficient</h5>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 5, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="epoch" label={{ value: 'Epochs', position: 'insideBottom', offset: -10 }} />
            <YAxis label={{ value: 'Dice Coeff', angle: -90, position: 'insideLeft' }} domain={[0.4, 0.75]} />
            <Tooltip />
            <Legend verticalAlign="top" />
            <Line type="monotone" dataKey="dice" name="Validation Dice" stroke="#3b82f6" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


// U-Net 섹션 전체 컴포넌트
const CtUnetSection = () => {
  return (
    <AnimatedSection>
      <h2>4. 진단의 또 다른 축: 3D CT 영상</h2>
      <p>
        오믹스 데이터가 암의 분자생물학적 특징을 밝혀내는 '현미경'이라면 CT 영상 분석은 종양의 위치, 크기, 형태 등 해부학적 정보를 파악하는 '망원경'과 같습니다.
        영상 모델을 CT 영상에 최적화하여 의사의 눈을 보조하고 진단의 정확성을 한 차원 높입니다.
      </p>

      {/* 1. Recharts로 생성된 학습 성과 그래프 */}
      <div className="chart-wrapper" style={{ marginBottom: '3rem' }}>
          <h4>모델 학습 성능</h4>
          <p>수백 번의 학습 결과, 모델은 높은 수준의 정확성을 보였습니다.</p>
          <UnetTrainingCharts data={unetTrainingData} />
      </div>
      
      {/* 2. 영상으로 대체된 실제 분석 결과 */}
      <div className="chart-wrapper">
        <h4>AI 기반 3D 종양 영역 분할</h4>
        <p>AI가 3차원 CT 데이터에서 종양의 위치와 부피를 정밀하게 식별하고 이를 3D 모델로 시각화하여 직관적인 분석을 지원합니다.</p>
        <div className="video-container">
          <video
            src={pancreasVideo}
            width="100%"
            autoPlay
            loop
            muted
            playsInline
          >
            3D U-Net 분할 시연 영상
          </video>
        </div>
      </div>
    </AnimatedSection>
  );
};

// --- 메인 페이지 컴포넌트 ---
const VisionTechPage = () => {
  const navigate = useNavigate();
  const [selectedOmics, setSelectedOmics] = useState('mirna');
  const [performanceView, setPerformanceView] = useState('table');
  const [cancerType, setCancerType] = useState('liver');
  const [clinicalView, setClinicalView] = useState('risk');
  const [isLoading, setIsLoading] = useState(true);
  
  // 데이터 초기화
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // clinicalView를 cancerType에 맞게 자동 조정
  useEffect(() => {
    if (cancerType === 'liver') {
      setClinicalView('risk');
    } else if (cancerType === 'kidney') {
      setClinicalView('risk');
    } else if (cancerType === 'gastric') {
      setClinicalView('risk');
    }
  }, [cancerType]);

  const omicsDataMap = { 
    mirna: { title: 'miRNA Top 10 예측 인자', data: mirnaTop10Data }, 
    meth: { title: '메틸레이션 Top 10 예측 인자', data: methTop10Data } 
  };

  const clinicalDataMap = {
    liver: {
      risk: { title: '간암 위험도 분류 모델 성능', data: liverRiskModelData, metric: 'accuracy', color: CLINICAL_COLORS.risk },
      survival: { title: '간암 생존율 예측 모델 성능', data: liverSurvivalModelData, metric: 'cindex', color: CLINICAL_COLORS.survival },
      treatment: { title: '간암 치료효과 예측 모델 성능', data: liverTreatmentModelData, metric: 'accuracy', color: CLINICAL_COLORS.treatment }
    },
    kidney: {
      risk: { title: '신장암 위험도 분류 모델 성능', data: kidneyRiskModelData, metric: 'accuracy', color: CLINICAL_COLORS.risk },
      survival: { title: '신장암 생존율 예측 모델 성능', data: kidneySurvivalModelData, metric: 'cindex', color: CLINICAL_COLORS.survival },
      treatment: { title: '신장암 치료효과 예측 모델 성능', data: kidneyTreatmentModelData, metric: 'accuracy', color: CLINICAL_COLORS.treatment }
    },
    gastric: {
      risk: { title: '위암 위험도 분류 모델 성능', data: gastricRiskModelData, metric: 'accuracy', color: CLINICAL_COLORS.risk },
      survival: { title: '위암 생존율 예측 모델 성능', data: gastricSurvivalModelData, metric: 'cindex', color: CLINICAL_COLORS.survival },
      treatment: { title: '위암 치료효과 예측 모델 성능', data: gastricTreatmentModelData, metric: 'accuracy', color: CLINICAL_COLORS.treatment }
    }
  };

  // 안전한 데이터 접근 함수
  const getCurrentClinicalData = () => {
    const typeData = clinicalDataMap[cancerType];
    if (!typeData) return null;
    return typeData[clinicalView];
  };

  const currentClinicalData = getCurrentClinicalData();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="vision-container">
      <header className="page-header">
        <h1>AI, 암 진단의 블랙박스를 열다</h1>
        <h1 className="highlight">단순 예측을 넘어 신뢰할 수 있는 진단 파트너로</h1>
        <p className="subtitle">전문 AI 모델의 자동화 진단 파이프라인을 통해 높은 정확도와 구체적인 근거를 제시하여 데이터 기반 정밀의료의 새로운 기준을 제시합니다.</p>
      </header>
      
      <AnimatedSection>
        <h2>Our Automated Diagnostic Pipeline</h2>
        <p>사용자가 데이터를 업로드하면 아래 3단계의 자동화된 파이프라인을 통해 신속하고 신뢰도 높은 분석 결과를 제공합니다.</p>
        <div className="pipeline-steps-container">
          <div className="pipeline-step">
            <FaProjectDiagram className="step-icon" />
            <h3>1단계: 병렬 스크리닝</h3>
            <p>6개의 암종별 전문 모델이 업로드된 데이터를 검사하여 암의 특징이 보이는지 1차적으로 스크리닝합니다.</p>
          </div>
          <div className="pipeline-step">
            <FaBrain className="step-icon" />
            <h3>2단계: 중앙 통제 및 판정</h3>
            <p>6개 모델 결과를 중앙에서 종합하여 '정상', '암 의심', 두 가지 케이스로 판단합니다.</p>
          </div>
          <div className="pipeline-step">
            <FaSearchPlus className="step-icon" />
            <h3>3단계: 특화 분석 및 XAI</h3>
            <p>암이 명확하게 의심될 경우 해당 암종에 특화된 모델이 심층 분석을 수행하고 판단의 핵심 근거를 시각적으로 제시합니다.</p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <h2>1단계 스크리닝: 어떤 데이터가 암을 가장 잘 찾아내는가?</h2>
        <p>5가지 오믹스 데이터를 개별 분석한 결과 miRNA와 Methylation 데이터가 99% 이상의 AUC를 기록하며 압도적인 성능을 보였습니다. 이는 특정 데이터 유형에 암을 탐지하는 강력한 바이오마커가 집중되어 있음을 시사하며, 이 결과를 바탕으로 가장 강력한 모델을 우선적으로 활용하여 진단 파이프라인을 설계했습니다.</p>
        <PerformanceRankingChart />
        <div className="interactive-section">
          <h3>모델별 심층 분석</h3>
          <p>아래 탭을 클릭하여 상위 모델들의 상세 성능 지표, 성능, 그리고 예측에 가장 큰 영향을 미친 특징 Top 5를 직접 확인해 보세요.</p>
          <DetailedAnalysisTabs />
        </div>
        <p className="summary-text">체계적인 비교 분석을 통해 가장 신뢰도 높은 데이터 소스를 식별하고, 각 데이터의 한계를 파악했습니다.</p>
      </AnimatedSection>

      <AnimatedSection>
        <h2>2. 핵심 모델: 다중 암종(Multi-Cancer) 분류</h2>
        <p>암으로 판단된 데이터에 대해 5가지 주요 암종(유방암, 간암, 위암 등) 중 어떤 암에 해당하는지에 대해 높은 정확도로 분류해냅니다. 이는 각 암종의 고유한 데이터 패턴을 AI가 완벽하게 학습했음을 의미합니다.</p>
        <div className="performance-view-section">
          <h3 className="chart-title">📊 최종 모델 성능</h3>
          <p>강력한 모델들을 기반으로 구축된 최종 암종 분류 모델의 성능은 아래와 같습니다.</p>
          <div className="view-toggle"> 
            <button onClick={() => setPerformanceView('table')} className={performanceView === 'table' ? 'active' : ''}>테이블 보기</button> 
            <button onClick={() => setPerformanceView('card')} className={performanceView === 'card' ? 'active' : ''}>카드 보기</button> 
          </div>
          {performanceView === 'table' ? (<PerformanceTable data={performanceData} />) : (<ScorecardGrid data={performanceData} />)}
        </div>
      </AnimatedSection>

      <AnimatedSection>
        <h2>3. 신뢰성의 근거: 설명 가능한 AI</h2>
        <p>설명 가능한 AI는 모델이 왜 그런 예측을 했는지, 어떤 유전자나 변이가 결정에 가장 큰 영향을 미쳤는지에 대해 시각적인 해석을 제공합니다.</p>
        <div className="chart-section interactive-section">
          <h3>어떤 유전자가 예측을 이끌었는가?</h3>
          <p>아래 버튼을 클릭하여 데이터 종류별로 어떤 유전자/특징이 암종 분류에 가장 큰 영향을 미쳤는지 Top 10을 확인해 보세요.</p>
          <div className="omics-selector">
            <button onClick={() => setSelectedOmics('mirna')} className={selectedOmics === 'mirna' ? 'active' : ''}>miRNA</button>
            <button onClick={() => setSelectedOmics('meth')} className={selectedOmics === 'meth' ? 'active' : ''}>Methylation</button>
          </div>
          <FeatureImportanceChart title={omicsDataMap[selectedOmics]?.title} data={omicsDataMap[selectedOmics]?.data} />
        </div>
        <div className="chart-section interactive-section">
          <h3>메타 모델의 최종 판단 기준</h3>
          <p>개별 모델의 예측 결과를 종합하여 최종 결론을 내리는 '메타 모델'은 어떤 전문가 모델의 의견을 가장 신뢰할까요? 분석 결과, 특정 암종에 대한 <strong>유전자(Gene) 모델의 예측</strong>을 가장 중요한 판단 근거로 삼는 경향을 보였습니다.</p>
          <FeatureImportanceChart title="메타 모델 Top 10 예측 인자" data={metaModelXaiData} />
        </div>
      </AnimatedSection>

      {/* 새로 추가된 Clinical 모델 섹션 */}
      <AnimatedSection>
        <h2>4. Clinical 데이터 기반 정밀 의료 모델</h2>
        <p>오믹스 데이터 분석을 넘어 실제 임상 환경에서 활용 가능한 Clinical 데이터 기반 모델을 개발했습니다. 간암, 신장암, 위암 환자의 임상 데이터를 활용하여 위험도 분류, 생존율 예측, 치료효과 예측 등 다양한 임상 의사결정을 지원하는 모델들을 구축했습니다.</p>
        
        <CleanClinicalOverview />
        
        <div className="interactive-section">
          <h3>암종별 Clinical 모델 상세 분석</h3>
          <p>각 암종별 모델의 상세 성능을 확인해 보세요. 모든 모델은 실제 임상 환경에서의 활용을 위해 엄격한 검증 과정을 거쳤습니다.</p>
          
          <div className="omics-selector">
            <button onClick={() => setCancerType('liver')} className={cancerType === 'liver' ? 'active' : ''}>간암</button>
            <button onClick={() => setCancerType('kidney')} className={cancerType === 'kidney' ? 'active' : ''}>신장암</button>
            <button onClick={() => setCancerType('gastric')} className={cancerType === 'gastric' ? 'active' : ''}>위암</button>
          </div>
          
          <div className="omics-selector">
            <button onClick={() => setClinicalView('risk')} className={clinicalView === 'risk' ? 'active' : ''}>위험도 분류</button>
            <button onClick={() => setClinicalView('survival')} className={clinicalView === 'survival' ? 'active' : ''}>생존율 예측</button>
            <button onClick={() => setClinicalView('treatment')} className={clinicalView === 'treatment' ? 'active' : ''}>치료효과 예측</button>
          </div>
          
          {currentClinicalData && (
            <ClinicalModelChart 
              data={currentClinicalData.data}
              title={currentClinicalData.title}
              metric={currentClinicalData.metric}
              color={currentClinicalData.color}
              cancerType={cancerType}
            />
          )}
          
          {/* 간암 모델 설명 */}
          {cancerType === 'liver' && clinicalView === 'risk' && (
            <div className="modern-model-description">
              <h4 className="description-title">간암 위험도 분류 모델 특징</h4>
              <div className="description-content">
                <div className="feature-item">
                  <span className="feature-icon">🤖</span>
                  <span className="feature-text">Random Forest 알고리즘 기반으로 환자를 저/중/고위험군으로 분류</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span className="feature-text">94.7% 정확도, AUC 0.991의 뛰어난 성능</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">👥</span>
                  <span className="feature-text">373명 환자 데이터 기반, 사망률 35.5%</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💡</span>
                  <span className="feature-text">SHAP, LIME을 통한 예측 근거 제시</span>
                </div>
              </div>
            </div>
          )}
          
          {/* 신장암 모델 설명 */}
          {cancerType === 'kidney' && clinicalView === 'treatment' && (
            <div className="modern-model-description">
              <h4 className="description-title">신장암 치료효과 예측 모델 특징</h4>
              <div className="description-content">
                <div className="feature-item">
                  <span className="feature-icon">🌲</span>
                  <span className="feature-text">Random Forest 알고리즘 기반 치료 반응 예측</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🏆</span>
                  <span className="feature-text">정확도 91.4%, AUC 0.919의 우수한 성능</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💚</span>
                  <span className="feature-text">사망률 15.3%의 상대적으로 양호한 예후</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🎯</span>
                  <span className="feature-text">신장암 치료에 대한 높은 예측 정확도</span>
                </div>
              </div>
            </div>
          )}
          
          {/* 위암 모델 설명 */}
          {cancerType === 'gastric' && clinicalView === 'risk' && (
            <div className="model-description">
              <h4>위암 위험도 분류 모델 특징</h4>
              <p>• **Risk_RF 알고리즘** 기반 위험도 분류</p>
              <p>• **94.0% 정확도, AUC 0.979**의 뛰어난 성능</p>
              <p>• XGBoost와 유사한 성능으로 모델 안정성 확인</p>
              <p>• 416명 환자 데이터로 충분한 검증</p>
            </div>
          )}
          
          {cancerType === 'gastric' && clinicalView === 'survival' && (
            <div className="model-description">
              <h4>위암 생존율 예측 모델 특징</h4>
              <p>• **GBSA 알고리즘**이 **C-index 0.738** 달성</p>
              <p>• 중간 추적 기간 450일, 사망률 41.3%</p>
              <p>• RSF 모델 대비 우수한 성능 (C-index 0.712)</p>
              <p>• 위암의 상대적으로 높은 사망률 반영</p>
            </div>
          )}
          
          {cancerType === 'gastric' && clinicalView === 'treatment' && (
            <div className="model-description">
              <h4>위암 치료효과 예측 모델 특징</h4>
              <p>• **Random Forest와 LightGBM** 모델 모두 **정확도 69.9%**</p>
              <p>• RF 모델이 AUC 0.634로 상대적 우위</p>
              <p>• 위암 치료 반응 예측의 복잡성 반영</p>
              <p>• 다양한 치료 옵션에 대한 개별 환자 반응 예측</p>
            </div>
          )}
        </div>

        <div className="chart-section">
          <h3>암종별 Clinical 모델 통합 성능 비교</h3>
          <p>간암, 신장암, 위암의 Clinical 모델 성능을 종합적으로 비교해보세요. 각 암종별로 특화된 모델들이 실제 임상 환경에서 검증된 성능을 보여줍니다.</p>
          <ClinicalModelComparison />
        </div>

        <div className="clinical-features">
          <h3>Clinical 모델의 핵심 특징 및 임상적 의의</h3>
          <div className="feature-grid">
            <div className="feature-item">
              <h4>🏥 실제 임상 검증</h4>
              <p>대규모 환자 코호트(간암 373명, 신장암 288명, 위암 416명)를 통한 실제 임상 환경 검증 완료</p>
            </div>
            <div className="feature-item">
              <h4>📊 암종별 특성 반영</h4>
              <p>각 암종의 고유한 생존율, 사망률, 치료 반응성을 정확히 반영한 맞춤형 모델</p>
            </div>
            <div className="feature-item">
              <h4>🎯 개인 맞춤형 의료</h4>
              <p>환자별 위험도, 생존율, 치료 반응을 정확히 예측하여 개인 맞춤형 치료 계획 수립 지원</p>
            </div>
            <div className="feature-item">
              <h4>🔬 다양한 알고리즘 검증</h4>
              <p>Random Forest, XGBoost, LightGBM, GBSA 등 다양한 알고리즘 비교를 통한 최적 모델 선택</p>
            </div>
            <div className="feature-item">
              <h4>🔍 설명 가능한 AI</h4>
              <p>SHAP, LIME 등 XAI 기법을 통해 모든 예측 결과에 대한 명확한 근거 제시</p>
            </div>
            <div className="feature-item">
              <h4>⚡ 실시간 의사결정 지원</h4>
              <p>CDSS 호환성을 통해 실제 진료 현장에서 실시간 의사결정 지원 가능</p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <CtUnetSection />

      <AnimatedSection>
        <h2>5. Our Vision & Partnership</h2>
        <p>궁극적인 목표는 해당 기술을 임상 현장에 적용하여 더욱 빠르고 정확한 진단을 돕고 환자 개개인에게 최적화된 정밀의료를 실현하는 것입니다. 오믹스 데이터 분석부터 Clinical 데이터 기반 예측까지 포괄적인 AI 의료 솔루션을 통해 의료진과 환자 모두에게 신뢰할 수 있는 파트너가 되는 것이 목표입니다.</p>
        
        <div className="vision-highlights">
          <h3>우리가 제공하는 가치</h3>
          <div className="value-grid">
            <div className="value-item">
              <h4>🎯 정확한 예측</h4>
              <p>오믹스 데이터 99% 이상, Clinical 모델 90% 이상의 높은 정확도</p>
            </div>
            <div className="value-item">
              <h4>🔍 투명한 설명</h4>
              <p>모든 예측에 대한 과학적 근거와 시각적 해석 제공</p>
            </div>
            <div className="value-item">
              <h4>🏥 임상 적용</h4>
              <p>실제 의료 현장에서 검증된 CDSS 호환 모델</p>
            </div>
            <div className="value-item">
              <h4>🌐 포괄적 솔루션</h4>
              <p>진단부터 치료까지 전 과정을 지원하는 통합 AI 플랫폼</p>
            </div>
          </div>
        </div>
        
        <div className="contact-info">
          <p>파트너십 및 기술 문의: contact@yourcompany.com</p>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default VisionTechPage;
