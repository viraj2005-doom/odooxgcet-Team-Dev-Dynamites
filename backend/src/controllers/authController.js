const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Company, User } = require('../models');
const { ROLES } = require('../config/constants');
const emailService = require('../services/emailService');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new company with admin user
// @route   POST /api/auth/register
// @access  Public
const registerCompany = async (req, res, next) => {
  try {
    const { companyName, adminName, email, phone, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate company code
    const companyCode = await Company.generateCompanyCode(companyName);

    // Create company
    const company = await Company.create({
      name: companyName,
      code: companyCode,
      email: email,
      phone: phone,
      logo: req.file ? `/uploads/logos/${req.file.filename}` : null
    });

    // Split admin name
    const nameParts = adminName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Generate login ID for admin
    const yearOfJoining = new Date().getFullYear();
    const serialNumber = await company.getNextEmployeeSerial();
    const loginId = await User.generateLoginId(
      companyCode,
      firstName,
      lastName,
      yearOfJoining,
      serialNumber
    );

    // Check if skipping email verification in development
    const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';

    // Create admin user
    const admin = await User.create({
      loginId,
      email,
      password,
      role: ROLES.ADMIN,
      isFirstLogin: false, // Admin doesn't need to change password
      isEmailVerified: skipEmailVerification, // Auto-verify in dev mode
      company: company._id,
      firstName,
      lastName,
      jobPosition: 'HR Administrator',
      department: 'Human Resources',
      mobile: phone,
      dateOfJoining: new Date(),
      employeeCode: serialNumber
    });

    // Generate email verification token and send email
    let emailSent = false;
    let emailMessage = '';
    let verificationUrl = null;
    
    const verificationToken = admin.generateEmailVerificationToken();
    await admin.save();
    
    verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Send verification email
    try {
      const result = await emailService.sendEmailVerification(admin, verificationToken);
      if (result?.simulated) {
        emailMessage = 'Email service not configured. Use the verification link below.';
        console.log('✅ Registration complete. Email simulated (SMTP not configured)');
        console.log('📧 Verification URL:', verificationUrl);
      } else {
        emailSent = true;
        emailMessage = `Verification email sent to ${admin.email}. Please check your inbox.`;
        console.log('✅ Verification email sent to:', admin.email);
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
      emailMessage = 'Could not send verification email. Use the verification link below.';
      console.log('📧 Verification URL:', verificationUrl);
    }

    // Update company employee count
    company.employeeCount = 1;
    await company.save();

    // Generate token
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: skipEmailVerification 
        ? 'Company registered successfully' 
        : (emailSent ? 'Company registered. Please verify your email.' : 'Company registered. ' + emailMessage),
      emailVerificationRequired: !skipEmailVerification,
      emailSent: emailSent,
      emailMessage: emailMessage,
      // Include verification URL in development for easy testing
      verificationUrl: process.env.NODE_ENV === 'development' && !emailSent ? verificationUrl : undefined,
      data: {
        token,
        user: {
          id: admin._id,
          loginId: admin.loginId,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          isEmailVerified: admin.isEmailVerified,
          company: {
            id: company._id,
            name: company.name,
            code: company.code,
            logo: company.logo
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { loginId, password } = req.body;

    // Find user by login ID or email
    const user = await User.findOne({
      $or: [
        { loginId: loginId.toUpperCase() },
        { email: loginId.toLowerCase() }
      ]
    }).populate('company', 'name code logo');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact HR.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    // Check if email is verified (for both admin and employees, skip in dev mode)
    const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';
    if (!skipEmailVerification && !user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        needsVerification: true,
        email: user.email
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          loginId: user.loginId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          isFirstLogin: user.isFirstLogin,
          profilePicture: user.profilePicture,
          jobPosition: user.jobPosition,
          department: user.department,
          company: user.company
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('company', 'name code logo timeOffPolicies')
      .populate('manager', 'firstName lastName email jobPosition');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: { token }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    console.log('📧 Verification attempt with token:', token.substring(0, 10) + '...');

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('📧 Hashed token:', hashedToken.substring(0, 10) + '...');

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      // Try to find if token exists but expired
      const expiredUser = await User.findOne({ emailVerificationToken: hashedToken });
      if (expiredUser) {
        console.log('📧 Token found but expired for user:', expiredUser.email);
        return res.status(400).json({
          success: false,
          message: 'Verification link has expired. Please request a new one.'
        });
      }
      
      console.log('📧 No user found with this token');
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token. Please request a new verification link.'
      });
    }

    console.log('📧 User found:', user.email);

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('✅ Email verified successfully for:', user.email);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    console.error('❌ Email verification error:', error);
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await emailService.sendEmailVerification(user, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCompany,
  login,
  getMe,
  changePassword,
  logout,
  verifyEmail,
  resendVerificationEmail
};
