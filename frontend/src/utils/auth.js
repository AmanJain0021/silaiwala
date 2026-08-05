export const TOKEN_KEY = "token"; // Customer token key

export const getToken = (forcedRole = null) => {
    try {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;

            if (forcedRole === 'delivery' || path.startsWith('/delivery')) {
                const stored = JSON.parse(localStorage.getItem('delivery-auth-storage') || '{}');
                if (stored.state?.token) return stored.state.token;
                return localStorage.getItem("delivery_token") || null;
            }
            if (forcedRole === 'tailor' || path.startsWith('/partner')) {
                return localStorage.getItem("tailor_token") || null;
            }
            if (forcedRole === 'measurement_executive' || path.startsWith('/executive')) {
                return localStorage.getItem("executive_token") || null;
            }
            if (forcedRole === 'admin' || path.startsWith('/admin')) {
                return localStorage.getItem("admin_token") || null;
            }
            if (forcedRole === 'customer' || path.startsWith('/user') || path === '/' || path.startsWith('/login')) {
                return localStorage.getItem(TOKEN_KEY) || null;
            }
        }
        return localStorage.getItem(TOKEN_KEY) || null;
    } catch (e) {
        console.error("Error reading token from localStorage:", e);
        return null;
    }
};

export const setToken = (token, role = null) => {
    try {
        if (!token) {
            removeToken(role);
            return;
        }
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (role === 'delivery' || path.startsWith('/delivery')) {
                localStorage.setItem("delivery_token", token);
                return;
            }
            if (role === 'tailor' || path.startsWith('/partner')) {
                localStorage.setItem("tailor_token", token);
                return;
            }
            if (role === 'measurement_executive' || path.startsWith('/executive')) {
                localStorage.setItem("executive_token", token);
                return;
            }
            if (role === 'admin' || path.startsWith('/admin')) {
                localStorage.setItem("admin_token", token);
                return;
            }
        }
        localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
        console.error("Error writing token to localStorage:", e);
    }
};

export const removeToken = (role = null) => {
    try {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;

            if (role === 'delivery' || path.startsWith('/delivery')) {
                localStorage.removeItem("delivery_token");
                localStorage.removeItem("delivery-token");
                localStorage.removeItem("delivery-refresh-token");
                localStorage.removeItem("delivery-auth-storage");
                return;
            }
            if (role === 'tailor' || path.startsWith('/partner')) {
                localStorage.removeItem("tailor_token");
                localStorage.removeItem("tailor_user");
                localStorage.removeItem("tailor_status");
                return;
            }
            if (role === 'measurement_executive' || path.startsWith('/executive')) {
                localStorage.removeItem("executive_token");
                localStorage.removeItem("executive_user");
                return;
            }
            if (role === 'admin' || path.startsWith('/admin')) {
                localStorage.removeItem("admin_token");
                localStorage.removeItem("admin_user");
                return;
            }
        }
        localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
        console.error("Error removing token from localStorage:", e);
    }
};


