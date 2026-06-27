/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Question from './Question';
import { questions } from '../data/questions';
import EmotionTracker from './EmotionTracker';
import { UserContext } from '../../context/userContext';
import { Timer, ChevronRight, Camera, Trophy } from 'lucide-react';
import '../styles/Quiz.css';

const LABELS = {
  happy: '😄 Happy!', sad: '😢 Sad', angry: '😠 Angry',
  fear: '😨 Scared', neutral: '😐 Focused', disgust: '🤢 Hmm',
};

const Quiz = ({ onQuizEnd, childname, sessionId }) => {
  const navigate = useNavigate();
  const { currentEmotion } = useContext(UserContext);

  const [started, setStarted] = useState(false);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [sel, setSel] = useState(null);
  const [time, setTime] = useState(15);
  const [qs, setQs] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null

  useEffect(() => {
    setQs(questions.level1.sort(() => 0.5 - Math.random()).slice(0, 5));
  }, []);

  useEffect(() => {
    if (!started || answered) return;
    if (time === 0) { advance(); return; }
    const t = setInterval(() => setTime(p => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [time, started, answered]);

  const handleAnswer = (ans) => {
    if (answered) return;
    setSel(ans);
    setAnswered(true);
    const ok = ans === qs[qi]?.answer;
    if (ok) setScore(s => s + 2);
    setResult(ok ? 'correct' : 'wrong');
  };

  const advance = () => {
    setSel(null); setAnswered(false); setResult(null); setTime(15);
    const next = qi + 1;
    if (next >= qs.length) { onQuizEnd(score); navigate('/game-select'); return; }
    setQi(next);
  };

  const tc = time <= 5 ? '#FF4757' : time <= 10 ? '#FFD166' : '#06D6A0';

  if (!started) {
    return (
      <div className="quiz-page">
        <div className="quiz-page__permission-card">
          <div className="quiz-page__cam-icon"><Camera size={32} color="white" /></div>
          <h2 className="quiz-page__cam-title">Quiz Challenge 🧩</h2>
          <p className="quiz-page__cam-desc">We'll use your camera to track emotions while you play. Ready?</p>
          <button id="start-quiz-btn" onClick={() => setStarted(true)} className="quiz-page__cam-btn">
            <Camera size={18} style={{ marginRight: 8 }} /> Allow Camera & Start! 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <EmotionTracker childname={childname} sessionId={sessionId} gameId="quiz" qid={`q${qi + 1}`} />

      <div className="quiz-page__content">
        {/* Status bar */}
        <div className="quiz-page__status-bar">
          <div className="quiz-page__question-num">
            <span className="quiz-page__num-badge">{qi + 1}</span>
            <span className="quiz-page__num-of">of {qs.length}</span>
          </div>
          <div className="quiz-page__score"><Trophy size={14} /> {score} pts</div>
          <div className="quiz-page__emotion-badge">{LABELS[currentEmotion] || '😐 Focused'}</div>
        </div>

        {/* Fixed-size card */}
        <div className="quiz-page__card">
          {/* Timer track */}
          <div className="quiz-page__timer-track">
            <div className="quiz-page__timer-fill" style={{ width: `${(time / 15) * 100}%`, background: tc }} />
          </div>

          <div className="quiz-page__card-body">
            <div className="quiz-page__timer-display">
              <div className="quiz-page__timer-value" style={{ background: `${tc}22`, color: tc }}>
                <Timer size={16} /> {time}s
              </div>
            </div>

            {qs[qi] && <Question question={qs[qi]} onAnswerSelect={handleAnswer} selectedAnswer={sel} answered={answered} />}

            {/* Result overlay — positioned absolute so card doesn't resize */}
            <div className="quiz-page__result-area">
              {result && (
                <div className={`quiz-page__result quiz-page__result--${result}`}>
                  {result === 'correct' ? '✅ Correct! +2 points' : '❌ Not quite!'}
                </div>
              )}
            </div>

            <button id="quiz-next-btn" onClick={advance} disabled={!answered} className="quiz-page__next-btn">
              {qi + 1 === qs.length ? '🏆 Finish Quiz' : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="quiz-page__dots">
          {qs.map((_, i) => (
            <div key={i} className="quiz-page__dot"
              style={{ background: i < qi ? '#06D6A0' : i === qi ? '#FF6B35' : '#e0e0e0' }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
