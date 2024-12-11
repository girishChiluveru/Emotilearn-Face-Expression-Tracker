const report = require("../models/report");
const{hashP,compareP} =require('../bcrypt/authCrypt');
const jwt =require('jsonwebtoken');
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

        const child = await report.findOne({ childname });
        if (!child) {
            return res.json({
                error: 'You do not have an account'
            });
        }

        const match = await compareP(password, child.password);
        if (match) {
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
                  sessionId: sessionId, // Include sessionId in the token payload
              },
              process.env.JWT_SECRET,
              {},
              (err, token) => {
                  if (err) throw err;
      
                  // Send response
                  res.cookie('token', token, { httpOnly: true }).json({
                      child: {
                          id: child._id,
                          childname: child.childname,
                      },
                      sessionId, // Include sessionId here
                  });
              }
          );
      }
       else {
            res.json({
                error: "Incorrect password"
            });
        }
    } catch (error) {
        console.log(error);
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