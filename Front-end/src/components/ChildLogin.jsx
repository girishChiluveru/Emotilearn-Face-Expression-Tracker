/* eslint-disable react/prop-types */
import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { UserContext } from '../../context/userContext';
import { LogIn, User, Lock, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import '../styles/ChildLogin.css';

const ChildLogin = ({ onStartQuiz }) => {
  const navigate = useNavigate();
  const { setChild } = useContext(UserContext);
  const [data, setData] = useState({ childname: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loginChild = async (e) => {
    e.preventDefault();
    setError('');
    if (!data.childname.trim()) { setError('Please enter your name.'); return; }

    setLoading(true);
    try {
      const res = await axios.post('/login', data);
      if (res.data.error) { setError(res.data.error); }
      else {
        setChild(res.data);
        if (res.data.isAdmin) navigate('/report');
        else { onStartQuiz(data.childname, res.data.sessionId); navigate('/game-select'); }
        setData({ childname: '', password: '' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  const update = (k, v) => { setData({ ...data, [k]: v }); setError(''); };

  return (
    <div className="login-page">
      {/* Left — branding */}
      <div className="login-page__branding">
        <div className="login-page__branding-inner">
          <div className="login-page__logo-icon"><Sparkles size={28} color="white" /></div>
          <h2 className="login-page__brand-title">EmotiLearn</h2>
          <p className="login-page__brand-sub">
            Track emotions while playing fun games — designed for curious minds! 🌈
          </p>
          <div className="login-page__brand-features">
            <div className="login-page__feature">🎮 Fun interactive games</div>
            <div className="login-page__feature">🧠 Real-time emotion tracking</div>
            <div className="login-page__feature">📊 Detailed progress reports</div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="login-page__form-panel">
        <div className="login-page__card">
          <div className="login-page__card-header">
            <div className="login-page__card-icon"><LogIn size={22} color="white" /></div>
            <h1 className="login-page__card-title">Welcome Back!</h1>
            <p className="login-page__card-subtitle">Sign in to start playing 🎮</p>
          </div>

          {error && <div className="login-page__error"><AlertCircle size={15} /> {error}</div>}

          <form onSubmit={loginChild} className="login-page__form">
            <div className="login-page__field">
              <label className="login-page__label">Your Name</label>
              <div className="login-page__input-wrap">
                <User size={15} className="login-page__input-icon" />
                <input id="login-name" type="text" placeholder="Enter your name"
                  value={data.childname} onChange={(e) => update('childname', e.target.value)}
                  className="login-page__input" />
              </div>
            </div>
            <div className="login-page__field">
              <label className="login-page__label">Password</label>
              <div className="login-page__input-wrap">
                <Lock size={15} className="login-page__input-icon" />
                <input id="login-password" type="password" placeholder="Enter password"
                  value={data.password} onChange={(e) => update('password', e.target.value)}
                  className="login-page__input" />
              </div>
            </div>
            <button id="login-submit" type="submit" disabled={loading} className="login-page__submit">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Logging in…</> : <><LogIn size={18} /> Let's Play! 🚀</>}
            </button>
          </form>

          <p className="login-page__register-link">
            New here? <Link to="/register">Register now →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChildLogin;
