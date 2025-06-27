import React from 'react';
import '../styles/PatientCard.css';

function PatientCard({ patient }) {
  const initial = patient.name[0];

  return (
    <div className="patient-card">
      <div className="avatar-circle">{initial}</div>
      <div className="patient-info">
        <h3>{patient.name}</h3>
        <p>나이: {patient.age}세</p>
        <button onClick={() => alert(`${patient.name} 상세 보기`)}>상세 보기</button>
      </div>
    </div>
  );
}

export default PatientCard;
