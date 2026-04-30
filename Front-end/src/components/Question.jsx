/* eslint-disable react/prop-types */
const LETTERS = ['A', 'B', 'C', 'D'];
const COLORS = [
  { bg: '#FFF3E0', accent: '#FF6B35' },
  { bg: '#EDE7F6', accent: '#845EF7' },
  { bg: '#E0F7FA', accent: '#06D6A0' },
  { bg: '#FCE4EC', accent: '#F72585' },
];

const Question = ({ question, onAnswerSelect, selectedAnswer, answered }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2d3436', textAlign: 'center', margin: '0 0 0.5rem', lineHeight: 1.3 }}>
      {question.question}
    </h3>

    {question.image && (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', flex: '0 0 auto' }}>
        <img src={question.image} alt="Question" style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'cover', borderRadius: 12 }} />
      </div>
    )}

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
      {question.options.map((opt, i) => {
        const c = COLORS[i];
        const active = selectedAnswer === opt;
        return (
          <button key={i} onClick={() => !answered && onAnswerSelect(opt)} disabled={answered}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem', borderRadius: 12,
              fontWeight: 700, fontSize: '0.88rem', textAlign: 'left',
              cursor: answered ? 'default' : 'pointer',
              background: active ? c.accent : c.bg,
              border: `2px solid ${active ? c.accent : 'transparent'}`,
              color: active ? '#fff' : c.accent,
              transition: 'all 0.15s',
            }}>
            <span style={{
              width: 24, height: 24, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
              background: active ? 'rgba(255,255,255,0.3)' : c.accent, color: '#fff',
            }}>{LETTERS[i]}</span>
            {opt}
          </button>
        );
      })}
    </div>
  </div>
);

export default Question;
