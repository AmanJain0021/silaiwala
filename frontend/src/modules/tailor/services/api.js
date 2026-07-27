import axios from 'axios';
import { API_URL } from '../../../config/constants';
import { getToken, removeToken } from '../../../utils/auth';

const getBaseUrl = () => {
    let url = API_URL;
    if (url && !url.startsWith('http') && !url.startsWith('/')) {
        url = `https://${url}`;
    }
    return url;
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for token
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        const hasAuth = config.headers && (config.headers.Authorization || (typeof config.headers.has === 'function' && config.headers.has('Authorization')));
        if (token && !hasAuth) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Prevent Mobile WebView / HTTP caching for GET requests
        if (config.method?.toLowerCase() === 'get') {
            if (config.headers.set) {
                config.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                config.headers.set('Pragma', 'no-cache');
                config.headers.set('Expires', '0');
            } else {
                config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                config.headers['Pragma'] = 'no-cache';
                config.headers['Expires'] = '0';
            }
            config.params = { ...config.params, _t: Date.now() };
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
            removeToken();
            // Clear the cached tailor identity too, otherwise the stale user keeps
            // driving sockets/push and can resurface after another tailor logs in.
            try {
                localStorage.removeItem('tailor_token');
                localStorage.removeItem('tailor_user');
                localStorage.removeItem('tailor_status');
                localStorage.removeItem('user');
            } catch (e) {
                console.error('Failed clearing tailor session:', e);
            }
            if (!window.location.pathname.startsWith('/partner/login')) {
                window.location.href = '/partner/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
