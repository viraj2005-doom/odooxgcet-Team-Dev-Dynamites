const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    default: null
  },
  checkOut: {
    type: Date,
    default: null
  },
  workHours: {
    type: Number,
    default: 0
  },
  extraHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: Object.values(ATTENDANCE_STATUS),
    default: ATTENDANCE_STATUS.ABSENT
  },
  notes: String
}, {
  timestamps: true
});

// Compound index for unique attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Calculate work hours and extra hours
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Standard work hours is 8
    const standardHours = 8;
    
    // Store actual work hours (not capped)
    this.workHours = Math.round(diffHours * 100) / 100; // Round to 2 decimal places
    this.extraHours = Math.max(0, Math.round((diffHours - standardHours) * 100) / 100);
    this.status = ATTENDANCE_STATUS.PRESENT;
  } else if (this.checkIn) {
    this.status = ATTENDANCE_STATUS.PRESENT;
    this.workHours = 0; // Will be calculated on checkout
  }
  next();
});

// Static method to get today's date normalized
attendanceSchema.statics.getTodayDate = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlySummary = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const records = await this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
  
  const daysPresent = records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
  const daysAbsent = records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length;
  const daysOnLeave = records.filter(r => r.status === ATTENDANCE_STATUS.ON_LEAVE).length;
  const halfDays = records.filter(r => r.status === ATTENDANCE_STATUS.HALF_DAY).length;
  const totalWorkHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0);
  const totalExtraHours = records.reduce((sum, r) => sum + (r.extraHours || 0), 0);
  const totalWorkingDays = records.length;
  
  return {
    daysPresent,
    daysAbsent,
    daysOnLeave,
    halfDays,
    totalWorkHours: Math.round(totalWorkHours * 100) / 100,
    totalExtraHours: Math.round(totalExtraHours * 100) / 100,
    totalWorkingDays,
    records
  };
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
