// src/components/Navbar/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* 로고 영역 */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-text">CDSS</span>
          </Link>
        </div>

        {/* 메뉴 영역 */}
        <div className="navbar-menu">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/about" className="nav-link">OurValue</Link>
            </li>
            <li className="nav-item">
              <Link to="/vision" className="nav-link">AI</Link>
            </li>
            <li className="nav-item">
              <Link to="/team" className="nav-link">TEAM</Link>
            </li>

          </ul>
        </div>

        {/* 로그인/회원가입 버튼 */}
        <div className="navbar-actions">
          <button 
            className="btn btn-outline"
            onClick={handleLoginClick}
          >
            로그인
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleRegisterClick}
          >
            회원가입
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
