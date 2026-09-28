import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const TailorAuthLayout = () => {
    const location = useLocation();
    const isSignup = location.pathname.includes('signup') || location.pathname.includes('register');

    return (
        <div className="min-h-[100dvh] w-full bg-white flex flex-col items-center justify-start sm:justify-center px-4 py-6 sm:p-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#843D9B]/20">
            <div className={`w-full ${isSignup ? 'max-w-[620px]' : 'max-w-[400px]'} mx-auto flex flex-col items-center my-0 sm:my-auto`}>
                <Outlet />
            </div>
        </div>
    );
};

export default TailorAuthLayout;
