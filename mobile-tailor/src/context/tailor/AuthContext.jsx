// Port of modules/tailor/context/AuthContext.jsx (converted with scripts/web2rn.js, then reviewed)
import storage from '../../lib/storage';
import { sessionStore } from '../../lib/storage';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../../lib/api";
import { getToken, setToken as saveToken, removeToken } from "../../lib/auth";
import { removeDeviceTokenOnLogout } from '../../lib/push';
import useSocketStore from '../../store/socketStore';
import events from '../../lib/events';
import { navigate } from '../../lib/nav';
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
  SUSPENDED: 'SUSPENDED'
};
const clearTailorSessionStorage = () => {
  storage.removeItem('tailor_token');
  storage.removeItem('tailor_user');
  storage.removeItem('tailor_status');
  storage.removeItem('user');
  storage.removeItem('token');
  storage.removeItem('tailorSignupData');
  storage.removeItem('tailorSignupStep');
  storage.removeItem('delivery_token');
  storage.removeItem('delivery_user');
  storage.removeItem('executive_token');
  storage.removeItem('executive_user');
  try {
    sessionStore.clear();
  } catch (_) {}
};
export const AuthProvider = ({
  children
}) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = storage.getItem('tailor_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(getToken());
  const [status, setStatus] = useState(storage.getItem('tailor_status') || TAILOR_STATUS.NOT_REGISTERED);
  const [loading, setLoading] = useState(true);
  // Counter to force checkAuth re-run even if token string is the same
  const [authVersion, setAuthVersion] = useState(0);
  // Invalidate in-flight /tailors/me so logout→login as another tailor cannot restore the old profile
  const authCheckSeq = useRef(0);
  const isAuthenticated = !!token && !!user;
  const determineStatus = tailorData => {
    if (!tailorData) return TAILOR_STATUS.PENDING_APPROVAL;
    const regStatus = String(tailorData?.registrationStatus || '').toLowerCase();
    if (regStatus === 'rejected') return TAILOR_STATUS.REJECTED;

    // Recognise 'approved', 'verified', or 'active' registrationStatus values
    if (regStatus === 'verified' || regStatus === 'approved' || regStatus === 'active') {
      return TAILOR_STATUS.APPROVED;
    }

    // Check Admin managed isActive flag (default to true unless explicitly false)
    const isActive = tailorData?.user?.isActive !== false && tailorData?.isActive !== false;
    if (isActive && regStatus !== 'pending' && regStatus !== 'rejected') {
      return TAILOR_STATUS.APPROVED;
    }
    if (regStatus === 'pending') {
      return TAILOR_STATUS.PENDING_APPROVAL;
    }

    // Fallback for logged in active tailors
    return TAILOR_STATUS.APPROVED;
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
        const res = await api.get('/tailors/me', {
          signal: controller.signal
        });
        if (seq !== authCheckSeq.current) return;
        if (res.data.success) {
          const tailorData = res.data.data;
          const currentStatus = determineStatus(tailorData);
          const combinedUser = {
            ...tailorData.user,
            shopName: tailorData.shopName,
            documents: tailorData.documents,
            profile: tailorData,
            // Keep full profile for reference
            status: currentStatus
          };
          setUser(combinedUser);
          setStatus(currentStatus);
          storage.setItem('tailor_status', currentStatus);
          storage.setItem('tailor_user', JSON.stringify(combinedUser));
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
      currentStatus = determineStatus({
        ...userData.profile,
        user: userData
      });
    }
    const enrichedUser = {
      ...userData,
      _id: userData.id || userData._id,
      id: userData.id || userData._id,
      status: currentStatus
    };

    // 4. Save new session data
    storage.setItem('tailor_user', JSON.stringify(enrichedUser));
    storage.setItem('tailor_status', currentStatus);
    storage.setItem('user', JSON.stringify(enrichedUser));

    // 5. Update React state — bump authVersion to force checkAuth to re-fetch
    setToken(userToken);
    setUser(enrichedUser);
    setStatus(currentStatus);
    setAuthVersion(v => v + 1);
    setLoading(false); // Stop loading immediately on explicit login
  }, []);
  const logout = useCallback(async () => {
    // Remove FCM token from database BEFORE clearing auth token
    try {
      await removeDeviceTokenOnLogout();
    } catch (_) {}

    // Invalidate in-flight /tailors/me so it cannot revive this session
    authCheckSeq.current += 1;
    removeToken();
    clearTailorSessionStorage();

    setToken(null);
    setUser(null);
    setStatus(TAILOR_STATUS.NOT_REGISTERED);
    setLoading(false);

    // Drop shared socket so the next tailor does not inherit this session's rooms/JWT
    try {
      useSocketStore.getState().disconnect();
    } catch (_) {/* ignore */}
  }, []);

  // services/api.js on the web: any 401 clears the tailor session and goes to /partner/login
  useEffect(() => events.on('session_expired', () => {
    authCheckSeq.current += 1;
    removeToken();
    clearTailorSessionStorage();
    setToken(null);
    setUser(null);
    setStatus(TAILOR_STATUS.NOT_REGISTERED);
    setLoading(false);
    try { useSocketStore.getState().disconnect(); } catch (_) { /* ignore */ }
    navigate('/partner/login', { replace: true });
  }), []);
  const updateStatus = newStatus => {
    setStatus(newStatus);
    storage.setItem('tailor_status', newStatus);
    if (user) {
      const updatedUser = {
        ...user,
        status: newStatus
      };
      setUser(updatedUser);
      storage.setItem('tailor_user', JSON.stringify(updatedUser));
    }
  };
  return <AuthContext.Provider value={{
    user,
    token,
    status,
    loading,
    isAuthenticated,
    login,
    logout,
    updateStatus
  }}>
            {children}
        </AuthContext.Provider>;
};
export const useTailorAuth = () => useContext(AuthContext);
