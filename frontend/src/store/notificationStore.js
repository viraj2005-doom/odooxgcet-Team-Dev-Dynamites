import { create } from 'zustand';
import { notificationsAPI } from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  // Fetch notifications
  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true });
    try {
      const response = await notificationsAPI.getAll({ unreadOnly });
      const { notifications, unreadCount } = response.data.data;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  // Mark as read
  markAsRead: async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      const notifications = get().notifications.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      );
      set({
        notifications,
        unreadCount: Math.max(0, get().unreadCount - 1)
      });
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead();
      const notifications = get().notifications.map(n => ({ ...n, isRead: true }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      console.error('Failed to mark all notifications as read');
    }
  },

  // Delete notification
  deleteNotification: async (id) => {
    try {
      await notificationsAPI.delete(id);
      const notification = get().notifications.find(n => n._id === id);
      const notifications = get().notifications.filter(n => n._id !== id);
      set({
        notifications,
        unreadCount: notification?.isRead ? get().unreadCount : get().unreadCount - 1
      });
    } catch (error) {
      console.error('Failed to delete notification');
    }
  }
}));

export default useNotificationStore;
