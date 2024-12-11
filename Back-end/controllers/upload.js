const fs=require('fs');
const path=require('path');
const reports=require('../models/report');

async function handleUploading(req, res) {
    const { image, filename, screenshot, screenshotFilename, childName, sessionId } = req.body;

    if (!image || !filename || !screenshot || !screenshotFilename || !childName || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const imagesDirectory = path.join(__dirname, '..', 'photos');
    const childDirectory = path.join(imagesDirectory, childName);
    const sessionDirectory = path.join(childDirectory, sessionId);

    if (!fs.existsSync(sessionDirectory)) {
        fs.mkdirSync(sessionDirectory, { recursive: true });
    }

    // Decode and save image
    const base64Image = image.replace(/^data:image\/png;base64,/, "");
    const imagePath = path.join(sessionDirectory, filename);
    fs.writeFileSync(imagePath, base64Image, 'base64');

    // Decode and save screenshot
    const base64Screenshot = screenshot.replace(/^data:image\/png;base64,/, "");
    const screenshotPath = path.join(sessionDirectory, screenshotFilename);
    fs.writeFileSync(screenshotPath, base64Screenshot, 'base64');

    try {
        const relativeImagePath = path.join('photos', childName, sessionId, filename);
        const relativeScreenshotPath = path.join('photos', childName, sessionId, screenshotFilename);

        // Check for duplicates
        const existingReport = await reports.findOne({
            childname: childName,
            "sessions.sessionId": sessionId,
            "sessions.images.imgpath": relativeImagePath,
        });

        if (existingReport) {
            return res.status(200).json({ success: false, message: 'Duplicate image path' });
        }

        // Update MongoDB with image and screenshot pair
        await reports.findOneAndUpdate(
            { childname: childName, "sessions.sessionId": sessionId },
            { $push: { "sessions.$.images": { imgpath: relativeImagePath, screenshotpath: relativeScreenshotPath } } },
            { new: true, upsert: true }
        );

        res.json({ success: true, message: 'Files saved successfully' });
    } catch (error) {
        console.error("Error saving files:", error);
        res.status(500).json({ error: 'Error saving files or updating database' });
    }
}

module.exports={
        handleUploading
    }