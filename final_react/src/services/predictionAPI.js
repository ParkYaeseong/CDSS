// services/predictionAPI.js
const API_BASE_URL = 'http://35.188.47.40:8000/api/clinical-prediction';

const PredictionAPI = {
  async getSupportedCancerTypes() {
    const response = await fetch(`${API_BASE_URL}/cancer-types/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  },

  async callPredictionAPI(predictionType, patientOpenemrId, patientName) {
    let endpoint;
    switch (predictionType) {
      case 'survival-rate':
        endpoint = '/predict/survival/';
        break;
      case 'cancer-risk':
        endpoint = '/predict/risk-classification/';
        break;
      case 'treatment-effect':
        endpoint = '/predict/treatment-effect/';
        break;
      default:
        throw new Error('지원하지 않는 예측 타입입니다.');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientOpenemrId,
        patient_name: patientName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: 예측 API 호출 실패`);
    }

    return await response.json();
  },

  async callAllPredictionsAPI(patientOpenemrId, patientName) {
    const response = await fetch(`${API_BASE_URL}/predict/all/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientOpenemrId,
        patient_name: patientName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: 통합 예측 API 호출 실패`);
    }

    return await response.json();
  },

  formatPredictionResults(apiData, predictionType) {
    let formattedResults;

    if (predictionType === 'survival-rate') {
      const survivalProbs = apiData.survival_probabilities || {};
      const oneYear = survivalProbs['1_year'] || 0.8;
      const threeYear = survivalProbs['3_year'] || 0.6;
      const fiveYear = survivalProbs['5_year'] || 0.4;
      
      formattedResults = {
        primaryValue: `${(fiveYear * 100).toFixed(1)}%`,
        secondaryValue: apiData.median_survival_months ?
          `${apiData.median_survival_months.toFixed(1)}개월` :
          `${Math.round((apiData.median_survival_days || 1500) / 30)}개월`,
        primaryLabel: '5년 생존율',
        secondaryLabel: '예상 생존기간',
        confidence: apiData.confidence || 0.85,
        features: [
          { name: '1년 생존율', value: `${(oneYear * 100).toFixed(1)}%`, importance: oneYear },
          { name: '3년 생존율', value: `${(threeYear * 100).toFixed(1)}%`, importance: threeYear },
          { name: '5년 생존율', value: `${(fiveYear * 100).toFixed(1)}%`, importance: fiveYear },
          { name: '위험 점수', value: apiData.risk_score ? apiData.risk_score.toFixed(3) : 'N/A', importance: apiData.risk_score ? Math.min(1 - apiData.risk_score, 1.0) : 0.5 }
        ],
        clinicalSummary: apiData.clinical_data_summary || null,
        xaiExplanation: apiData.xai_explanation || null
      };
    } else if (predictionType === 'cancer-risk') {
      const lowRiskProb = apiData.risk_probabilities?.low_risk || 0;
      const highRiskProb = apiData.risk_probabilities?.high_risk || 0;
      
      formattedResults = {
        primaryValue: apiData.predicted_risk_class || 'Unknown',
        secondaryValue: `${(apiData.confidence * 100).toFixed(1)}%`,
        primaryLabel: '위험도 분류',
        secondaryLabel: '분류 확률',
        confidence: apiData.confidence || 0.85,
        features: [
          { name: '저위험 확률', value: `${(lowRiskProb * 100).toFixed(1)}%`, importance: lowRiskProb },
          { name: '고위험 확률', value: `${(highRiskProb * 100).toFixed(1)}%`, importance: highRiskProb },
          ...(apiData.risk_factors || []).slice(0, 3).map(factor => ({
            name: factor.factor.replace(/_/g, ' '),
            value: typeof factor.value === 'number' ? factor.value.toFixed(3) : factor.value,
            importance: factor.importance || 0.5
          }))
        ],
        clinicalSummary: apiData.clinical_data_summary || null,
        xaiExplanation: apiData.xai_explanation || null
      };
    } else if (predictionType === 'treatment-effect') {
      const recommendedTreatment = apiData.recommended_treatment;
      const treatmentEffects = apiData.treatment_effects || {};

      formattedResults = {
        primaryValue: recommendedTreatment?.primary || '수술',
        secondaryValue: `${(recommendedTreatment?.effectiveness || 75).toFixed(1)}%`,
        primaryLabel: '추천 치료법',
        secondaryLabel: '예상 효과',
        confidence: apiData.overall_confidence || 0.87,
        features: Object.entries(treatmentEffects).slice(0, 4).map(([treatment, effect]) => ({
          name: treatment,
          value: `${(effect.effectiveness || 50).toFixed(1)}%`,
          importance: (effect.effectiveness || 50) / 100
        })),
        clinicalSummary: apiData.clinical_data_summary || null,
        xaiExplanation: apiData.xai_explanation || null
      };
    }

    return formattedResults;
  }
};

export default PredictionAPI;
