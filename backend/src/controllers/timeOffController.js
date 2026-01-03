const { TimeOff, User, Attendance, Notification } = require('../models');
const { TIME_OFF_TYPES, TIME_OFF_STATUS, ATTENDANCE_STATUS, ROLES } = require('../config/constants');
const emailService = require('../services/emailService');

// @desc    Create time off request
// @route   POST /api/timeoff
// @access  Private
const createTimeOffRequest = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason, allocationType } = req.body;

    // Admin/HR cannot request time off
    if (req.user.role === ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Admins/HR Officers cannot request time off'
      });
    }

    // Check for overlapping requests
    const hasOverlap = await TimeOff.hasOverlap(
      req.user._id,
      new Date(startDate),
      new Date(endDate)
    );

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: 'You already have a time off request for these dates'
      });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check available balance
    const user = req.user;
    if (type === TIME_OFF_TYPES.PAID) {
      if (user.timeOffBalances.paidTimeOff.available < totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient paid time off balance. Available: ${user.timeOffBalances.paidTimeOff.available} days`
        });
      }
    } else if (type === TIME_OFF_TYPES.SICK) {
      if (user.timeOffBalances.sickLeave.available < totalDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient sick leave balance. Available: ${user.timeOffBalances.sickLeave.available} days`
        });
      }
    }

    // Create time off request
    const timeOff = await TimeOff.create({
      user: req.user._id,
      company: req.user.company._id,
      type,
      startDate: start,
      endDate: end,
      totalDays,
      allocationType: allocationType || 'days',
      reason,
      attachment: req.file ? {
        filename: req.file.originalname,
        path: `/uploads/timeoff/${req.file.filename}`
      } : undefined
    });

    // Send notification to admins
    const admins = await User.find({
      company: req.user.company._id,
      role: ROLES.ADMIN,
      isActive: true
    });

    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        company: req.user.company._id,
        type: 'time_off_request',
        title: 'New Time Off Request',
        message: `${req.user.firstName} ${req.user.lastName} has requested ${totalDays} day(s) of ${type.replace('_', ' ')}`,
        relatedId: timeOff._id,
        relatedModel: 'TimeOff'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Time off request submitted successfully',
      data: timeOff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my time off requests
// @route   GET /api/timeoff/my
// @access  Private
const getMyTimeOffRequests = async (req, res, next) => {
  try {
    const { type, status, year } = req.query;
    
    const query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31);
      query.startDate = { $gte: startOfYear, $lte: endOfYear };
    }

    const requests = await TimeOff.find(query)
      .sort({ createdAt: -1 });

    // Get balances
    const user = await User.findById(req.user._id).select('timeOffBalances');

    res.json({
      success: true,
      data: {
        requests,
        balances: user.timeOffBalances
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all time off requests (Admin only)
// @route   GET /api/timeoff
// @access  Private/Admin
const getAllTimeOffRequests = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    
    const query = { company: req.user.company._id };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    let requests = await TimeOff.find(query)
      .populate('user', 'firstName lastName profilePicture jobPosition department')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      requests = requests.filter(req => 
        req.user.firstName.toLowerCase().includes(searchLower) ||
        req.user.lastName.toLowerCase().includes(searchLower)
      );
    }

    // Group by type for tabs
    const groupedRequests = {
      all: requests,
      paidTimeOff: requests.filter(r => r.type === TIME_OFF_TYPES.PAID),
      sickLeave: requests.filter(r => r.type === TIME_OFF_TYPES.SICK),
      unpaidLeave: requests.filter(r => r.type === TIME_OFF_TYPES.UNPAID)
    };

    // Calculate available days per type across all employees
    const employees = await User.find({
      company: req.user.company._id,
      isActive: true
    }).select('timeOffBalances');

    const totalAvailable = {
      paidTimeOff: employees.reduce((sum, e) => sum + e.timeOffBalances.paidTimeOff.available, 0),
      sickLeave: employees.reduce((sum, e) => sum + e.timeOffBalances.sickLeave.available, 0)
    };

    res.json({
      success: true,
      data: {
        requests: groupedRequests,
        totalAvailable
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject time off request (Admin only)
// @route   PUT /api/timeoff/:id/review
// @access  Private/Admin
const reviewTimeOffRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be approve or reject'
      });
    }

    const timeOff = await TimeOff.findOne({
      _id: id,
      company: req.user.company._id
    }).populate('user');

    if (!timeOff) {
      return res.status(404).json({
        success: false,
        message: 'Time off request not found'
      });
    }

    if (timeOff.status !== TIME_OFF_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'This request has already been reviewed'
      });
    }

    const newStatus = action === 'approve' 
      ? TIME_OFF_STATUS.APPROVED 
      : TIME_OFF_STATUS.REJECTED;

    timeOff.status = newStatus;
    timeOff.reviewedBy = req.user._id;
    timeOff.reviewedAt = new Date();
    timeOff.reviewNotes = notes;
    await timeOff.save();

    // If approved, update user's time off balance
    if (newStatus === TIME_OFF_STATUS.APPROVED) {
      const user = await User.findById(timeOff.user._id);

      if (timeOff.type === TIME_OFF_TYPES.PAID) {
        user.timeOffBalances.paidTimeOff.used += timeOff.totalDays;
        user.timeOffBalances.paidTimeOff.available -= timeOff.totalDays;
      } else if (timeOff.type === TIME_OFF_TYPES.SICK) {
        user.timeOffBalances.sickLeave.used += timeOff.totalDays;
        user.timeOffBalances.sickLeave.available -= timeOff.totalDays;
      } else if (timeOff.type === TIME_OFF_TYPES.UNPAID) {
        user.timeOffBalances.unpaidLeave.used += timeOff.totalDays;
      }

      await user.save();

      // Create attendance records as ON_LEAVE
      const currentDate = new Date(timeOff.startDate);
      const endDate = new Date(timeOff.endDate);
      
      while (currentDate <= endDate) {
        await Attendance.findOneAndUpdate(
          { user: timeOff.user._id, date: new Date(currentDate) },
          {
            user: timeOff.user._id,
            company: timeOff.company,
            date: new Date(currentDate),
            status: ATTENDANCE_STATUS.ON_LEAVE
          },
          { upsert: true }
        );
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Send notification to employee
    await Notification.create({
      user: timeOff.user._id,
      company: req.user.company._id,
      type: newStatus === TIME_OFF_STATUS.APPROVED ? 'time_off_approved' : 'time_off_rejected',
      title: `Time Off Request ${newStatus === TIME_OFF_STATUS.APPROVED ? 'Approved' : 'Rejected'}`,
      message: `Your ${timeOff.type.replace('_', ' ')} request has been ${newStatus}`,
      relatedId: timeOff._id,
      relatedModel: 'TimeOff'
    });

    // Send email notification
    try {
      await emailService.sendTimeOffStatusEmail(timeOff.user, timeOff, newStatus);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    res.json({
      success: true,
      message: `Time off request ${newStatus}`,
      data: timeOff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel time off request
// @route   DELETE /api/timeoff/:id
// @access  Private
const cancelTimeOffRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const timeOff = await TimeOff.findOne({
      _id: id,
      user: req.user._id
    });

    if (!timeOff) {
      return res.status(404).json({
        success: false,
        message: 'Time off request not found'
      });
    }

    if (timeOff.status !== TIME_OFF_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled'
      });
    }

    await TimeOff.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Time off request cancelled'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get time off summary for employee
// @route   GET /api/timeoff/summary/:userId?
// @access  Private
const getTimeOffSummary = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    // If not admin and trying to view others' summary, deny
    if (req.user.role !== ROLES.ADMIN && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own time off summary'
      });
    }

    const user = await User.findById(userId).select('timeOffBalances firstName lastName');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentYear = new Date().getFullYear();
    const usedDays = await TimeOff.getUserSummary(userId, currentYear);

    res.json({
      success: true,
      data: {
        employee: {
          name: `${user.firstName} ${user.lastName}`
        },
        balances: user.timeOffBalances,
        usedThisYear: usedDays
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get time off balance for current user
// @route   GET /api/timeoff/balance
// @access  Private
const getBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('timeOffBalances');
    
    res.json({
      success: true,
      data: {
        paid: user.timeOffBalances.paidTimeOff.available,
        sick: user.timeOffBalances.sickLeave.available,
        annual: user.timeOffBalances.paidTimeOff.available,
        personal: 5, // Default personal days
        paidTimeOff: user.timeOffBalances.paidTimeOff,
        sickLeave: user.timeOffBalances.sickLeave
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTimeOffRequest,
  getMyTimeOffRequests,
  getAllTimeOffRequests,
  reviewTimeOffRequest,
  cancelTimeOffRequest,
  getTimeOffSummary,
  getBalance
};
