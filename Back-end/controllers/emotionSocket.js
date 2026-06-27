/**
 * emotionSocket.js
 * ----------------
 * Socket.io namespace handler for real-time emotion detection.
 * With JWT authentication, token refresh, and comprehensive error handling.
 *
 * Flow per connection:
 *   1. Client connects with JWT token (query param or handshake auth)
 *   2. Server validates JWT token
 *   3. Server validates session exists in MongoDB
 *   4. Client emits 'landmarks' events every ~600ms
 *   5. Server POSTs landmarks to FastAPI → gets emotion back
 *   6. Server emits 'emotion_result' back to the same socket (real-time)
 *   7. Server saves emotion event to MongoDB asynchronously
 *
 * Error handling:
 *   - Auth failure → socket disconnect with reason
 *   - Token expired → send token refresh challenge
 *   - FastAPI unavailable → emits 'emotion_error' to client (does not crash server)
 *   - DB write failure → logged, never propagated to client
 */

const Report = require('../models/report');
const { saveEmotionEvent } = require('./saveEmotionEvent');
const { verifyToken, refreshToken } = require('../utils/jwtUtils');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const LANDMARK_COUNT = 468 * 3; // 1404

/**
 * Register Socket.io handlers on the given io instance.
 * @param {import('socket.io').Server} io
 */
function registerEmotionSocket(io) {
  // ── Socket.io middleware for JWT verification ─────────────────────────────
  io.use((socket, next) => {
    try {
      // Parse token from cookies
      let tokenFromCookie = null;
      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, ...valParts] = cookie.split('=');
          if (key) acc[key.trim()] = valParts.join('=').trim();
          return acc;
        }, {});
        tokenFromCookie = cookies['token'];
      }

      // Get token from cookie, query, auth header, or handshake
      let token = tokenFromCookie ||
                  socket.handshake.query.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '') ||
                  socket.handshake.auth.token;

      if (!token) {
        return next(new Error('No authentication token provided'));
      }

      // Verify token
      try {
        const decoded = verifyToken(token);
        socket.user = decoded;
        socket.jwtToken = token;
        next();
      } catch (error) {
        if (error.message.includes('expired')) {
          return next(new Error('Token expired. Please refresh.'));
        }
        return next(new Error('Invalid token: ' + error.message));
      }
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', async (socket) => {
    const { childname, sessionId } = socket.handshake.query;
    const user = socket.user;

    // ── Validate Query Parameters ──────────────────────────────────────────
    if (!childname || !sessionId) {
      socket.emit('emotion_error', {
        error: 'Invalid request',
        message: 'childname and sessionId are required in query parameters',
      });
      socket.disconnect(true);
      return;
    }

    // ── Validate JWT Token Matches Session ─────────────────────────────────
    if (user.childname !== childname) {
      socket.emit('emotion_error', {
        error: 'Unauthorized',
        message: 'Token does not match the requested child',
      });
      socket.disconnect(true);
      return;
    }

    // ── Verify Session in Database ────────────────────────────────────────
    try {
      const report = await Report.findOne(
        { childname, 'sessions.sessionId': sessionId },
        { _id: 1, 'sessions.$': 1 }
      ).lean();

      if (!report) {
        socket.emit('emotion_error', {
          error: 'Session not found',
          message: 'Please log in again',
        });
        socket.disconnect(true);
        return;
      }

      // Check if session is still valid (not logged out)
      const session = report.sessions[0];
      if (session.logoutTime) {
        socket.emit('emotion_error', {
          error: 'Session invalid',
          message: 'Session has been terminated',
        });
        socket.disconnect(true);
        return;
      }

      socket.childId = report._id;
      socket.sessionData = session;
    } catch (err) {
      console.error('[emotionSocket] Database error during auth:', err.message);
      socket.emit('emotion_error', {
        error: 'Server error',
        message: 'Failed to authenticate session',
      });
      socket.disconnect(true);
      return;
    }

    console.log(`[emotionSocket] ✅ Connected: child="${childname}" session="${sessionId}" user="${user.id}"`);

    // ── Check if Token Needs Refresh ───────────────────────────────────────
    const newToken = refreshToken(socket.jwtToken);
    if (newToken) {
      socket.emit('token_refreshed', {
        token: newToken,
        message: 'Your authentication token has been automatically refreshed',
      });
    }

    // ── Landmark Events ────────────────────────────────────────────────────
    socket.on('landmarks', async ({ landmarks, gameId, qid }) => {
      // Input validation
      if (!Array.isArray(landmarks) || landmarks.length !== LANDMARK_COUNT) {
        socket.emit('emotion_error', {
          error: 'Invalid landmarks',
          message: `Expected ${LANDMARK_COUNT} landmarks, got ${landmarks?.length ?? 0}`,
        });
        return;
      }

      if (!gameId || !qid) {
        socket.emit('emotion_error', {
          error: 'Invalid request',
          message: 'gameId and qid are required',
        });
        return;
      }

      // Validate gameId
      if (!['quiz', 'animal', 'memory'].includes(gameId)) {
        socket.emit('emotion_error', {
          error: 'Invalid gameId',
          message: 'gameId must be one of: quiz, animal, memory',
        });
        return;
      }


      // ── Call FastAPI Inference Service ────────────────────────────────────
      let emotion, probabilities;
      try {
        const response = await fetch(`${AI_SERVICE_URL}/detect-emotion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ landmarks }),
          timeout: 10000, // 10 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`FastAPI ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        emotion = data.emotion;
        probabilities = data.probabilities;

        // Validate response
        if (!emotion || !probabilities) {
          throw new Error('Invalid response from AI service');
        }
        

      } catch (err) {
        console.error('[emotionSocket] AI Service error:', err.message);
        socket.emit('emotion_error', {
          error: 'AI Service unavailable',
          message: 'Emotion detection service is temporarily unavailable',
          retry: true,
        });
        return;
      }

      // ── Emit Result Immediately ───────────────────────────────────────────
      socket.emit('emotion_result', {
        emotion,
        probabilities,
        gameId,
        qid,
        timestamp: Date.now(),
        socketId: socket.id,
      });

      // ── Persist Asynchronously (Fire-and-Forget) ─────────────────────────
      saveEmotionEvent({
        childname,
        sessionId,
        gameId,
        qid,
        emotions: probabilities,
        dominant_emotion: emotion,
        dominant_score: probabilities?.[emotion] ?? 0,
      }).catch((err) => {
        console.error('[emotionSocket] Failed to save emotion event:', err.message);
        // Don't emit error to client - analysis was successful
      });
    });

    // ── Disconnect Handler ────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[emotionSocket] ❌ Disconnected: child="${childname}" reason="${reason}" socket=${socket.id}`);
    });

    // ── Error Handler ────────────────────────────────────────────────────
    socket.on('error', (error) => {
      console.error(`[emotionSocket] Socket error from ${childname}:`, error);
    });
  });

  // ── Socket.io Error Handler ───────────────────────────────────────────────
  io.engine.on('connection_error', (error) => {
    console.error('[emotionSocket] Connection error:', error);
  });
}
module.exports = { registerEmotionSocket };
