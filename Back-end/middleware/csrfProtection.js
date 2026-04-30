/**
 * csrfProtection.js
 * ================
 * CSRF (Cross-Site Request Forgery) protection middleware
 * Implements double-submit cookie pattern with token validation
 */

const crypto = require('crypto');

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_NAME = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = '__csrf_token';

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
function generateCSRFToken() {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * CSRF middleware - Generate token for GET requests
 */
function csrfTokenMiddleware(req, res, next) {
  // Generate token if not exists
  if (!req.cookies[CSRF_COOKIE_NAME]) {
    const token = generateCSRFToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be accessible to client JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    res.locals.csrfToken = token;
  } else {
    res.locals.csrfToken = req.cookies[CSRF_COOKIE_NAME];
  }

  next();
}

/**
 * CSRF verification middleware - Verify token on state-changing requests
 * Apply only to POST, PUT, DELETE, PATCH requests
 */
function csrfVerifyMiddleware(req, res, next) {
  // Skip verification for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get token from header or body
  const tokenFromHeader = req.headers[CSRF_TOKEN_NAME.toLowerCase()];
  const tokenFromBody = req.body?._csrf;
  const clientToken = tokenFromHeader || tokenFromBody;

  // Get token from cookie
  const cookieToken = req.cookies[CSRF_COOKIE_NAME];

  if (!clientToken || !cookieToken) {
    return res.status(403).json({
      error: 'CSRF validation failed',
      message: 'Missing CSRF token',
    });
  }

  // Verify tokens match (double-submit cookie)
  if (clientToken !== cookieToken) {
    return res.status(403).json({
      error: 'CSRF validation failed',
      message: 'Token mismatch',
    });
  }

  // Token is valid
  res.locals.csrfTokenValid = true;
  next();
}

/**
 * Get CSRF token endpoint
 * Client calls this to get a fresh CSRF token
 */
function getCsrfTokenRoute(req, res) {
  const token = generateCSRFToken();
  
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    csrfToken: token,
    headerName: CSRF_TOKEN_NAME,
  });
}

module.exports = {
  generateCSRFToken,
  csrfTokenMiddleware,
  csrfVerifyMiddleware,
  getCsrfTokenRoute,
  CSRF_TOKEN_NAME,
  CSRF_COOKIE_NAME,
};
