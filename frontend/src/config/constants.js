// Dynamic detection for LAN/Mobile devices
const getBackendBase = () => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        if (!host.includes('vercel.app') && !host.includes('sewzella') && !host.includes('silaiwala')) {
            return `http://${host}:5000`;
        }
    }
    return ''; // Fallback for env var prioritization
};

let envApiUrl = import.meta.env.VITE_API_URL;
let envSocketUrl = import.meta.env.VITE_SOCKET_URL;

if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // If accessing from a phone over LAN IP (e.g. 192.168.x.x), route to that host instead of localhost
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.includes('vercel.app') && !host.includes('sewzella') && !host.includes('silaiwala')) {
        if (envApiUrl && envApiUrl.includes('localhost')) {
            envApiUrl = envApiUrl.replace('localhost', host);
        }
        if (envSocketUrl && envSocketUrl.includes('localhost')) {
            envSocketUrl = envSocketUrl.replace('localhost', host);
        }
    }
}

if (envApiUrl && !envApiUrl.startsWith('http')) {
    envApiUrl = `https://${envApiUrl}`;
}
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
