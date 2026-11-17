// Port of frontend/src/store/authStore.js (customer role only).
import { create } from 'zustand';
import api from '../lib/api';
import storage, { sessionStore } from '../lib/storage';
import { getToken, setToken, removeToken } from '../lib/auth';

const getInitialUser = () => {
  try {
    const userStr = storage.getItem('user');
    if (!userStr || userStr === 'undefined') return null;
    const parsed = JSON.parse(userStr);
    return parsed?.user ? { ...parsed.user, profile: parsed.profile } : parsed;
  } catch (e) {
    return null;
  }
};

const extractUser = (response) => {
  const rawData = response.data.data || response.data.user || response.data;
  return rawData && rawData.user ? { ...rawData.user, profile: rawData.profile } : rawData;
};

const persistSession = (token, user, set) => {
  setToken(token);
  storage.setItem('user', JSON.stringify(user));
  set({ user, isAuthenticated: true, role: user.role, isLoading: false });
};

const useAuthStore = create((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!getToken(),
  role: getInitialUser()?.role || null,
  isLoading: false,
  error: null,

  login: async (email, password, expectedRole = null) => {
    set({ isLoading: true, error: null });
    try {
      const payload = { email, password };
      if (expectedRole) payload.expectedRole = expectedRole;
      const response = await api.post('/auth/login', payload);
      const user = extractUser(response);
      if (!user) throw new Error('User data not found in response');
      persistSession(response.data.token, user, set);
      return user;
    } catch (err) {
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

  otpLogin: async (phoneNumber, otp, expectedRole = null) => {
    set({ isLoading: true, error: null });
    try {
      const payload = { email: phoneNumber, otp };
      if (expectedRole) payload.expectedRole = expectedRole;
      const response = await api.post('/auth/login', payload);
      const user = extractUser(response);
      persistSession(response.data.token, user, set);
      return user;
    } catch (err) {
      const data = err.response?.data;
      const message = data?.message || 'Invalid OTP. Please try again.';
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

  googleLogin: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/google-login', { credential });
      const user = response.data.data || response.data.user || response.data;
      persistSession(response.data.token, user, set);
      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Google Login failed.';
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
    storage.removeItem('fcm_token');
    sessionStore.clear();
    set({ user: null, isAuthenticated: false, role: null, error: null });
    try {
      const { navigate } = require('../lib/nav');
      navigate('/partner/login', { replace: true });
    } catch (_) { /* router not mounted */ }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register-customer', userData);
      let user = response.data.data;
      if (user && user.user) user = { ...user.user, profile: user.profile };
      else user = user || response.data.user || response.data;
      if (!user) throw new Error('User object not found in the response');
      persistSession(response.data.token, user, set);
      return user;
    } catch (err) {
      const data = err.response?.data;
      const message = data?.errors?.[0] || data?.message || err.message || 'Signup failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
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
      return { user: updatedUser };
    });
  },
}));

export default useAuthStore;
