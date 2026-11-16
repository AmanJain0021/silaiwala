// Port of frontend/src/utils/auth.js for the customer role only.
import storage from './storage';

export const TOKEN_KEY = 'token';
export const getToken = () => storage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (!token) return removeToken();
  storage.setItem(TOKEN_KEY, token);
};
export const removeToken = () => storage.removeItem(TOKEN_KEY);
