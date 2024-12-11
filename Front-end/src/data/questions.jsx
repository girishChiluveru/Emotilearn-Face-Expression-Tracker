import skyImage from '../assets/quiz_images/sky.jpg';
import dogImage from '../assets/quiz_images/dog.jpg';
import bananaImage from '../assets/quiz_images/banana.jpg';
import appleImage from '../assets/quiz_images/apple.jpg';
import yellowImage from '../assets/quiz_images/yellow.jpg';

export const questions = {
    level1: [
      { question: "What color is the sky?", options: ["Blue", "White", "Grey", "Pink"], answer: "blue", image: skyImage },
      { question: "Which animal is this?", options: ["Cat", "Dog", "Rabbit", "Horse"], answer: "Dog", image: dogImage },
      { question: "What fruit is this?", options: ["Apple", "Banana", "Orange", "Grapes"], answer: "Banana", image: bananaImage},
      { question: "What is the color of a ripe apple?", options: ["Green", "Red", "Purple", "Violet"], answer: "Red", image: appleImage },
      
      { question: "Identify this color", options: ["Crimson", "Black", "Yellow", "Orange"], answer: "Yellow", image: yellowImage }
      // Add more questions as needed for level 1
    ],
    
  };
  
  