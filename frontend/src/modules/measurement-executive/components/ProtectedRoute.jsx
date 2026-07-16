import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../../../utils/auth';

const ProtectedRoute = () => {
    const token = getToken();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'measurement_executive') {
        return <Navigate to="/executive/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
