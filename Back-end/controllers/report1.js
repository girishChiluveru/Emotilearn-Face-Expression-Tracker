const Report = require('../models/report');

/**
 * GET /reports
 * Returns all children with their sessions and emotion_events for charts.
 */
async function handleReport(req, res) {
    try {
        const reports = await Report.find(
            {},
            'childname sessions.sessionId sessions.sessiondate sessions.isProcessed sessions.emotion_events sessions.scores'
        ).lean();

        if (!reports || reports.length === 0) {
            return res.status(404).json({ error: 'No reports found.' });
        }

        // Shape data for the frontend charts
        const grouped = reports.map((r) => ({
            childname: r.childname,
            sessions: (r.sessions || []).map((session) => ({
                sessionId:      session.sessionId,
                sessiondate:    session.sessiondate,
                isProcessed:    session.isProcessed,
                scores:         session.scores || [],
                emotion_events: (session.emotion_events || []).map((ev) => ({
                    gameId:           ev.gameId,
                    qid:              ev.qid,
                    timestamp:        ev.timestamp,
                    emotions:         ev.emotions,
                    dominant_emotion: ev.dominant_emotion,
                    dominant_score:   ev.dominant_score,
                })),
            })),
        }));

        res.status(200).json(grouped);
    } catch (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

/**
 * GET /reports/:childName/:sessionID
 * Returns one specific session with all its emotion_events.
 */
async function handleSpecificSession(req, res) {
    const { childName, sessionID } = req.params;

    try {
        const report = await Report.findOne(
            { childname: childName, 'sessions.sessionId': sessionID },
            { sessions: { $elemMatch: { sessionId: sessionID } } }
        ).lean();

        if (!report || !report.sessions?.length) {
            return res.status(404).json({ error: 'No report found for the specified child and session.' });
        }

        res.status(200).json(report.sessions[0]);
    } catch (err) {
        console.error('Error fetching specific session:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { handleReport, handleSpecificSession };
