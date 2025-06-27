import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { FaProjectDiagram, FaBrain, FaSearchPlus } from 'react-icons/fa';
import '../styles/VisionTechPage.css';

// --- 데이터 준비 ---

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
const performanceData = [ { cancer: 'BRCA', accuracy: '99.5%', auc: '0.998', f1: '0.99', accuracyVal: 99.5, aucVal: 99.8, f1Val: 99.0 }, { cancer: 'KIRC', accuracy: '98.9%', auc: '0.992', f1: '0.97', accuracyVal: 98.9, aucVal: 99.2, f1Val: 97.0 }, { cancer: 'LIHC', accuracy: '99.2%', auc: '0.997', f1: '0.99', accuracyVal: 99.2, aucVal: 99.7, f1Val: 99.0 }, { cancer: 'LUSC', accuracy: '98.5%', auc: '0.990', f1: '0.99', accuracyVal: 98.5, aucVal: 99.0, f1Val: 99.0 }, { cancer: 'OV',   accuracy: '99.0%', auc: '0.995', f1: '0.99', accuracyVal: 99.0, aucVal: 99.5, f1Val: 99.0 }, { cancer: 'STAD', accuracy: '99.1%', auc: '0.996', f1: '0.99', accuracyVal: 99.1, aucVal: 99.6, f1Val: 99.0 } ];
const CANCER_COLORS = { BRCA: '#2c7bb6', LIHC: '#d7191c', STAD: '#fdae61', LUSC: '#abd9e9', KIRC: '#a6d96a', OV: '#d494e1' };
const omicsImportanceData = [ { name: 'Gene', value: 1.35 }, { name: 'miRNA', value: 0.46 }, { name: 'Meth', value: 0.22 }, { name: 'CNV', value: 0.07 }, { name: 'Mutation', value: 0.01 } ];
const mirnaTop10Data = [ { name: 'hsa-mir-122', value: 3.1, cancer: 'LIHC' }, { name: 'hsa-mir-21', value: 2.0, cancer: 'OV' }, { name: 'hsa-mir-142', value: 1.6, cancer: 'LUSC' }, { name: 'hsa-mir-378a', value: 1.0, cancer: 'BRCA' }, { name: 'hsa-mir-944', value: 0.9, cancer: 'STAD' }, { name: 'hsa-mir-27b', value: 0.8, cancer: 'BRCA' }, { name: 'hsa-mir-190b', value: 0.7, cancer: 'BRCA' }, { name: 'hsa-mir-200c', value: 0.6, cancer: 'LIHC' }, { name: 'hsa-mir-196a-1', value: 0.5, cancer: 'BRCA' }, { name: 'hsa-let-7f-2', value: 0.45, cancer: 'LUSC' } ];
const methTop10Data = [ { name: 'cg06119575', value: 1.05, cancer: 'BRCA' }, { name: 'cg25042226', value: 0.85, cancer: 'KIRC' }, { name: 'cg23555120', value: 0.80, cancer: 'BRCA' }, { name: 'cg05155595', value: 0.55, cancer: 'STAD' }, { name: 'cg07354371', value: 0.48, cancer: 'LIHC' }, { name: 'cg20442697', value: 0.40, cancer: 'LUSC' }, { name: 'cg03693099', value: 0.38, cancer: 'LUSC' }, { name: 'cg06105778', value: 0.37, cancer: 'LIHC' }, { name: 'cg18913171', value: 0.36, cancer: 'LUSC' }, { name: 'cg19201019', value: 0.35, cancer: 'KIRC' } ];
const metaModelXaiData = [ { name: 'pred_gene_BRCA', value: 2.5, cancer: 'BRCA' }, { name: 'pred_gene_LIHC', value: 2.2, cancer: 'LIHC' }, { name: 'pred_mirna_OV', value: 1.8, cancer: 'OV' }, { name: 'pred_gene_STAD', value: 1.1, cancer: 'STAD' }, { name: 'pred_gene_OV', value: 1.0, cancer: 'OV' }, { name: 'pred_gene_LUSC', value: 0.8, cancer: 'LUSC' }, { name: 'pred_gene_KIRC', value: 0.7, cancer: 'KIRC' }, { name: 'pred_mirna_BRCA', value: 0.6, cancer: 'BRCA' }, { name: 'pred_mirna_STAD', value: 0.55, cancer: 'STAD' }, { name: 'pred_meth_KIRC', value: 0.5, cancer: 'KIRC' } ];

// --- 재사용 가능한 컴포넌트들 ---
const FeatureImportanceChart = ({ data, title }) => ( <div className="chart-wrapper"> <h4>{title}</h4> <ResponsiveContainer width="100%" height={400}> <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 30 }}> <CartesianGrid strokeDasharray="3 3" /> <XAxis type="number" /> <YAxis type="category" dataKey="name" width={150} fontSize={12} tick={{ textAnchor: 'end' }} /> <Tooltip formatter={(value) => value.toFixed(3)} /> <Legend layout="vertical" align="right" verticalAlign="bottom" wrapperStyle={{ paddingLeft: 20 }} payload={Object.entries(CANCER_COLORS).map(([cancer, color]) => ({ id: cancer, value: cancer, type: 'rect', color: color, }))} /> <Bar dataKey="value" name="평균 SHAP 값"> {data.map((entry, index) => ( <Cell key={`cell-${index}`} fill={CANCER_COLORS[entry.cancer] || '#8884d8'} /> ))} </Bar> </BarChart> </ResponsiveContainer> </div> );
const PerformanceTable = ({ data }) => ( <div className="table-container"> <table> <thead> <tr> <th>암종 (Cancer Type)</th> <th>정확도 (Accuracy)</th> <th>AUC</th> <th>F1-Score</th> </tr> </thead> <tbody> {data.map((row) => ( <tr key={row.cancer}> <td>{row.cancer}</td> <td>{row.accuracy}</td> <td>{row.auc}</td> <td>{row.f1}</td> </tr> ))} </tbody> </table> </div> );
const ScorecardGrid = ({ data }) => ( <div className="scorecard-grid"> {data.map((item) => { const miniChartData = [ { name: 'F1', value: item.f1Val }, { name: 'AUC', value: item.aucVal }, { name: 'Acc', value: item.accuracyVal }, ]; return ( <div key={item.cancer} className="scorecard"> <h4 className="scorecard-title">{item.cancer}</h4> <div className="score-item-container"> <div className="scorecard-item"> <span className="score-value">{item.accuracy}</span> <span className="score-label">Accuracy</span> </div> <div className="scorecard-item"> <span className="score-value">{item.auc}</span> <span className="score-label">AUC</span> </div> <div className="scorecard-item"> <span className="score-value">{item.f1}</span> <span className="score-label">F1-Score</span> </div> </div> <div className="mini-chart-container"> <ResponsiveContainer width="100%" height={80}> <BarChart data={miniChartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}> <XAxis type="number" domain={[95, 100]} hide /> <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={50} /> <Bar dataKey="value" fill="#0077b6" radius={[5, 5, 5, 5]} background={{ fill: '#eee', radius: 5 }} /> </BarChart> </ResponsiveContainer> </div> </div> ); })} </div> );
const PerformanceRankingChart = () => ( <div className="chart-wrapper"> <h4>오믹스 데이터별 예측 성능 (AUC)</h4> <ResponsiveContainer width="100%" height={250}> <BarChart data={binaryModelPerformance} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 20 }}> <CartesianGrid strokeDasharray="3 3" /> <XAxis type="number" domain={[0, 1]} /> <YAxis type="category" dataKey="name" width={120} /> <Tooltip formatter={(value) => value.toFixed(4)} /> <Bar dataKey="auc" name="AUC"> {binaryModelPerformance.map((entry, index) => ( <Cell key={entry.name} fill={RANKING_PALETTE[index % RANKING_PALETTE.length]} /> ))} </Bar> </BarChart> </ResponsiveContainer> </div>);
const ConfusionMatrix = ({ data }) => (
 <div className="cm-wrapper">
   <h4>혼동 행렬</h4>
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

  return (
    <div>
      <div className="omics-selector">
        <button onClick={() => setActiveTab('miRNA')} className={activeTab === 'miRNA' ? 'active' : ''}>miRNA</button>
        <button onClick={() => setActiveTab('Gene Expression')} className={activeTab === 'Gene Expression' ? 'active' : ''}>Gene</button>
        <button onClick={() => setActiveTab('Methylation')} className={activeTab === 'Methylation' ? 'active' : ''}>Meth</button>
      </div>

      {currentData && (
        <div className="tab-content">
          {/* 2x2 그리드 컨테이너 */}
          <div className="analysis-grid-container">
            {/* 1. 핵심 지표 */}
            <div className="metric-card kpi-card">
                 <h4>핵심 지표 (KPIs)</h4>
                 <div className="kpi-item">
                    <span className="kpi-value">{currentData.kpis.acc}</span>
                    <span className="kpi-label">Accuracy</span>
                 </div>
                 <div className="kpi-item">
                    <span className="kpi-value">{currentData.kpis.f1}</span>
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
              value={`${(currentData.pr.cancer_r * 100).toFixed(1)}%`}
              description={`실제 '암' 샘플 중 우리 모델이 '암'이라고 올바르게 예측한 비율입니다. 암 환자를 놓치지 않는 능력을 의미합니다.`}
            />

            {/* 4. 정밀도 */}
            <MetricCard
              title="정밀도 (Precision)"
              value={`${(currentData.pr.cancer_p * 100).toFixed(1)}%`}
              description={`우리 모델이 '암'이라고 예측한 것들 중 실제 '암'이었던 비율입니다.`}
            />
          </div>

          <FeatureImportanceChart title={`${activeTab} Top 5 예측 인자`} data={currentData.xaiTop5} />
        </div>
      )}
    </div>
  );
};


// --- 메인 페이지 컴포넌트 ---
const VisionTechPage = () => {
  const navigate = useNavigate();
  const [selectedOmics, setSelectedOmics] = useState('mirna');
  const [performanceView, setPerformanceView] = useState('table');
  const omicsDataMap = { mirna: { title: 'miRNA Top 10 예측 인자', data: mirnaTop10Data }, meth: { title: '메틸레이션 Top 10 예측 인자', data: methTop10Data } };

  return (
    <div className="vision-container">
      <header className="page-header">
        <h1>AI, 암 진단의 블랙박스를 열다</h1>
        <h1 className="highlight">단순 예측을 넘어, 신뢰할 수 있는 진단 파트너로</h1>
        <p className="subtitle">저희는 6개의 전문 AI 모델이 협력하는 자동화 진단 파이프라인을 통해 높은 정확도는 물론, 예측의 구체적인 근거까지 제시하여 데이터 기반 정밀의료의 새로운 기준을 제시합니다.</p>
      </header>
      
      <section className="content-section">
        <h2>Our Automated Diagnostic Pipeline</h2>
        <p>사용자가 데이터를 업로드하면 저희 시스템은 아래 3단계의 자동화된 파이프라인을 통해 신속하고 신뢰도 높은 분석 결과를 제공합니다.</p>
        <div className="pipeline-steps-container">
          <div className="pipeline-step"><FaProjectDiagram className="step-icon" /><h3>1단계: 병렬 스크리닝</h3><p>6개의 암종별 '전문 모델'이 동시에 업로드된 데이터를 검사하여 암의 특징이 보이는지 1차적으로 스크리닝합니다.</p></div>
          <div className="pipeline-step"><FaBrain className="step-icon" /><h3>2단계: 중앙 통제 및 판정</h3><p>6개 모델의 결과를 중앙에서 종합하여 '정상', '암 의심(명확)', '암 의심(모호)' 세 가지 케이스로 상황을 판단합니다.</p></div>
          <div className="pipeline-step"><FaSearchPlus className="step-icon" /><h3>3단계: 특화 분석 및 XAI</h3><p>암이 명확하게 의심될 경우, 해당 암종에 특화된 모델이 심층 분석을 수행하고, 판단의 핵심 근거를 시각적으로 제시합니다.</p></div>
        </div>
      </section>

      <section className="content-section">
        <h2>1단계 스크리닝: 어떤 데이터가 암을 가장 잘 찾아내는가?</h2>
        <p>5가지 오믹스 데이터를 개별 분석한 결과, **miRNA와 Methylation 데이터가 99% 이상의 AUC를 기록**하며 가장 압도적인 성능을 보였습니다. 이는 특정 데이터 유형에 암을 탐지하는 강력한 바이오마커가 집중되어 있음을 시사하며, 저희는 이 결과를 바탕으로 가장 강력한 모델들을 우선적으로 활용하여 진단 파이프라인을 설계했습니다.</p>
        <PerformanceRankingChart />
        <div className="interactive-section">
          <h3>모델별 심층 분석</h3>
          <p>아래 탭을 클릭하여 상위 모델들의 상세 성능 지표, 혼동 행렬, 그리고 예측에 가장 큰 영향을 미친 특징 Top 5를 직접 확인해 보세요.</p>
          <DetailedAnalysisTabs />
        </div>
        <p className="summary-text">이러한 체계적인 비교 분석을 통해, 저희는 가장 신뢰도 높은 데이터 소스를 식별하고, 각 데이터의 한계까지 명확히 파악했습니다.</p>
      </section>

      <section className="content-section">
        <h2>2. 핵심 모델: 다중 암종(Multi-Cancer) 분류</h2>
        <p>암으로 판단된 데이터에 대해, 5가지 주요 암종(유방암, 간암, 위암 등) 중 어떤 암에 해당하는지 100%에 가까운 정확도로 분류해냅니다. 이는 각 암종의 고유한 데이터 패턴을 AI가 완벽하게 학습했음을 의미합니다.</p>
        <div className="performance-view-section">
          <h3 className="chart-title">📊 최종 모델 성능</h3>
          <p>이러한 강력한 모델들을 기반으로 구축된 최종 암종 분류 모델의 성능은 아래와 같습니다.</p>
          <div className="view-toggle"> <button onClick={() => setPerformanceView('table')} className={performanceView === 'table' ? 'active' : ''}>테이블 보기</button> <button onClick={() => setPerformanceView('card')} className={performanceView === 'card' ? 'active' : ''}>카드 보기</button> </div>
          {performanceView === 'table' ? (<PerformanceTable data={performanceData} />) : (<ScorecardGrid data={performanceData} />)}
        </div>
      </section>

      <section className="content-section">
        <h2>3. 신뢰성의 근거: 설명 가능한 AI (XAI) 분석</h2>
        <p>저희 모델은 '답'만 내놓는 블랙박스가 아닙니다. SHAP 분석을 통해 모델이 왜 그런 예측을 했는지, 어떤 유전자나 변이가 결정에 가장 큰 영향을 미쳤는지 시각적으로 해석합니다.</p>
        <div className="chart-section interactive-section">
          <h3>XAI 분석: 어떤 유전자가 예측을 이끌었는가?</h3>
          <p>아래 버튼을 클릭하여 데이터 종류별로 어떤 유전자/특징이 암종 분류에 가장 큰 영향을 미쳤는지 Top 10을 확인해 보세요.</p>
          <div className="omics-selector">
            <button onClick={() => setSelectedOmics('mirna')} className={selectedOmics === 'mirna' ? 'active' : ''}>miRNA</button>
            <button onClick={() => setSelectedOmics('meth')} className={selectedOmics === 'meth' ? 'active' : ''}>Methylation</button>
          </div>
          <FeatureImportanceChart title={omicsDataMap[selectedOmics].title} data={omicsDataMap[selectedOmics].data} />
        </div>
        <div className="chart-section interactive-section">
          <h3>XAI 분석: 메타 모델의 최종 판단 기준</h3>
          <p>개별 모델의 예측 결과를 종합하여 최종 결론을 내리는 '메타 모델'은 어떤 전문가 모델의 의견을 가장 신뢰할까요? 분석 결과, 특정 암종에 대한 <strong>'유전자(Gene) 모델'의 예측</strong>을 가장 중요한 판단 근거로 삼는 경향을 보였습니다. 이는 우리 시스템의 최종 판단이 어떤 내부 로직을 통해 이루어지는지 투명하게 보여주는 핵심적인 결과입니다.</p>
          <FeatureImportanceChart title="메타 모델 Top 10 예측 인자" data={metaModelXaiData} />
        </div>
      </section>

      <section className="content-section">
        <h2>4. Our Vision & Partnership</h2>
        <p>저희의 목표는 이 기술을 임상 현장에 적용하여 더 빠르고 정확한 진단을 돕고, 궁극적으로는 환자 개개인에게 최적화된 정밀의료를 실현하는 것입니다. 저희의 비전에 공감하고, 데이터 기반 의료 혁신을 함께 만들어갈 파트너를 찾고 있습니다.</p>
        <div className="contact-info"><p>파트너십 및 기술 문의: contact@yourcompany.com</p></div>
      </section>
    </div>
  );
};

export default VisionTechPage;