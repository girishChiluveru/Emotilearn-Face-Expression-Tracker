/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './Navbar'; // Navbar component
import Quiz from './Quiz'; // Quiz game
import AnimalGame from './AnimalGame'; // Animal game
import MemoryGame from './MemoryGame'; // Memory game
import Report from './Report'; // Admin report
import ChildReport from './ChildReport'; // Child report
import ChildLogin from './ChildLogin'; // Child login
import AdminLogin from './AdminLogin'; // Admin login
import LandingPage from './LandingPage'; // Landing page
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/App.css';
import ChildRegister from './Register';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';


axios.defaults.baseURL = 'http://localhost:3000';
axios.defaults.withCredentials = true;



function App() {
  // States for managing application data
  const [gameStage, setGameStage] = useState('start'); // Game stage
  const [isAdmin, setIsAdmin] = useState(false); // Admin login status
  const [childName, setChildName] = useState(''); // Child's name
  const [sessionId, setSessionId] = useState(''); // Current session ID
  const [allSessions, setAllSessions] = useState([]); // All session data

  // Handlers for login and game transitions
  const handleAdminLogin = () => setIsAdmin(true);

  const handleStartQuiz = (name, sid) => {
    setChildName(name);
    setSessionId(sid);
    setGameStage('quiz');
  };

  const handleAddSession = (sessionData) =>
    setAllSessions((prev) => [...prev, sessionData]);

  // Function to post scores to the server
  const postScores = async (scores) => {
    try {
      const response = await fetch('http://localhost:3000/store-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName,
          sessionId,
          scores, // Scores should be an array of objects with gameType and score
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Scores stored successfully:', data);
    } catch (error) {
      console.error('Failed to store scores:', error);
    }
  };

  // Render functions for each game
  const renderQuiz = () => (
    <Quiz
      onQuizEnd={(score, expressionTally) => {
        handleAddSession({ childName, sessionId, quizScore: score, expressionTally });
        postScores([{ gameType: 'Quiz Game', score }]);
        setGameStage('AnimalGame');
      }}
      childName={childName}
      sessionId={sessionId}
    />
  );

  const renderAnimalGame = () => (
    <AnimalGame
      onanimal={(score) => {
        setAllSessions((prev) =>
          prev.map((session) =>
            session.sessionId === sessionId ? { ...session, animalGameScore: score } : session
          )
        );
        postScores([{ gameType: 'Animal Game', score }]);
        setGameStage('memoryGame');
      }}
      childName={childName}
      sessionId={sessionId}
    />
  );

  const renderMemoryGame = () => (
    <MemoryGame
      onFinish={(score) => {
        setAllSessions((prev) =>
          prev.map((session) =>
            session.sessionId === sessionId ? { ...session, memoryGameScore: score } : session
          )
        );
        postScores([{ gameType: 'Memory Game', score }]);
        setGameStage('start');
      }}
      childName={childName}
      sessionId={sessionId}
    />
  );

  return (
    <Router>
      <div className="app">
        {/* Conditionally render Navbar */}
        {gameStage === 'start' && <Navbar />} {/* Navbar is visible only when gameStage is 'start' */}
        <Toaster position="center" toastOptions={{ duration: 3000 }} />
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/child-login" element={<ChildLogin onStartQuiz={handleStartQuiz} />} />
          <Route path="/admin-login" element={<AdminLogin onAdminLogin={handleAdminLogin} />} />
          <Route path="/child-report" element={<ChildReport />} />
          <Route path="/quiz" element={renderQuiz()} />
          <Route path="/animal-game" element={renderAnimalGame()} />
          <Route path="/memory-game" element={renderMemoryGame()} />
          <Route path="/report" element={<Report allSessions={allSessions} />} />
          <Route path="/child-register" element={<ChildRegister onStartQuiz={handleStartQuiz} />} />
        </Routes>
      </div>
    </Router>
  );
  
}

export default App;
