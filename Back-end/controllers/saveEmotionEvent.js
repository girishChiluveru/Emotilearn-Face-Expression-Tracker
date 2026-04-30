/**
 * saveEmotionEvent.js
 * -------------------
 * Atomic helper: push one emotion_event into the matching session document.
 * Called fire-and-forget from the Socket.io handler — errors are logged but
 * do NOT block the real-time emit back to the client.
 */

const Report = require('../models/report');

/**
 * @param {object} params
 * @param {string} params.childname
 * @param {string} params.sessionId
 * @param {string} params.gameId   - "quiz" | "animal" | "memory"
 * @param {string} params.qid      - question / round identifier
 * @param {object} params.emotions - { angry, disgust, fear, happy, neutral, sad }
 * @param {string} params.dominant_emotion
 * @param {number} params.dominant_score
 */
async function saveEmotionEvent({ childname, sessionId, gameId, qid, emotions, dominant_emotion, dominant_score }) {
    try {
        const result = await Report.findOneAndUpdate(
            {
                childname,
                'sessions.sessionId': sessionId,
            },
            {
                $push: {
                    'sessions.$.emotion_events': {
                        gameId,
                        qid,
                        timestamp: new Date(),
                        emotions,
                        dominant_emotion,
                        dominant_score,
                    },
                },
            },
            { new: false } // We don't need the updated doc returned
        );

        if (!result) {
            console.warn(`[saveEmotionEvent] No session found for child="${childname}" session="${sessionId}"`);
        }
    } catch (err) {
        // Log but never throw — a DB write failure must not kill the WebSocket loop
        console.error('[saveEmotionEvent] DB write failed:', err.message);
    }
}

module.exports = { saveEmotionEvent };
