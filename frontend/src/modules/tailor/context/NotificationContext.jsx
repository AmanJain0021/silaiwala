import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';
import { useTailorAuth } from './AuthContext';
import api from '../services/api';
import { playNotificationSound } from '../../../utils/audio';
import { getToken } from '../../../utils/auth';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, token } = useTailorAuth();
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
        
        const socket = io(SOCKET_URL, {
            auth: {
                token: getToken()
            }
        });
        
        const userId = user?._id || user?.id;
        const joinUserRoom = () => {
            if (userId) {
                socket.emit('join_user_room', String(userId));
            }
        };
        socket.on('connect', joinUserRoom);
        joinUserRoom();

        const triggerDesktopNotification = async (title, body) => {
            if (!("Notification" in window) || Notification.permission !== "granted") return;
            try {
                const iconUrl = window.location.origin + '/logo.png';
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    const registration = await navigator.serviceWorker.ready;
                    registration.showNotification(title, {
                        body,
                        icon: iconUrl,
                        badge: iconUrl,
                        vibrate: [200, 100, 200],
                        tag: 'tailor-order-' + Date.now()
                    });
                } else {
                    new Notification(title, { body, icon: iconUrl });
                }
            } catch (e) {
                try { new Notification(title, { body }); } catch (_e) {}
            }
        };

        const handleNewOrder = (data) => {
            fetchNotifications();
            try { playNotificationSound('tailor'); } catch(e) { console.error(e); }
            
            const orderIdStr = data?.orderId || data?.id || data?._id || '';
            const msg = data?.message || data?.title || `New Order ${orderIdStr ? '#' + orderIdStr : ''} received! Please review.`;
            toast.success(`🛍️ ${msg}`, { id: `toast-new-order-${orderIdStr || Date.now()}`, duration: 6000, position: 'top-right' });

            triggerDesktopNotification("New Order Placed! 🛍️", msg);
        };

        socket.on('new_notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            try { playNotificationSound('tailor'); } catch(e) { console.error(e); }
            
            const title = notification.title || "New Notification 🔔";
            const body = notification.message || "";
            toast.success(`🔔 ${title}\n${body}`, { id: `toast-notif-${notification._id || Date.now()}`, duration: 5000, position: 'top-right' });

            triggerDesktopNotification(title, body);
        });

        socket.on('receive_new_order', handleNewOrder);
        socket.on('new_order', handleNewOrder);

        return () => {
            socket.off('connect', joinUserRoom);
            socket.off('new_notification');
            socket.off('receive_new_order', handleNewOrder);
            socket.off('new_order', handleNewOrder);
        };
    }, [token, user?._id, user?.id]);

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            loading, 
            fetchNotifications, 
            markAllRead, 
            markAsRead 
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
