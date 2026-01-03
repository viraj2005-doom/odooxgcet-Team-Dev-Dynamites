const { User, Company, Attendance, TimeOff } = require('../models');
const { ROLES, ATTENDANCE_STATUS, TIME_OFF_STATUS } = require('../config/constants');
const emailService = require('../services/emailService');

// @desc    Create a new employee (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobile,
      jobPosition,
      department,
      dateOfJoining,
      manager,
      location,
      dateOfBirth,
      address,
      nationality,
      personalEmail,
      gender,
      maritalStatus,
      salary
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Get company
    const company = await Company.findById(req.user.company._id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Generate login ID
    const yearOfJoining = new Date(dateOfJoining).getFullYear();
    const serialNumber = await company.getNextEmployeeSerial();
    const loginId = await User.generateLoginId(
      company.code,
      firstName,
      lastName,
      yearOfJoining,
      serialNumber
    );

    // Generate temporary password
    const tempPassword = User.generateTempPassword();

    // Create employee
    const employee = await User.create({
      loginId,
      email,
      password: tempPassword,
      role: ROLES.EMPLOYEE,
      isFirstLogin: true,
      company: company._id,
      firstName,
      lastName,
      jobPosition,
      department,
      dateOfJoining,
      employeeCode: serialNumber,
      manager: manager || null,
      location,
      mobile,
      dateOfBirth,
      address,
      nationality,
      personalEmail,
      gender,
      maritalStatus,
      salary: salary || undefined,
      timeOffBalances: {
        paidTimeOff: {
          total: company.timeOffPolicies.paidTimeOff.daysPerYear,
          used: 0,
          available: company.timeOffPolicies.paidTimeOff.daysPerYear
        },
        sickLeave: {
          total: company.timeOffPolicies.sickLeave.daysPerYear,
          used: 0,
          available: company.timeOffPolicies.sickLeave.daysPerYear
        },
        unpaidLeave: {
          used: 0
        }
      }
    });

    // Update company employee count
    company.employeeCount += 1;
    await company.save();

    // Generate email verification token for the employee
    const verificationToken = employee.generateEmailVerificationToken();
    await employee.save();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Send welcome email with credentials AND verification link
    let emailSent = false;
    try {
      const result = await emailService.sendEmployeeWelcomeWithVerification(employee, tempPassword, verificationToken);
      emailSent = !result?.simulated;
      if (result?.simulated) {
        console.log('📧 [SIMULATED] Employee welcome + verification email');
        console.log('📧 Verification URL:', verificationUrl);
      } else {
        console.log('✅ Welcome + verification email sent to:', employee.email);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      console.log('📧 Verification URL:', verificationUrl);
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully. Verification email sent.',
      data: {
        id: employee._id,
        loginId: employee.loginId,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: employee.fullName,
        jobPosition: employee.jobPosition,
        department: employee.department,
        tempPassword, // Only return in development or send via secure channel
        emailSent,
        // Include verification URL in development for easy testing
        verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees (with status indicators)
// @route   GET /api/users
// @access  Private
const getEmployees = async (req, res, next) => {
  try {
    const { search, department, status } = req.query;

    // Build query
    const query = { company: req.user.company._id, isActive: true };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { loginId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    // Get employees
    const employees = await User.find(query)
      .select('firstName lastName email profilePicture jobPosition department loginId')
      .sort({ firstName: 1 });

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance for all employees
    const attendanceRecords = await Attendance.find({
      company: req.user.company._id,
      date: today
    });

    // Get approved time-off for today
    const timeOffRecords = await TimeOff.find({
      company: req.user.company._id,
      status: TIME_OFF_STATUS.APPROVED,
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // Map attendance status to employees
    const employeesWithStatus = employees.map(emp => {
      const attendance = attendanceRecords.find(
        a => a.user.toString() === emp._id.toString()
      );
      const timeOff = timeOffRecords.find(
        t => t.user.toString() === emp._id.toString()
      );

      let statusIndicator;
      if (timeOff) {
        statusIndicator = 'on_leave'; // Airplane icon - on approved leave
      } else if (attendance && attendance.checkIn && !attendance.checkOut) {
        // Only show green if checked in AND not yet checked out
        statusIndicator = 'present'; // Green dot - currently in office
      } else {
        // Default: not checked in yet today OR already checked out (red dot)
        statusIndicator = 'not_checked_in'; // Red dot - not in office
      }

      return {
        ...emp.toJSON(),
        statusIndicator
      };
    });

    res.json({
      success: true,
      count: employeesWithStatus.length,
      data: employeesWithStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee
// @route   GET /api/users/:id
// @access  Private
const getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    let selectFields = '';
    
    // If employee viewing their own profile, include all fields
    // If admin, include all fields
    // If employee viewing another employee, limit fields
    if (req.user.role === ROLES.ADMIN || req.user._id.toString() === id) {
      selectFields = '-password';
    } else {
      // Limited view for employees viewing other employees
      selectFields = 'firstName lastName email profilePicture jobPosition department location';
    }

    const employee = await User.findOne({
      _id: id,
      company: req.user.company._id
    })
      .select(selectFields)
      .populate('manager', 'firstName lastName email jobPosition')
      .populate('company', 'name code');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/users/:id
// @access  Private
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get employee
    const employee = await User.findOne({
      _id: id,
      company: req.user.company._id
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Define what fields each role can update
    const adminOnlyFields = [
      'role', 'jobPosition', 'department', 'manager', 'dateOfJoining',
      'salary', 'timeOffBalances', 'isActive', 'employeeCode'
    ];

    const employeeEditableFields = [
      'firstName', 'lastName', 'mobile', 'address', 'personalEmail',
      'dateOfBirth', 'nationality', 'gender', 'maritalStatus',
      'bankDetails', 'panNumber', 'uanNumber',
      'about', 'whatILoveAboutJob', 'interestsAndHobbies', 'skills', 'certifications'
    ];

    // If not admin and not own profile, deny
    if (req.user.role !== ROLES.ADMIN && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    // Filter allowed updates based on role
    let allowedUpdates = {};
    
    if (req.user.role === ROLES.ADMIN) {
      // Admin can update everything except loginId and email
      const protectedFields = ['loginId', 'password', '_id', 'company'];
      Object.keys(updates).forEach(key => {
        if (!protectedFields.includes(key)) {
          allowedUpdates[key] = updates[key];
        }
      });
    } else {
      // Employee can only update allowed fields
      Object.keys(updates).forEach(key => {
        if (employeeEditableFields.includes(key)) {
          allowedUpdates[key] = updates[key];
        }
      });
    }

    // Handle profile picture update
    if (req.file) {
      allowedUpdates.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    // Update employee
    const updatedEmployee = await User.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('manager', 'firstName lastName email jobPosition')
      .populate('company', 'name code logo');

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate employee
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deactivateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Cannot deactivate yourself
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const employee = await User.findOneAndUpdate(
      { _id: id, company: req.user.company._id },
      { isActive: false },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update company employee count
    await Company.findByIdAndUpdate(req.user.company._id, {
      $inc: { employeeCount: -1 }
    });

    res.json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get departments list
// @route   GET /api/users/departments
// @access  Private
const getDepartments = async (req, res, next) => {
  try {
    const departments = await User.distinct('department', {
      company: req.user.company._id,
      isActive: true
    });

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update own profile (Resume/Private info)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'about',
      'whatILoveAboutJob',
      'interestsAndHobbies',
      'skills',
      'certifications',
      'dateOfBirth',
      'gender',
      'maritalStatus',
      'nationality',
      'personalEmail',
      'address',
      'bankDetails',
      'panNumber',
      'uanNumber'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).populate('company', 'name code logo timeOffPolicies')
     .populate('manager', 'firstName lastName email jobPosition');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   PUT /api/users/profile/picture
// @access  Private
const uploadProfilePictureHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: `/uploads/profiles/${req.file.filename}` },
      { new: true }
    ).populate('company', 'name code logo timeOffPolicies')
     .populate('manager', 'firstName lastName email jobPosition');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deactivateEmployee,
  getDepartments,
  updateProfile,
  uploadProfilePictureHandler
};
