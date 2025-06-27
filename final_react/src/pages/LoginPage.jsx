// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import '../styles/LoginPage.css';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // ✅ 1. AuthContext의 login 함수를 호출하고, 성공 시 user 객체를 반환받습니다.
      // (이 함수 안에서 서비스 호출, 토큰 저장, Context 상태 설정이 모두 일어납니다.)
      const loggedInUser = await login(username, password);

      // ✅ 2. 반환된 사용자 정보의 'user_type'에 따라 페이지를 이동시킵니다.
      if (loggedInUser && loggedInUser.user_type) {
        switch (loggedInUser.user_type) {
          case 'doctor':
            navigate('/dashboard');
            break;
          case 'nurse':
            navigate('/nurse-panel');
            break;
          case 'radio':
            navigate('/radiologist-panel');
            break;
          case 'staff':  // 원무과 케이스 추가
            navigate('/admin-panel');
            break;
          default:
            navigate('/'); // 그 외 역할은 기본 페이지(홈)로 이동
        }
      } else {
        // 혹시 user 정보나 user_type이 없는 예외적인 경우
        throw new Error('사용자 정보를 불러오는 데 실패했습니다.');
      }
    } catch (err) {
      // authService 또는 AuthContext에서 던진 에러를 여기서 잡아서 표시합니다.
      setError(err.message || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const setDummyCredentials = (dummyUsername, pwd) => {
    setUsername(dummyUsername);
    setPassword(pwd);
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleLogin}>
        <h1 className="login-title">CDSS 로그인</h1>
        <p className="login-subtitle">의료진 전용 의사결정지원 시스템</p>

        {error && <p className="login-error">{error}</p>}

        <input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button 
          type="submit"
          disabled={loading}
          className={loading ? 'loading' : ''}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
        
        <div className="register-link">
          <button
          type="button"
          className="register-button"
          onClick={() => navigate('/register')}
          >
            회원가입
            </button>
        </div>

        <div className="dummy-login-section">
          <p className="dummy-login-title">개발용 더미 로그인:</p>
          <div className="dummy-login-buttons">
            <button type="button" onClick={() => setDummyCredentials('doctor1', 'qaws1234')}>의사</button>
            <button type="button" onClick={() => setDummyCredentials('nurse1', 'qaws1234')}>간호사</button>
            <button type="button" onClick={() => setDummyCredentials('radiologist1', 'qaws1234')}>영상의학과</button>
            <button type="button" onClick={() => setDummyCredentials('staff1', 'qaws1234')}>원무과</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
