/* eslint-disable react/no-unknown-property */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/childreport.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Color palette for charts
const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
];

// Emoji map for emotions
const EMOJI_MAP = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  surprise: "😲",
  fear: "😨",
  neutral: "😐",
  disgust: "🤢",
};

// Base URL for images
const BASE_URL = "http://localhost:3000/";

const ChildResult = () => {
  const location = useLocation();
  const { childName, sessionId } = location.state;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [filteredImages, setFilteredImages] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/reports/${childName}/${sessionId}`
        );
        // Normalize image paths by replacing "\\" with "/" and prefixing the base URL
        const normalizedImages = response.data.images.map((image) => ({
          ...image,
          imgpath: `${BASE_URL}${image.imgpath.replace(/\\/g, "/")}`,
          screenshotpath: `${BASE_URL}${image.screenshotpath.replace(/\\/g, "/")}`,
        }));
        setReport({ ...response.data, images: normalizedImages });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Failed to load report data.");
        setLoading(false);
      }
    };

    fetchReport();
  }, [childName, sessionId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  // Extract game scores
  const gameScores = report.scores.map((score) => ({
    gameType: score.gameType,
    score: score.score,
  }));

  // Calculate emotion percentages
  const emotionCounts = report.images.reduce((acc, image) => {
    const dominantEmotion = image.max_emotion_img?.emotion;
    if (dominantEmotion) {
      acc[dominantEmotion] = (acc[dominantEmotion] || 0) + 1;
    }
    return acc;
  }, {});

  const emotionPercentages = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion: `${EMOJI_MAP[emotion] || "😶"} ${emotion}`,
    percentage: ((count / report.images.length) * 100).toFixed(2),
    rawEmotion: emotion,
  }));

  const handleEmotionClick = (emotion) => {
    const filtered = report.images.filter(
      (image) => image.max_emotion_img?.emotion === emotion
    );
    setSelectedEmotion(emotion);
    setFilteredImages(filtered);
  };

  return (
    <div id="root" className="container">
      
      <div class="info">
      <h1>Child Report</h1>
      <p>
        <strong>Child Name:</strong> {childName}
      </p>
      <p>
        <strong>Session ID:</strong> {sessionId}
      </p>
      </div>

      {selectedEmotion && (
        <div className="sticky-emotion-bar">
          <p>
            Viewing analysis for emotion:{" "}
            <strong>
              {EMOJI_MAP[selectedEmotion]} {selectedEmotion}
            </strong>
          </p>
          <button className="clear-selection" onClick={() => setSelectedEmotion(null)}>
            Clear Selection
          </button>
        </div>
      )}

      {/* Game Scores */}
      <h2>Game Scores</h2>
      <BarChart width={600} height={300} data={gameScores}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="gameType" angle={-45} textAnchor="end" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="score" fill="#8884d8" />
      </BarChart>

      {/* Dominant Emotions */}
      <h2>Average Dominant Emotions</h2>
      <BarChart
        width={600}
        height={300}
        data={emotionPercentages}
        onClick={(e) =>
          handleEmotionClick(e?.activePayload?.[0]?.payload?.rawEmotion)
        }
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="emotion"
          tickFormatter={(tick) => tick.split(" ")[1]} // Remove emojis
          angle={-45}
          textAnchor="end"
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="percentage" fill="#82ca9d" />
      </BarChart>

      {/* Individual Analysis for Selected Emotion */}
      {selectedEmotion && (
        <div>
          <h3>
            Images with Dominant Emotion: {EMOJI_MAP[selectedEmotion]} {selectedEmotion}
          </h3>
          {filteredImages.map((image, index) => {
            const emotionData = Object.entries(image.emotions).map(([key, value]) => ({
              name: `${EMOJI_MAP[key] || ""} ${key}`,
              value: parseFloat(value.toFixed(2)), // Use percentages from the API
            }));

            return (
              <div className="emotion-analysis-card" key={index}>
                <img
                  src={image.imgpath}
                  alt={`Analysis for ${image.imgpath}`}
                  className="image-preview"
                />
                <img
                  src={image.screenshotpath}
                  alt={`Analysis for ${image.screenshotpath}`}
                  className="image-preview"
                />
                <div>
                  
                  <p>
                    <strong>Dominant Emotion:</strong>{" "}
                    {EMOJI_MAP[selectedEmotion]} {selectedEmotion}
                  </p>

                  {/* Bar Chart for Individual Image Analysis */}
                  <BarChart width={400} height={300} data={emotionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tickFormatter={(tick) => tick.split(" ")[1]} // Remove emojis
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChildResult;
