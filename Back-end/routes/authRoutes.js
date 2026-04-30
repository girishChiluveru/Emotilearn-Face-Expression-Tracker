const express = require('express');
const router = express.Router();
const {
  test,
  registerChild,
  loginChild,
  getProfile,
  refreshTokenEndpoint,
  logoutChild,
  adminLogin,
} = require('../controllers/authControllers');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/', test);
router.post('/register', registerChild);
router.post('/login', loginChild);
router.post('/admin/login', adminLogin);

// ── Protected Routes ──────────────────────────────────────────────────────────
router.get('/profile', getProfile);
router.post('/refresh', refreshTokenEndpoint);
router.post('/logout', logoutChild);

// ── Export functions for use in server.js ─────────────────────────────────────
module.exports = router;
module.exports.registerChild = registerChild;
module.exports.loginChild = loginChild;
module.exports.adminLogin = adminLogin;
module.exports.getProfile = getProfile;
module.exports.logoutChild = logoutChild;