// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // 반드시 export default 되어 있어야 함
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
