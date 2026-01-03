import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', ''); // Get base URL without /api for static files

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function to get full image URL
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email })
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/users/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put(`/users/${id}`, data);
  },
  delete: (id) => api.delete(`/users/${id}`),
  getDepartments: () => api.get('/users/departments'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadProfilePicture: (data) => api.put('/users/profile/picture', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Attendance API
export const attendanceAPI = {
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  getToday: () => api.get('/attendance/today'),
  getMy: (params) => api.get('/attendance/my', { params }),
  getAll: (params) => api.get('/attendance', { params }),
  getReports: (params) => api.get('/attendance/reports', { params })
};

// Time Off API
export const timeOffAPI = {
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/timeoff', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getMy: (params) => api.get('/timeoff/my', { params }),
  getMyRequests: (params) => api.get('/timeoff/my', { params }),
  getAll: (params) => api.get('/timeoff', { params }),
  getAllRequests: (params) => api.get('/timeoff', { params }),
  review: (id, data) => api.put(`/timeoff/${id}/review`, data),
  approve: (id, data) => api.put(`/timeoff/${id}/review`, { action: 'approve', notes: data?.comment }),
  reject: (id, data) => api.put(`/timeoff/${id}/review`, { action: 'reject', notes: data?.comment }),
  cancel: (id) => api.delete(`/timeoff/${id}`),
  getSummary: (userId) => api.get(`/timeoff/summary/${userId || ''}`),
  getBalance: () => api.get('/timeoff/balance')
};

// Payroll API
export const payrollAPI = {
  getSalary: (userId) => api.get(`/payroll/salary/${userId || ''}`),
  getSalaryInfo: (userId) => api.get(`/payroll/salary/${userId || ''}`),
  updateSalary: (userId, data) => api.put(`/payroll/salary/${userId}`, data),
  getPayslip: (userId, params) => api.get(`/payroll/payslip/${userId || ''}`, { params }),
  getSummary: (params) => api.get('/payroll/summary', { params })
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

export default api;
