import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTailorAuth, TAILOR_STATUS } from '../context/AuthContext';

const ProtectedRoute = ({ requiredStatus = [TAILOR_STATUS.APPROVED] }) => {
    const { token, status, loading } = useTailorAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/partner/welcome" replace />;
    }

    if (status === TAILOR_STATUS.PENDING_APPROVAL && !requiredStatus.includes(TAILOR_STATUS.PENDING_APPROVAL)) {
        return <Navigate to="/partner/under-review" replace />;
    }

    if (status === TAILOR_STATUS.REJECTED && !requiredStatus.includes(TAILOR_STATUS.REJECTED)) {
        return <Navigate to="/partner/rejected" replace />;
    }

    if (!requiredStatus.includes(status)) {
        return <Navigate to="/partner/welcome" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
