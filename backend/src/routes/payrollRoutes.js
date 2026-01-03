const express = require('express');
const router = express.Router();
const {
  getSalaryInfo,
  updateSalaryInfo,
  calculatePayslip,
  getPayrollSummary
} = require('../controllers/payrollController');
const { protect, adminOnly, checkFirstLogin } = require('../middleware/auth');
const { salaryUpdateRules, validate } = require('../middleware/validators');

// All routes require authentication
router.use(protect);
router.use(checkFirstLogin);

// Employee routes (can view own salary)
router.get('/salary/:userId?', getSalaryInfo);
router.get('/payslip/:userId?', calculatePayslip);

// Admin routes
router.put('/salary/:userId', adminOnly, salaryUpdateRules, validate, updateSalaryInfo);
router.get('/summary', adminOnly, getPayrollSummary);

module.exports = router;
