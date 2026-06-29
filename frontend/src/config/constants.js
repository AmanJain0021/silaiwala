// Dynamic detection for LAN/Mobile devices
const getBackendBase = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        // Local development
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        // If we are on a Vercel/Production domain, we should NOT append :5000
        // and we should probably use HTTPS.
        // However, it's best to rely on VITE_API_URL for production.
    }
    return ''; // Fallback for env var prioritization
};

let envApiUrl = import.meta.env.VITE_API_URL;
if (envApiUrl && !envApiUrl.startsWith('http')) {
    envApiUrl = `https://${envApiUrl}`;
}
let envSocketUrl = import.meta.env.VITE_SOCKET_URL;
if (envSocketUrl && !envSocketUrl.startsWith('http')) {
    envSocketUrl = `https://${envSocketUrl}`;
}

export const SOCKET_URL = envSocketUrl || getBackendBase() || 'http://localhost:5000';
export const API_URL = envApiUrl || (SOCKET_URL ? `${SOCKET_URL}/api/v1` : '/api/v1');


export const APP_NAME = 'SewZella';

export const THEME = {
    primary: '#FD0053', // Emerald Green (Starbucks-like)
    secondary: '#d4e9e2', // Light Green
    accent: '#00754a', // Bright Green
};
