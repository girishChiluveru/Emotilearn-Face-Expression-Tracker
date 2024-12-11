const reports = require('../models/report');
// Controller to handle fetching reports
async function handleReport(req, res) {
    try {
        // Fetch all reports and include necessary nested fields
        const report = await reports.find({}, 'childname sessions.sessionId sessions.isProcessed sessions.images.imgpath sessions.images.screenshotpath sessions.images.emotions sessions.images.max_emotion_img sessions.scores');

        // If no reports found, return a 404 response
        if (!report || report.length === 0) {
            return res.status(404).json({ error: "No reports found." });
        }

        // Group the data by childname
        const groupedReports = report.map(r => {
            return {
                childname: r.childname,
                sessions: r.sessions.map(session => ({
                    sessionid: session.sessionId,
                    isProcessed: session.isProcessed,
                    images: session.images.map(image => ({
                        imgpath: image.imgpath,
                        screenshotpath: image.screenshotpath,
                        emotions: image.emotions, // Include emotions
                        max_emotion_img: image.max_emotion_img // Include max emotion image
                    })),
                    scores: session.scores
                }))
            };
        });

        // Send the grouped data as an array to the front-end
        res.status(200).json(groupedReports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function handleSpecificSession(req, res) {
    const { childName, sessionID } = req.params;

    try {
        // Query the database for the specific child and session ID
        const report = await reports.findOne(
            {
                childname: childName, // Match the child name
                "sessions.sessionId": sessionID // Match the session ID in the sessions array
            },
            {
                _id: 0, // Exclude the _id field if not needed
                "sessions": { $elemMatch: { sessionId: sessionID } } // Extract only the specific session
            }
        );

        // If no matching session is found, return a 404 response
        if (!report || !report.sessions || report.sessions.length === 0) {
            return res.status(404).json({ error: "No report found for the specified child and session." });
        }

        // Respond with the matching session details
        res.status(200).json(report.sessions[0]); // Return only the session object
    } catch (error) {
        console.error("Error fetching specific session:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}



module.exports = {
    handleReport,
    handleSpecificSession,
};

