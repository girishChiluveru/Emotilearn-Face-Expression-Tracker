const reports = require('../models/report');

const handleStoreScores = async (req, res) => {
    const { childName, sessionId, scores } = req.body;

    if (!childName || !sessionId || !Array.isArray(scores)) {
        return res.status(400).json({ error: 'childName, sessionId, and scores array are required' });
    }

    try {
        // Find the report with the matching child name and session ID
        const report = await reports.findOne({ childname: childName, "sessions.sessionId": sessionId });

        if (!report) {
            return res.status(404).json({ error: 'No matching report found' });
        }

        // Locate the specific session
        const session = report.sessions.find(s => s.sessionId === sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Append new scores to the session's scores array
        session.scores.push(...scores); // Assuming scores is an array of objects with gameType and score fields

        // Save the updated report document
        await report.save();

        res.status(200).json({ message: 'Scores stored successfully', report });
    } catch (error) {
        console.error('Error updating scores:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleStoreScores };