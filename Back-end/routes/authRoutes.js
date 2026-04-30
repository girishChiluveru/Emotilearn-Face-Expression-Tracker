const express = require('express')
const router = express.Router() 
const {
  test,
  registerChild,
  loginChild,
  getProfile,
  logoutChild,
  adminLogin
} = require('../controllers/authControllers')
const path = require('path');





router.get('/', test)     
router.post('/register', registerChild)
router.post('/login',loginChild)
router.get('/profile',getProfile)
router.post('/logout', logoutChild)
router.post('/admin/login', adminLogin)


module.exports = router