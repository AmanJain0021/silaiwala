export const TOKEN_KEY = "token";

export const getToken = () => {
    try {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.startsWith('/delivery')) {
                const stored = JSON.parse(localStorage.getItem('delivery-auth-storage') || '{}');
                if (stored.state?.token) return stored.state.token;
                return localStorage.getItem("delivery_token") || localStorage.getItem(TOKEN_KEY);
            }
            if (path.startsWith('/partner')) {
                return localStorage.getItem("tailor_token") || localStorage.getItem(TOKEN_KEY);
            }
            if (path.startsWith('/executive')) {
                return localStorage.getItem("executive_token") || localStorage.getItem(TOKEN_KEY);
            }
        }
        return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
        console.error("Error reading token from localStorage:", e);
        return null;
    }
};

export const setToken = (token) => {
    try {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.startsWith('/delivery')) {
                if (token) localStorage.setItem("delivery_token", token);
                else localStorage.removeItem("delivery_token");
            } else if (path.startsWith('/partner')) {
                if (token) localStorage.setItem("tailor_token", token);
                else localStorage.removeItem("tailor_token");
            } else if (path.startsWith('/executive')) {
                if (token) localStorage.setItem("executive_token", token);
                else localStorage.removeItem("executive_token");
            }
        }
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    } catch (e) {
        console.error("Error writing token to localStorage:", e);
    }
};

export const removeToken = () => {
    try {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.startsWith('/delivery')) {
                localStorage.removeItem("delivery_token");
            } else if (path.startsWith('/partner')) {
                localStorage.removeItem("tailor_token");
            } else if (path.startsWith('/executive')) {
                localStorage.removeItem("executive_token");
            }
        }
        localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
        console.error("Error removing token from localStorage:", e);
    }
};

