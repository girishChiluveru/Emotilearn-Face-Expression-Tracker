const reports = require('../models/report'); // Adjust the path as needed

const handleStoreEmotions = async (req, res) => {
    const { childName, sessionId, result } = req.body;
    //console.log("Received data:\n", req.body);

    if (!childName || !sessionId || !Array.isArray(result)) {
        return res.status(400).json({ error: 'childName, sessionId, and result array are required' });
    }

    try {
        const report = await reports.findOne({
            childname: childName,
            "sessions.sessionId": sessionId
        });

        if (!report) {
            return res.status(404).json({ error: 'No matching report found' });
        }

        const session = report.sessions.find(s => s.sessionId === sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        result.forEach(({ file, emotions = {}, dominant_emotion, dominant_score }) => {
            const imagePath = `photos\\${childName}\\${sessionId}\\${file}`;
            //console.log(`Processing image path: ${imagePath}`);

            const image = session.images.find(img => img.imgpath === imagePath);

            if (image) {
               // console.log(`Image found: ${image.imgpath}`);
                //console.log(`Current emotions:, image.emotions`);

                image.emotions = {
                    angry: parseFloat(emotions.angry) || 0,
                    disgust: parseFloat(emotions.disgust) || 0,
                    fear: parseFloat(emotions.fear) || 0,
                    happy: parseFloat(emotions.happy) || 0,
                    sad: parseFloat(emotions.sad) || 0,
                    surprise: parseFloat(emotions.surprise) || 0,
                    neutral: parseFloat(emotions.neutral) || 0
                };

                //console.log(`Updated emotions:, image.emotions`);

                image.max_emotion_img = {
                    emotion: dominant_emotion || 'neutral',
                    score: parseFloat(dominant_score) || 0
                };

                //console.log(`Updated max_emotion_img:, image.max_emotion_img`);
            } else {
                //console.warn(`Image not found for path: ${imagePath}`);
            }
        });

        session.isProcessed = true;

        await report.save();

        res.status(200).json({
            message: 'Emotions stored successfully and session marked as processed',
            report
        });
    } catch (error) {
        console.error('Error updating emotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { handleStoreEmotions };