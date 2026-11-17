// Public runtime config (EXPO_PUBLIC_* values from mobile-user/.env, inlined at build time).
const ensureHttps = (u) => (u && !/^https?:\/\//.test(u) ? `https://${u}` : u);

export const SOCKET_URL = ensureHttps(process.env.EXPO_PUBLIC_SOCKET_URL) || 'https://sewzella.com';
export const API_URL = ensureHttps(process.env.EXPO_PUBLIC_API_URL) || `${SOCKET_URL}/api/v1`;
export const WEB_ORIGIN = SOCKET_URL; // the deployed web app (serves /public assets)
export const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
export const APP_NAME = 'SewZella';
export const REQUEST_TIMEOUT_MS = 20000;
