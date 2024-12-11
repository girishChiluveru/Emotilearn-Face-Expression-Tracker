// File: imageAnalysisService.js

const fs = require("fs");
const path = require("path");
const os = require("os");
require('dotenv').config(); 
// Constants
const API_URL = "https://api-inference.huggingface.co/models/trpakov/vit-face-expression";
const API_TOKEN = process.env.API_TOKEN;

// Helper to read a file
async function readFileAsync(filePath) {
    return fs.promises.readFile(filePath);
}

// Helper to send image data to the Hugging Face API
async function sendToAPI(fileBuffer) {
    const fetch = (await import("node-fetch")).default;

    const response = await fetch(API_URL, {
        headers: {
            Authorization: API_TOKEN,
            "Content-Type": "application/octet-stream",
        },
        method: "POST",
        body: fileBuffer,
    });

    if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
    }
    return response.json();
}

// Analyze a single image
async function analyzeImage(filePath) {
    const fileBuffer = await readFileAsync(filePath);
    const result = await sendToAPI(fileBuffer);

    if (!Array.isArray(result) || result.length === 0) {
        throw new Error("Invalid API response format");
    }

    // Transform API result to the desired format
    const emotions = {};
    let dominantEmotion = { emotion: "", score: 0 };

    result.forEach(({ label, score }) => {
        const percentageScore = (score * 100).toFixed(2);
        emotions[label] = percentageScore;

        if (score > dominantEmotion.score) {
            dominantEmotion = { emotion: label, score: percentageScore };
        }
    });

    return {
        dominant_emotion: dominantEmotion.emotion,
        dominant_score: dominantEmotion.score,
        emotions,
    };
}

// Analyze all images in a folder
async function analyzeFolder(folderPath, maxConcurrent = os.cpus().length) {
    if (!fs.existsSync(folderPath)) {
        throw new Error(`Directory not found: ${folderPath}`);
    }

    const files = fs.readdirSync(folderPath).filter(
        (file) => /\.(png|jpg|jpeg|bmp)$/i.test(file) && !file.toLowerCase().startsWith("screenshot")
    );

    if (files.length === 0) {
        throw new Error("No valid images found in directory");
    }

    const filePaths = files.map((file) => path.join(folderPath, file));
    const results = [];
    const semaphore = Array(maxConcurrent).fill(Promise.resolve());

    for (const filePath of filePaths) {
        const task = async () => {
            try {
                const analysis = await analyzeImage(filePath);
                results.push({ ...analysis, file: path.basename(filePath) });
            } catch (error) {
                results.push({ error: error.message, file: path.basename(filePath) });
            }
        };

        const currentTask = semaphore.shift().then(task);
        semaphore.push(currentTask);
    }

    await Promise.all(semaphore);
    return results;
}

// Controller for folder analysis (for integration with an API)
async function analyzeFolderController(req, res) {
    try {
        const { folderPath } = req.body;

        if (!folderPath) {
            return res.status(400).json({ error: "Folder name is required" });
        }

        const analysisResults = await analyzeFolder(folderPath);
        return res.json(analysisResults);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}

// Exporting functions for external usage
module.exports = {
    analyzeImage,
    analyzeFolder,
    analyzeFolderController,
};

// Example usage for standalone testing
if (require.main === module) {
    const folderPath = "./images"; // Replace with your folder path
    analyzeFolder(folderPath, 8) // Adjust concurrency if needed
        .then((results) => {
            console.log(JSON.stringify(results, null, 2));
        })
        .catch((error) => {
            console.error("Error:", error.message);
        });
}
