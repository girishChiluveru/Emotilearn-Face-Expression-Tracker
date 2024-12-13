/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */


import { useEffect, useState, useRef } from 'react';
import Question from './Question';
import { questions } from '../data/questions';
import '../styles/Quiz.css';
import cameraAccessImage from '../assets/camera-access.png';

import Capturing from './Capturing';
import { useNavigate } from 'react-router-dom';

const Quiz = ({ onQuizEnd, childName, sessionId }) => {
  const navigate = useNavigate();
  const [quizStarted, setQuizStarted] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [time, setTime] = useState(15);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    const level1Questions = questions.level1
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    setShuffledQuestions(level1Questions);
  }, []);

  useEffect(() => {
    if (quizStarted && time === 0) handleNextQuestion();
    if (!quizStarted) return;

    const timer = setInterval(() => {
      setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [time, quizStarted]);

  const handleStartQuiz = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play(); // Ensure the video starts playing
      }
      setQuizStarted(true);
    } catch (error) {
      console.error("Error accessing the camera:", error);
      alert("Unable to access camera. Please allow camera permissions.");
    }
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === shuffledQuestions[questionIndex].answer) {
      setScore(score + 2);
    }

    setSelectedAnswer(null);
    setQuestionIndex(questionIndex + 1);
    setTime(15);

    if (questionIndex + 1 === shuffledQuestions.length) {
      onQuizEnd(score);
      cameraStream?.getTracks().forEach((track) => track.stop());
      navigate('/animal-game');
    }
  };

  if (!quizStarted) {
    return (
      <div className="quiz">
        <h2>Giving Access to Camera</h2>
        <img src={cameraAccessImage} className="cameraaccess-image" alt="Camera Access" />
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{ width: "100%", maxWidth: "400px", marginBottom: "20px", borderRadius: "8px" }}
        ></video>
        <button className="next-button" onClick={handleStartQuiz}>
          Allow Camera and Start Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <Capturing
        childName={childName}
        sessionId={sessionId}
        gameId="1"
        captureInterval={4000}
        screenshotInterval={4000}
        uploadUrl="http://localhost:3000/photos"
      />
      <h2>
        Question {questionIndex + 1} / {shuffledQuestions.length}
      </h2>
      <p className="timer">Time: {time}s</p>
      {shuffledQuestions[questionIndex] && (
        <Question question={shuffledQuestions[questionIndex]} onAnswerSelect={setSelectedAnswer} />
      )}
      <button className="next-button" onClick={handleNextQuestion}>
        Next
      </button>
    </div>
  );
};

export default Quiz;
