/**
 * jwtUtils.js
 * ============
 * JWT token generation and verification utilities
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @param {string} expiresIn - Token expiration time (default: 24h)
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = JWT_EXPIRY) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256',
    issuer: 'emotilearn',
    audience: 'emotilearn-client',
  });
}

/**
 * Verify JWT token
 * @param {string} token - Token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'emotilearn',
      audience: 'emotilearn-client',
    });
  } catch (error) {
    const errorMessages = {
      'JsonWebTokenError': 'Invalid token',
      'TokenExpiredError': 'Token has expired',
      'NotBeforeError': 'Token not yet valid',
    };
    throw new Error(errorMessages[error.name] || error.message);
  }
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - Token to decode
 * @returns {Object} Decoded payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Refresh token (issue new token if old one is expiring)
 * @param {string} oldToken - Old token
 * @returns {string|null} New token or null if not needed
 */
function refreshToken(oldToken) {
  try {
    const decoded = decodeToken(oldToken);
    if (!decoded) return null;

    // Get time until expiration
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    // If token expires in less than 1 hour, refresh it
    if (expiresIn < 3600) {
      const { iat, exp, ...payload } = decoded;
      return generateToken(payload);
    }
    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken,
  JWT_SECRET,
  JWT_EXPIRY,
};
