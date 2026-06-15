import { create } from 'zustand';
import api from '../utils/api';
import { ROLES } from '../config/roles';
import { getToken, setToken, removeToken } from '../utils/auth';

const getInitialUser = () => {
    try {
        const user = localStorage.getItem('user');
        if (!user || user === 'undefined') return null;
        return JSON.parse(user);
    } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        return null;
    }
};

const useAuthStore = create((set) => ({
    user: getInitialUser(),
    isAuthenticated: !!getToken(),
    role: getInitialUser()?.role || null,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            console.log('Backend Login Raw Response:', response.data);
            
            const user = response.data.data || response.data.user || response.data;
            const token = response.data.token;

            if (!user) {
                throw new Error('User data not found in response');
            }

            setToken(token);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                user,
                isAuthenticated: true,
                role: user.role,
                isLoading: false
            });
            return user;
        } catch (err) {
            console.error('Frontend AuthStore Login Error Detail:', err);
            const data = err.response?.data;
            const message = data?.errors?.[0] || data?.message || err.message || 'Login failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    sendOTP: async (identifier) => {
        set({ isLoading: true, error: null });
        try {
            const isEmail = identifier.includes('@');
            const payload = isEmail ? { email: identifier } : { phoneNumber: identifier };
            
            const response = await api.post('/auth/send-otp', payload);
            set({ isLoading: false });
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to send verification code';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    otpLogin: async (phoneNumber, otp) => {
        set({ isLoading: true, error: null });
        try {
            // Using /auth/login route which backend controller already supports for phoneNumber + otp
            const response = await api.post('/auth/login', { email: phoneNumber, otp });
            
            const user = response.data.data || response.data.user || response.data;
            const token = response.data.token;

            setToken(token);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                user,
                isAuthenticated: true,
                role: user.role,
                isLoading: false
            });
            return user;
        } catch (err) {
            const data = err.response?.data;
            const message = data?.message || 'Invalid OTP. Please try again.';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    logout: () => {
        removeToken();
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false, role: null });
    },

    signup: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/register-customer', userData);
            console.log('Backend Signup Raw Response:', response.data);
            
            // Handle different potential response structures robustly
            const user = response.data.data || response.data.user || response.data;
            const token = response.data.token;

            if (!user) {
                throw new Error('User object not found in the response');
            }

            setToken(token);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                user,
                isAuthenticated: true,
                role: user.role,
                isLoading: false
            });
            return user;
        } catch (err) {
            console.error('Frontend AuthStore Signup Error Detail:', err);
            const data = err.response?.data;
            const message = data?.errors?.[0] || data?.message || err.message || 'Signup failed';
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    checkAuth: () => {
        const user = getInitialUser();
        const token = getToken();
        if (user && token) {
            set({ user, isAuthenticated: true, role: user.role });
        } else {
            set({ user: null, isAuthenticated: false, role: null });
        }
    }
}));

export default useAuthStore;
