import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Login
  login: async (loginId, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ loginId, password });
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      });
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Register company
  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(formData);
      const { token, user } = response.data.data;
      const { emailVerificationRequired, emailSent, emailMessage, verificationUrl } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      });
      
      return { 
        success: true, 
        user, 
        emailVerificationRequired,
        emailSent,
        emailMessage,
        verificationUrl
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Fetch current user
  fetchUser: async () => {
    if (!get().token) return;
    
    set({ isLoading: true });
    try {
      const response = await authAPI.getMe();
      const user = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoading: false });
      
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      
      // Update token if provided
      if (response.data.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        set({ token: response.data.data.token });
      }
      
      // Update user's isFirstLogin status
      const user = { ...get().user, isFirstLogin: false };
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoading: false });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Logout
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout API errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({
        user: null,
        token: null,
        isAuthenticated: false
      });
    }
  },

  // Update user data
  updateUser: (userData) => {
    const user = { ...get().user, ...userData };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  // Check if user is admin
  isAdmin: () => {
    return get().user?.role === 'admin';
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

export default useAuthStore;
