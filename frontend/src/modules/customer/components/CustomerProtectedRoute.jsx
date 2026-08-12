import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';

const CustomerProtectedRoute = () => {
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const currentRole = user?.role || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.role : null);

    if (!isAuthenticated || (currentRole && currentRole !== 'customer')) {
        return <Navigate to="/user/login" state={{ from: location.pathname + location.search }} replace />;
    }

    return <Outlet />;
};

export default CustomerProtectedRoute;
