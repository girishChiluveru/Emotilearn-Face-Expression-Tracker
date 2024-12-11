const fs=require('fs');
const path=require('path');
const reports=require('../models/report');

async function handleLoginDetails(req,res){
    const { childName, sessionId } = req.body;
    try {
        await reports.create({
            childname: childName,
            sessionid: sessionId
        });
        res.status(200).json({ message: 'Login details saved successfully' });
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports={
    handleLoginDetails
}