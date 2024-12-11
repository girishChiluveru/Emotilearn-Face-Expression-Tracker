const express = require('express')
const router = express.Router() 
const {
  test,
  registerChild,
  loginChild,
  getProfile,
  logoutChild,
} = require('../controllers/authControllers')
const path = require('path');





router.get('/', test)     
router.post('/register', registerChild)
router.post('/login',loginChild)
router.get('/profile',getProfile)
router.post('/logout', logoutChild)


module.exports = router