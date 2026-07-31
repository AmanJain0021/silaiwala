import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { getToken, setToken as saveToken, removeToken } from '../../../utils/auth';

const AuthContext = createContext({
    user: null,
    token: null,
    status: 'NOT_REGISTERED',
    loading: false,
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
    updateStatus: () => {}
});

export const TAILOR_STATUS = {
    NOT_REGISTERED: 'NOT_REGISTERED',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    SUSPENDED: 'SUSPENDED',
};

const clearTailorSessionStorage = () => {
    localStorage.removeItem('tailor_token');
    localStorage.removeItem('tailor_user');
    localStorage.removeItem('tailor_status');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('tailorSignupData');
    localStorage.removeItem('tailorSignupStep');
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    localStorage.removeItem('executive_token');
    localStorage.removeItem('executive_user');
    try {
        sessionStorage.clear();
    } catch (_) {}
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('tailor_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(getToken());
    const [status, setStatus] = useState(localStorage.getItem('tailor_status') || TAILOR_STATUS.NOT_REGISTERED);
    const [loading, setLoading] = useState(true);
    // Counter to force checkAuth re-run even if token string is the same
    const [authVersion, setAuthVersion] = useState(0);
    // Invalidate in-flight /tailors/me so logout→login as another tailor cannot restore the old profile
    const authCheckSeq = useRef(0);
    const isAuthenticated = !!token && !!user;

    const determineStatus = (tailorData) => {
        // Check Admin managed isActive flag first
        const isActive = tailorData?.user?.isActive || tailorData?.isActive;
        if (isActive) return TAILOR_STATUS.APPROVED;
        
        if (!tailorData) return TAILOR_STATUS.PENDING_APPROVAL;
        
        if (tailorData.registrationStatus === 'rejected') return TAILOR_STATUS.REJECTED;
        if (tailorData.registrationStatus === 'verified') return TAILOR_STATUS.APPROVED;
        
        return TAILOR_STATUS.PENDING_APPROVAL;
    };

    useEffect(() => {
        const seq = ++authCheckSeq.current;
        const controller = new AbortController();

        const checkAuth = async () => {
            const currentToken = getToken();
            if (!currentToken) {
                if (seq === authCheckSeq.current) {
                    setUser(null);
                    setStatus(TAILOR_STATUS.NOT_REGISTERED);
                    setLoading(false);
                }
                return;
            }

            try {
                setLoading(true);
                const res = await api.get('/tailors/me', { signal: controller.signal });
                if (seq !== authCheckSeq.current) return;

                if (res.data.success) {
                    const tailorData = res.data.data;
                    const currentStatus = determineStatus(tailorData);

                    const combinedUser = {
                        ...tailorData.user,
                        shopName: tailorData.shopName,
                        documents: tailorData.documents,
                        profile: tailorData, // Keep full profile for reference
                        status: currentStatus
                    };
                    
                    setUser(combinedUser);
                    setStatus(currentStatus);
                    localStorage.setItem('tailor_status', currentStatus);
                    localStorage.setItem('tailor_user', JSON.stringify(combinedUser));
                }
            } catch (error) {
                if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
                if (seq !== authCheckSeq.current) return;

                console.error("Auth check failed:", error);
                if (error.response?.status === 401) {
                    authCheckSeq.current += 1;
                    removeToken();
                    clearTailorSessionStorage();
                    setToken(null);
                    setUser(null);
                    setStatus(TAILOR_STATUS.NOT_REGISTERED);
                }
            } finally {
                if (seq === authCheckSeq.current) {
                    setLoading(false);
                }
            }
        };

        checkAuth();
        return () => {
            controller.abort();
        };
    }, [token, authVersion]);

    const login = useCallback((userData, userToken) => {
        // Invalidate any in-flight profile fetch from the previous tailor
        authCheckSeq.current += 1;

        // 1. Clear ALL old session data first
        removeToken();
        clearTailorSessionStorage();

        // 2. Save new token
        saveToken(userToken, 'tailor');
        
        // 3. Determine status immediately from login payload
        let currentStatus = TAILOR_STATUS.NOT_REGISTERED;
        if (userData.role === 'tailor') {
            // Pass whole userData so determineStatus can see the isActive flag
            currentStatus = determineStatus({ ...userData.profile, user: userData });
        }

        const enrichedUser = {
            ...userData,
            _id: userData.id || userData._id,
            id: userData.id || userData._id,
            status: currentStatus
        };

        // 4. Save new session data
        localStorage.setItem('tailor_user', JSON.stringify(enrichedUser));
        localStorage.setItem('tailor_status', currentStatus);
        localStorage.setItem('user', JSON.stringify(enrichedUser));
        
        // 5. Update React state — bump authVersion to force checkAuth to re-fetch
        setToken(userToken);
        setUser(enrichedUser);
        setStatus(currentStatus);
        setAuthVersion(v => v + 1);
        setLoading(false); // Stop loading immediately on explicit login
    }, []);

    const logout = useCallback(() => {
        // Invalidate in-flight /tailors/me so it cannot revive this session
        authCheckSeq.current += 1;
        removeToken();
        clearTailorSessionStorage();

        // Reset global Zustand authStore if active
        try {
            import('../../../store/authStore').then((mod) => {
                if (mod.default?.getState()?.logout) {
                    mod.default.getState().logout();
                }
            }).catch(() => {});
        } catch (_) {}

        setToken(null);
        setUser(null);
        setStatus(TAILOR_STATUS.NOT_REGISTERED);
        setLoading(false);

        // Drop shared socket so the next tailor does not inherit this session's rooms/JWT
        try {
            import('../../../store/socketStore').then((mod) => {
                mod.default.getState().disconnect();
            }).catch(() => {});
        } catch (_) { /* ignore */ }
    }, []);

    const updateStatus = (newStatus) => {
        setStatus(newStatus);
        localStorage.setItem('tailor_status', newStatus);
        if (user) {
            const updatedUser = { ...user, status: newStatus };
            setUser(updatedUser);
            localStorage.setItem('tailor_user', JSON.stringify(updatedUser));
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, status, loading, isAuthenticated, login, logout, updateStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useTailorAuth = () => useContext(AuthContext);
