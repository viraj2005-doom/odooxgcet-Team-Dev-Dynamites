const express = require('express');
const router = express.Router();
const { 
  registerCompany, 
  login, 
  getMe, 
  changePassword, 
  logout,
  verifyEmail,
  resendVerificationEmail 
} = require('../controllers/authController');
const { protect, checkFirstLogin } = require('../middleware/auth');
const { companyRegistrationRules, loginRules, passwordChangeRules, validate } = require('../middleware/validators');
const { uploadCompanyLogo } = require('../middleware/upload');

// Public routes
router.post('/register', uploadCompanyLogo, companyRegistrationRules, validate, registerCompany);
router.post('/login', loginRules, validate, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes
router.get('/me', protect, getMe);
router.put('/change-password', protect, passwordChangeRules, validate, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
