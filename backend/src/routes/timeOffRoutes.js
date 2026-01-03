const express = require('express');
const router = express.Router();
const {
  createTimeOffRequest,
  getMyTimeOffRequests,
  getAllTimeOffRequests,
  reviewTimeOffRequest,
  cancelTimeOffRequest,
  getTimeOffSummary,
  getBalance
} = require('../controllers/timeOffController');
const { protect, adminOnly, checkFirstLogin } = require('../middleware/auth');
const { timeOffRequestRules, validate } = require('../middleware/validators');
const { uploadTimeOffAttachment } = require('../middleware/upload');

// All routes require authentication
router.use(protect);
router.use(checkFirstLogin);

// Employee routes
router.post('/', uploadTimeOffAttachment, timeOffRequestRules, validate, createTimeOffRequest);
router.get('/my', getMyTimeOffRequests);
router.get('/balance', getBalance);
router.get('/summary/:userId?', getTimeOffSummary);
router.delete('/:id', cancelTimeOffRequest);

// Admin routes
router.get('/', adminOnly, getAllTimeOffRequests);
router.put('/:id/review', adminOnly, reviewTimeOffRequest);

module.exports = router;
