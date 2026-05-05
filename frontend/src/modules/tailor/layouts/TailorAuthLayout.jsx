import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const TailorAuthLayout = () => {
    const location = useLocation();
    const isLogin = location.pathname.includes('login');

    return (
        <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-start sm:py-10">
            <div className="w-full max-w-[450px] bg-white sm:rounded-[2.5rem] shadow-xl overflow-hidden relative min-h-screen sm:min-h-0 flex flex-col">
                {/* Banner Section */}
                <div className="relative h-[300px] w-full bg-[#FDF2F8] overflow-hidden">
                    {/* Background elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-50" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl -ml-20 -mb-20 opacity-50" />
                    
                    <div className="relative z-10 h-full grid grid-cols-[1.2fr_1fr] items-center px-6">
                        {/* Left Side: Text Stack */}
                        <div className="flex flex-col items-start gap-0 -translate-y-4">
                            {/* Logo Icon */}
                            <div className="mb-4">
                                <img src="/sewzella_logo-removebg-preview.png" alt="Logo" className="h-32 w-auto object-contain" />
                            </div>
                            
                            {/* Role Title */}
                            <h2 className="text-[#D86580] font-sans text-2xl font-black tracking-tight mb-2">SewZella</h2>
                            
                            {/* Slogan */}
                            <p className="text-gray-600 text-sm font-semibold tracking-tight opacity-80 italic">Stitching excellence,<br />happy customers.</p>
                        </div>

                        {/* Right Side: Illustration */}
                        <div className="relative h-full flex justify-center items-end overflow-visible">
                            <img 
                                src="/tailor_partner_illustration-removebg-preview.png" 
                                alt="Tailor Partner" 
                                className="h-[280px] sm:h-[320px] w-auto object-contain transform translate-y-6 z-10 -translate-x-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 bg-white px-8 pt-8 pb-10">
                    <Outlet />
                </div>

                {/* Footer Navigation */}
                <div className="bg-white px-8 pb-8 pt-2 text-center relative z-10">
                    {isLogin ? (
                        <p className="text-gray-500 font-medium text-sm">
                            Don't have an account?{' '}
                            <Link to="/partner/signup" className="text-[#D86580] font-bold hover:underline">
                                Sign Up
                            </Link>
                        </p>
                    ) : (
                        <p className="text-gray-500 font-medium text-sm">
                            Already have an account?{' '}
                            <Link to="/partner/login" className="text-[#D86580] font-bold hover:underline">
                                Login
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TailorAuthLayout;
