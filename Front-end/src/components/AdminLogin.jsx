import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/AdminLogin.css"; // In AdminLogin.js

const AdminLogin = ({ onAdminLogin }) => {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const correctAdminId = "123";
  const correctAdminPassword = "123";

  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminId === correctAdminId && adminPassword === correctAdminPassword) {
      onAdminLogin();
      navigate("/report");
    } else {
      setLoginError("Incorrect Admin ID or Password.");
    }
  };

  return (
    <div className="admin-login-form">
      <h1>Admin Login</h1>
      <form onSubmit={handleAdminLoginSubmit}>
        <div className="input-group">
          <label htmlFor="adminId">Admin ID:</label>
          <input
            type="text"
            id="adminId"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="adminPassword">Password:</label>
          <input
            type="password"
            id="adminPassword"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
        {loginError && <p className="error-message">{loginError}</p>}
      </form>
    </div>
  );
};

export default AdminLogin;
