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
const dotenv = require('dotenv').config()
const cookieParser =require('cookie-parser')


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


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);

});