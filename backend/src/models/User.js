const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, DEFAULT_SALARY_COMPONENTS, DEFAULT_DEDUCTIONS } = require('../config/constants');

const salaryComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  calculatedAmount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Login credentials
  loginId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.EMPLOYEE
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Company reference
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  jobPosition: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  location: String,
  mobile: {
    type: String,
    required: true
  },
  dateOfJoining: {
    type: Date,
    required: true
  },
  employeeCode: {
    type: String,
    required: true
  },
  
  // Personal Details
  dateOfBirth: Date,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  nationality: String,
  personalEmail: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed']
  },
  
  // Banking & Compliance
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String
  },
  panNumber: String,
  uanNumber: String,
  
  // Admin Profile Extensions
  about: String,
  whatILoveAboutJob: String,
  interestsAndHobbies: String,
  skills: [{
    name: String,
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    }
  }],
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String
  }],
  
  // Salary Information
  salary: {
    monthlyWage: {
      type: Number,
      default: 0
    },
    yearlyWage: {
      type: Number,
      default: 0
    },
    workingDaysPerWeek: {
      type: Number,
      default: 5
    },
    breakTimeMinutes: {
      type: Number,
      default: 60
    },
    components: {
      type: [salaryComponentSchema],
      default: DEFAULT_SALARY_COMPONENTS
    },
    deductions: {
      pfEmployeePercent: {
        type: Number,
        default: DEFAULT_DEDUCTIONS.pfEmployeePercent
      },
      pfEmployerPercent: {
        type: Number,
        default: DEFAULT_DEDUCTIONS.pfEmployerPercent
      },
      professionalTax: {
        type: Number,
        default: DEFAULT_DEDUCTIONS.professionalTax
      }
    }
  },
  
  // Time Off Balances
  timeOffBalances: {
    paidTimeOff: {
      total: { type: Number, default: 21 },
      used: { type: Number, default: 0 },
      available: { type: Number, default: 21 }
    },
    sickLeave: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
      available: { type: Number, default: 12 }
    },
    unpaidLeave: {
      used: { type: Number, default: 0 }
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for initials
userSchema.virtual('initials').get(function() {
  return `${this.firstName[0]}${this.lastName[0]}`.toUpperCase();
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Pre-save hook to calculate salary components
userSchema.pre('save', function(next) {
  if (this.isModified('salary.monthlyWage') || this.isModified('salary.components')) {
    this.salary.yearlyWage = this.salary.monthlyWage * 12;
    
    // Recalculate component amounts
    this.salary.components = this.salary.components.map(component => {
      if (component.type === 'percentage') {
        component.calculatedAmount = (this.salary.monthlyWage * component.value) / 100;
      } else {
        component.calculatedAmount = component.value;
      }
      return component;
    });
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate login ID
userSchema.statics.generateLoginId = async function(companyCode, firstName, lastName, yearOfJoining, serialNumber) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const year = yearOfJoining.toString();
  const loginId = `${companyCode}${initials}${year}${serialNumber}`;
  return loginId;
};

// Generate temporary password
userSchema.statics.generateTempPassword = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// JSON transformation
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
