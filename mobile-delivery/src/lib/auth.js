// Port of frontend/src/utils/auth.js for the delivery role: the web keeps the delivery session under
// `delivery_token` (plus the persisted `delivery-auth-storage` that deliveryStore reads).
import storage from './storage';

export const TOKEN_KEY = 'delivery_token';
export const getToken = () => {
  try {
    const persisted = JSON.parse(storage.getItem('delivery-auth-storage') || '{}');
    if (persisted?.state?.token) return persisted.state.token;
  } catch (_) { /* fall back to the plain key */ }
  return storage.getItem(TOKEN_KEY);
};
export const setToken = (token) => {
  if (!token) return removeToken();
  storage.setItem(TOKEN_KEY, token);
};
export const removeToken = () => storage.removeItem(TOKEN_KEY);
