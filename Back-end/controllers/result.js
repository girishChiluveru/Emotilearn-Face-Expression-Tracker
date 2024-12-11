
const {analysisResults}=require('./process');


async function handleResult(req, res) {
    res.json(analysisResults);
}

module.exports={
    handleResult
}