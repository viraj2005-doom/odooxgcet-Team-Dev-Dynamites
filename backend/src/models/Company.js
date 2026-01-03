const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 4
  },
  logo: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  website: String,
  industry: String,
  employeeCount: {
    type: Number,
    default: 0
  },
  employeeSerialCounter: {
    type: Number,
    default: 0
  },
  timeOffPolicies: {
    paidTimeOff: {
      daysPerYear: { type: Number, default: 21 }
    },
    sickLeave: {
      daysPerYear: { type: Number, default: 12 }
    },
    unpaidLeave: {
      maxDays: { type: Number, default: 30 }
    }
  },
  workingDaysPerWeek: {
    type: Number,
    default: 5
  },
  breakTimeMinutes: {
    type: Number,
    default: 60
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate company code from name
companySchema.statics.generateCompanyCode = async function(companyName) {
  // Take first letters of each word, max 4 characters
  const words = companyName.split(' ').filter(w => w.length > 0);
  let code = '';
  
  if (words.length >= 4) {
    code = words.slice(0, 4).map(w => w[0]).join('');
  } else if (words.length > 0) {
    code = words.map(w => w[0]).join('');
    // Pad with characters from first word if needed
    while (code.length < 4 && words[0].length > code.length) {
      code += words[0][code.length];
    }
  }
  
  code = code.toUpperCase().substring(0, 4);
  
  // Ensure uniqueness
  let finalCode = code;
  let counter = 1;
  while (await this.findOne({ code: finalCode })) {
    finalCode = code.substring(0, 3) + counter;
    counter++;
  }
  
  return finalCode;
};

// Get next employee serial number
companySchema.methods.getNextEmployeeSerial = async function() {
  this.employeeSerialCounter += 1;
  await this.save();
  return this.employeeSerialCounter.toString().padStart(4, '0');
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
