// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectToMongoDB } = require('./connection');
const resultRoutes = require('./routes/result');
const photoRoutes = require('./routes/photos');
const reportRoutes = require('./routes/report1');
const processRoutes = require('./routes/process');
const analyzeRoutes = require('./routes/analyze');
const emotionRoutes = require('./routes/storeEmotions');
const storeScoresRoutes = require('./routes/storeScores');
const dotenv = require('dotenv').config();
const cookieParser =require('cookie-parser');


const app = express();
const PORT = 3000;

app.use(cookieParser());

app.use('/photos', express.static(path.join(__dirname, 'photos')));
// mongodb://127.0.0.1:27017/results
connectToMongoDB(process.env.CONNECTION_STRING)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));


app.use(cors({
    credentials: true,
    origin: ['http://localhost:5173','http://192.168.0.103:5173'] // Frontend origin
}));



// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/results', resultRoutes);
app.use('/photos', photoRoutes);
app.use('/reports', reportRoutes);
app.use('/process', processRoutes);
app.use('/analyze', analyzeRoutes);
app.use('/store-emotions', emotionRoutes);
app.use('/store-scores', storeScoresRoutes);
app.use('/', require('./routes/authRoutes'));



const Report = require('./models/report');

app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: true })); 
app.get('/children', async (req, res) => {
    try {
        const children = await Report.find();
        res.json(children);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create a new child
app.post('/children', async (req, res) => {
    try {
        const newChild = new Report(req.body);
        await newChild.save();
        res.status(201).json(newChild);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 3. Update child details
app.put('/children/:id', async (req, res) => {
    try {
        const updatedChild = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedChild);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 4. Delete a child
app.delete('/children/:id', async (req, res) => {
    try {
        await Report.findByIdAndDelete(req.params.id);
        res.json({ message: "Child deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Update session's isProcessed
app.patch('/sessions/:childId/:sessionId', async (req, res) => {
    try {
        const { childId, sessionId } = req.params;
        const { isProcessed } = req.body;

        const child = await Report.findById(childId);
        const session = child.sessions.id(sessionId);
        if (session) {
            session.isProcessed = isProcessed;
            await child.save();
            res.json(child);
        } else {
            res.status(404).json({ message: "Session not found" });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start the server

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);

});