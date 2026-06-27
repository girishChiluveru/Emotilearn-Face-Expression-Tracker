import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { UserPlus, User, Lock, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import '../styles/ChildLogin.css'; // reuse login styles

const ChildRegister = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ childname: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const registerChild = async (e) => {
    e.preventDefault();
    setError('');
    if (!data.childname.trim() || !data.password.trim()) { setError('Both fields are required.'); return; }

    setLoading(true);
    try {
      const res = await axios.post('/register', data);
      if (res.data.error) { setError(res.data.error); }
      else {
        toast.success(res.data.message || 'Registration successful!');
        navigate('/login');
      }
    } catch (err) {
      const msg = err.response?.data?.details?.[0]?.message || err.response?.data?.message || err.response?.data?.error || 'An error occurred.';
      setError(msg);
    } finally { setLoading(false); }
  };

  const update = (k, v) => { setData({ ...data, [k]: v }); setError(''); };

  return (
    <div className="login-page">
      {/* Left — branding (same as login) */}
      <div className="login-page__branding">
        <div className="login-page__branding-inner">
          <div className="login-page__logo-icon"><Sparkles size={28} color="white" /></div>
          <h2 className="login-page__brand-title">EmotiLearn</h2>
          <p className="login-page__brand-sub">
            Join our fun learning platform — create your account and start playing! 🎉
          </p>
          <div className="login-page__brand-features">
            <div className="login-page__feature">🎮 Fun interactive games</div>
            <div className="login-page__feature">🧠 Real-time emotion tracking</div>
            <div className="login-page__feature">📊 Detailed progress reports</div>
          </div>
        </div>
      </div>

      {/* Right — register form */}
      <div className="login-page__form-panel">
        <div className="login-page__card">
          <div className="login-page__card-header">
            <div className="login-page__card-icon"><UserPlus size={22} color="white" /></div>
            <h1 className="login-page__card-title">Create Account</h1>
            <p className="login-page__card-subtitle">Join EmotiLearn today! 🌟</p>
          </div>

          {error && <div className="login-page__error"><AlertCircle size={15} /> {error}</div>}

          <form onSubmit={registerChild} className="login-page__form">
            <div className="login-page__field">
              <label className="login-page__label">Child Name</label>
              <div className="login-page__input-wrap">
                <User size={15} className="login-page__input-icon" />
                <input id="reg-name" type="text" placeholder="Enter child's name"
                  value={data.childname} onChange={(e) => update('childname', e.target.value)}
                  className="login-page__input" />
              </div>
            </div>
            <div className="login-page__field">
              <label className="login-page__label">Password</label>
              <div className="login-page__input-wrap">
                <Lock size={15} className="login-page__input-icon" />
                <input id="reg-password" type="password" placeholder="Create a password"
                  value={data.password} onChange={(e) => update('password', e.target.value)}
                  className="login-page__input" />
              </div>
            </div>
            <button id="reg-submit" type="submit" disabled={loading} className="login-page__submit">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Creating…</> : <><UserPlus size={18} /> Register 🎉</>}
            </button>
          </form>

          <p className="login-page__register-link">
            Already have an account? <Link to="/login">Login →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChildRegister;
