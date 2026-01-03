// User Roles
const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee'
};

// Attendance Status
const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ON_LEAVE: 'on_leave',
  ABSENT: 'absent',
  HALF_DAY: 'half_day'
};

// Time Off Types
const TIME_OFF_TYPES = {
  PAID: 'paid',
  SICK: 'sick',
  UNPAID: 'unpaid'
};

// Time Off Status
const TIME_OFF_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Salary Component Types
const SALARY_COMPONENT_TYPES = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage'
};

// Default Salary Components
const DEFAULT_SALARY_COMPONENTS = [
  { name: 'Basic Salary', type: 'percentage', value: 40 },
  { name: 'House Rent Allowance', type: 'percentage', value: 20 },
  { name: 'Standard Allowance', type: 'percentage', value: 15 },
  { name: 'Performance Bonus', type: 'percentage', value: 10 },
  { name: 'Leave Travel Allowance', type: 'percentage', value: 10 },
  { name: 'Fixed Allowance', type: 'percentage', value: 5 }
];

// Default Deductions
const DEFAULT_DEDUCTIONS = {
  pfEmployeePercent: 12,
  pfEmployerPercent: 12,
  professionalTax: 200
};

module.exports = {
  ROLES,
  ATTENDANCE_STATUS,
  TIME_OFF_TYPES,
  TIME_OFF_STATUS,
  SALARY_COMPONENT_TYPES,
  DEFAULT_SALARY_COMPONENTS,
  DEFAULT_DEDUCTIONS
};
