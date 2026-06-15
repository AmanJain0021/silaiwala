export const TOKEN_KEY = "token";

export const getToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
        console.error("Error reading token from localStorage:", e);
        return null;
    }
};

export const setToken = (token) => {
    try {
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
        localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
        console.error("Error removing token from localStorage:", e);
    }
};
