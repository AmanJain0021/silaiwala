import axios from 'axios';
import { API_URL } from '../config/constants';
import { getToken, removeToken } from './auth';

// Ensure the base URL has a protocol to prevent it from being treated as a relative path
const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_URL || API_URL;
    if (url && !url.startsWith('http') && !url.startsWith('/')) {
        url = `https://${url}`;
    }
    return url;
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true,
});

// Map to store active requests
const activeRequests = new Map();

// Helper to generate a unique key for each request
const getRequestKey = (config) => {
    if (!config) return '';
    let paramsCopy = null;
    if (config.params) {
        const { _t, ...rest } = config.params;
        if (Object.keys(rest).length > 0) {
            paramsCopy = rest;
        }
    }
    const paramsStr = paramsCopy ? JSON.stringify(paramsCopy) : '';
    const method = config.method ? config.method.toLowerCase() : 'get';
    return `${method}:${config.url}:${paramsStr}`;
};

const clearActiveRequest = (config) => {
    if (config && config.method?.toLowerCase() === 'get') {
        const requestKey = getRequestKey(config);
        if (activeRequests.get(requestKey) === config._controller) {
            activeRequests.delete(requestKey);
        }
    }
};

// Request interceptor for adding JWT token and handling cancellation
api.interceptors.request.use(
    (config) => {
        // Prevent Mobile WebView / HTTP caching for GET requests
        if (config.method?.toLowerCase() === 'get') {
            if (config.headers?.set) {
                config.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                config.headers.set('Pragma', 'no-cache');
                config.headers.set('Expires', '0');
            } else if (config.headers) {
                config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                config.headers['Pragma'] = 'no-cache';
                config.headers['Expires'] = '0';
            }
            config.params = { ...config.params, _t: Date.now() };

            // Cancel previous pending request if it exists (ONLY FOR GET REQUESTS)
            const requestKey = getRequestKey(config);
            if (activeRequests.has(requestKey)) {
                const controller = activeRequests.get(requestKey);
                controller.abort("Cancelled by a new request");
            }

            // Create new AbortController for this request (ONLY FOR GET REQUESTS)
            const controller = new AbortController();
            config.signal = controller.signal;
            config._controller = controller;
            activeRequests.set(requestKey, controller);
        }

        // Global fix for FormData boundary issues
        if (config.data instanceof FormData) {
            if (config.headers && config.headers.has && config.headers.has('Content-Type')) {
                 config.headers.delete('Content-Type');
            } else if (config.headers && config.headers['Content-Type']) {
                 delete config.headers['Content-Type'];
            }
        }

        const token = getToken();
        const hasAuth = config.headers && (config.headers.get?.('Authorization') || config.headers.Authorization);
        if (token && !hasAuth) {
            if (config.headers.set) {
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling global errors and clearing active requests
api.interceptors.response.use(
    (response) => {
        clearActiveRequest(response.config);
        return response;
    },
    (error) => {
        if (error.config) {
            clearActiveRequest(error.config);
        }

        if (axios.isCancel(error)) {
            // Silently handle cancellation, it's expected behavior
        }

        // Catch offline / network disconnect errors
        if (!error.response && (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED')) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('app_network_offline'));
            }
        }

        // Global error handling: e.g., redirect to login if 401
        if (error.response && error.response.status === 401) {
            removeToken();
            // Optional: window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
