// Port of modules/customer/context/NotificationContext.jsx.
// Uses the app's shared socket (socketStore) instead of opening a second connection.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import useSocketStore from '../store/socketStore';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const socket = useSocketStore((s) => s.socket);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (_) {
      // keep previous list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
    else { setNotifications([]); setUnreadCount(0); }
  }, [isAuthenticated, user?._id, user?.id, fetchNotifications]);

  useEffect(() => {
    if (!socket || !isAuthenticated) return undefined;
    const onNew = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };
    socket.on('new_notification', onNew);
    return () => socket.off('new_notification', onNew);
  }, [socket, isAuthenticated]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) { /* ignore */ }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) { /* ignore */ }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, fetchNotifications, markAllRead, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext) || { notifications: [], unreadCount: 0, loading: false };
