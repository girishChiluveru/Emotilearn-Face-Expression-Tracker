const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    childname: {
        type: String,
    },
    password:{
        type: String,
    },
    sessions: [{
        sessionId: { type: String, required: true },
        loginTime: { type: Date, default: Date.now },
        logoutTime: { type: Date },
    sessiondate: {
        type: Date,
        required: true,
        default: Date.now
    },
    isProcessed: {
        type: Boolean,
        required: true,
        default: false
    },
    images: [{
        imgpath: {
            type: String,
            required: true,
        },
        screenshotpath: {
            type: String,
            required: true
        },
        emotions: {
            angry: { type: Number, required: true, default: 0 },
            disgust: { type: Number, required: true, default: 0 },
            fear: { type: Number, default: 0 },
            happy: { type: Number, required: true, default: 0 },
            sad: { type: Number, required: true, default: 0 },
            surprise: { type: Number, default: 0 },
            neutral: { type: Number, required: true, default: 0 },
        },
        max_emotion_img: {
            emotion: { type: String, required: false },
            score: { type: Number, required: false }
        }
    }],
    scores: [{ // New field to store scores
        gameType: { type: String, required: true },
        score: { type: Number, required: true }
    }]
}]
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields.

const reports = mongoose.model('report', reportSchema);

module.exports = reports;