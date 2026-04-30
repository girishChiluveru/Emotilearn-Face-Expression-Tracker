import { useNavigate, Link } from 'react-router-dom';
import { useContext } from 'react';
import { Brain, Gamepad2, BarChart3, Sparkles, ArrowRight, Star } from 'lucide-react';
import { UserContext } from '../../context/userContext';
import Navbar from './Navbar';

const FEATURES = [
  { icon: <Gamepad2 size={28} className="text-white" />, title: 'Interactive Games', desc: 'Quiz, letter-catching, and memory games keep children engaged.', color: 'from-orange-400 to-yellow-400', emoji: '🎮' },
  { icon: <Brain size={28} className="text-white" />, title: 'Emotion Tracking', desc: 'AI watches facial expressions in real time to understand feelings.', color: 'from-purple-500 to-pink-500', emoji: '🧠' },
  { icon: <BarChart3 size={28} className="text-white" />, title: 'Therapist Reports', desc: 'Detailed emotion charts help therapists monitor each child.', color: 'from-teal-400 to-cyan-400', emoji: '📊' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { child } = useContext(UserContext);

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', overflow: 'hidden' }}>
      <Navbar />

      {/* Hero — full width, no gaps */}
      <section style={{
        minHeight: '100vh', width: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '5rem 2rem 4rem', position: 'relative',
      }}>
        <div style={{ maxWidth: 700, width: '100%', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.4rem 1rem', borderRadius: 999,
            background: 'rgba(255,107,53,0.2)', border: '1px solid rgba(255,107,53,0.4)',
            color: '#FFD166', fontSize: '0.85rem', fontWeight: 700, marginBottom: 24,
          }}>
            <Sparkles size={14} /> AI-Powered Learning for Children
          </div>

          <h1 style={{
            fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            lineHeight: 1.1, marginBottom: 20,
            background: 'linear-gradient(135deg, #FF6B35 0%, #FFD166 50%, #FF6B6B 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Learning That<br />Feels Fun! 🎉
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 520, margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            Emoti-Learn combines interactive games with real-time emotion AI — so therapists understand how children <em style={{ color: '#fff', fontWeight: 600 }}>feel</em> while they play.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate(child ? '/game-select' : '/login')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.9rem 2rem', borderRadius: 16, border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: '1.05rem', color: '#fff',
                background: 'linear-gradient(135deg, #FF6B35, #FFD166)',
                boxShadow: '0 8px 30px rgba(255,107,53,0.5)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>
              <Gamepad2 size={20} /> Start Playing! <ArrowRight size={16} />
            </button>
            <Link to="/Faqs" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '0.9rem 2rem', borderRadius: 16, cursor: 'pointer',
                fontWeight: 700, fontSize: '1.05rem', color: '#fff',
                background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)',
                transition: 'transform 0.2s',
              }}>Learn More</button>
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 40, alignItems: 'center' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#FFD166" color="#FFD166" />)}
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginLeft: 8 }}>Loved by 500+ children</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 2rem', background: '#fff', width: '100%' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '2.5rem', textAlign: 'center', color: '#2d3436', marginBottom: 8 }}>Why Emoti-Learn?</h2>
          <p style={{ textAlign: 'center', color: '#999', fontSize: '1rem', marginBottom: 48 }}>We make learning fun, measurable, and deeply human.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                borderRadius: 20, padding: '2rem', textAlign: 'center',
                background: '#fafbff', border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                transition: 'transform 0.3s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${f.color}`}>{f.icon}</div>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{f.emoji}</div>
                <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem', color: '#2d3436', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: '#777', lineHeight: 1.6, fontSize: '0.9rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section style={{ padding: '4rem 2rem', background: '#f8f9ff', width: '100%' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '2rem', color: '#2d3436', marginBottom: 16 }}>About Emoti-Learn</h2>
          <p style={{ color: '#666', fontSize: '1rem', lineHeight: 1.7 }}>
            We believe every child deserves to learn at their own pace. Our platform uses MediaPipe face tracking and a custom AI model to capture how children feel — question by question — during play.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2.5rem 2rem', textAlign: 'center', background: '#1a1a2e', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <Brain size={18} style={{ color: '#FF6B35' }} />
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.2rem', color: '#FFD166' }}>EmotiLearn</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>© 2026 Emoti-Learn. Made with ❤️ for children.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
