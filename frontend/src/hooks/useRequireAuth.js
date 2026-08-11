import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

/**
 * Reusable hook to guard actions that require authentication.
 * 
 * Usage:
 *   const { isAuthenticated, requireAuth } = useRequireAuth();
 *   const handleBuyNow = () => {
 *     if (!requireAuth('Please login to book this service')) return;
 *     // ... existing logic
 *   };
 */
export const useRequireAuth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    /**
     * Call before any action that requires a logged-in user.
     * @param {string} message - Toast message shown when redirecting to login
     * @returns {boolean} true if authenticated, false if redirecting to login
     */
    const requireAuth = (message = 'Please login to continue') => {
        if (isAuthenticated) return true;

        toast(message, {
            icon: '🔒',
            duration: 3000,
            style: {
                borderRadius: '16px',
                background: '#1F2937',
                color: '#fff',
                fontWeight: '600',
                fontSize: '14px',
                padding: '12px 20px',
            },
        });

        navigate('/user/login', {
            state: { from: location.pathname + location.search },
        });

        return false;
    };

    return { isAuthenticated, requireAuth };
};

export default useRequireAuth;
