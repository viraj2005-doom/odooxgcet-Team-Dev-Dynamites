const { Attendance, TimeOff, User } = require('../models');
const { ATTENDANCE_STATUS, TIME_OFF_STATUS, ROLES } = require('../config/constants');

// @desc    Check in
// @route   POST /api/attendance/check-in
// @access  Private
const checkIn = async (req, res, next) => {
  try {
    const today = Attendance.getTodayDate();
    
    // Check if already checked in today
    let attendance = await Attendance.findOne({
      user: req.user._id,
      date: today
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today'
      });
    }

    // Check if user is on approved leave today
    const onLeave = await TimeOff.findOne({
      user: req.user._id,
      status: TIME_OFF_STATUS.APPROVED,
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    if (onLeave) {
      return res.status(400).json({
        success: false,
        message: 'You are on approved leave today'
      });
    }

    if (attendance) {
      // Update existing record
      attendance.checkIn = new Date();
      attendance.status = ATTENDANCE_STATUS.PRESENT;
      await attendance.save();
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        user: req.user._id,
        company: req.user.company._id,
        date: today,
        checkIn: new Date(),
        status: ATTENDANCE_STATUS.PRESENT
      });
    }

    res.json({
      success: true,
      message: 'Checked in successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check out
// @route   POST /api/attendance/check-out
// @access  Private
const checkOut = async (req, res, next) => {
  try {
    const today = Attendance.getTodayDate();
    
    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: today
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'You need to check in first'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today'
      });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private
const getTodayAttendance = async (req, res, next) => {
  try {
    const today = Attendance.getTodayDate();
    
    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: today
    });

    // Check if on leave
    const onLeave = await TimeOff.findOne({
      user: req.user._id,
      status: TIME_OFF_STATUS.APPROVED,
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    res.json({
      success: true,
      data: {
        attendance,
        isOnLeave: !!onLeave,
        leaveDetails: onLeave
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my attendance records (monthly)
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    
    const currentDate = new Date();
    const targetYear = parseInt(year) || currentDate.getFullYear();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;

    const summary = await Attendance.getMonthlySummary(
      req.user._id,
      targetYear,
      targetMonth
    );

    res.json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        summary: {
          daysPresent: summary.daysPresent,
          daysAbsent: summary.daysAbsent,
          daysOnLeave: summary.daysOnLeave,
          halfDays: summary.halfDays,
          totalWorkHours: summary.totalWorkHours,
          totalExtraHours: summary.totalExtraHours,
          totalWorkingDays: summary.totalWorkingDays
        },
        records: summary.records
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees attendance (Admin only)
// @route   GET /api/attendance
// @access  Private/Admin
const getAllAttendance = async (req, res, next) => {
  try {
    const { date, search } = req.query;
    
    // Parse date or use today
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all employees
    let employeeQuery = { 
      company: req.user.company._id, 
      isActive: true 
    };

    if (search) {
      employeeQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await User.find(employeeQuery)
      .select('firstName lastName profilePicture jobPosition');

    // Get attendance records for the date
    const attendanceRecords = await Attendance.find({
      company: req.user.company._id,
      date: targetDate
    }).populate('user', 'firstName lastName profilePicture');

    // Get leave records for the date
    const leaveRecords = await TimeOff.find({
      company: req.user.company._id,
      status: TIME_OFF_STATUS.APPROVED,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    });

    // Merge data
    const attendanceList = employees.map(emp => {
      const attendance = attendanceRecords.find(
        a => a.user._id.toString() === emp._id.toString()
      );
      const leave = leaveRecords.find(
        l => l.user.toString() === emp._id.toString()
      );

      return {
        employee: {
          id: emp._id,
          name: emp.fullName || `${emp.firstName} ${emp.lastName}`,
          profilePicture: emp.profilePicture,
          jobPosition: emp.jobPosition
        },
        date: targetDate,
        checkIn: attendance?.checkIn || null,
        checkOut: attendance?.checkOut || null,
        workHours: attendance?.workHours || 0,
        extraHours: attendance?.extraHours || 0,
        status: leave ? ATTENDANCE_STATUS.ON_LEAVE : 
                (attendance?.checkIn ? ATTENDANCE_STATUS.PRESENT : ATTENDANCE_STATUS.ABSENT),
        leaveType: leave?.type || null
      };
    });

    res.json({
      success: true,
      date: targetDate,
      count: attendanceList.length,
      data: attendanceList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance reports (Admin only)
// @route   GET /api/attendance/reports
// @access  Private/Admin
const getAttendanceReports = async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const query = {
      company: req.user.company._id,
      date: { $gte: start, $lte: end }
    };

    if (userId) {
      query.user = userId;
    }

    const records = await Attendance.find(query)
      .populate('user', 'firstName lastName employeeCode')
      .sort({ date: 1, 'user.firstName': 1 });

    // Calculate summary
    const summary = {
      totalRecords: records.length,
      totalWorkHours: records.reduce((sum, r) => sum + r.workHours, 0),
      totalExtraHours: records.reduce((sum, r) => sum + r.extraHours, 0),
      presentDays: records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length,
      absentDays: records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length,
      leaveDays: records.filter(r => r.status === ATTENDANCE_STATUS.ON_LEAVE).length
    };

    res.json({
      success: true,
      data: {
        summary,
        records
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getAllAttendance,
  getAttendanceReports
};
