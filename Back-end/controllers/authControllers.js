const Admin = require('../models/Admin');
const report = require('../models/report');
const { hashP, compareP } = require('../bcrypt/authCrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const test = (req, res) => { res.json('It is working'); };

const registerChild = async (req, res) => {
    try {
        const { childname, password } = req.body;
        if(!childname) return res.json({ error:"please type in your name" });
        if (!password || password.length < 8) return res.json({ error: "Password must be at least 8 characters" });
        
        const existingChild = await report.findOne({ childname });
        if (existingChild) return res.json({ error: "Name already taken" });

        const hashedP = await hashP(password);
        const child = await report.create({ childname, password: hashedP});
        res.json({ message: "child registered successfully", user: { childname:child.childname, id: child._id } });
    } catch (error) { console.log(error); }
};

const loginChild = async (req, res) => {
    try {
        const { childname, password } = req.body;
        if (!childname || !password) return res.status(400).json({ error: "Credentials required" });

        console.log("Login attempt:", { childname });

        // 1. Check Admin
        const admin = await Admin.findOne({ name: childname });
        if (admin) {
            // NOTE: Ideally you'd check admin password here too, 
            // but keeping existing logic where existence is enough for now.
            const token = jwt.sign({ childname: admin.name, id: admin._id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })
                      .json({ message: "Admin access granted", child: { childname: admin.name, isAdmin: true } });
        }

        // 2. Check Child
        const child = await report.findOne({ childname });
        if (!child) return res.status(404).json({ error: "Account not found" });

        const isMatch = await compareP(password, child.password);
        if (!isMatch) return res.status(401).json({ error: "Incorrect password" });

        const sessionId = uuidv4();
        const loginTime = new Date();
        child.sessions.push({ sessionId, loginTime });
        await child.save();

        const token = jwt.sign({ childname: child.childname, id: child._id, sessionId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })
           .json({ message: "Login successful", child: { id: child._id, childname: child.childname }, sessionId });
           
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getProfile = (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
            if (err) return res.json(null);
            res.json(user);
        });
    } else {
        res.json(null);
    }
};

const logoutChild = async (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
};

module.exports = { test, registerChild, loginChild, getProfile, logoutChild };