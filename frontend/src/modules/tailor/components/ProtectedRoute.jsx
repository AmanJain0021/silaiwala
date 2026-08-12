import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTailorAuth, TAILOR_STATUS } from '../context/AuthContext';

const ProtectedRoute = ({ requiredStatus = [TAILOR_STATUS.APPROVED] }) => {
    const { token, status, loading, user } = useTailorAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    const currentRole = user?.role || (localStorage.getItem('tailor_user') ? JSON.parse(localStorage.getItem('tailor_user'))?.role : null);

    if (!token || (currentRole && currentRole !== 'tailor' && currentRole !== 'partner')) {
        return <Navigate to="/partner/login" replace />;
    }

    if (status === TAILOR_STATUS.PENDING_APPROVAL && !requiredStatus.includes(TAILOR_STATUS.PENDING_APPROVAL)) {
        return <Navigate to="/partner/verification" replace />;
    }

    if (status === TAILOR_STATUS.REJECTED && !requiredStatus.includes(TAILOR_STATUS.REJECTED)) {
        return <Navigate to="/partner/verification" replace />;
    }

    if (!requiredStatus.includes(status)) {
        if (status === TAILOR_STATUS.NOT_REGISTERED) {
            return <Navigate to="/partner/login" replace />;
        }
        return <Navigate to="/partner/verification" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
