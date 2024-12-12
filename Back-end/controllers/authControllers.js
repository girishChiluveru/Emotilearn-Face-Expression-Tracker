const Admin = require('../models/Admin'); // Ensure case matches the filename
const report = require('../models/report'); // Ensure consistency with Report
const { hashP, compareP } = require('../bcrypt/authCrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');



const test = (req, res) => {
    res.json('It is working');
};

const registerChild = async (req, res) => {
    try {
        const { childname, password } = req.body;

        if(!childname){
            return res.json({
                error:"please type in your name"
            })
        }

        
        if (!password || password.length < 8) {
            return res.json({
                error: "Password is required and must be at least 8 characters long"
            });
        }

        
        const existingChild = await report.findOne({ childname });
        if (existingChild) {
            return res.json({
                error: "Your name is already being used, try adding a number at the end"
            });
        }

        const hashedP= await hashP(password)

        
        const child = await report.create({ childname, password: hashedP});

        
        res.json({
            message: "child registered successfully",
            user: {
                childname:child.childname,
                id: child._id,
            }
        });
        
    } catch (error) {
        console.log(error);
    }
};

const loginChild = async (req, res) => {
    try {
        const { childname, password } = req.body;

        if (!childname || !password) {
            return res.status(400).json({ error: "Childname and password are required" });
        }

        console.log("Login attempt:", { childname });

        // Check if the user is an admin
        const admin = await Admin.findOne({ name: childname });
        if (admin) {
            console.log("Admin login detected");
            return res.json({ message: "Admin access granted",
                isAdmin:true
             });
        }

        // Check if the user is a registered child
        const child = await report.findOne({ childname });
        if (!child) {
            console.log("Child not found:", childname);
            return res.status(404).json({ error: "Account not found" });
        }

        // Verify password
        const isPasswordCorrect = await compareP(password, child.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Generate session ID and login time
        const sessionId = uuidv4();
        const loginTime = new Date();

        // Save session data
        child.sessions.push({ sessionId, loginTime });
        await child.save();

        // Sign JWT
        jwt.sign(
            {
                childname: child.childname,
                id: child._id,
                loginTime: loginTime.toISOString(),
                sessionId,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token valid for 1 hour
            (err, token) => {
                if (err) {
                    console.error("JWT signing error:", err);
                    return res.status(500).json({ error: "Failed to generate token" });
                }

                // Set token as an HTTP-only cookie
                res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' }).json({
                    message: "Login successful",
                    child: {
                        id: child._id,
                        childname: child.childname,
                    },
                    sessionId,
                });
            }
        );
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const getProfile =(req,res)=>{

const {token} =req.cookies
if(token){
    jwt.verify(token,process.env.JWT_SECRET,{},(err,child)=>{
        if(err) throw err;
        console.log(child)
        res.json(child)
    })
}else{
    console.log(child)
    res.json(null)
}
};

const logoutChild = async (req, res) => {
    const { token } = req.cookies;
    
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) return res.status(401).json({ error: 'Invalid token' });

            const child = await report.findById(decoded.id);
            if (child) {
                
                const lastSession = child.sessions[child.sessions.length - 1];
                if (lastSession) {
                    lastSession.logoutTime = new Date();
                }

                await child.save();

                res.clearCookie('token');
                return res.json({ message: 'Logged out successfully' });
            }
        });
    } else {
        return res.status(400).json({ error: 'No token found' });
    }
};


module.exports = {
    test,
    registerChild,
    loginChild,
    getProfile,
    logoutChild,

};