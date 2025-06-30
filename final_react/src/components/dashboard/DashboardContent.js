//src/components/dashboard/DashboardContent.jsx

import React from 'react';
import { Box } from '@mui/material';
import PatientInfoCard from './PatientInfoCard';
import VitalChartComponent from './VitalChartComponent';
import CTImageViewer from './CTImageViewer';
import MedicalRecords from './MedicalRecords';
import MedicationCard from './MedicationCard';
import OmicsAnalysisViewer from '../omics/OmicsAnalysisViewer';

const THEME_COLORS = {
  background: '#f8fafc',
  border: '#e2e8f0'
};

export default function DashboardContent({
  selectedPatient,
  currentRequest,
  ctLoading,
  ctError,
  analysisHistory,
  selectedAnalysis,
  onAnalysisSelect,
  showAnalysisSelector,
  onMenuChange
}) {
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', bgcolor: THEME_COLORS.background }}>
      <Box sx={{ 
        width: '50%', 
        p: 1, 
        overflowY: 'auto',
        borderRight: `1px solid ${THEME_COLORS.border}`
      }}>
        <PatientInfoCard patient={selectedPatient} />
        <VitalChartComponent patient={selectedPatient} />
        <CTImageViewer 
          currentRequest={currentRequest}
          loading={ctLoading}
          error={ctError}
          analysisHistory={analysisHistory}
          selectedAnalysis={selectedAnalysis}
          onAnalysisSelect={onAnalysisSelect}
          showAnalysisSelector={showAnalysisSelector}
        />
      </Box>
      
      <Box sx={{ 
        width: '50%', 
        p: 1, 
        overflowY: 'auto'
      }}>
        <MedicalRecords patient={selectedPatient} />
        <MedicationCard patient={selectedPatient} onMenuChange={onMenuChange} />
        <Box sx={{ mt: 1 }}>
          <OmicsAnalysisViewer patientId={selectedPatient?.id} />
        </Box>
      </Box>
    </Box>
  );
}
