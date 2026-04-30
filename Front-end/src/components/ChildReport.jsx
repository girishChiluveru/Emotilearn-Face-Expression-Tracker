/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/childreport.css';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

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
  happy:   '#FFCE56',
  sad:     '#36A2EB',
  angry:   '#FF6384',
  fear:    '#9966FF',
  neutral: '#C9CBCF',
  disgust: '#4BC0C0',
};

const GAME_LABELS = { quiz: 'Quiz', animal: 'Animal Game', memory: 'Memory Game' };

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
    emotion: `${EMOJI_MAP[emotion] ?? ''} ${emotion}`,
    count,
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

  if (loading) return <p>Loading…</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;
  if (!session) return <p>No session data found.</p>;

  const events    = session.emotion_events ?? [];
  const scores    = session.scores ?? [];
  const games     = [...new Set(events.map((e) => e.gameId))];

  const freqData     = buildFrequencyData(events, activeGame);
  const timelineData = buildTimelineData(events, activeGame);

  return (
    <div id="root" className="container">
      <div className="info">
        <h1>Child Report</h1>
        <p><strong>Child:</strong> {childName}</p>
        <p><strong>Session:</strong> {sessionId}</p>
        <p><strong>Total emotion samples:</strong> {events.length}</p>
      </div>

      {/* ── Game filter tabs ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        <button
          className={`btn ${!activeGame ? 'success' : ''}`}
          onClick={() => setActiveGame(null)}
        >
          All Games
        </button>
        {games.map((g) => (
          <button
            key={g}
            className={`btn ${activeGame === g ? 'success' : ''}`}
            onClick={() => setActiveGame(g)}
          >
            {GAME_LABELS[g] ?? g}
          </button>
        ))}
      </div>

      {/* ── Game scores bar chart ──────────────────────────────────── */}
      <h2>Game Scores</h2>
      {scores.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={scores}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="gameType" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>No scores recorded.</p>
      )}

      {/* ── Emotion frequency bar chart ────────────────────────────── */}
      <h2>Emotion Frequency {activeGame ? `— ${GAME_LABELS[activeGame]}` : '(All Games)'}</h2>
      {events.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={freqData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="emotion" tickFormatter={(t) => t.split(' ')[1]} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>No emotion data for this selection.</p>
      )}

      {/* ── Emotion timeline line chart ────────────────────────────── */}
      <h2>Emotion Confidence Over Time</h2>
      {timelineData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="qid" label={{ value: 'Question/Round', position: 'insideBottom', offset: -4 }} />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip
              formatter={(val, name) => [`${val}%`, 'Confidence']}
              labelFormatter={(label) => `Round: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8884d8"
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name="Dominant emotion confidence"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p>No timeline data for this selection.</p>
      )}

      {/* ── Per-event detail table ─────────────────────────────────── */}
      <h2>Emotion Event Log</h2>
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="table" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Game</th>
              <th>Q/Round</th>
              <th>Dominant Emotion</th>
              <th>Confidence</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {events
              .filter((ev) => !activeGame || ev.gameId === activeGame)
              .map((ev, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{GAME_LABELS[ev.gameId] ?? ev.gameId}</td>
                  <td>{ev.qid}</td>
                  <td>
                    {EMOJI_MAP[ev.dominant_emotion?.toLowerCase()] ?? ''}{' '}
                    {ev.dominant_emotion}
                  </td>
                  <td>{(ev.dominant_score * 100).toFixed(1)}%</td>
                  <td>{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChildResult;
