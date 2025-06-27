// src/components/PrivateRouteWithRole.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Common/Loading';

const PrivateRouteWithRole = ({ children, role }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // AuthContext가 사용자 정보를 로딩 중일 때는 로딩 화면을 보여줍니다.
    return <Loading />;
  }

  // ✅ user.user_type 대신, user.user_type을 직접 확인하도록 수정합니다.
  if (user && user.user_type === role) {
    return children;
  }

  if (user) {
    // 로그인은 되어 있지만 역할이 다른 경우, 접근 권한 없음 페이지나 홈으로 보냅니다.
    // 여기서는 홈으로 보내고, 접근 시도했던 경로는 state로 남겨둡니다.
    return <Navigate to="/" state={{ from: location, error: "접근 권한이 없습니다." }} replace />;
  }

  // 로그인하지 않은 사용자는 로그인 페이지로 보냅니다.
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRouteWithRole;