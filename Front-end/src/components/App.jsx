import { useState, useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import Navbar from './Navbar';
import Quiz from './Quiz';
import AnimalGame from './AnimalGame';
import MemoryGame from './MemoryGame';
import Report from './Report';
import ChildReport from './ChildReport';
import ChildLogin from './ChildLogin';
import AdminLogin from './AdminLogin';
import LandingPage from './LandingPage';
import GameSelect from './GameSelect';
import ChildRegister from './Register';
import SuperAdmin from './SuperAdmin';
import Faqs from './Faqs';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/App.css';

// Central axios configuration — only set here, not in userContext
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = '__csrf_token';
axios.defaults.xsrfHeaderName = 'X-CSRF-Token';

// Interceptor to generate and attach an Idempotency-Key for state-changing requests
axios.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      if (!config.headers['Idempotency-Key']) {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
        config.headers['Idempotency-Key'] = uuid;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Redirect already-logged-in users away from auth pages */
const PublicRoute = ({ children }) => {
  const { child, ready } = useContext(UserContext);
  if (!ready) return null;
  return child ? <Navigate to="/game-select" replace /> : children;
};

/** Require any authenticated session */
const ProtectedRoute = ({ children }) => {
  const { child, ready } = useContext(UserContext);
  if (!ready) return null;
  return child ? children : <Navigate to="/login" replace />;
};

/** Require super-admin session — regular admins, children & unauthenticated users are redirected */
const SuperAdminRoute = ({ children }) => {
  const { child, ready } = useContext(UserContext);
  if (!ready) return null;
  if (!child) return <Navigate to="/login" replace />;
  if (!child.isSuperAdmin) return <Navigate to="/game-select" replace />;
  return children;
};

/** Require admin or super-admin session (therapists/admins) */
const AdminRoute = ({ children }) => {
  const { child, ready } = useContext(UserContext);
  if (!ready) return null;
  if (!child) return <Navigate to="/login" replace />;
  if (!child.isAdmin && !child.isSuperAdmin) return <Navigate to="/game-select" replace />;
  return children;
};

function App() {
  const [childname, setChildname] = useState('');
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem('emotilearn_sid') || ''
  );
  const { child } = useContext(UserContext);

  const resolved = {
    name: childname || child?.childname || '',
    session: sessionId,
  };

  const handleStartQuiz = (name, sid) => {
    setChildname(name);
    setSessionId(sid);
    localStorage.setItem('emotilearn_sid', sid);
  };

  const postScores = async (scores) => {
    if (!resolved.name || !resolved.session) return;
    try {
      await axios.post('/store-scores', {
        childName: resolved.name,
        sessionId: resolved.session,
        scores,
      });
    } catch (e) {
      console.error('postScores failed:', e);
    }
  };

  const withNav = (C) => <><Navbar />{C}</>;

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth — public only */}
        <Route path="/login"       element={<PublicRoute><ChildLogin onStartQuiz={handleStartQuiz} /></PublicRoute>} />
        <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/register"    element={<PublicRoute><ChildRegister /></PublicRoute>} />

        {/* Game hub — any authenticated user */}
        <Route path="/game-select" element={<ProtectedRoute>{withNav(<GameSelect childname={resolved.name} />)}</ProtectedRoute>} />

        {/* Games — no navbar (full-screen experience) */}
        <Route path="/quiz"        element={<ProtectedRoute><Quiz        childname={resolved.name} sessionId={resolved.session} onQuizEnd={(s)   => postScores([{ gameType: 'Quiz Game',   score: s }])} /></ProtectedRoute>} />
        <Route path="/animal-game" element={<ProtectedRoute><AnimalGame  childname={resolved.name} sessionId={resolved.session} onanimal={(s)    => postScores([{ gameType: 'Animal Game', score: s }])} /></ProtectedRoute>} />
        <Route path="/memory-game" element={<ProtectedRoute><MemoryGame  childname={resolved.name} sessionId={resolved.session} onFinish={(s)   => postScores([{ gameType: 'Memory Game', score: s }])} /></ProtectedRoute>} />

        {/* Reports & Admin — therapists can view report pages, super admin can view all */}
        <Route path="/report"       element={<AdminRoute>{withNav(<Report />)}</AdminRoute>} />
        <Route path="/child-report" element={<AdminRoute>{withNav(<ChildReport />)}</AdminRoute>} />
        <Route path="/super-admin"  element={<SuperAdminRoute>{withNav(<SuperAdmin />)}</SuperAdminRoute>} />

        {/* Public pages */}
        <Route path="/Faqs" element={<Faqs />} />

        {/* Legacy redirects */}
        <Route path="/child-login"    element={<Navigate to="/login"    replace />} />
        <Route path="/child-register" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
