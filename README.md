# Emotilearn: Emotion-Aware Learning Support System for Dyslexic Children

## 🎯 Project Overview

**Emotilearn** is a full-stack web application that combines artificial intelligence with educational gaming to support dyslexic children's learning journey. The system leverages **real-time facial emotion recognition** to detect emotional states (frustration, confusion, engagement) while children participate in educational games, providing therapist with actionable insights for personalized learning support.

### Core Value Proposition

- 📊 **Real-time emotion tracking** during educational activities
- 🎮 **Gamified learning experiences** (Quiz, Memory Game, Animal Game)
- 📈 **Data-driven progress reports** for therapists
- 🤖 **AI-powered adaptive feedback** based on emotional patterns

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                        │
│  - Child login & game interfaces                                │
│  - Real-time webcam + emotion visualization                     │
│  - Therapist dashboards with analytics                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ WebSocket (Socket.io) + REST API
┌────────────────────▼────────────────────────────────────────────┐
│  Backend (Node.js + Express)                                    │
│  - REST API (authentication, data management)                   │
│  - WebSocket server for real-time emotion streaming             │
│  - MongoDB data persistence                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP Inference API
┌────────────────────▼────────────────────────────────────────────┐
│  ML Service (FastAPI + PyTorch)                                 │
│  - Emotion classification from facial landmarks                 │
│  - Vision Transformer model inference                           │
└─────────────────────────────────────────────────────────────────┘
```

For detailed deployment architecture, see [DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md).

---

## 🛠️ Tech Stack

| Component          | Technology                           | Purpose                           |
| ------------------ | ------------------------------------ | --------------------------------- |
| **Frontend**       | React 18, Vite, TailwindCSS          | Web UI, real-time emotion display |
| **Backend**        | Node.js 18+, Express, Socket.io      | REST API, WebSocket streaming     |
| **Database**       | MongoDB 5+                           | User profiles, sessions, emotions |
| **ML/AI**          | FastAPI, PyTorch, Vision Transformer | Emotion inference from landmarks  |
| **Infrastructure** | AWS (EC2, RDS, S3, Lambda)           | Cloud deployment & scaling        |
| **IaC**            | Terraform                            | Infrastructure as Code            |

---

## 📋 Features

✅ **Child Authentication & Profiles**

- Secure login/registration for children
- Session tracking with session IDs

✅ **Real-Time Emotion Detection**

- MediaPipe facial landmark extraction
- Vision Transformer-based emotion classification
- WebSocket streaming for sub-second latency

✅ **Educational Games**

- **Quiz Mode**: Question-based learning with emotion tracking
- **Memory Game**: Card-matching game with emotional context
- **Animal Game**: Interactive animal learning game

✅ **Analytics & Reporting**

- Per-session emotion analysis (happy, sad, angry, neutral, fearful, disgusted)
- Emotion events linked to specific questions/game rounds
- Therapist dashboards with charts and progress reports

✅ **Admin Controls**

- Super Admin dashboard for user management
- Session history and processing status
- Child profile management

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+, Python 3.9+, MongoDB 5+

### Setup

**1. Clone & Install**

```bash
git clone https://github.com/girishChiluveru/Emotilearn-Face-Expression-Tracker.git
cd Emotilearn-Face-Expression-Tracker

# Backend dependencies
cd Back-end && npm install && cd ..

# Frontend dependencies
cd Front-end && npm install && cd ..

# ML service dependencies
cd TransformerModel && pip install -r requirements.txt && cd ..
```

**2. Configure Environment**

Backend (`Back-end/.env`):

```env
PORT=3000
NODE_ENV=development
CONNECTION_STRING=mongodb://localhost:27017/emotilearn
JWT_SECRET=your-secret-key-here
ADMIN_ID=admin_username
ADMIN_PASS=admin_password
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

Frontend (`Front-end/.env.local`):

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

ML Service (`TransformerModel/.env`):

```env
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ARTIFACTS_DIR=artifacts
```

**3. Start Services**

```bash
# Terminal 1: Backend
cd Back-end && npm run dev

# Terminal 2: Frontend
cd Front-end && npm run dev

# Terminal 3: ML Service
cd TransformerModel && uvicorn main:app --reload
```

Visit: http://localhost:5173

---

## 📁 Project Structure

```
Emotilearn-Face-Expression-Tracker/
├── Back-end/              # Node.js/Express backend
│   ├── server.js         # Express app entry point
│   ├── connection.js     # MongoDB connection
│   ├── controllers/      # Business logic
│   ├── routes/           # API endpoints
│   ├── models/           # MongoDB schemas
│   └── photos/           # User-uploaded images
│
├── Front-end/            # React + Vite frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # Global state
│   │   ├── styles/       # CSS files
│   │   └── main.jsx      # App entry
│   └── index.html
│
├── TransformerModel/     # FastAPI ML service
│   ├── main.py          # FastAPI server
│   ├── model.py         # PyTorch model
│   ├── config.py        # Settings
│   ├── artifacts/       # Trained model weights
│   └── requirements.txt
│
└── deployment/          # Infrastructure as Code
    └── terraform/       # AWS deployment configs
```

---



## 📊 Data Models

### Child Profile (MongoDB)

```json
{
  "childname": "string",
  "password": "hashed_bcrypt",
  "sessions": [
    {
      "sessionId": "uuid",
      "loginTime": "date",
      "logoutTime": "date",
      "emotion_events": [...],
      "scores": [...]
    }
  ]
}
```

### Emotion Event

```json
{
  "gameId": "quiz|animal|memory",
  "qid": "question_id",
  "timestamp": "date",
  "emotions": {
    "happy": 0.85,
    "sad": 0.05,
    "angry": 0.02,
    "neutral": 0.08,
    "fearful": 0.0,
    "disgusted": 0.0
  },
  "dominant_emotion": "happy",
  "dominant_score": 0.85
}
```

---

## 🔄 API Endpoints

### Authentication

- `POST /register` - Register new child account
- `POST /login` - Child login
- `POST /admin/login` - Admin login
- `GET /profile` - Get current user profile
- `POST /logout` - Logout user

### Reports & Data

- `GET /reports/children` - List all children (admin)
- `GET /reports/report/:childname` - Get child's emotion report
- `POST /store-scores` - Save game scores
- `PATCH /sessions/:childId/:sessionId` - Mark session as processed

### WebSocket Events

- `landmarks` - Send facial landmarks (468 points × 3 coords)
- `emotion_result` - Receive emotion predictions
- `emotion_error` - Error notifications

---

## 📈 Performance Metrics

Target metrics for production:

- **API Response Time**: < 200ms (p95)
- **Emotion Detection Latency**: < 500ms (WebSocket)
- **Database Query Time**: < 50ms (p95)
- **Frontend Load Time**: < 2s (first paint)

---

## 🐛 Troubleshooting

**MongoDB Connection Error**

```bash
# Ensure MongoDB is running
mongod

# Check connection string in .env
CONNECTION_STRING=mongodb://localhost:27017/emotilearn
```

**AI Service Unavailable**

```bash
# Verify FastAPI is running
cd TransformerModel && uvicorn main:app --reload

# Check AI_SERVICE_URL in backend .env
AI_SERVICE_URL=http://localhost:8000
```

**WebSocket Connection Issues**

- Verify `FRONTEND_URL` matches actual frontend origin
- Check browser console for CORS errors

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

---

## 📚 Documentation


- [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) - Quick reference for development
- [Explain.md](Explain.md) - Detailed codebase breakdown

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## ✉️ Contact & Support

**Project Owner:** Girish Chiluveru  
**Repository:** https://github.com/girishChiluveru/Emotilearn-Face-Expression-Tracker
