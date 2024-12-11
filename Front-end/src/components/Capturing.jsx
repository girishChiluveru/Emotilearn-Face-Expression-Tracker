/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
// /* eslint-disable no-unused-vars */
import  { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';

const Capturing = ({ 
    childName, 
    sessionId, 
    gameId, 
    captureInterval = 4000, 
    screenshotInterval = 4000, 
    uploadUrl = 'http://localhost:3000/photos' 
}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const timerCapture = useRef(null);
    const streamRef = useRef(null); // Reference to the video stream
    const [startTime, setStartTime] = useState(Date.now());
    const [capturing, setCapturing] = useState(true);

    useEffect(() => {
        if (!childName || !sessionId || !gameId) {
            alert("Missing required session information. Please log in again.");
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoRef.current.srcObject = stream;
                streamRef.current = stream; // Store the stream reference
                setStartTime(Date.now());
                startCaptureIntervals();
            })
            .catch(error => console.error("Video capture error:", error));

        return () => stopCaptureIntervals();
    }, [childName, sessionId, gameId]);

    const startCaptureIntervals = () => {
        timerCapture.current = setInterval(() => {
            captureImageAndScreenshot();
        }, Math.min(captureInterval, screenshotInterval));
    };

    const stopCaptureIntervals = () => {
        if (timerCapture.current) clearInterval(timerCapture.current);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null; // Clear the stream reference
        }

        setCapturing(false); // Update state to reflect stopped capturing
    };

    const captureImageAndScreenshot = async () => {
        if (canvasRef.current && videoRef.current) {
            // Generate shared identifier for image and screenshot pair
            const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
            const pairId = `${timeElapsed}-${gameId}`; // Unique identifier

            // Capture image from webcam
            const context = canvasRef.current.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, 640, 480);
            const imageData = canvasRef.current.toDataURL('image/png');
            const imageFilename = `${pairId}-image.png`;

            // Capture screenshot of the webpage
            const screenshotData = await html2canvas(document.body).then(canvas => canvas.toDataURL('image/png'));
            const screenshotFilename = `${pairId}-screenshot.png`;

            // Upload both the image and screenshot with shared pairId
            uploadImage(imageData, imageFilename, screenshotFilename, screenshotData);
        }
    };

    const uploadImage = (imageData, imageFilename, screenshotFilename, screenshotData) => {
        fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: imageData,
                filename: imageFilename,
                screenshot: screenshotData,
                screenshotFilename: screenshotFilename,
                childName: childName,
                sessionId: sessionId,
                gameId: gameId
            })
        })
        .then(response => response.json())
        .then(data => console.log('Upload response:', data))
        .catch(error => console.error('Upload error:', error));
    };

    return (
        <div>
            <video ref={videoRef} autoPlay style={{ display: 'none' }} />
            <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
        </div>
    );
};

Capturing.propTypes = {
    childName: PropTypes.string.isRequired,
    sessionId: PropTypes.string.isRequired,
    gameId: PropTypes.string.isRequired,
    captureInterval: PropTypes.number,
    screenshotInterval: PropTypes.number,
    uploadUrl: PropTypes.string
};

export default Capturing;