/* eslint-disable no-unused-vars */
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

const PublicRoute = ({ children }) => {
  const { child, ready } = useContext(UserContext);
  if (!ready) return null;
  return child ? <Navigate to="/game-select" replace /> : children;
};

const ProtectedRoute = ({ children }) => {
  const { child, ready } = useContext(UserContext);
  if (!ready) return null; // Wait for session check
  return child ? children : <Navigate to="/login" replace />;
};

function App() {
  const [childname, setChildname] = useState('');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('emotilearn_sid') || '');
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
      const r = await fetch(`${API_URL}/store-scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ childName: resolved.name, sessionId: resolved.session, scores }),
      });
      if (!r.ok) throw new Error(r.statusText);
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
        <Route path="/login" element={<PublicRoute><ChildLogin onStartQuiz={handleStartQuiz} /></PublicRoute>} />
        <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><ChildRegister /></PublicRoute>} />

        {/* Game hub */}
        <Route path="/game-select" element={<ProtectedRoute>{withNav(<GameSelect childname={resolved.name} />)}</ProtectedRoute>} />

        {/* Games — no navbar */}
        <Route path="/quiz" element={<ProtectedRoute><Quiz childname={resolved.name} sessionId={resolved.session} onQuizEnd={(s) => postScores([{ gameType: 'Quiz Game', score: s }])} /></ProtectedRoute>} />
        <Route path="/animal-game" element={<ProtectedRoute><AnimalGame childname={resolved.name} sessionId={resolved.session} onanimal={(s) => postScores([{ gameType: 'Animal Game', score: s }])} /></ProtectedRoute>} />
        <Route path="/memory-game" element={<ProtectedRoute><MemoryGame childname={resolved.name} sessionId={resolved.session} onFinish={(s) => postScores([{ gameType: 'Memory Game', score: s }])} /></ProtectedRoute>} />

        {/* Reports */}
        <Route path="/report" element={<ProtectedRoute>{withNav(<Report />)}</ProtectedRoute>} />
        <Route path="/child-report" element={<ProtectedRoute>{withNav(<ChildReport />)}</ProtectedRoute>} />
        <Route path="/super-admin" element={<ProtectedRoute>{withNav(<SuperAdmin />)}</ProtectedRoute>} />
        <Route path="/Faqs" element={<Faqs />} />

        {/* Legacy redirects */}
        <Route path="/child-login" element={<Navigate to="/login" replace />} />
        <Route path="/child-register" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
