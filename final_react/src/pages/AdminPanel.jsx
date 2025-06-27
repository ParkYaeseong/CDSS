// src/pages/AdminPanel.jsx (래퍼 컴포넌트로 수정)
import React from 'react';
import AdminPanelComponent from '../components/AdminPanel';
import '../styles/AdminPanel.css'; // CSS 파일 import 추가

function AdminPanel() {
  return <AdminPanelComponent />;
}

export default AdminPanel;
