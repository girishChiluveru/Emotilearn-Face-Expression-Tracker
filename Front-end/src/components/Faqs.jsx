import React, { useState } from "react";
import "../styles/Faqs.css"; // For custom styling

const faqs = [
  {
    question: "What is dyslexia?",
    answer: "Dyslexia is a specific learning disability that is neurobiological in origin. It is characterized by difficulties with accurate and/or fluent word recognition and by poor spelling and decoding abilities."
  },
  {
    question: "How can I support a child with dyslexia?",
    answer: "Support a child with dyslexia by providing them with a structured and supportive learning environment, using multisensory teaching methods, and being patient and understanding."
  },
  {
    question: "Can dyslexia be cured?",
    answer: "Dyslexia is a lifelong condition. However, with the right support and intervention, individuals with dyslexia can learn to read and write effectively."
  },
  {
    question: "What are the early signs of dyslexia in children?",
    answer: "Early signs of dyslexia in children may include difficulty learning the alphabet, trouble rhyming, difficulty recognizing words that begin with the same sound, and struggling with basic reading and writing tasks."
  },
  {
    question: "Are there any assistive technologies for dyslexia?",
    answer: "Yes, there are several assistive technologies for dyslexia, such as text-to-speech software, audiobooks, and dyslexia-friendly fonts to support reading and writing tasks."
  },
  {
    question: "What are some common myths about dyslexia?",
    answer: "Some common myths about dyslexia include that it is caused by laziness or lack of intelligence. In reality, dyslexia is not related to a person's intelligence but to the way their brain processes language."
  },
  {
    question: "How can I help my child with reading difficulties caused by dyslexia?",
    answer: "To help a child with reading difficulties caused by dyslexia, you can use structured literacy programs, engage in regular reading practice, and incorporate fun, interactive activities like games to reinforce learning."
  },
  {
    question: "How does dyslexia affect learning?",
    answer: "Dyslexia can make it challenging for individuals to decode written words, recognize letters and sounds, and spell correctly, affecting their overall reading and writing abilities. However, with the right support, these challenges can be overcome."
  },
  {
    question: "Can dyslexia affect other skills besides reading?",
    answer: "Yes, dyslexia can affect other skills such as writing, spelling, and sometimes even math, as it can make it difficult to understand patterns or sequences, but it does not affect a person's overall intelligence."
  },
  {
    question: "How can teachers support students with dyslexia?",
    answer: "Teachers can support students with dyslexia by using multisensory teaching methods, providing extra time on tasks, offering audio books, and using technology tools that can assist with reading and writing."
  }
];

const Faqs = () => {
  const [openIndex, setOpenIndex] = useState(null); // State to track which question is open

  const handleToggle = (index) => {
    if (openIndex === index) {
      setOpenIndex(null); // Close the currently open answer if the same question is clicked
    } else {
      setOpenIndex(index); // Open the clicked question's answer
    }
  };

  return (
    <div className="faqs-container">
      <h1>Frequently Asked Questions</h1>
      <div className="faqs-list">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <h2
              className="faq-question"
              onClick={() => handleToggle(index)} // Toggle visibility of the answer
            >
              {faq.question}
            </h2>
            {openIndex === index && (
              <p className="faq-answer">{faq.answer}</p> // Show the answer only if the question is open
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Faqs;
