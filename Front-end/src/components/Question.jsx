/* eslint-disable react/prop-types */
import { useState } from 'react';
import "../styles/Question.css";

const Question = ({ question, onAnswerSelect }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    onAnswerSelect(option);
  };

  return (
    <div className="question">
      <h3>{question.question}</h3>
      {question.image && <img src={question.image} alt="question related" className="question-image" />}
      <div className="options">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            className={`option-button ${selectedOption === option ? 'selected' : ''}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Question;
