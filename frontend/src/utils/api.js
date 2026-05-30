import axios from 'axios';
import { API_URL } from '../config/constants';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Map to store active requests
const activeRequests = new Map();

// Helper to generate a unique key for each request
const getRequestKey = (config) => {
    return `${config.method}:${config.url}`;
};

// Request interceptor for adding JWT token and handling cancellation
api.interceptors.request.use(
    (config) => {
        // Cancel previous pending request if it exists
        const requestKey = getRequestKey(config);
        if (activeRequests.has(requestKey)) {
            const controller = activeRequests.get(requestKey);
            controller.abort("Cancelled by a new request");
        }

        // Create new AbortController for this request
        const controller = new AbortController();
        config.signal = controller.signal;
        activeRequests.set(requestKey, controller);

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
            console.log('Request canceled:', error.message);
        } else if (error.config) {
            const requestKey = getRequestKey(error.config);
            activeRequests.delete(requestKey);
        }

        // Global error handling: e.g., redirect to login if 401
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            // Optional: window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
