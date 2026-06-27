/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmotionTracker from './EmotionTracker';
import { Trophy, Star, RotateCcw } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const GAME_ID = 'memory';
const COLORS = ['#FF6B35','#845EF7','#06D6A0','#F72585','#FFD166','#4CC9F0','#FF6B6B','#06B6D4'];
const EMOJI_PAIRS = ['🍎','🦁','🌟','🎮','🌈','🎯','🧠','❤️'];

function MemoryGame({ onFinish, childname, sessionId }) {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  const [grid, setGrid]           = useState([]);
  const [selected, setSelected]   = useState([]);
  const [matched, setMatched]     = useState([]);
  const [attempts, setAttempts]   = useState(15);
  const [revealed, setRevealed]   = useState(true);
  const [gameWon, setGameWon]     = useState(false);
  const [gameLost, setGameLost]   = useState(false);
  const [confetti, setConfetti]   = useState(false);

  useEffect(() => {
    const pairs = [...COLORS, ...COLORS].sort(() => Math.random() - 0.5);
    setGrid(pairs);
    const t = setTimeout(() => setRevealed(false), 3500);
    return () => clearTimeout(t);
  }, []);

  const handleClick = (idx) => {
    if (gameWon || gameLost || selected.length >= 2 || selected.includes(idx) || matched.includes(grid[idx])) return;
    const next = [...selected, idx];
    setSelected(next);
    if (next.length === 2) setTimeout(() => check(next), 350);
  };

  const check = ([a, b]) => {
    const newAttempts = attempts - 1;
    setAttempts(newAttempts);
    if (grid[a] === grid[b]) {
      const newMatched = [...matched, grid[a]];
      setMatched(newMatched);
      setSelected([]);
      if (newMatched.length === 8) { setConfetti(true); setGameWon(true); onFinish(calcScore(newAttempts)); }
    } else {
      setTimeout(() => setSelected([]), 800);
      if (newAttempts === 0) { setGameLost(true); onFinish(2); }
    }
  };

  const calcScore = (rem) => rem >= 5 ? 10 : rem >= 4 ? 8 : rem >= 3 ? 6 : rem >= 1 ? 4 : 2;

  const EMOJI_MAP = {};
  COLORS.forEach((c, i) => { EMOJI_MAP[c] = EMOJI_PAIRS[i]; });

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center px-6"
      style={{ fontFamily: 'Nunito, sans-serif', overflow: 'hidden' }}>

      {confetti && <Confetti width={width} height={height} recycle={false} />}

      <EmotionTracker
        childname={childname}
        sessionId={sessionId}
        gameId={GAME_ID}
        qid={`pair-${matched.length}`}
      />

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-fredoka text-4xl text-gray-800">Memory Match 🎴</h1>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(255,215,0,0.15)', color: '#e6a800' }}>
              <Trophy size={14} /> {calcScore(attempts)} pts
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(255,71,87,0.1)', color: '#FF4757' }}>
              ❤️ {attempts} left
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(6,214,160,0.1)', color: '#06D6A0' }}>
              <Star size={14} fill="#06D6A0" /> {matched.length}/8
            </div>
          </div>
        </div>

        {/* Reveal countdown hint */}
        {revealed && (
          <div className="text-center mb-3 text-sm font-bold animate-bounce-gentle"
            style={{ color: '#845EF7' }}>
            👀 Memorize the colors!
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-4 gap-3 p-4 rounded-3xl shadow-2xl"
          style={{ background: 'white' }}>
          {grid.map((color, idx) => {
            const isFlipped = revealed || selected.includes(idx) || matched.includes(color);
            return (
              <div
                key={idx}
                onClick={() => handleClick(idx)}
                className="rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center text-2xl select-none"
                style={{
                  aspectRatio: '1',
                  width: '100%',
                  background: isFlipped ? color : 'linear-gradient(135deg, #e8ecff, #d8ddff)',
                  boxShadow: isFlipped ? `0 4px 14px ${color}55` : '0 2px 8px rgba(0,0,0,0.08)',
                  transform: matched.includes(color) ? 'scale(1.05)' : selected.includes(idx) ? 'scale(0.95)' : 'scale(1)',
                  border: matched.includes(color) ? '3px solid #06D6A0' : '2px solid transparent',
                }}
              >
                {isFlipped ? EMOJI_MAP[color] : '?'}
              </div>
            );
          })}
        </div>

        {/* End states */}
        {(gameWon || gameLost) && (
          <div className="mt-5 p-5 rounded-2xl text-center shadow-lg animate-slide-up"
            style={{
              background: gameWon ? 'linear-gradient(135deg, #06D6A0, #4CC9F0)' : 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              color: 'white',
            }}>
            <div className="text-4xl mb-2">{gameWon ? '🎉' : '💪'}</div>
            <p className="font-fredoka text-2xl">{gameWon ? 'You matched them all!' : 'Good try!'}</p>
            <p className="font-bold mt-1">Score: {calcScore(attempts)} pts</p>
            <button onClick={() => navigate('/game-select')}
              className="mt-4 px-8 py-3 rounded-2xl bg-white font-bold text-lg hover:-translate-y-1 transition-all"
              style={{ color: gameWon ? '#06D6A0' : '#FF6B6B' }}>
              Back to Games 🏠
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemoryGame;
