import React, { useState } from 'react';
import '../styles/LoginPage.css';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    role: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async () => {
    // 📌 여기 수정하면 됩니다: 회원가입 API 요청 (POST)
    console.log('회원가입 요청:', formData);
    navigate('/login');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>CDSS 회원가입</h2>
        <input
          name="employeeId"
          placeholder="사원번호"
          value={formData.employeeId}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="이메일"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="">역할 선택</option>
          <option value="doctor">의사</option>
          <option value="nurse">간호사</option>
          <option value="radio">영상의학과</option>
        </select>
        <input
          name="password"
          placeholder="비밀번호"
          type="password"
          value={formData.password}
          onChange={handleChange}
        />
        <button onClick={handleRegister}>회원가입</button>
      </div>
    </div>
  );
}

export default RegisterPage;
