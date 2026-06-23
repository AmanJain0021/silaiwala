import { create } from 'zustand';
import api from '../../../shared/utils/api';

const useMeasurementStore = create((set, get) => ({
    profile: null,
    stats: null,
    requests: [],
    loading: false,
    error: null,

    // Auth
    login: async (credentials) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/auth/login', credentials);
            set({ loading: false });
            return res.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Login failed', loading: false });
            throw error;
        }
    },

    register: async (data) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/auth/register', { ...data, role: 'measurement_executive' });
            return res.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Registration failed', loading: false });
            throw error;
        }
    },

    // Profile & Dashboard
    fetchDashboard: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/measurement-executive/dashboard');
            set({ 
                profile: res.data.data.profile, 
                stats: res.data.data.stats, 
                loading: false 
            });
        } catch (error) {
            if (error.name === 'CanceledError') return;
            set({ error: error.response?.data?.message || 'Failed to load dashboard', loading: false });
        }
    },

    toggleAvailability: async (status) => {
        try {
            const res = await api.put('/measurement-executive/availability', { status });
            set(state => ({
                profile: { ...state.profile, availabilityStatus: res.data.data.availabilityStatus }
            }));
            return res.data;
        } catch (error) {
            console.error('Error toggling availability:', error);
            throw error;
        }
    },

    updateLocation: async (coordinates) => {
        try {
            await api.put('/measurement-executive/location', { coordinates });
        } catch (error) {
            console.error('Location update failed:', error);
        }
    },

    // Requests
    fetchRequests: async (statusFilter = 'pending') => {
        set({ loading: true, error: null });
        try {
            const res = await api.get(`/measurement-executive/requests?status=${statusFilter}`);
            set({ requests: res.data.data, loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to load requests', loading: false });
        }
    },

    getRequestDetail: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await api.get(`/measurement-executive/requests/${id}`);
            set({ loading: false });
            return res.data.data;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to load request details', loading: false });
            throw error;
        }
    },

    acceptRequest: async (id) => {
        try {
            await api.put(`/measurement-executive/requests/${id}/accept`);
            get().fetchRequests('active');
        } catch (error) {
            throw error;
        }
    },

    rejectRequest: async (id) => {
        try {
            await api.put(`/measurement-executive/requests/${id}/reject`);
            get().fetchRequests('pending');
        } catch (error) {
            throw error;
        }
    },

    // OTP
    generateOTP: async (id) => {
        try {
            await api.post(`/measurement-executive/requests/${id}/generate-otp`);
        } catch (error) {
            throw error;
        }
    },

    verifyOTP: async (id, otp) => {
        try {
            await api.post(`/measurement-executive/requests/${id}/verify-otp`, { otp });
        } catch (error) {
            throw error;
        }
    },

    // Upload
    uploadMeasurements: async (id, formData) => {
        try {
            await api.post(`/measurement-executive/requests/${id}/upload`, formData);
        } catch (error) {
            throw error;
        }
    },

    completeMeasurement: async (id) => {
        try {
            await api.put(`/measurement-executive/requests/${id}/complete`);
            get().fetchRequests('completed');
        } catch (error) {
            throw error;
        }
    }
}));

export default useMeasurementStore;
