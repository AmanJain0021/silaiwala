// Executive session store. Same storage keys as the web executive login (executive_token, executive_user, user);
// the token lives in SecureStore. Password reset calls are the web authStore's.
import { create } from 'zustand';
import api from '../lib/api';
import storage, { sessionStore } from '../lib/storage';
import { getToken, setToken, removeToken } from '../lib/auth';
import useMeasurementStore from './measurementExecutiveStore';

const getInitialUser = () => {
  try {
    const userStr = storage.getItem('executive_user') || storage.getItem('user');
    if (!userStr || userStr === 'undefined') return null;
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!getToken(),
  role: getInitialUser()?.role || null,
  isLoading: false,
  error: null,

  setSession: (token, user) => {
    setToken(token);
    storage.setItem('executive_user', JSON.stringify(user));
    storage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, role: user.role, isLoading: false, error: null });
  },

  sendOTP: async (identifier) => {
    set({ isLoading: true, error: null });
    try {
      const payload = identifier.includes('@') ? { email: identifier } : { phoneNumber: identifier };
      const response = await api.post('/auth/send-otp', payload);
      set({ isLoading: false });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send verification code';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  resetPassword: async (phoneNumber, otp, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/reset-password', { phoneNumber, otp, newPassword });
      set({ isLoading: false });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      const { removeDeviceTokenOnLogout } = require('../lib/push');
      await removeDeviceTokenOnLogout();
    } catch (_) { /* push not available */ }
    removeToken();
    storage.removeItem('user');
    storage.removeItem('executive_user');
    storage.removeItem('fcm_token');
    sessionStore.clear();
    useMeasurementStore.getState().logout();
    set({ user: null, isAuthenticated: false, role: null, error: null });
    try {
      const { navigate } = require('../lib/nav');
      navigate('/executive/login', { replace: true });
    } catch (_) { /* router not mounted */ }
  },

  checkAuth: () => {
    const user = getInitialUser();
    const token = getToken();
    if (user && token) set({ user, isAuthenticated: true, role: user.role });
    else set({ user: null, isAuthenticated: false, role: null });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updatedFields };
      storage.setItem('user', JSON.stringify(updatedUser));
      storage.setItem('executive_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));

export default useAuthStore;
