const mongoose = require('mongoose');

// ── Emotion event subdocument ─────────────────────────────────────────────────
// Stored once per landmark sample (every ~600ms) during a game.
// gameId  : which game produced this reading  ("quiz" | "animal" | "memory")
// qid     : question / round identifier so therapist can correlate emotion
//           to specific content (e.g. "q3", "round-2")
const emotionEventSchema = new mongoose.Schema(
    {
        gameId:   { type: String, required: true },
        qid:      { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        emotions: {
            angry:   { type: Number, default: 0 },
            disgust: { type: Number, default: 0 },
            fear:    { type: Number, default: 0 },
            happy:   { type: Number, default: 0 },
            neutral: { type: Number, default: 0 },
            sad:     { type: Number, default: 0 },
        },
        dominant_emotion: { type: String, default: 'neutral' },
        dominant_score:   { type: Number, default: 0 },
    },
    { _id: false } // No separate _id per event — keeps docs lean
);

// ── Score subdocument ─────────────────────────────────────────────────────────
const scoreSchema = new mongoose.Schema(
    {
        gameType: { type: String, required: true },
        score:    { type: Number, required: true },
    },
    { _id: false }
);

// ── Session subdocument ───────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema(
    {
        sessionId:   { type: String, required: true },
        loginTime:   { type: Date, default: Date.now },
        logoutTime:  { type: Date },
        sessiondate: { type: Date, required: true, default: Date.now },
        isProcessed: { type: Boolean, required: true, default: false },

        // Real-time emotion events captured during the session
        emotion_events: [emotionEventSchema],

        // Game scores
        scores: [scoreSchema],
    },
    { _id: false }
);

// ── Report (child) document ───────────────────────────────────────────────────
const reportSchema = new mongoose.Schema(
    {
        childname: { type: String, required: true },
        password:  { type: String, required: true },
        sessions:  [sessionSchema],
    },
    { timestamps: true }
);

// ── Indexes for common query patterns ─────────────────────────────────────────
reportSchema.index({ childname: 1 });
reportSchema.index({ 'sessions.sessionId': 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model('report', reportSchema);
module.exports = Report;