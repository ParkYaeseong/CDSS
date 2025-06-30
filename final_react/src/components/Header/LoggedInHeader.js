// src/components/Header/LoggedInHeader.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoggedInHeader.css';

function LoggedInHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const getUserTypeLabel = (userType) => {
    const labels = {
      'doctor': '의사',
      'nurse': '간호사',
      'admin': '관리자',
      'staff': '원무과',
      'patient': '환자',
      'radiologist': '영상의학과'
    };
    return labels[userType] || '사용자';
  };

  return (
    <header className="logged-in-header">
      <div className="header-container">
        <div className="header-brand">
          <button 
            className="brand-button"
            onClick={() => navigate('/')}
          >
            MEORING
          </button>
        </div>
        
        <div className="header-user-info">
          <div className="user-details">
            <span className="user-name">{user?.name || user?.username}</span>
            <span className="user-role">{getUserTypeLabel(user?.user_type)}</span>
          </div>
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

export default LoggedInHeader;
