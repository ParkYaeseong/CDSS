//src/components/dashboard/ClinicalPredictionContent.jsx

import React from 'react';
import ClinicalPredictionDashboard from '../clinical/ClinicalPredictionDashboard';

export default function ClinicalPredictionContent({ selectedPatient }) {
  return <ClinicalPredictionDashboard selectedPatient={selectedPatient} />;
}
