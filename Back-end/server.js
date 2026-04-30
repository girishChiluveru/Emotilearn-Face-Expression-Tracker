// server.js — Emotilearn Node.js backend
// Real-time emotion detection via Socket.io + FastAPI TransformerModel

const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const { connectToMongoDB } = require('./connection');
const { registerEmotionSocket } = require('./controllers/emotionSocket');

// ── Route imports (only what remains) ────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/report1');
const storeScoresRoutes = require('./routes/storeScores');

// ── Models (still needed for inline routes) ───────────────────────────────────
const Admin = require('./models/admin');
const Report = require('./models/report');

// ── App + HTTP server ─────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Socket.io ─────────────────────────────────────────────────────────────────
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
});
registerEmotionSocket(io);

// ── MongoDB ───────────────────────────────────────────────────────────────────
connectToMongoDB(process.env.CONNECTION_STRING)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: [FRONTEND_URL],
}));
app.use(express.json({ limit: '1mb' }));    // no more base64 images → limit is small
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/reports', reportRoutes);
app.use('/store-scores', storeScoresRoutes);

// ── Children CRUD (used by SuperAdmin / therapist dashboard) ──────────────────
app.get('/children', async (req, res) => {
    try {
        const children = await Report.find({}, 'childname sessions.sessionId sessions.sessiondate sessions.isProcessed sessions.scores');
        res.json(children);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/children', async (req, res) => {
    try {
        const newChild = new Report(req.body);
        await newChild.save();
        res.status(201).json(newChild);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/children/:id', async (req, res) => {
    try {
        const updated = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/children/:id', async (req, res) => {
    try {
        await Report.findByIdAndDelete(req.params.id);
        res.json({ message: 'Child deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Session isProcessed patch ─────────────────────────────────────────────────
app.patch('/sessions/:childId/:sessionId', async (req, res) => {
    try {
        const { childId, sessionId } = req.params;
        const { isProcessed } = req.body;
        const child = await Report.findById(childId);
        if (!child) return res.status(404).json({ message: 'Child not found' });
        const session = child.sessions.id(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        session.isProcessed = isProcessed;
        await child.save();
        res.json(child);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── Admin CRUD ────────────────────────────────────────────────────────────────
app.get('/admins', async (req, res) => {
    try {
        const admins = await Admin.find();
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/admins', async (req, res) => {
    try {
        const newAdmin = new Admin(req.body);
        await newAdmin.save();
        res.status(201).json(newAdmin);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/admins/:id', async (req, res) => {
    try {
        const updated = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/admins/:id', async (req, res) => {
    try {
        await Admin.findByIdAndDelete(req.params.id);
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Socket.io ready — CORS origin: ${FRONTEND_URL}`);
});