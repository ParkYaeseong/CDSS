//src/components/dashboard/DrugInteractionContent.jsx

import React from 'react';
import DrugInteractionComponent from '../DrugInteractionComponent';

export default function DrugInteractionContent({ selectedPatient }) {
  return <DrugInteractionComponent selectedPatient={selectedPatient} />;
}
