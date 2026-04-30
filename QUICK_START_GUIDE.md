# Quick Start: Implementing MediaPipe + WebSocket for Emotilearn

## 🎯 Goal

Upgrade Emotilearn to use real-time emotion detection with WebSocket updates, replacing the current Hugging Face ViT API with a faster, on-device MediaPipe solution.

---

## 📝 Step 1: Create Environment Configuration

**Create file:** `Back-end/.env`

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
CONNECTION_STRING=mongodb://localhost:27017/emotilearn
DB_NAME=emotilearn

# Authentication
JWT_SECRET=emotilearn-secret-key-change-in-production-12345
BCRYPT_ROUNDS=12

# AI Model Configuration
AI_MODEL_TYPE=mediapipe
ML_INFERENCE_URL=http://localhost:5000/analyze
HUGGINGFACE_API_TOKEN=your_token_if_needed

# WebSocket Configuration
WEBSOCKET_ENABLED=true
IMAGE_CAPTURE_INTERVAL=500
EMOTION_SPIKE_THRESHOLD=0.7

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN_WHITELIST=http://localhost:5173,http://localhost:3000

# Session
SESSION_SECRET=emotilearn-session-secret-change-in-production
```

**Create file:** `Front-end/.env.local`

```env
VITE_API_URL=http://localhost:3000
VITE_WEBSOCKET_URL=http://localhost:3000
VITE_CAPTURE_INTERVAL=500
```

---

## 🔌 Step 2: Update Backend Dependencies

```bash
cd Back-end

# Install new packages
npm install socket.io@4.7.2 socket.io-cors@4.0.1
npm install express-rate-limit@7.0.0 helmet@7.0.0 joi@17.11.0

# Verify installation
npm list socket.io express-rate-limit helmet joi
```

---

## 🐍 Step 3: Set Up Python ML Service

```bash
# In a NEW terminal, from project root
cd Back-end

# Create virtual environment (recommended)
python -m venv env

# Activate virtual environment
# On Windows:
.\env\Scripts\activate

# Install dependencies
pip install flask flask-cors mediapipe opencv-python numpy

# Verify installation
python -c "import mediapipe; print(mediapipe.__version__)"
```

---

## 📁 Step 4: Create Required Directories & Files

```bash
# From Back-end directory
mkdir -p middleware
mkdir -p services
mkdir -p utils
```

---

## 🛡️ Step 5: Create Rate Limiting Middleware

**File:** `Back-end/middleware/rateLimiter.js`

```javascript
const rateLimit = require("express-rate-limit");

const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later",
  skipSuccessfulRequests: true,
});

const analyzeImageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "Image analysis rate limit exceeded",
});

module.exports = {
  generalLimiter,
  authLimiter,
  analyzeImageLimiter,
};
```

---

## ✅ Step 6: Create Input Validation

**File:** `Back-end/middleware/validators.js`

```javascript
const Joi = require("joi");

const registerChildSchema = Joi.object({
  childname: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).required(),
});

const loginChildSchema = Joi.object({
  childname: Joi.string().alphanum().required(),
  password: Joi.string().required(),
});

const imageAnalysisSchema = Joi.object({
  image: Joi.string().base64({ paddingRequired: false }).required(),
  sessionId: Joi.string().uuid().required(),
});

function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));
      return res.status(400).json({ error: "Validation failed", details });
    }

    req.validatedData = value;
    next();
  };
}

module.exports = {
  registerChildSchema,
  loginChildSchema,
  imageAnalysisSchema,
  validateRequest,
};
```

---

## 🚀 Step 7: Update Backend Server with WebSocket

**Replace content of:** `Back-end/server.js`

```javascript
require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");

const { connectToMongoDB } = require("./connection");
const {
  generalLimiter,
  authLimiter,
  analyzeImageLimiter,
} = require("./middleware/rateLimiter");
const {
  validateRequest,
  loginChildSchema,
  registerChildSchema,
} = require("./middleware/validators");

// ============ SERVER SETUP ============
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

// ============ SECURITY MIDDLEWARE ============
app.use(helmet());
app.use(cookieParser());
app.use(
  cors({
    origin: (
      process.env.CORS_ORIGIN_WHITELIST || "http://localhost:5173"
    ).split(","),
    credentials: true,
  }),
);

// ============ BODY PARSER & RATE LIMITING ============
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(generalLimiter);

// ============ STATIC FILES ============
app.use("/photos", express.static(path.join(__dirname, "photos")));

// ============ DATABASE CONNECTION ============
connectToMongoDB(process.env.CONNECTION_STRING)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ============ ROUTES ============
app.use("/auth", authLimiter, require("./routes/authRoutes"));
app.use("/analyze", analyzeImageLimiter, require("./routes/analyze"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// ============ WEBSOCKET HANDLER ============
const activeConnections = new Map();

io.on("connection", (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);

  socket.on("join_session", (data) => {
    const { childId, sessionId, childName } = data;
    activeConnections.set(socket.id, { childId, sessionId, childName });
    socket.join(`session_${sessionId}`);
    console.log(`👤 ${childName} joined session ${sessionId}`);
  });

  socket.on("analyze_frame", async (data) => {
    try {
      const { image, timestamp } = data;
      const connection = activeConnections.get(socket.id);

      if (!connection) {
        socket.emit("error", { message: "Not in session" });
        return;
      }

      // Call ML inference service
      const { emotionResult } = await analyzeEmotionFrame(image);

      // Broadcast to all clients in session
      io.to(`session_${connection.sessionId}`).emit("emotion_update", {
        timestamp,
        emotions: emotionResult.emotions,
        dominantEmotion: emotionResult.dominant_emotion,
        confidence: emotionResult.dominant_score,
        userId: connection.childId,
      });

      // Check for emotion spike
      if (
        emotionResult.dominant_score >
        (process.env.EMOTION_SPIKE_THRESHOLD || 0.7)
      ) {
        io.to(`session_${connection.sessionId}`).emit("emotion_spike", {
          emotion: emotionResult.dominant_emotion,
          confidence: emotionResult.dominant_score,
          timestamp,
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
      socket.emit("error", { message: "Frame analysis failed" });
    }
  });

  socket.on("disconnect", () => {
    activeConnections.delete(socket.id);
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ============ ML ANALYSIS HELPER ============
async function analyzeEmotionFrame(imageData) {
  try {
    const fetch = (await import("node-fetch")).default;

    const response = await fetch(process.env.ML_INFERENCE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageData,
        model: process.env.AI_MODEL_TYPE,
      }),
      timeout: 5000,
    });

    if (!response.ok) throw new Error("ML service error");

    return { emotionResult: await response.json() };
  } catch (error) {
    console.error("ML inference error:", error);
    throw error;
  }
}

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============ START SERVER ============
server.listen(PORT, () => {
  console.log(`
    🚀 Emotilearn Backend Started
    ├─ HTTP: http://localhost:${PORT}
    ├─ WebSocket: ws://localhost:${PORT}
    ├─ Environment: ${process.env.NODE_ENV}
    └─ Database: ${process.env.CONNECTION_STRING}
  `);
});

module.exports = { app, server, io };
```

---

## 🎨 Step 8: Create Frontend WebSocket Service

**Create file:** `Front-end/src/services/emotionWebSocket.js`

```javascript
import io from "socket.io-client";

class EmotionWebSocketService {
  constructor(serverUrl = "http://localhost:3000") {
    this.socket = null;
    this.serverUrl = serverUrl;
    this.listeners = {};
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on("connect", () => {
          console.log("✅ WebSocket connected");
          resolve();
        });

        this.socket.on("disconnect", () => console.log("🔌 Disconnected"));
        this.socket.on("error", (error) =>
          console.error("❌ WS Error:", error),
        );
        this.socket.on("emotion_update", (data) =>
          this._trigger("emotion_update", data),
        );
        this.socket.on("emotion_spike", (data) =>
          this._trigger("emotion_spike", data),
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  joinSession(childId, sessionId, childName) {
    this.socket.emit("join_session", { childId, sessionId, childName });
  }

  sendFrame(imageData, timestamp) {
    this.socket.emit("analyze_frame", { image: imageData, timestamp });
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    }
  }

  _trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }
}

export default new EmotionWebSocketService(import.meta.env.VITE_WEBSOCKET_URL);
```

---

## 🐍 Step 9: Create Python ML Service

**Create file:** `Back-end/deepface_mediapipe.py`

```python
import os
import cv2
import mediapipe as mp
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import base64
import io

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection

EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

class EmotionDetector:
    def __init__(self):
        self.face_detector = mp_face_detection.FaceDetection(
            model_selection=1,  # Full-range model
            min_detection_confidence=0.5
        )

    def analyze_image(self, image_data):
        """
        Analyze image for emotions
        For now, returns dummy emotion scores
        In production, integrate with MobileNet or EfficientNet for emotion classification
        """
        try:
            # Decode base64 image
            if isinstance(image_data, str):
                image_bytes = base64.b64decode(image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                img = image_data

            if img is None:
                raise ValueError("Failed to decode image")

            # Convert to RGB
            rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Detect faces
            results = self.face_detector.process(rgb_image)

            if not results.detections:
                # No face detected
                return {
                    'emotions': {e: 0.0 for e in EMOTION_LABELS},
                    'dominant_emotion': 'neutral',
                    'dominant_score': 0.5,
                    'faces_detected': 0
                }

            # Extract emotion scores (placeholder - integrate real model)
            emotions = self._infer_emotions(results.detections, rgb_image)

            return emotions

        except Exception as e:
            logging.error(f"Error analyzing image: {str(e)}")
            raise

    def _infer_emotions(self, detections, image):
        """
        Infer emotions from detected faces
        TODO: Replace with actual emotion classification model (e.g., MobileNet)
        """
        # Placeholder: Return normalized random scores
        scores = {e: np.random.random() for e in EMOTION_LABELS}
        total = sum(scores.values())
        scores = {k: v / total for k, v in scores.items()}

        dominant = max(scores, key=scores.get)

        return {
            'emotions': scores,
            'dominant_emotion': dominant,
            'dominant_score': float(scores[dominant]),
            'faces_detected': len(detections)
        }

detector = EmotionDetector()

@app.route('/analyze', methods=['POST'])
def analyze():
    """API endpoint for emotion analysis"""
    try:
        data = request.get_json()
        image_base64 = data.get('image')
        model_type = data.get('model', 'mediapipe')

        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400

        logging.info(f"Analyzing image with model: {model_type}")

        # Analyze image
        results = detector.analyze_image(image_base64)

        return jsonify(results)

    except Exception as e:
        logging.error(f"Error in /analyze: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'mediapipe'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
```

---

## 🎮 Step 10: Update Quiz Component with Real-Time Emotions

**Update file:** `Front-end/src/components/Quiz.jsx`

Add this snippet to start of component:

```javascript
import { useEffect, useRef } from "react";
import emotionWebSocket from "../services/emotionWebSocket";
import toast from "react-hot-toast";

function Quiz({ onQuizEnd, childName, sessionId }) {
  const [emotions, setEmotions] = useState({
    angry: 0,
    disgust: 0,
    fear: 0,
    happy: 0,
    neutral: 0,
    sad: 0,
    surprise: 0,
  });
  const [dominantEmotion, setDominantEmotion] = useState("neutral");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureIntervalRef = useRef(null);

  // Initialize WebSocket on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Connect WebSocket
        await emotionWebSocket.connect();
        emotionWebSocket.joinSession(
          sessionId.slice(0, 8),
          sessionId,
          childName,
        );

        // Listen for emotion updates
        emotionWebSocket.on("emotion_update", (data) => {
          setEmotions(data.emotions);
          setDominantEmotion(data.dominantEmotion);
        });

        emotionWebSocket.on("emotion_spike", (data) => {
          toast(`😊 We noticed you feel ${data.emotion}. You're doing great!`, {
            duration: 2000,
          });
        });

        // Start webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;

        // Start frame capture
        startFrameCapture();
        toast.success("Emotion tracking started!");
      } catch (error) {
        toast.error("Failed to initialize: " + error.message);
      }
    };

    init();

    return () => {
      emotionWebSocket.disconnect();
      stopFrameCapture();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [childName, sessionId]);

  const startFrameCapture = () => {
    const interval = parseInt(import.meta.env.VITE_CAPTURE_INTERVAL || 500);
    captureIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(",")[1];
            emotionWebSocket.sendFrame(base64, new Date().toISOString());
          };
          reader.readAsDataURL(blob);
        });
      }
    }, interval);
  };

  const stopFrameCapture = () => {
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
  };

  return (
    <div className="quiz-container">
      {/* Emotion Display */}
      <div className="emotion-display">
        <h3>Current Emotion: {dominantEmotion.toUpperCase()}</h3>
        <div className="emotion-bars">
          {Object.entries(emotions).map(([emotion, score]) => (
            <div
              key={emotion}
              className="emotion-bar"
              style={{
                height: `${score * 100}%`,
                backgroundColor: getColor(emotion),
              }}
              title={`${emotion}: ${(score * 100).toFixed(0)}%`}
            ></div>
          ))}
        </div>
      </div>

      {/* Rest of quiz UI */}
      <video ref={videoRef} autoPlay muted></video>
      <canvas ref={canvasRef} hidden></canvas>
    </div>
  );
}

function getColor(emotion) {
  const colors = {
    happy: "#FFD700",
    sad: "#4169E1",
    angry: "#FF4500",
    neutral: "#A9A9A9",
    fear: "#8B008B",
    disgust: "#32CD32",
    surprise: "#FF1493",
  };
  return colors[emotion] || "#999";
}
```

---

## ✅ Step 11: Testing Checklist

Run these commands in separate terminals:

**Terminal 1: MongoDB** (if not running)

```bash
mongod
```

**Terminal 2: Backend**

```bash
cd Back-end
npm run dev
# Should output: ✅ MongoDB connected
```

**Terminal 3: Python ML Service**

```bash
cd Back-end
.\env\Scripts\activate  # Windows
# or: source env/bin/activate  # Mac/Linux

python deepface_mediapipe.py
# Should output: Running on http://0.0.0.0:5000
```

**Terminal 4: Frontend**

```bash
cd Front-end
npm run dev
# Should output: ✅ Local: http://localhost:5173
```

---

## 🧪 Test in Browser

1. Open http://localhost:5173
2. Register a child account
3. Login
4. Click "Start Game"
5. Allow webcam access
6. Check browser console (F12) for:
   - ✅ "WebSocket connected"
   - ✅ "Emotion updates" logs
   - ✅ Real-time emotion bars updating

---

## 📊 Performance Monitoring

Add this to your browser console to monitor latency:

```javascript
// Measure emotion update latency
let lastFrameTime = Date.now();
const emotionWebSocket = window.emotionWebSocket;

emotionWebSocket.on("emotion_update", (data) => {
  const latency = Date.now() - lastFrameTime;
  console.log(`Latency: ${latency}ms`, data);
  lastFrameTime = Date.now();
});
```

**Expected latency: 200-400ms** ✅

---

## 🆘 Troubleshooting

| Problem                                            | Solution                                              |
| -------------------------------------------------- | ----------------------------------------------------- |
| "WebSocket connection refused"                     | Ensure backend running on port 3000                   |
| "Module not found: socket.io"                      | Run `npm install socket.io` in Back-end               |
| "ModuleNotFoundError: No module named 'mediapipe'" | Run `pip install mediapipe`                           |
| "Empty emotion values"                             | Check Python service running, test `/health` endpoint |
| "High latency (>500ms)"                            | Close other apps, check GPU usage                     |

---

## 🎉 Success Indicators

You'll know it's working when:

- ✅ WebSocket connects (no errors in console)
- ✅ Emotion bars update in real-time (no lag)
- ✅ Emotion spike notifications appear
- ✅ Latency is 200-400ms (check console)
- ✅ No database errors in backend logs

---

## 🚀 Next Steps

1. **Integrate real emotion classification model** (replace random scores in Python)
2. **Add performance monitoring** (track latency, throughput)
3. **Optimize frame capture rate** (adjust based on latency)
4. **Store emotion data** in MongoDB for analysis
5. **Build emotion trend visualizations** in admin dashboard

---
