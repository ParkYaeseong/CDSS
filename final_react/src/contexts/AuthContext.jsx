// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 앱이 처음 로드될 때 토큰을 확인하여 자동 로그인 상태를 복구합니다.
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // 서버에 토큰 유효성을 확인하고 사용자 정보를 가져옵니다.
          const userData = await authService.checkStatus();
          setUser(userData);
        } catch (error) {
          console.error("Token validation failed on initial load:", error.message);
          // 유효하지 않은 토큰이면 깨끗하게 로그아웃 처리합니다.
          authService.logout();
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  // LoginPage에서 호출할 login 함수
  const login = async (username, password) => {
    try {
      // 서비스의 login 함수는 토큰 저장까지 모두 처리합니다.
      const data = await authService.login({ username, password });
      
      if (data.user) {
        // Context의 user 상태를 업데이트하고, LoginPage가 사용할 수 있도록 user 데이터를 반환합니다.
        setUser(data.user);
        return data.user;
      }
    } catch (error) {
      console.error("Login process failed in context", error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = { user, isLoading, login, logout, isAuthenticated: !!user };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
