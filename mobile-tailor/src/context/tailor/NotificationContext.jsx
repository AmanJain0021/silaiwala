// Port of modules/tailor/context/NotificationContext.jsx (converted with scripts/web2rn.js, then reviewed)
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useState, useEffect } from "react";
import { useTailorAuth } from "./AuthContext";
import api from "../../lib/api";
import { playNotificationSound } from "../../utils/audio";
import { getToken } from "../../lib/auth";
import toast from '../../lib/toast';
import useSocketStore from "../../store/socketStore";
import { Scroll } from '../../components/ui/primitives';
const NotificationContext = createContext();
export const NotificationProvider = ({
  children
}) => {
  const {
    user,
    token
  } = useTailorAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const userId = user?._id || user?.id;
    const socket = useSocketStore.getState().connect(userId ? String(userId) : null, 'tailor');
    // web: Notification / service-worker showNotification (when permission granted);
    // native: an immediate local notification (POST_NOTIFICATIONS permission).
    const triggerDesktopNotification = async (title, body) => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;
        await Notifications.scheduleNotificationAsync({ content: { title, body, sound: 'default', data: { url: '/partner/orders' } }, trigger: null });
      } catch (_) { /* best effort */ }
    };
    let lastHandledTime = 0;
    let lastHandledOrderId = '';
    const handleNewOrder = data => {
      const orderIdStr = String(data?.orderId || data?.id || data?._id || '');
      const now = Date.now();
      if (lastHandledOrderId === orderIdStr && now - lastHandledTime < 4000) {
        return;
      }
      lastHandledOrderId = orderIdStr;
      lastHandledTime = now;
      fetchNotifications();
      try {
        playNotificationSound('tailor');
      } catch (e) {
        console.error(e);
      }
      const msg = data?.message || data?.title || `New Order ${orderIdStr ? '#' + orderIdStr : ''} received! Please review.`;
      toast.success(`🛍️ ${msg}`, {
        id: `toast-new-order-${orderIdStr || now}`,
        duration: 6000,
        position: 'top-right'
      });
      triggerDesktopNotification("New Order Placed! 🛍️", msg);
    };
    const handleNotification = notification => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Skip toast if this notification is for an order creation (handleNewOrder handles it)
      if (notification.type === 'ORDER_CREATED' || notification.type === 'NEW_ORDER') {
        return;
      }
      try {
        playNotificationSound('tailor');
      } catch (e) {
        console.error(e);
      }
      const title = notification.title || "New Notification 🔔";
      const body = notification.message || "";
      toast.success(`🔔 ${title}\n${body}`, {
        id: `toast-notif-${notification._id || Date.now()}`,
        duration: 5000,
        position: 'top-right'
      });
      triggerDesktopNotification(title, body);
    };
    if (socket) {
      socket.on('new_notification', handleNotification);
      socket.on('receive_new_order', handleNewOrder);
    }
    return () => {
      if (socket) {
        socket.off('new_notification', handleNotification);
        socket.off('receive_new_order', handleNewOrder);
      }
    };
  }, [token, user?._id, user?.id]);
  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({
        ...n,
        isRead: true
      })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  const markAsRead = async id => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? {
        ...n,
        isRead: true
      } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };
  return <NotificationContext.Provider value={{
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllRead,
    markAsRead
  }}>
            {children}
        </NotificationContext.Provider>;
};
export const useNotifications = () => useContext(NotificationContext);
