import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';

const AdminProtectedRoute = () => {
    const { isAuthenticated, role, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-dark"></div>
            </div>
        );
    }

    const ADMIN_ROLES = ['admin', 'super_admin', 'support_agent', 'finance_manager', 'content_manager'];
    if (!isAuthenticated || !ADMIN_ROLES.includes(role)) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
};

export default AdminProtectedRoute;
