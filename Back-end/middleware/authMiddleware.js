/**
 * authMiddleware.js
 * ================
 * JWT authentication middleware for protected routes
 */

const { verifyToken, refreshToken } = require('../utils/jwtUtils');

/**
 * Verify JWT token from request
 * Supports: Authorization header, cookies, or body
 */
function authMiddleware(req, res, next) {
  try {
    // Get token from header
    let token = req.headers.authorization?.replace('Bearer ', '');

    // Or get from cookie
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    // Or get from body (for WebSocket init)
    if (!token && req.body?.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    req.user = decoded;

    // Check if token should be refreshed
    const newToken = refreshToken(token);
    if (newToken) {
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.setHeader('X-New-Token', newToken);
    }

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message,
    });
  }
}

/**
 * Optional auth - doesn't fail if token is missing
 */
function optionalAuthMiddleware(req, res, next) {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }

  next();
}

/**
 * Admin-only middleware
 * Must be used after authMiddleware
 */
function adminOnlyMiddleware(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminOnlyMiddleware,
};
