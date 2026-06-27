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
    headers: {
        'Content-Type': 'application/json',
    },
});

// Map to store active requests
const activeRequests = new Map();

// Helper to generate a unique key for each request
const getRequestKey = (config) => {
    const paramsStr = config.params ? JSON.stringify(config.params) : '';
    return `${config.method}:${config.url}:${paramsStr}`;
};

// Request interceptor for adding JWT token and handling cancellation
api.interceptors.request.use(
    (config) => {
        // Cancel previous pending request if it exists (ONLY FOR GET REQUESTS)
        const requestKey = getRequestKey(config);
        if (config.method?.toLowerCase() === 'get' && activeRequests.has(requestKey)) {
            const controller = activeRequests.get(requestKey);
            controller.abort("Cancelled by a new request");
        }

        // Create new AbortController for this request (ONLY FOR GET REQUESTS)
        if (config.method?.toLowerCase() === 'get') {
            const controller = new AbortController();
            config.signal = controller.signal;
            activeRequests.set(requestKey, controller);
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
        const requestKey = getRequestKey(response.config);
        activeRequests.delete(requestKey);
        return response;
    },
    (error) => {
        if (axios.isCancel(error)) {
            // Silently handle cancellation, it's expected behavior
        } else if (error.config) {
            const requestKey = getRequestKey(error.config);
            activeRequests.delete(requestKey);
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
