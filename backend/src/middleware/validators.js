const { validationResult, body, param, query } = require('express-validator');

// Validate request
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Company registration validation
const companyRegistrationRules = [
  body('companyName')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),
  body('adminName')
    .trim()
    .notEmpty().withMessage('Admin name is required'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Login validation
const loginRules = [
  body('loginId')
    .trim()
    .notEmpty().withMessage('Login ID or Email is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Employee creation validation
const employeeCreationRules = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile is required'),
  body('jobPosition')
    .trim()
    .notEmpty().withMessage('Job position is required'),
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required'),
  body('dateOfJoining')
    .notEmpty().withMessage('Date of joining is required')
    .isISO8601().withMessage('Invalid date format')
];

// Password change validation
const passwordChangeRules = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmNewPassword')
    .notEmpty().withMessage('Confirm new password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    })
];

// Time off request validation
const timeOffRequestRules = [
  body('type')
    .notEmpty().withMessage('Time off type is required')
    .isIn(['paid', 'sick', 'unpaid']).withMessage('Invalid time off type'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

// Salary update validation
const salaryUpdateRules = [
  body('monthlyWage')
    .optional()
    .isNumeric().withMessage('Monthly wage must be a number')
    .custom(value => value >= 0).withMessage('Monthly wage cannot be negative'),
  body('components')
    .optional()
    .isArray().withMessage('Components must be an array'),
  body('components.*.name')
    .optional()
    .notEmpty().withMessage('Component name is required'),
  body('components.*.type')
    .optional()
    .isIn(['fixed', 'percentage']).withMessage('Component type must be fixed or percentage'),
  body('components.*.value')
    .optional()
    .isNumeric().withMessage('Component value must be a number')
];

module.exports = {
  validate,
  companyRegistrationRules,
  loginRules,
  employeeCreationRules,
  passwordChangeRules,
  timeOffRequestRules,
  salaryUpdateRules
};
