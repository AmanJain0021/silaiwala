import api from '../../../utils/api';

const deliveryService = {
    // Profile
    getProfile: async () => {
        const response = await api.get('/deliveries/me');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await api.patch('/deliveries/profile', data);
        return response.data;
    },

    updateStatus: async (data) => {
        const response = await api.patch('/deliveries/status', data);
        return response.data;
    },

    submitDocuments: async (documents) => {
        const response = await api.post('/deliveries/documents', { documents });
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/deliveries/stats');
        return response.data;
    },

    // Orders
    getAssignedOrders: async (status) => {
        const url = status ? `/deliveries/orders?status=${status}` : '/deliveries/orders';
        const response = await api.get(url);
        return response.data;
    },

    getAvailableOrders: async () => {
        const response = await api.get('/deliveries/available-orders');
        return response.data;
    },

    acceptOrder: async (orderId) => {
        const response = await api.post(`/deliveries/orders/${orderId}/accept`);
        return response.data;
    },

    rejectOrder: async (orderId) => {
        const response = await api.post(`/deliveries/orders/${orderId}/reject`);
        return response.data;
    },

    updateDeliveryStatus: async (orderId, status, message, proof) => {
        const response = await api.patch(`/deliveries/orders/${orderId}/status`, { status, message, proof });
        return response.data;
    },

    // Notifications
    getNotifications: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },

    markNotificationAsRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllNotificationsRead: async () => {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    }
};

export default deliveryService;
