/**
 * Central Theme Configuration
 * Single source of truth for brand colors used in JS (toasts, Razorpay, etc.).
 */

export const theme = {
    colors: {
        primary: '#843D9B',
        primaryLight: '#9B5BB0',
        primaryDark: '#6B2F7E',
        primarySoft: '#F3EAF8',

        secondary: '#6B2F7E',
        accent: '#D4AF37',
        success: '#10b981',
        warning: '#facc15',
        error: '#ef4444',

        gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
        },
    },

    gradients: {
        primary: 'linear-gradient(135deg, #843D9B 0%, #6B2F7E 100%)',
        dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        glass: 'rgba(255, 255, 255, 0.7)',
    },

    shadows: {
        primary: '0 10px 25px -5px rgba(132, 61, 155, 0.28)',
        card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    },
};

export default theme;
