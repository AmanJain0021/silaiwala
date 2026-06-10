import axios from 'axios';
import { API_URL } from '../../../config/constants';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('tailor_token');
        const hasAuth = config.headers && (config.headers.Authorization || (typeof config.headers.has === 'function' && config.headers.has('Authorization')));
        if (token && !hasAuth) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('tailor_token');
            window.location.href = '/partner/login';
        }
        return Promise.reject(error);
    }
);

export default api;
