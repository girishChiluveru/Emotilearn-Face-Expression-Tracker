/* eslint-disable react/prop-types */
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { UserContext } from '../../context/userContext';
import '../styles/ChildLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setChild } = useContext(UserContext);
  const [data, setData] = useState({ id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Hardcoded Super Admin credentials
    if (data.id === '123' && data.password === '123') {
      const superUser = { childname: 'Super Admin', isSuperAdmin: true };
      setChild(superUser);
      // Persist super admin session locally
      localStorage.setItem('emotilearn_super', JSON.stringify(superUser));
      navigate('/super-admin');
    } else {
      setError('Incorrect Admin ID or Password.');
    }
  };

  const update = (k, v) => { setData({ ...data, [k]: v }); setError(''); };

  return (
    <div className="login-page">
      <div className="login-page__branding">
        <div className="login-page__branding-inner">
          <div className="login-page__logo-icon"><ShieldCheck size={28} color="white" /></div>
          <h2 className="login-page__brand-title">Admin Portal</h2>
          <p className="login-page__brand-sub">Manage children, view reports, and configure the platform.</p>
          <div className="login-page__brand-features">
            <div className="login-page__feature">📊 View all reports</div>
            <div className="login-page__feature">👥 Manage children</div>
            <div className="login-page__feature">⚙️ Platform settings</div>
          </div>
        </div>
      </div>

      <div className="login-page__form-panel">
        <div className="login-page__card">
          <div className="login-page__card-header">
            <div className="login-page__card-icon"><ShieldCheck size={22} color="white" /></div>
            <h1 className="login-page__card-title">Admin Login</h1>
            <p className="login-page__card-subtitle">Enter your admin credentials 🔐</p>
          </div>

          {error && <div className="login-page__error"><AlertCircle size={15} /> {error}</div>}

          <form onSubmit={handleSubmit} className="login-page__form">
            <div className="login-page__field">
              <label className="login-page__label">Admin ID</label>
              <div className="login-page__input-wrap">
                <User size={15} className="login-page__input-icon" />
                <input id="admin-id" type="text" placeholder="Enter admin ID"
                  value={data.id} onChange={(e) => update('id', e.target.value)}
                  className="login-page__input" />
              </div>
            </div>
            <div className="login-page__field">
              <label className="login-page__label">Password</label>
              <div className="login-page__input-wrap">
                <Lock size={15} className="login-page__input-icon" />
                <input id="admin-password" type="password" placeholder="Enter password"
                  value={data.password} onChange={(e) => update('password', e.target.value)}
                  className="login-page__input" />
              </div>
            </div>
            <button id="admin-submit" type="submit" disabled={loading} className="login-page__submit">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : <><ShieldCheck size={18} /> Login as Admin</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
