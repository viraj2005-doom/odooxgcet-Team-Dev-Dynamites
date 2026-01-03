# 🌟 Dayflow HRMS
### *Every workday, perfectly aligned*

A comprehensive Human Resource Management System built with React and Node.js.

![Dayflow HRMS](https://via.placeholder.com/800x400?text=Dayflow+HRMS)

## 📋 Features

### 🔐 Authentication & Authorization
- **Two-tier Role System**: Admin/HR Officer and Employee
- **Auto-generated Login IDs**: Format: `<CompanyCode><Initials><Year><Serial>` (e.g., ABC-JS-25-001)
- **Secure Password System**: Temporary passwords with mandatory first-login change
- **JWT-based Authentication**: Secure token-based sessions

### 👥 Employee Management
- **Employee Directory**: Grid view with search functionality
- **Employee Cards**: Profile picture, name, role, department, and status indicator
- **Status Indicators**:
  - 🟢 Green dot: Present in office
  - ✈️ Airplane icon: On approved leave
  - 🟡 Yellow dot: Absent
- **Profile Management**: Resume, Private Info, Salary (read-only for employees), Security tabs

### ⏰ Attendance Tracking
- **One-click Check In/Out**: Simple attendance marking
- **Live Time Display**: Real-time clock on attendance page
- **Monthly History**: View past attendance with status breakdown
- **Admin View**: Team attendance overview with filters and export

### 🏖️ Time Off Management
- **Leave Balance Dashboard**: Annual, Sick, Personal leave tracking
- **Request Workflow**: Submit requests with date range and reason
- **Approval System**: Admin can approve/reject with comments
- **Half-day Support**: Option for half-day leaves

### 💰 Payroll & Salary
- **Salary Configuration**: Base wage, components (fixed/percentage-based)
- **Statutory Deductions**: PF, Professional Tax auto-calculated
- **Payslip Generation**: Monthly payslip download
- **Annual Projections**: CTC and net salary calculations

### 🔔 Notifications
- **Real-time Alerts**: Bell icon with unread count
- **Notification Types**: Leave requests, approvals, system messages
- **Mark as Read**: Click to dismiss notifications

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: MongoDB with Mongoose 8.0
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer
- **Email**: Nodemailer

### Frontend
- **Framework**: React 18.2
- **Routing**: React Router 6.21
- **State Management**: Zustand 4.4
- **Styling**: Tailwind CSS 3.4
- **HTTP Client**: Axios 1.6
- **UI Components**: Headless UI, Heroicons
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
HRMS-ODOO/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & constants
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, uploads
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Email service
│   │   └── uploads/        # File storage
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service
│   │   ├── store/          # Zustand stores
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB 6+ (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dayflow
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000)

## 📝 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register company (creates admin) |
| POST | `/api/auth/login` | Login with loginId/email & password |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/logout` | Logout user |

### Users/Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all employees |
| POST | `/api/users` | Create employee (Admin) |
| GET | `/api/users/:id` | Get employee by ID |
| PUT | `/api/users/:id` | Update employee |
| DELETE | `/api/users/:id` | Delete employee (Admin) |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/check-in` | Check in |
| POST | `/api/attendance/check-out` | Check out |
| GET | `/api/attendance/my` | Get own attendance |
| GET | `/api/attendance` | Get all attendance (Admin) |

### Time Off
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/timeoff` | Request time off |
| GET | `/api/timeoff/my` | Get own requests |
| GET | `/api/timeoff` | Get all requests (Admin) |
| POST | `/api/timeoff/:id/approve` | Approve request (Admin) |
| POST | `/api/timeoff/:id/reject` | Reject request (Admin) |

### Payroll
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll/:userId` | Get salary info |
| PUT | `/api/payroll/:userId` | Update salary (Admin) |
| GET | `/api/payroll/:userId/payslip` | Get monthly payslip |

## 🎨 Color Scheme

The Dayflow design uses a modern, professional color palette:

- **Primary**: Purple gradient (#7C3AED → #9333EA)
- **Secondary**: Pink accent (#EC4899)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

## 👤 User Roles

### Admin/HR Officer
- ✅ Register company
- ✅ Create employees (generates Login ID + temp password)
- ✅ View all employees
- ✅ Edit all employee profiles
- ✅ Manage attendance (view all)
- ✅ Approve/reject time-off requests
- ✅ Configure employee salaries
- ✅ View payroll summaries

### Employee
- ✅ Login with provided credentials
- ✅ Change password
- ✅ View colleague profiles (limited info)
- ✅ Mark own attendance
- ✅ Request time off
- ✅ View own attendance history
- ✅ View own salary (read-only)
- ✅ Download payslips

## 📄 License

Made By Viraj Solanki, Swayam Dalal, Palak Behl, and Priyanshi Baria.
Feel free to use for projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ for better HR management
