import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const DeliveryAuthLayout = () => {
    const location = useLocation();
    const isSignup = location.pathname.includes('signup') || location.pathname.includes('register');

    return (
        <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#843D9B]/20">
            <div className={`w-full ${isSignup ? 'max-w-[620px]' : 'max-w-[400px]'} mx-auto flex flex-col items-center py-4`}>
                <Outlet />
            </div>
        </div>
    );
};

export default DeliveryAuthLayout;
