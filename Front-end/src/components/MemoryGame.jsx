/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */

import  { useState, useEffect } from 'react';
import '../styles/MemoryGame.css';
import Capturing from './Capturing';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti'; // Import the Confetti library
import { useWindowSize } from 'react-use'; // For dynamic confetti size

const gameId = "3";
const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A6', '#F3FF33', '#33FFF6', '#A6FF33', '#33A6FF'];

function MemoryGame({ onFinish, childName, sessionId }) {
  const navigate = useNavigate();
  const [grid, setGrid] = useState(Array(16).fill(null));
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [attemptsLeft, setAttemptsLeft] = useState(15);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [revealed, setRevealed] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false); // State for confetti
  const { width, height } = useWindowSize(); // Get window dimensions for confetti

  useEffect(() => {
    initializeGrid();

    // Reveal grid colors for 5 seconds
    const revealTimeout = setTimeout(() => {
      setRevealed(false);
    }, 5000);

    return () => clearTimeout(revealTimeout);
  }, []);

  function initializeGrid() {
    let tempGrid = Array(16).fill(null);
    let pairs = [...colors, ...colors];
    pairs = pairs.sort(() => Math.random() - 0.5);

    pairs.forEach((color, index) => {
      tempGrid[index] = color;
    });

    setGrid(tempGrid);
  }

  function handleBoxClick(index) {
    if (!gameWon && selectedBoxes.length < 2 && !selectedBoxes.includes(index) && !matchedPairs.includes(grid[index])) {
      const newSelected = [...selectedBoxes, index];
      setSelectedBoxes(newSelected);

      // Delay the match check to allow the color to be revealed
      if (newSelected.length === 2) {
        setTimeout(() => checkMatch(newSelected), 300);
      }
    }
  }

  function checkMatch(newSelected) {
    const [first, second] = newSelected;

    if (grid[first] === grid[second]) {
      setMatchedPairs([...matchedPairs, grid[first]]);
      setSelectedBoxes([]);
    } else {
      setTimeout(() => setSelectedBoxes([]), 1000);
    }

    const newAttemptsLeft = attemptsLeft - 1;
    setAttemptsLeft(newAttemptsLeft);

    if (matchedPairs.length + 1 === 8) {
      handleGameEnd(true, newAttemptsLeft);
    } else if (newAttemptsLeft === 0) {
      handleGameEnd(false, newAttemptsLeft);
    }
  }

  function handleGameEnd(success, movesRemaining) {
    setShowConfetti(true); // Start confetti animation
    setTimeout(() => {
      setShowConfetti(false); // Stop confetti after 10 seconds
      const finalScore = calculateScore(movesRemaining);
      if (success) {
        alert(`Congratulations! You've Have completed all the games!`);
      } else {
        alert(`Game Over!`);
      }

      if (onFinish) onFinish(finalScore);
      navigate('/'); // Navigate after the alert
    }, 10000); // Delay alert for 10 seconds
  }

  function calculateScore(movesRemaining) {
    if (movesRemaining >= 5) return 10;
    if (movesRemaining >= 4) return 8;
    if (movesRemaining >= 3) return 6;
    if (movesRemaining >= 1) return 4;
    return 2;
  }

  return (
    <div>
      <Capturing
        childName={childName}
        sessionId={sessionId}
        gameId={gameId}
        captureInterval={4000}
        screenshotInterval={4000}
        uploadUrl="http://localhost:3000/photos"
      />

      {showConfetti && <Confetti width={width} height={height} />} {/* Confetti displayed when triggered */}

      <h1>Memory Game</h1>
      <h2>Score: {calculateScore(attemptsLeft)}</h2>
      <h2>Attempts Left: {attemptsLeft}</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', width: '320px', margin: '0 auto' }}>
        {grid.map((color, index) => (
          <div
            key={index}
            className="box"
            style={{
              width: '70px',
              height: '70px',
              margin: '5px',
              backgroundColor:
                revealed || selectedBoxes.includes(index) || matchedPairs.includes(color)
                  ? color
                  : '#ccc',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
            onClick={() => handleBoxClick(index)}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default MemoryGame
