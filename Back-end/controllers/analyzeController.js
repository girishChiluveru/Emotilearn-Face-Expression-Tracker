const { analyzeFolder } = require('../models/imageAnalysis');
async function analyzeFolderController(req, res) {
    try {
        
        const { folderPath } = req.body;
        console.log('folderPath:', folderPath);
        if (!folderPath) {
            return res.status(400).json({ error: "Folder name is required" });
        }
        const analysisResults = await analyzeFolder(folderPath);
        //console.log(analysisResults);
        return res.json(analysisResults );
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}





module.exports = {
    analyzeFolderController,
};
