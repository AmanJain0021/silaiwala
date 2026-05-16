import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import deliveryLoginImg from '../../../assets/deliveryLogin.png';

const DeliveryAuthLayout = () => {
    const location = useLocation();
    const isLogin = location.pathname.includes('login');

    return (
        <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center">
            {/* Top Branding Section */}
            <div className="relative w-full h-[320px] overflow-hidden">
                <img 
                    src={deliveryLoginImg} 
                    alt="Delivery Background" 
                    className="w-full h-full object-cover"
                />
                {/* White Left Shadow/Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent w-[75%]" />
                
                {/* Logo and Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-start px-8 pt-8">
                    <div className="flex flex-col items-center mb-4 -ml-4">
                        <img src="/sewzella_logo-removebg-preview.png" alt="SewZella" className="h-28 w-auto drop-shadow-sm" />
                        <div className="flex items-center gap-3 -mt-3">
                             <div className="h-[1.5px] w-6 bg-[#2D2F6F] opacity-50" />
                             <span className="text-[10px] font-black text-[#2D2F6F] tracking-[0.25em] uppercase">Delivery Partner</span>
                             <div className="h-[1.5px] w-6 bg-[#2D2F6F] opacity-50" />
                        </div>
                    </div>

                    <div className="max-w-[220px] space-y-2.5 relative z-10">
                        <h1 className="text-xl font-black text-[#1e293b] leading-[1.1] tracking-tight">
                            Delivering style.<br />
                            <span className="text-[#2D2F6F]">Earning smiles.</span>
                        </h1>
                        <p className="text-[11px] font-bold text-gray-700 leading-snug">
                            Join Sewzella and deliver happiness, on time.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Auth Content Area */}
            <div className="w-full max-w-[520px] px-4 -mt-10 relative z-20 mb-12">
                <div className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-50/50 overflow-hidden p-5">
                    <Outlet />
                </div>

                {/* Footer Navigation */}
                <div className="mt-8 text-center">
                    {isLogin ? (
                        <p className="text-gray-600 font-bold text-sm tracking-tight">
                            New to Sewzella Delivery?{' '}
                            <Link to="/delivery/signup" className="text-[#2D2F6F] hover:underline font-black">
                                Register Now
                            </Link>
                        </p>
                    ) : (
                        <p className="text-gray-600 font-bold text-sm tracking-tight">
                            Already a partner?{' '}
                            <Link to="/delivery/login" className="text-[#2D2F6F] hover:underline font-black">
                                Login
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryAuthLayout;

