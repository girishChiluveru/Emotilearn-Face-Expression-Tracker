# Emotion-Aware Learning Support System for Dyslexic Children

## Introduction

**Emotion-Aware Learning Support System for Dyslexic Children** is a web-based application designed to enhance the educational experience for dyslexic children. By leveraging advanced facial emotion recognition technologies, the system tracks emotional states such as frustration, confusion, or engagement in real-time, offering valuable feedback to teachers and parents. This enables adaptive learning tailored to each child's emotional journey.

## Features

- **Real-Time Facial Emotion Detection**  
  Utilizes DeepFace for instant facial emotion recognition via webcam.

- **Emotion Classification**  
  Employs Hugging Face Vision Transformer (ViT) for robust emotion classification.

- **Dashboard Visualizations**  
  Interactive dashboard displays detected emotions and analytical insights.

- **Data Logging & Progress Reports**  
  Records emotional data over time for progress tracking and reporting.

- **Adaptive Learning Suggestions**  
  Recommends personalized learning strategies based on the child’s emotional state.

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Frontend   | React, Vite                                       |
| Backend    | Node.js, Express                                  |
| AI Models  | DeepFace, Hugging Face ViT                        |
| Database   | MongoDB                                           |
                         

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/girishChiluveru/Emotilearn-Face-Expression-Tracker.git
   cd Emotilearn-Face-Expression-Tracker
   ```

2. **Install dependencies**
   - Frontend & Backend:
     ```bash
     npm install
     ```
   - AI Model (Python):
     ```bash
     pip install -r requirements.txt
     ```

3. **Configure environment variables**
   - Set API keys, database connection strings, and other secrets in a `.env` file.

4. **Run the application**
   - Start backend server:
     ```bash
     npm run server
     ```
   - Start frontend client:
     ```bash
     npm run dev
     ```

## Usage

- Activate the webcam from the dashboard.
- The application detects and analyzes the child’s facial emotions in real-time.
- View the dashboard for insights and visualizations on emotional states.
- Teachers and parents receive adaptive feedback and recommendations.

## Future Scope

- **Voice-Based Emotion Analysis**
- **Multilingual Learning Insights**
- **Integration with Adaptive E-Learning Platforms**

## License

This project is licensed under the [MIT License](LICENSE).
