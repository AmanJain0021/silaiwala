import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const TAILOR_STATUS = {
    NOT_REGISTERED: 'NOT_REGISTERED',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    SUSPENDED: 'SUSPENDED',
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('tailor_user')));
    const [token, setToken] = useState(localStorage.getItem('tailor_token'));
    const [status, setStatus] = useState(localStorage.getItem('tailor_status') || TAILOR_STATUS.NOT_REGISTERED);
    const [loading, setLoading] = useState(true);

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
        const checkAuth = async () => {
            if (token) {
                try {
                    const res = await api.get('/tailors/me');
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
                    console.error("Auth check failed:", error);
                    if (error.response?.status === 401) {
                        logout();
                    }
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, [token]);

    const login = (userData, userToken) => {
        localStorage.setItem('tailor_token', userToken);
        
        // Determine status immediately from login payload
        let currentStatus = TAILOR_STATUS.NOT_REGISTERED;
        if (userData.role === 'tailor') {
            // Pass whole userData so determineStatus can see the isActive flag
            currentStatus = determineStatus({ ...userData.profile, user: userData });
        }

        const enrichedUser = {
            ...userData,
            status: currentStatus
        };

        localStorage.setItem('tailor_user', JSON.stringify(enrichedUser));
        localStorage.setItem('tailor_status', currentStatus);
        
        setToken(userToken);
        setUser(enrichedUser);
        setStatus(currentStatus);
        setLoading(false); // Stop loading immediately on explicit login
    };

    const logout = () => {
        localStorage.removeItem('tailor_token');
        localStorage.removeItem('tailor_user');
        localStorage.removeItem('tailor_status');
        setToken(null);
        setUser(null);
        setStatus(TAILOR_STATUS.NOT_REGISTERED);
    };

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
        <AuthContext.Provider value={{ user, token, status, loading, login, logout, updateStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useTailorAuth = () => useContext(AuthContext);
