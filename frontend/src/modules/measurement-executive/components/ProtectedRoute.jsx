import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'measurement_executive') {
        return <Navigate to="/executive/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
