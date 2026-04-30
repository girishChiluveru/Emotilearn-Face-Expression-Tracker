/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import '../styles/AnimalGame.css';
import EmotionTracker from './EmotionTracker';
import { useEmotionBackground } from '../hooks/useEmotionBackground';
import { useNavigate } from 'react-router-dom';

const GAME_ID = 'animal';

const animals = [
  { name: 'lion',  image: '🦁' },
  { name: 'tiger', image: '🐯' },
  { name: 'bear',  image: '🐻' },
  { name: 'zebra', image: '🦓' },
];

const getRandomAnimal = () => animals[Math.floor(Math.random() * animals.length)];

function AnimalGame({ onanimal, childname, sessionId }) {
  const navigate = useNavigate();
  const { bgStyle, setEmotion } = useEmotionBackground();

  const [currentAnimal, setCurrentAnimal]           = useState(getRandomAnimal());
  const [letters, setLetters]                       = useState([]);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [position, setPosition]                     = useState({ x: 150, y: 150 });
  const [score, setScore]                           = useState(0);
  const [gameOver, setGameOver]                     = useState(false);
  const [speed]                                     = useState(7);
  const [round, setRound]                           = useState(1);

  const verticalLanes = [50, 150, 250, 350];

  useEffect(() => {
    if (gameOver) return;
    const letterInterval = setInterval(() => {
      const randomLetter = currentAnimal.name[Math.floor(Math.random() * currentAnimal.name.length)];
      const randomLane   = verticalLanes[Math.floor(Math.random() * verticalLanes.length)];
      setLetters((prev) => [...prev, { letter: randomLetter, x: 400, y: randomLane }]);
    }, 1000);

    const gameInterval = setInterval(() => {
      setLetters((prev) => prev.map((l) => ({ ...l, x: l.x - speed })));
    }, 100);

    return () => { clearInterval(letterInterval); clearInterval(gameInterval); };
  }, [currentAnimal, speed, gameOver]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowUp') {
        setPosition((prev) => ({
          ...prev,
          y: verticalLanes[Math.max(verticalLanes.indexOf(prev.y) - 1, 0)],
        }));
      } else if (e.key === 'ArrowDown') {
        setPosition((prev) => ({
          ...prev,
          y: verticalLanes[Math.min(verticalLanes.indexOf(prev.y) + 1, verticalLanes.length - 1)],
        }));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    letters.forEach((letter) => {
      if (letter.x < position.x + 50 && letter.x > position.x && letter.y === position.y) {
        const expected = currentAnimal.name[currentLetterIndex];
        if (letter.letter === expected) {
          setLetters((prev) => prev.filter((l) => l !== letter));
          const pts = currentAnimal.name.length === 4 ? (currentLetterIndex < 2 ? 2 : 3) : 2;
          setScore((s) => s + pts);
          const nextIndex = currentLetterIndex + 1;
          setCurrentLetterIndex(nextIndex);
          if (nextIndex === currentAnimal.name.length) {
            onanimal(score + pts);
            setGameOver(true);
          }
        } else {
          onanimal(score);
          navigate('/memory-game');
        }
      }
    });
  }, [letters, position, currentLetterIndex]);

  return (
    <div className="game-container" style={bgStyle}>
      <EmotionTracker
        childname={childname}
        sessionId={sessionId}
        gameId={GAME_ID}
        qid={`round-${round}`}
        onEmotion={(emotion) => setEmotion(emotion)}
      />

      <h1>Animal Letter Game</h1>
      <p>Score: {score}</p>
      <h2>
        {currentAnimal.name.split('').map((letter, index) => (
          <span key={index} style={{ color: index < currentLetterIndex ? 'green' : 'black' }}>
            {letter.toUpperCase()}
          </span>
        ))}
      </h2>

      {gameOver ? (
        <button onClick={() => navigate('/memory-game')}>Next Game</button>
      ) : (
        <div className="game-area">
          <div className="animal" style={{ left: position.x, top: position.y }}>
            {currentAnimal.image}
          </div>
          {letters.map((letter, index) => (
            <div key={index} className="letter" style={{ left: letter.x, top: letter.y }}>
              {letter.letter}
            </div>
          ))}
          <p className="instructions">Catch letters in order! Use arrow keys to move.</p>
        </div>
      )}
    </div>
  );
}

export default AnimalGame;