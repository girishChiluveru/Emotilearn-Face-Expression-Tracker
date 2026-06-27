/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import '../styles/AnimalGame.css';
import EmotionTracker from './EmotionTracker';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { Heart, ShieldAlert, Award } from 'lucide-react';

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

  const [currentAnimal, setCurrentAnimal]           = useState(getRandomAnimal());
  const [letters, setLetters]                       = useState([]);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [position, setPosition]                     = useState({ x: 150, y: 150 });
  const [score, setScore]                           = useState(0);
  const [lives, setLives]                           = useState(5);
  const [gameOver, setGameOver]                     = useState(false);
  const [paused, setPaused]                         = useState(false);
  const [showWrongModal, setShowWrongModal]         = useState(false);
  const [wrongLetter, setWrongLetter]               = useState('');
  const [speed]                                     = useState(7);
  const [round, setRound]                           = useState(1);

  const verticalLanes = [50, 150, 250, 350];

  // Spawn and move letters
  useEffect(() => {
    if (gameOver || paused) return;

    const letterInterval = setInterval(() => {
      // Spawn either the expected letter or a random letter to keep it interesting
      const isExpected = Math.random() > 0.4;
      const expectedLetter = currentAnimal.name[currentLetterIndex];
      const randomLetter = currentAnimal.name[Math.floor(Math.random() * currentAnimal.name.length)];
      const spawnedLetter = isExpected ? expectedLetter : randomLetter;
      
      const randomLane = verticalLanes[Math.floor(Math.random() * verticalLanes.length)];
      setLetters((prev) => [...prev, { letter: spawnedLetter, x: 400, y: randomLane }]);
    }, 1000);

    const gameInterval = setInterval(() => {
      setLetters((prev) => prev.map((l) => ({ ...l, x: l.x - speed })).filter((l) => l.x > -20));
    }, 100);

    return () => {
      clearInterval(letterInterval);
      clearInterval(gameInterval);
    };
  }, [currentAnimal, speed, gameOver, paused, currentLetterIndex]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKey = (e) => {
      if (gameOver || paused) return;
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
  }, [gameOver, paused]);

  // Handle collisions
  useEffect(() => {
    if (gameOver || paused) return;

    letters.forEach((letter) => {
      // Check collision box
      if (letter.x < position.x + 55 && letter.x > position.x - 10 && letter.y === position.y) {
        const expected = currentAnimal.name[currentLetterIndex];
        if (letter.letter === expected) {
          // Correct letter caught!
          setLetters((prev) => prev.filter((l) => l !== letter));
          const pts = currentAnimal.name.length === 4 ? (currentLetterIndex < 2 ? 2 : 3) : 2;
          const newScore = score + pts;
          setScore(newScore);
          
          const nextIndex = currentLetterIndex + 1;
          setCurrentLetterIndex(nextIndex);
          
          if (nextIndex === currentAnimal.name.length) {
            onanimal(newScore);
            setGameOver(true);
          }
        } else {
          // Wrong letter caught!
          setLetters((prev) => prev.filter((l) => l !== letter));
          const newLives = lives - 1;
          setLives(newLives);
          setWrongLetter(letter.letter);
          setPaused(true);
          
          if (newLives <= 0) {
            onanimal(score);
            setGameOver(true);
          } else {
            setShowWrongModal(true);
            // Reset position to center lane on error to help them regroup
            setPosition({ x: 150, y: 150 });
          }
        }
      }
    });
  }, [letters, position, currentLetterIndex, score, lives, gameOver, paused]);

  const resumeGame = () => {
    setShowWrongModal(false);
    setPaused(false);
  };

  const renderHearts = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Heart
        key={i}
        size={22}
        fill={i < lives ? '#FF4757' : 'none'}
        stroke={i < lives ? '#FF4757' : '#ccc'}
        className="me-1 animate-pulse-gentle"
      />
    ));
  };

  return (
    <div className="animal-game-container py-4 flex flex-col items-center">
      <EmotionTracker
        childname={childname}
        sessionId={sessionId}
        gameId={GAME_ID}
        qid={`round-${round}`}
      />

      <div className="animal-game__card shadow-lg p-4 rounded-4 bg-white text-center w-100" style={{ maxWidth: '500px' }}>
        <h1 className="animal-game__title font-fredoka mb-2">Animal Letter Game 🦁</h1>
        
        {/* HUD Info */}
        <div className="d-flex justify-content-between align-items-center mb-3 px-2">
          <div className="d-flex align-items-center">
            <span className="fw-bold text-secondary me-2">LIVES:</span>
            <div className="d-flex">{renderHearts()}</div>
          </div>
          <div className="bg-light px-3 py-1 rounded-3 font-bold text-primary">
            🏆 {score} pts
          </div>
        </div>

        {/* Word Display */}
        <div className="mb-4">
          <h2 className="display-6 font-fredoka tracking-wider">
            {currentAnimal.name.split('').map((letter, index) => (
              <span 
                key={index} 
                className="px-1" 
                style={{ 
                  color: index < currentLetterIndex ? '#06D6A0' : '#C9CBCF',
                  textDecoration: index === currentLetterIndex ? 'underline' : 'none'
                }}
              >
                {letter.toUpperCase()}
              </span>
            ))}
          </h2>
          <div className="badge bg-warning text-dark px-3 py-2 mt-2 fs-6">
            🎯 Catch letter: <strong className="fs-5">{currentAnimal.name[currentLetterIndex]?.toUpperCase()}</strong>
          </div>
        </div>

        {gameOver ? (
          <div className="game-over-box p-4 rounded-3 border bg-light">
            <div className="fs-1 mb-2">{lives > 0 ? '🏆' : '💪'}</div>
            <h3 className="font-fredoka mb-2">{lives > 0 ? 'Splendid Job!' : 'Nice Attempt!'}</h3>
            <p className="text-muted">
              {lives > 0 
                ? `You spelled ${currentAnimal.name.toUpperCase()} perfectly!` 
                : `You almost had it! Spelled up to: ${currentAnimal.name.substring(0, currentLetterIndex).toUpperCase()}`}
            </p>
            <p className="fs-4 font-bold text-success mt-2">Score: {score} pts</p>
            <Button variant="success" size="lg" className="w-100 mt-3 py-2.5 rounded-3 fw-bold" onClick={() => navigate('/game-select')}>
              Back to Games 🏠
            </Button>
          </div>
        ) : (
          <div className="game-area">
            {/* Horizontal Lane Lines */}
            {verticalLanes.map((lane) => (
              <div 
                key={lane} 
                className="lane-line" 
                style={{ top: lane + 25 }} 
              />
            ))}

            {/* Animal Sprite */}
            <div className="animal" style={{ left: position.x, top: position.y }}>
              {currentAnimal.image}
            </div>

            {/* Sliding Letters */}
            {letters.map((letter, index) => (
              <div 
                key={index} 
                className="letter" 
                style={{ left: letter.x, top: letter.y }}
              >
                {letter.letter.toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {!gameOver && (
          <p className="instructions mt-3 text-muted">
            Keyboard: Use <strong>Arrow Up</strong> & <strong>Arrow Down</strong> to change lanes!
          </p>
        )}
      </div>

      {/* Wrong Letter Modal */}
      <Modal show={showWrongModal} onHide={resumeGame} centered backdrop="static">
        <Modal.Header className="bg-danger-subtle">
          <Modal.Title className="text-danger d-flex align-items-center gap-2">
            <ShieldAlert /> Wrong Letter caught!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <p className="fs-5">
            You caught the letter <strong className="text-danger fs-4">{wrongLetter.toUpperCase()}</strong>.
          </p>
          <p className="text-muted">
            We need <strong className="text-success fs-5">{currentAnimal.name[currentLetterIndex]?.toUpperCase()}</strong> next to spell <strong>{currentAnimal.name.toUpperCase()}</strong>!
          </p>
          <div className="mt-3 bg-light p-3 rounded-3 font-bold text-danger">
            Chances remaining: {lives} of 5
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" size="lg" className="w-100 fw-bold" onClick={resumeGame}>
            Keep Trying! 💪
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AnimalGame;