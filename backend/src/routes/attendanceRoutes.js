const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getAllAttendance,
  getAttendanceReports
} = require('../controllers/attendanceController');
const { protect, adminOnly, checkFirstLogin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);
router.use(checkFirstLogin);

// Employee attendance actions
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayAttendance);
router.get('/my', getMyAttendance);

// Admin routes
router.get('/', adminOnly, getAllAttendance);
router.get('/reports', adminOnly, getAttendanceReports);

module.exports = router;
