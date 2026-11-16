// Port of frontend/src/hooks/useRequireAuth.js
import { useNavigate, useLocation } from '../lib/nav';
import useAuthStore from '../store/authStore';
import toast from '../lib/toast';

export const useRequireAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const requireAuth = (message = 'Please login to continue') => {
    if (isAuthenticated) return true;
    toast(message, { icon: '🔒', duration: 3000 });
    navigate('/user/login', { state: { from: location.pathname + location.search } });
    return false;
  };

  return { isAuthenticated, requireAuth };
};

export default useRequireAuth;
