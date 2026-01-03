import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChangePassword from './pages/auth/ChangePassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Employee Pages
import { Employees, EmployeeProfile, MyProfile } from './pages/employees';

// Attendance Pages
import { Attendance, AttendanceAdmin } from './pages/attendance';

// Time Off Pages
import { TimeOff, TimeOffApprovals } from './pages/timeoff';

// Salary Pages
import { Salary } from './pages/salary';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If first login, redirect to change password
  if (user?.isFirstLogin && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

// Public Route Component (redirects to employees if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.isFirstLogin) {
      return <Navigate to="/change-password" replace />;
    }
    return <Navigate to="/employees" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Email Verification Route */}
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Change Password (First Login) */}
        <Route 
          path="/change-password" 
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes with Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/employees" replace />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeProfile />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="attendance/all" element={<AttendanceAdmin />} />
          <Route path="time-off" element={<TimeOff />} />
          <Route path="time-off/approvals" element={<TimeOffApprovals />} />
          <Route path="salary" element={<Salary />} />
          <Route path="salary/:id" element={<Salary />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/employees" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
