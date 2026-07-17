import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import PendingApproval from '../pages/PendingApproval';

const DeliveryProtectedRoute = () => {
    const { isAuthenticated, user, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'delivery') {
        return <Navigate to="/delivery/login" replace />;
    }

    if (user && !user.isActive) {
        return <PendingApproval />;
    }

    return <Outlet />;
};

export default DeliveryProtectedRoute;
