// Port of frontend/src/utils/auth.js for the executive role: the web keeps this session under `executive_token`.
import storage from './storage';

export const TOKEN_KEY = 'executive_token';
export const getToken = () => storage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (!token) return removeToken();
  storage.setItem(TOKEN_KEY, token);
};
export const removeToken = () => storage.removeItem(TOKEN_KEY);
