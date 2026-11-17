// Port of frontend/src/utils/auth.js for the tailor (partner) role: the web keeps the
// partner session under `tailor_token` (getToken/setToken with role 'tailor' or a /partner path).
import storage from './storage';

export const TOKEN_KEY = 'tailor_token';
export const getToken = () => storage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (!token) return removeToken();
  storage.setItem(TOKEN_KEY, token);
};
export const removeToken = () => storage.removeItem(TOKEN_KEY);
