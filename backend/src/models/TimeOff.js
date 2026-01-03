const mongoose = require('mongoose');
const { TIME_OFF_TYPES, TIME_OFF_STATUS } = require('../config/constants');

const timeOffSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: Object.values(TIME_OFF_TYPES),
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  allocationType: {
    type: String,
    enum: ['days', 'hours'],
    default: 'days'
  },
  reason: String,
  attachment: {
    filename: String,
    path: String
  },
  status: {
    type: String,
    enum: Object.values(TIME_OFF_STATUS),
    default: TIME_OFF_STATUS.PENDING
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: Date,
  reviewNotes: String
}, {
  timestamps: true
});

// Calculate total days
timeOffSchema.pre('save', function(next) {
  if (this.isModified('startDate') || this.isModified('endDate')) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
    this.totalDays = diffDays;
  }
  next();
});

// Static method to check for overlapping requests
timeOffSchema.statics.hasOverlap = async function(userId, startDate, endDate, excludeId = null) {
  const query = {
    user: userId,
    status: { $ne: TIME_OFF_STATUS.REJECTED },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const overlap = await this.findOne(query);
  return !!overlap;
};

// Static method to get time off summary for a user
timeOffSchema.statics.getUserSummary = async function(userId, year) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  
  const requests = await this.find({
    user: userId,
    startDate: { $gte: startOfYear, $lte: endOfYear },
    status: TIME_OFF_STATUS.APPROVED
  });
  
  const summary = {
    paidTimeOff: 0,
    sickLeave: 0,
    unpaidLeave: 0
  };
  
  requests.forEach(req => {
    if (req.type === TIME_OFF_TYPES.PAID) {
      summary.paidTimeOff += req.totalDays;
    } else if (req.type === TIME_OFF_TYPES.SICK) {
      summary.sickLeave += req.totalDays;
    } else if (req.type === TIME_OFF_TYPES.UNPAID) {
      summary.unpaidLeave += req.totalDays;
    }
  });
  
  return summary;
};

const TimeOff = mongoose.model('TimeOff', timeOffSchema);

module.exports = TimeOff;
