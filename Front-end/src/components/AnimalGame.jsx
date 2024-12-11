/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import '../styles/AnimalGame.css';
import Capturing from './Capturing';
import { useNavigate } from 'react-router-dom';

const gameId = "2";
const animals = [
  { name: 'lion', image: '🦁' },
  { name: 'tiger', image: '🐯' },
  { name: 'bear', image: '🐻' },
  { name: 'zebra', image: '🦓' },
];

const getRandomAnimal = () => animals[Math.floor(Math.random() * animals.length)];

function AnimalGame({ onanimal, childName, sessionId }) {
  const navigate = useNavigate();
  const [currentAnimal, setCurrentAnimal] = useState(getRandomAnimal());
  const [letters, setLetters] = useState([]);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(7);

  const verticalLanes = [50, 150, 250, 350];
  const horizontalLanes = [50, 150, 250];

  useEffect(() => {
    if (gameOver) return;

    const letterInterval = setInterval(() => {
      const randomLetter = currentAnimal.name[Math.floor(Math.random() * currentAnimal.name.length)];
      const randomLane = verticalLanes[Math.floor(Math.random() * verticalLanes.length)];
      setLetters((prevLetters) => [
        ...prevLetters,
        { letter: randomLetter, x: 400, y: randomLane },
      ]);
    }, 1000);

    const gameInterval = setInterval(() => {
      setLetters((prevLetters) =>
        prevLetters.map((letter) => ({ ...letter, x: letter.x - speed }))
      );
    }, 100);

    return () => {
      clearInterval(letterInterval);
      clearInterval(gameInterval);
    };
  }, [currentAnimal, speed, gameOver]);

  useEffect(() => {
    const handleKeyPress = (e) => {
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

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    letters.forEach((letter) => {
      if (letter.x < position.x + 50 && letter.x > position.x && letter.y === position.y) {
        const expectedLetter = currentAnimal.name[currentLetterIndex];

        if (letter.letter === expectedLetter) {
          setLetters((prev) => prev.filter((l) => l !== letter));
          const points = calculateScore(currentAnimal.name, currentLetterIndex);
          setScore((prevScore) => prevScore + points);
          setCurrentLetterIndex((prevIndex) => prevIndex + 1);

          if (currentLetterIndex + 1 === currentAnimal.name.length) {
            sendScoreToBackend(); // This function is called only once, when the game ends
            setGameOver(true);
          }
        }
      }
    });
  }, [letters, position, currentLetterIndex]);

  const calculateScore = (word, index) => {
    if (word.length === 4) {
      return index < 2 ? 2 : 3;
    } else if (word.length === 5) {
      return 2;
    }
    return 1;
  };

  const sendScoreToBackend = () => {
    // Define your logic to send the score to the backend
    onanimal(score);
    console.log('Score sent to backend:', score);
  };

  return (
    <div className="game-container">
      <Capturing
        childName={childName}
        sessionId={sessionId}
        gameId={gameId}
        captureInterval={4000}
        screenshotInterval={4000}
        uploadUrl="http://localhost:3000/photos"
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
