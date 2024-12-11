const fs = require('fs');
const path = require('path');
const reports = require('../models/report');


let analysisResults = [];

async function handleProcess(req, res) {
    const { sessionId, childName } = req.body;

    if (!sessionId || !childName) {
        return res.status(400).json({ error: 'sessionId and childName are required' });
    }

    try {
        // Construct the folder path dynamically
        const photosBasePath = path.join(__dirname, '..', 'photos'); // Adjust the base folder if needed
        const folderPath = path.join(photosBasePath, childName, sessionId);
        //console.log(folderPath);
        // Check if the folder path exists
        if (!fs.existsSync(folderPath)) {
            console.error(`Error: Incoming path does not exist: ${folderPath}`);
            return res.status(400).json({ error: 'Invalid folder path' });
        }

        // hugging face-vit
        const response = await fetch('http://localhost:3000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderPath }),
        });

        // //  Call the Flask API with the folder path
        // const response = await fetch(
        //   `http://127.0.0.1:5000/analyze_emotions?folder_path=${encodeURIComponent(folderPath)}`
        // );
        const result = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: result.error || 'Error analyzing emotions',
            });
        }

        // Save the result in memory or any desired storage
        analysisResults.push({ sessionId, childName, result });

        try {
            const storeResponse = await fetch('http://localhost:3000/store-emotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ childName, sessionId, result })
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                console.error("Validation Error:", error.message);
                // Handle the validation error (e.g., return a response to the client)
            } else {
                console.error("An unexpected error occurred:", error);
                // Handle other types of errors
            }
        }

        return res.status(200).json({
            message: 'Analysis processed successfully',
            data: result,
        });
    } catch (error) {
        console.error('Error analyzing session:', error);
        return res.status(500).json({ error: 'Error processing analysis' });
    }



}

module.exports = {
    handleProcess,
    analysisResults
}