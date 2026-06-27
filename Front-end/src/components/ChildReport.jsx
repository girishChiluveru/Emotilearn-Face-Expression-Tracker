/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/childreport.css';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { LayoutDashboard, Gamepad2, Heart, Award, ArrowLeft, Database } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EMOJI_MAP = {
  happy:   '😊',
  sad:     '😢',
  angry:   '😠',
  fear:    '😨',
  neutral: '😐',
  disgust: '🤢',
};

const EMOTION_COLORS = {
  happy:   '#FFCE56', // Yellow
  sad:     '#36A2EB', // Blue
  angry:   '#FF6384', // Red
  fear:    '#9966FF', // Purple
  neutral: '#A0AEC0', // Grey
  disgust: '#4BC0C0', // Teal
};

const GAME_LABELS = { quiz: 'Quiz', animal: 'Animal Game', memory: 'Memory Game' };

const GAME_COLORS = {
  'Quiz Game':   '#FF6B35', // orange
  'Animal Game': '#06D6A0', // teal/green
  'Memory Game': '#845EF7', // purple
};

/**
 * Build frequency chart data: { emotion, count } per game
 */
function buildFrequencyData(events, gameId) {
  const filtered = gameId ? events.filter((e) => e.gameId === gameId) : events;
  const counts = { happy: 0, sad: 0, angry: 0, fear: 0, neutral: 0, disgust: 0 };
  filtered.forEach((ev) => {
    const key = ev.dominant_emotion?.toLowerCase();
    if (key in counts) counts[key]++;
  });
  return Object.entries(counts).map(([emotion, count]) => ({
    emotion: `${EMOJI_MAP[emotion] ?? ''} ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`,
    rawEmotion: emotion,
    count,
    fill: EMOTION_COLORS[emotion],
  }));
}

/**
 * Build pie chart distribution data
 */
function buildPieData(events, gameId) {
  const filtered = gameId ? events.filter((e) => e.gameId === gameId) : events;
  const counts = { happy: 0, sad: 0, angry: 0, fear: 0, neutral: 0, disgust: 0 };
  filtered.forEach((ev) => {
    const key = ev.dominant_emotion?.toLowerCase();
    if (key in counts) counts[key]++;
  });
  return Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([emotion, count]) => ({
      name: `${EMOJI_MAP[emotion] ?? ''} ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`,
      value: count,
      fill: EMOTION_COLORS[emotion],
    }));
}

/**
 * Build time-series data: one point per event with dominant_score and timestamp
 */
function buildTimelineData(events, gameId) {
  const filtered = (gameId ? events.filter((e) => e.gameId === gameId) : events)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return filtered.map((ev, idx) => ({
    idx: idx + 1,
    qid: ev.qid,
    emotion: ev.dominant_emotion,
    score: Number((ev.dominant_score * 100).toFixed(1)),
  }));
}

const ChildResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { childName, sessionId } = location.state ?? {};

  const [session, setSession]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeGame, setActiveGame] = useState(null); // filter by game

  useEffect(() => {
    if (!childName || !sessionId) {
      setError('Missing child name or session ID.');
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/reports/${childName}/${sessionId}`,
          { withCredentials: true }
        );
        setSession(res.data);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to load session data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [childName, sessionId]);

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading session report...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger shadow border rounded-4 py-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h4>❌ Session Error</h4>
          <p>{error}</p>
          <button className="btn btn-outline-danger mt-3" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container py-5 text-center">
        <p className="fs-4 text-muted">No session data found.</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const events    = session.emotion_events ?? [];
  const scores    = session.scores ?? [];
  const games     = [...new Set(events.map((e) => e.gameId))];

  const freqData     = buildFrequencyData(events, activeGame);
  const pieData      = buildPieData(events, activeGame);
  const timelineData = buildTimelineData(events, activeGame);

  return (
    <div className="container py-4">
      {/* Back Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 border rounded-3" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Sessions
        </button>
        <h4 className="m-0 text-muted d-flex align-items-center gap-2">
          <LayoutDashboard size={20} /> Diagnostic Dashboard
        </h4>
      </div>

      {/* Metadata KPI Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white d-flex flex-row align-items-center">
            <div className="p-3 bg-primary-subtle text-primary rounded-3 me-3">
              <Gamepad2 size={24} />
            </div>
            <div>
              <small className="text-muted text-uppercase fw-bold">Child Name</small>
              <h5 className="m-0 text-dark fw-bold">{childName}</h5>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white d-flex flex-row align-items-center">
            <div className="p-3 bg-success-subtle text-success rounded-3 me-3">
              <Database size={24} />
            </div>
            <div>
              <small className="text-muted text-uppercase fw-bold">Session ID</small>
              <h5 className="m-0 text-dark fw-bold text-truncate" style={{ maxWidth: '180px' }}>{sessionId}</h5>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-4 p-3 bg-white d-flex flex-row align-items-center">
            <div className="p-3 bg-warning-subtle text-warning rounded-3 me-3">
              <Heart size={24} />
            </div>
            <div>
              <small className="text-muted text-uppercase fw-bold">Emotion Samples</small>
              <h5 className="m-0 text-dark fw-bold">{events.length} frames</h5>
            </div>
          </div>
        </div>
      </div>

      {/* Game Filter Pills */}
      <div className="card border-0 shadow-sm p-3 rounded-4 bg-white mb-4">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="fw-bold text-secondary me-2">Filter Analysis:</span>
          <button
            className={`btn rounded-pill px-4 ${!activeGame ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveGame(null)}
          >
            All Games Combined
          </button>
          {games.map((g) => (
            <button
              key={g}
              className={`btn rounded-pill px-4 ${activeGame === g ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveGame(g)}
            >
              {GAME_LABELS[g] ?? g}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Interactive Charts */}
      <div className="row g-4 mb-5">
        
        {/* Chart 1: Game Scores */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
            <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
              <Award size={18} className="text-warning" /> Game Performance Scores
            </h5>
            {scores.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="gameType" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} pts`, 'Score']} />
                  <Legend />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {scores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GAME_COLORS[entry.gameType] || '#8884d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5 text-muted">No game scores recorded.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Emotion Distribution Breakdown (Pie Chart) */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
            <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
              📊 Emotion Distribution Ratio
            </h5>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} samples`, name]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5 text-muted">No emotion distribution data.</div>
            )}
          </div>
        </div>

        {/* Chart 3: Emotion Frequency */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
            <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
              ⏱️ Emotion Occurrence Count
            </h5>
            {events.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={freqData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="emotion" tickFormatter={(t) => t.split(' ')[1]} />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} occurrences`, 'Count']} />
                  <Legend />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {freqData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5 text-muted">No emotion occurrences recorded.</div>
            )}
          </div>
        </div>

        {/* Chart 4: Emotion Confidence Over Time (Area Chart with Soft Gradient) */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
            <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
              📈 Classifier Confidence Timeline
            </h5>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="qid" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip
                    formatter={(val, name) => [`${val}%`, 'Confidence']}
                    labelFormatter={(label) => `Round: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#8884d8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    name="Dominant Emotion Confidence"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-5 text-muted">No confidence timeline data.</div>
            )}
          </div>
        </div>

      </div>

      {/* Emotion Event Log List */}
      <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
        <h5 className="fw-bold text-dark mb-4">📜 Detailed Emotion Event Log</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th className="px-3 py-3 border-0">#</th>
                <th className="py-3 border-0">Game Module</th>
                <th className="py-3 border-0">Question/Round</th>
                <th className="py-3 border-0">Dominant Emotion</th>
                <th className="py-3 border-0">Classification Confidence</th>
                <th className="py-3 border-0 text-end px-3">Logged Time</th>
              </tr>
            </thead>
            <tbody>
              {events
                .filter((ev) => !activeGame || ev.gameId === activeGame)
                .map((ev, idx) => {
                  const rawEmotion = ev.dominant_emotion?.toLowerCase();
                  const badgeBg = EMOTION_COLORS[rawEmotion] + '22'; // 22 is transparency
                  const badgeText = EMOTION_COLORS[rawEmotion];
                  return (
                    <tr key={idx} className="border-bottom border-light">
                      <td className="px-3 py-3 fw-bold text-muted">{idx + 1}</td>
                      <td className="py-3 fw-semibold">{GAME_LABELS[ev.gameId] ?? ev.gameId}</td>
                      <td className="py-3 text-secondary">{ev.qid}</td>
                      <td className="py-3">
                        <span 
                          className="px-3 py-1.5 rounded-pill font-bold text-sm"
                          style={{ backgroundColor: badgeBg, color: badgeText }}
                        >
                          {EMOJI_MAP[rawEmotion] ?? ''} {ev.dominant_emotion}
                        </span>
                      </td>
                      <td className="py-3 fw-bold text-dark">{(ev.dominant_score * 100).toFixed(1)}%</td>
                      <td className="py-3 text-muted text-end px-3">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChildResult;
