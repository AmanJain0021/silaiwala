import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';

const CustomerProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }

    return <Outlet />;
};

export default CustomerProtectedRoute;
