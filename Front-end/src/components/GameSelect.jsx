/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, Star, ArrowRight, Trophy } from 'lucide-react';
import quizImg   from '../assets/quiz_game_card.png';
import animalImg from '../assets/animal_game_card.png';
import memoryImg from '../assets/memory_game_card.png';

const GAMES = [
  {
    id: 'quiz',
    title: 'Quiz Challenge',
    emoji: '🧩',
    desc: 'Answer fun picture questions! How many can you get right?',
    image: quizImg,
    route: '/quiz',
    duration: '~3 min',
    difficulty: '⭐⭐',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FFD166 100%)',
    glow: 'rgba(255,107,53,0.3)',
    badge: 'Most Popular',
    badgeColor: '#FF6B35',
  },
  {
    id: 'animal',
    title: 'Animal Letters',
    emoji: '🦁',
    desc: 'Catch falling letters to spell animal names — use arrow keys!',
    image: animalImg,
    route: '/animal-game',
    duration: '~2 min',
    difficulty: '⭐⭐⭐',
    gradient: 'linear-gradient(135deg, #06D6A0 0%, #4CC9F0 100%)',
    glow: 'rgba(6,214,160,0.3)',
    badge: 'Fast Paced',
    badgeColor: '#06D6A0',
  },
  {
    id: 'memory',
    title: 'Memory Match',
    emoji: '🎴',
    desc: 'Flip and match the coloured pairs — train your memory!',
    image: memoryImg,
    route: '/memory-game',
    duration: '~4 min',
    difficulty: '⭐⭐',
    gradient: 'linear-gradient(135deg, #845EF7 0%, #F72585 100%)',
    glow: 'rgba(132,94,247,0.3)',
    badge: 'Brain Trainer',
    badgeColor: '#845EF7',
  },
];

const FLOAT_ITEMS = ['🎮','⭐','🧠','🌟','❤️','🎯'];

const GameSelect = ({ childname }) => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen pt-24 pb-12 px-4 overflow-x-hidden"
      style={{ fontFamily: 'Nunito, sans-serif' }}
    >
      {/* Floating background emojis */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        {FLOAT_ITEMS.map((item, i) => (
          <span
            key={i}
            className="absolute text-4xl opacity-10"
            style={{
              left: `${8 + i * 15}%`,
              top: `${15 + (i % 2) * 40}%`,
              animation: `float ${3.5 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
            }}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-bold"
            style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)', color: '#FF6B35' }}>
            <Sparkles size={14} />
            Choose your adventure
          </div>
          <h1 className="font-fredoka text-5xl md:text-6xl text-gray-800 mb-3">
            {childname ? `Hi ${childname}! 👋` : 'Pick a Game!'}
          </h1>
          <p className="text-gray-500 text-lg">
            Pick a game to play. You can come back and try them all! 🎉
          </p>
        </div>

        {/* Game cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {GAMES.map((game, i) => (
            <GameCard key={game.id} game={game} delay={i * 0.1} onPlay={() => navigate(game.route)} />
          ))}
        </div>

        {/* Bottom tip */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-gray-500"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <Trophy size={16} style={{ color: '#FFD166' }} />
            Play all 3 games to complete today's session!
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Game card sub-component ──────────────────────────── */
const GameCard = ({ game, delay, onPlay }) => (
  <div
    className="rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-3 cursor-default group"
    style={{
      background: 'white',
      boxShadow: `0 8px 30px ${game.glow}`,
      animationDelay: `${delay}s`,
    }}
  >
    {/* Image area with gradient overlay */}
    <div className="relative h-48 overflow-hidden">
      <img
        src={game.image}
        alt={game.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 opacity-60"
        style={{ background: game.gradient }} />

      {/* Badge */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white"
        style={{ background: game.badgeColor }}>
        {game.badge}
      </div>

      {/* Big emoji in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-6xl drop-shadow-lg animate-bounce-gentle">{game.emoji}</span>
      </div>
    </div>

    {/* Card body */}
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-fredoka text-2xl text-gray-800">{game.title}</h3>
        <span className="text-sm">{game.difficulty}</span>
      </div>

      <p className="text-gray-500 text-sm leading-relaxed mb-4">{game.desc}</p>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {game.duration}
        </span>
        <span className="flex items-center gap-1">
          <Star size={12} style={{ color: '#FFD166' }} fill="#FFD166" /> Fun rating: 5/5
        </span>
      </div>

      {/* Play button */}
      <button
        onClick={onPlay}
        className="w-full py-3 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: game.gradient,
          boxShadow: `0 4px 16px ${game.glow}`,
        }}
      >
        Play Now
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

export default GameSelect;
