/**
 * emotionSocket.js
 * ----------------
 * Socket.io namespace handler for real-time emotion detection.
 *
 * Flow per connection:
 *   1. Client connects with query: { childname, sessionId }
 *   2. Server validates the session exists in MongoDB
 *   3. Client emits 'landmarks' events every ~600ms
 *   4. Server POSTs landmarks to FastAPI → gets emotion back
 *   5. Server emits 'emotion_result' back to the same socket (real-time)
 *   6. Server fire-and-forgets a MongoDB write of the emotion event
 *
 * Error handling:
 *   - Auth failure → socket disconnect with reason
 *   - FastAPI unavailable → emits 'emotion_error' to client (does not crash server)
 *   - DB write failure → logged, never propagated to client
 */

const Report = require('../models/report');
const { saveEmotionEvent } = require('./saveEmotionEvent');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const LANDMARK_COUNT = 468 * 3; // 1404

/**
 * Register Socket.io handlers on the given io instance.
 * @param {import('socket.io').Server} io
 */
function registerEmotionSocket(io) {
    io.on('connection', async (socket) => {
        const { childname, sessionId } = socket.handshake.query;

        // ── Authentication ─────────────────────────────────────────────────
        if (!childname || !sessionId) {
            socket.emit('emotion_error', { message: 'childname and sessionId are required.' });
            socket.disconnect(true);
            return;
        }

        try {
            const report = await Report.findOne(
                { childname, 'sessions.sessionId': sessionId },
                { _id: 1 }
            ).lean();

            if (!report) {
                socket.emit('emotion_error', { message: 'Session not found. Please log in again.' });
                socket.disconnect(true);
                return;
            }
        } catch (err) {
            console.error('[emotionSocket] Auth DB error:', err.message);
            socket.emit('emotion_error', { message: 'Server error during authentication.' });
            socket.disconnect(true);
            return;
        }

        console.log(`[emotionSocket] Connected: child="${childname}" session="${sessionId}" socket=${socket.id}`);

        // ── Landmark events ────────────────────────────────────────────────
        socket.on('landmarks', async ({ landmarks, gameId, qid }) => {
            // Input validation
            if (!Array.isArray(landmarks) || landmarks.length !== LANDMARK_COUNT) {
                socket.emit('emotion_error', {
                    message: `Expected ${LANDMARK_COUNT} landmarks, got ${landmarks?.length ?? 0}.`,
                });
                return;
            }

            if (!gameId || !qid) {
                socket.emit('emotion_error', { message: 'gameId and qid are required.' });
                return;
            }

            // Call FastAPI inference service
            let emotion, probabilities;
            try {
                const response = await fetch(`${AI_SERVICE_URL}/detect-emotion`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ landmarks }),
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`FastAPI ${response.status}: ${text}`);
                }

                const data = await response.json();
                emotion = data.emotion;
                probabilities = data.probabilities;
            } catch (err) {
                console.error('[emotionSocket] FastAPI error:', err.message);
                socket.emit('emotion_error', { message: 'Emotion detection service unavailable.' });
                return;
            }

            // Emit result immediately — don't await DB write
            socket.emit('emotion_result', {
                emotion,
                probabilities,
                gameId,
                qid,
                timestamp: Date.now(),
            });

            // Persist asynchronously (fire-and-forget)
            saveEmotionEvent({
                childname,
                sessionId,
                gameId,
                qid,
                emotions: probabilities,
                dominant_emotion: emotion,
                dominant_score: probabilities?.[emotion] ?? 0,
            });
        });

        socket.on('disconnect', (reason) => {
            console.log(`[emotionSocket] Disconnected: child="${childname}" reason="${reason}"`);
        });
    });
}

module.exports = { registerEmotionSocket };
