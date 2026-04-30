const Admin = require('../models/admin');
const Report = require('../models/report');
const { hashP, compareP } = require('../bcrypt/authCrypt');
const { generateToken, refreshToken } = require('../utils/jwtUtils');
const { v4: uuidv4 } = require('uuid');

/**
 * Test endpoint - indicates server is running
 */
const test = (req, res) => {
  res.json({ status: 'Server is working', timestamp: new Date() });
};

/**
 * Admin login
 * POST /admin/login
 * Body: { id, password }
 */
const adminLogin = async (req, res) => {
  try {
    const { id, password } = req.body;

    // Check hardcoded admin (only in development)
    if (process.env.NODE_ENV === 'development') {
      const ADMIN_ID = process.env.ADMIN_DEFAULT_ID || 'admin@emotilearn.com';
      const ADMIN_PASS = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';

      if (id === ADMIN_ID && password === ADMIN_PASS) {
        const token = generateToken({
          id: 'admin-001',
          childname: 'Super Admin',
          isAdmin: true,
          email: ADMIN_ID,
        });

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });

        return res.json({
          message: 'Super Admin access granted',
          token,
          user: {
            id: 'admin-001',
            childname: 'Super Admin',
            isAdmin: true,
          },
        });
      }
    }

    // Check MongoDB admin collection
    const admin = await Admin.findOne({ name: id });
    if (!admin) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin not found',
      });
    }

    // Verify password
    const isMatch = await compareP(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken({
      id: admin._id.toString(),
      childname: admin.name,
      isAdmin: true,
      email: admin.email,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Admin access granted',
      token,
      user: {
        id: admin._id,
        childname: admin.name,
        isAdmin: true,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

/**
 * Register Child
 * POST /register
 * Body: { childname, password }
 */
const registerChild = async (req, res) => {
  try {
    const { childname, password } = req.body;

    // Check if child already exists
    const existingChild = await Report.findOne({ childname });
    if (existingChild) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Name already taken',
      });
    }

    // Hash password
    const hashedPassword = await hashP(password);

    // Create child record
    const child = await Report.create({
      childname,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = generateToken({
      id: child._id.toString(),
      childname: child.childname,
      isAdmin: false,
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Child registered successfully',
      token,
      user: {
        id: child._id,
        childname: child.childname,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

/**
 * Login Child
 * POST /login
 * Body: { childname, password }
 */
const loginChild = async (req, res) => {
  try {
    const { childname, password } = req.body;

    console.log('[LOGIN] Attempt:', { childname });

    // Check if admin user
    const admin = await Admin.findOne({ name: childname });
    if (admin) {
      const isMatch = await compareP(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }

      const token = generateToken({
        id: admin._id.toString(),
        childname: admin.name,
        isAdmin: true,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        message: 'Admin access granted',
        token,
        user: {
          id: admin._id,
          childname: admin.name,
          isAdmin: true,
        },
      });
    }

    // Check child account
    const child = await Report.findOne({ childname });
    if (!child) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Account not found',
      });
    }

    // Verify password
    const isMatch = await compareP(password, child.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Create session
    const sessionId = uuidv4();
    const loginTime = new Date();
    child.sessions.push({
      sessionId,
      loginTime,
      isProcessed: false,
    });
    await child.save();

    // Generate token
    const token = generateToken({
      id: child._id.toString(),
      childname: child.childname,
      sessionId,
      isAdmin: false,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log('[LOGIN] Success:', { childname, sessionId });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: child._id,
        childname: child.childname,
        sessionId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

/**
 * Get Current User Profile
 * GET /profile
 * Requires: Valid JWT token
 */
const getProfile = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No user logged in',
    });
  }

  res.json({
    user: req.user,
    timestamp: new Date(),
  });
};

/**
 * Refresh Token
 * POST /refresh
 * Requires: Valid JWT token
 */
const refreshTokenEndpoint = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No user logged in',
    });
  }

  const newToken = generateToken({
    id: req.user.id,
    childname: req.user.childname,
    isAdmin: req.user.isAdmin,
  });

  res.cookie('token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    message: 'Token refreshed',
    token: newToken,
  });
};

/**
 * Logout Child
 * POST /logout
 * Requires: Valid JWT token
 */
const logoutChild = async (req, res) => {
  try {
    // Clear token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Invalidate session in database if needed
    if (req.user?.sessionId) {
      const child = await Report.findById(req.user.id);
      if (child) {
        const session = child.sessions.id(req.user.sessionId);
        if (session) {
          session.logoutTime = new Date();
        }
        await child.save();
      }
    }

    res.json({
      message: 'Logged out successfully',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

module.exports = {
  test,
  registerChild,
  loginChild,
  getProfile,
  refreshTokenEndpoint,
  logoutChild,
  adminLogin,
};