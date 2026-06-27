/* eslint-disable react-hooks/exhaustive-deps */
/**
 * EmotionTracker.jsx
 * ------------------
 * Replaces the old Capturing component.
 *
 * What it does:
 *  1. Opens the webcam stream (hidden video element)
 *  2. Runs MediaPipe FaceMesh on every video frame (~30fps)
 *  3. Throttles to one Socket.io emission every EMIT_INTERVAL_MS
 *  4. Flattens 468 landmarks × (x,y,z) → 1404 floats and emits 'landmarks'
 *  5. Listens for 'emotion_result' from the server and calls onEmotion()
 *  6. Cleans up camera + socket on unmount
 *
 * Props:
 *   childname   {string}   - logged-in child's name (for socket auth)
 *   sessionId   {string}   - current session ID (for socket auth)
 *   gameId      {string}   - "quiz" | "animal" | "memory"
 *   qid         {string}   - current question / round identifier
 *   onEmotion   {function} - (emotion: string, probabilities: object) => void
 */

import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
const EMIT_INTERVAL_MS = 600; // throttle: one emotion sample every 600ms

const EmotionTracker = ({ childname, sessionId, gameId, qid, onEmotion }) => {
    const videoRef      = useRef(null);
    const socketRef     = useRef(null);
    const cameraRef     = useRef(null);
    const lastEmitRef   = useRef(0);
    // Keep latest qid accessible inside the FaceMesh callback without stale closure
    const qidRef        = useRef(qid);
    const gameIdRef     = useRef(gameId);

    useEffect(() => { qidRef.current = qid; }, [qid]);
    useEffect(() => { gameIdRef.current = gameId; }, [gameId]);

    // ── Socket.io connection ─────────────────────────────────────────────────
    useEffect(() => {
        if (!childname || !sessionId) return;

        const socket = io(WS_URL, {
            query: { childname, sessionId },
            transports: ['websocket'],
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('[EmotionTracker] Socket connected:', socket.id);
        });

        socket.on('emotion_result', ({ emotion, probabilities }) => {
            if (onEmotion) onEmotion(emotion, probabilities);
        });

        socket.on('emotion_error', ({ message }) => {
            console.warn('[EmotionTracker] Server error:', message);
        });

        socket.on('disconnect', (reason) => {
            console.log('[EmotionTracker] Disconnected:', reason);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [childname, sessionId]);

    // ── MediaPipe FaceMesh ───────────────────────────────────────────────────
    const onResults = useCallback((results) => {
        if (!results.multiFaceLandmarks?.length) return;
        if (!socketRef.current?.connected) return;

        const now = Date.now();
        if (now - lastEmitRef.current < EMIT_INTERVAL_MS) return;
        lastEmitRef.current = now;

        // Flatten [{ x, y, z }, ...] → [x0, y0, z0, x1, y1, z1, ...]
        const landmarks = results.multiFaceLandmarks[0].flatMap(({ x, y, z }) => [x, y, z]);

        socketRef.current.emit('landmarks', {
            landmarks,
            gameId: gameIdRef.current,
            qid:    qidRef.current,
        });
    }, []);

    useEffect(() => {
        if (!videoRef.current) return;

        const faceMesh = new FaceMesh({
            locateFile: (file) => `/face_mesh/${file}`,
        });

        faceMesh.setOptions({
            maxNumFaces:           1,
            refineLandmarks:       false, // true gives 478 pts — we keep 468 for model compat
            minDetectionConfidence: 0.5,
            minTrackingConfidence:  0.5,
        });

        faceMesh.onResults(onResults);

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                await faceMesh.send({ image: videoRef.current });
            },
            width: 640,
            height: 480,
        });

        camera.start();
        cameraRef.current = camera;

        return () => {
            camera.stop();
            faceMesh.close();
            cameraRef.current = null;
        };
    }, [onResults]);

    // Hidden — no visible UI
    return (
        <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ display: 'none' }}
        />
    );
};

EmotionTracker.propTypes = {
    childname:  PropTypes.string.isRequired,
    sessionId:  PropTypes.string.isRequired,
    gameId:     PropTypes.string.isRequired,
    qid:        PropTypes.string.isRequired,
    onEmotion:  PropTypes.func,
};

EmotionTracker.defaultProps = {
    onEmotion: () => {},
};

export default EmotionTracker;
