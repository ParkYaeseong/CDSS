// src/components/Layout/Layout.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar';

function Layout({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // 로그인/회원가입 페이지인지 확인
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  
  // 네비게이션 바를 표시할지 결정
  const shouldShowNavbar = !isAuthenticated && !isAuthPage;

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <div className={shouldShowNavbar ? 'page-content' : ''}>
        {children}
      </div>
    </>
  );
}

export default Layout;
