const { User, Attendance, TimeOff } = require('../models');
const { ATTENDANCE_STATUS, TIME_OFF_STATUS, TIME_OFF_TYPES, ROLES } = require('../config/constants');

// @desc    Get salary info for an employee
// @route   GET /api/payroll/salary/:userId?
// @access  Private
const getSalaryInfo = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;

    // If employee trying to view others' salary, deny
    if (req.user.role !== ROLES.ADMIN && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own salary information'
      });
    }

    const user = await User.findById(userId)
      .select('firstName lastName employeeCode salary jobPosition department')
      .populate('company', 'name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        employee: {
          name: `${user.firstName} ${user.lastName}`,
          employeeCode: user.employeeCode,
          jobPosition: user.jobPosition,
          department: user.department,
          company: user.company?.name
        },
        salary: user.salary
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update salary info (Admin only)
// @route   PUT /api/payroll/salary/:userId
// @access  Private/Admin
const updateSalaryInfo = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { monthlyWage, workingDaysPerWeek, breakTimeMinutes, components, deductions } = req.body;

    const user = await User.findOne({
      _id: userId,
      company: req.user.company._id
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Validate components total doesn't exceed wage
    if (components) {
      let totalPercentage = 0;
      let totalFixed = 0;

      components.forEach(comp => {
        if (comp.type === 'percentage') {
          totalPercentage += comp.value;
        } else {
          totalFixed += comp.value;
        }
      });

      if (totalPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Total percentage of components cannot exceed 100%'
        });
      }

      const wage = monthlyWage || user.salary.monthlyWage;
      const percentageAmount = (wage * totalPercentage) / 100;
      
      if (percentageAmount + totalFixed > wage) {
        return res.status(400).json({
          success: false,
          message: 'Total salary components cannot exceed monthly wage'
        });
      }
    }

    // Update salary information
    if (monthlyWage !== undefined) {
      user.salary.monthlyWage = monthlyWage;
      user.salary.yearlyWage = monthlyWage * 12;
    }

    if (workingDaysPerWeek !== undefined) {
      user.salary.workingDaysPerWeek = workingDaysPerWeek;
    }

    if (breakTimeMinutes !== undefined) {
      user.salary.breakTimeMinutes = breakTimeMinutes;
    }

    if (components) {
      // Recalculate component amounts
      user.salary.components = components.map(comp => ({
        name: comp.name,
        type: comp.type,
        value: comp.value,
        calculatedAmount: comp.type === 'percentage' 
          ? (user.salary.monthlyWage * comp.value) / 100 
          : comp.value
      }));
    }

    if (deductions) {
      user.salary.deductions = {
        ...user.salary.deductions,
        ...deductions
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Salary information updated successfully',
      data: {
        salary: user.salary
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate payslip for an employee
// @route   GET /api/payroll/payslip/:userId
// @access  Private
const calculatePayslip = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { month, year } = req.query;

    // If employee trying to view others' payslip, deny
    if (req.user.role !== ROLES.ADMIN && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own payslip'
      });
    }

    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
    const targetYear = parseInt(year) || currentDate.getFullYear();

    const user = await User.findById(userId)
      .select('firstName lastName employeeCode salary bankDetails panNumber company')
      .populate('company', 'name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get attendance for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    
    const attendanceRecords = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate working days in month
    const totalDaysInMonth = endDate.getDate();
    let expectedWorkingDays = 0;
    
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(targetYear, targetMonth - 1, d);
      const dayOfWeek = date.getDay();
      // Assuming working days are Mon-Fri (or based on company settings)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        expectedWorkingDays++;
      }
    }

    // Count attendance
    const daysPresent = attendanceRecords.filter(
      r => r.status === ATTENDANCE_STATUS.PRESENT
    ).length;

    const daysOnPaidLeave = attendanceRecords.filter(
      r => r.status === ATTENDANCE_STATUS.ON_LEAVE
    ).length;

    // Get unpaid leave days
    const unpaidLeaveRecords = await TimeOff.find({
      user: userId,
      type: TIME_OFF_TYPES.UNPAID,
      status: TIME_OFF_STATUS.APPROVED,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    let unpaidLeaveDays = 0;
    unpaidLeaveRecords.forEach(leave => {
      const leaveStart = new Date(Math.max(leave.startDate, startDate));
      const leaveEnd = new Date(Math.min(leave.endDate, endDate));
      const days = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
      unpaidLeaveDays += days;
    });

    // Calculate payable days
    const payableDays = daysPresent + daysOnPaidLeave;
    const absentDays = expectedWorkingDays - payableDays - unpaidLeaveDays;

    // Calculate daily wage
    const dailyWage = user.salary.monthlyWage / expectedWorkingDays;

    // Calculate gross salary
    const grossSalary = dailyWage * payableDays;

    // Calculate deductions
    const basicForPF = user.salary.components.find(c => c.name === 'Basic Salary')?.calculatedAmount || 0;
    const pfEmployee = (basicForPF * user.salary.deductions.pfEmployeePercent) / 100;
    const pfEmployer = (basicForPF * user.salary.deductions.pfEmployerPercent) / 100;
    const professionalTax = user.salary.deductions.professionalTax;

    const totalDeductions = pfEmployee + professionalTax;
    
    // Calculate net salary
    const netSalary = grossSalary - totalDeductions;

    // Build payslip
    const payslip = {
      employee: {
        name: `${user.firstName} ${user.lastName}`,
        employeeCode: user.employeeCode,
        company: user.company?.name,
        panNumber: user.panNumber,
        bankDetails: user.bankDetails
      },
      period: {
        month: targetMonth,
        year: targetYear,
        startDate,
        endDate
      },
      attendance: {
        expectedWorkingDays,
        daysPresent,
        daysOnPaidLeave,
        unpaidLeaveDays,
        absentDays,
        payableDays
      },
      earnings: {
        monthlyWage: user.salary.monthlyWage,
        dailyWage: Math.round(dailyWage * 100) / 100,
        components: user.salary.components.map(c => ({
          name: c.name,
          amount: Math.round((c.calculatedAmount * payableDays / expectedWorkingDays) * 100) / 100
        })),
        grossSalary: Math.round(grossSalary * 100) / 100
      },
      deductions: {
        pfEmployee: Math.round(pfEmployee * 100) / 100,
        pfEmployer: Math.round(pfEmployer * 100) / 100,
        professionalTax,
        totalDeductions: Math.round(totalDeductions * 100) / 100
      },
      netSalary: Math.round(netSalary * 100) / 100
    };

    res.json({
      success: true,
      data: payslip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payroll summary for all employees (Admin only)
// @route   GET /api/payroll/summary
// @access  Private/Admin
const getPayrollSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
    const targetYear = parseInt(year) || currentDate.getFullYear();

    const employees = await User.find({
      company: req.user.company._id,
      isActive: true
    }).select('firstName lastName employeeCode salary jobPosition department');

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Get attendance for all employees
    const attendanceRecords = await Attendance.find({
      company: req.user.company._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const payrollData = employees.map(emp => {
      const empAttendance = attendanceRecords.filter(
        a => a.user.toString() === emp._id.toString()
      );

      const daysPresent = empAttendance.filter(
        a => a.status === ATTENDANCE_STATUS.PRESENT
      ).length;

      const daysOnLeave = empAttendance.filter(
        a => a.status === ATTENDANCE_STATUS.ON_LEAVE
      ).length;

      const totalWorkingDays = endDate.getDate();
      const payableDays = daysPresent + daysOnLeave;
      const dailyWage = emp.salary.monthlyWage / totalWorkingDays;
      const grossSalary = dailyWage * payableDays;

      return {
        employee: {
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          employeeCode: emp.employeeCode,
          jobPosition: emp.jobPosition,
          department: emp.department
        },
        monthlyWage: emp.salary.monthlyWage,
        daysPresent,
        daysOnLeave,
        payableDays,
        grossSalary: Math.round(grossSalary * 100) / 100
      };
    });

    // Calculate totals
    const totals = {
      totalEmployees: payrollData.length,
      totalMonthlyWage: payrollData.reduce((sum, p) => sum + p.monthlyWage, 0),
      totalGrossSalary: payrollData.reduce((sum, p) => sum + p.grossSalary, 0)
    };

    res.json({
      success: true,
      data: {
        period: {
          month: targetMonth,
          year: targetYear
        },
        employees: payrollData,
        totals
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalaryInfo,
  updateSalaryInfo,
  calculatePayslip,
  getPayrollSummary
};
