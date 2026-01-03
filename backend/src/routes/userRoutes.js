const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deactivateEmployee,
  getDepartments,
  updateProfile,
  uploadProfilePictureHandler
} = require('../controllers/userController');
const { protect, adminOnly, checkFirstLogin } = require('../middleware/auth');
const { employeeCreationRules, validate } = require('../middleware/validators');
const { uploadProfilePicture } = require('../middleware/upload');

// All routes require authentication
router.use(protect);
router.use(checkFirstLogin);

// Get departments (before :id route to prevent conflict)
router.get('/departments', getDepartments);

// Profile routes (before :id to prevent conflict)
router.put('/profile', updateProfile);
router.put('/profile/picture', uploadProfilePicture, uploadProfilePictureHandler);

// Employee routes
router.route('/')
  .get(getEmployees)
  .post(adminOnly, employeeCreationRules, validate, createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(uploadProfilePicture, updateEmployee)
  .delete(adminOnly, deactivateEmployee);

module.exports = router;
