import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Users, Scissors, TrendingUp } from 'lucide-react';
import partnerLoginImg from '../../../assets/partnerLogin.png';

const TailorAuthLayout = () => {
    const location = useLocation();
    const isLogin = location.pathname.includes('login');

    const features = [
        { icon: <ClipboardList className="w-7 h-7 text-[#2D2F6F]" />, label: 'Manage Orders' },
        { icon: <Users className="w-7 h-7 text-[#2D2F6F]" />, label: 'Client Management' },
        { icon: <Scissors className="w-7 h-7 text-[#2D2F6F]" />, label: 'Measurements & Fittings' },
        { icon: <TrendingUp className="w-7 h-7 text-[#2D2F6F]" />, label: 'Business Growth' },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center">
            {/* Top Branding Section */}
            <div className="relative w-full h-[280px] sm:h-[400px] overflow-hidden">
                <img 
                    src={partnerLoginImg} 
                    alt="Tailor Background" 
                    className="w-full h-full object-cover"
                />
                {/* White Left Shadow/Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent w-[70%]" />
                
                {/* Logo and Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-start px-6 pt-6 sm:px-8 sm:pt-10">
                    <div className="flex flex-col items-center mb-4 sm:mb-6 -ml-4">
                        <img src="/sewzella_logo-removebg-preview.png" alt="SewZella" className="h-20 sm:h-32 w-auto drop-shadow-sm" />
                        <div className="flex items-center gap-3 -mt-2 sm:-mt-4">
                             <div className="h-[1.5px] w-10 bg-[#2D2F6F] opacity-50" />
                             <span className="text-[11px] font-black text-[#2D2F6F] tracking-[0.25em] uppercase">Tailored for you</span>
                             <div className="h-[1.5px] w-10 bg-[#2D2F6F] opacity-50" />
                        </div>
                    </div>

                    <div className="max-w-[220px] space-y-3 relative z-10">
                        <h1 className="text-2xl font-black text-[#1e293b] leading-[1.1] tracking-tight">
                            Crafting style.<br />
                            <span className="text-[#2D2F6F]">Creating smiles.</span>
                        </h1>
                        <p className="text-[12px] font-bold text-gray-700 leading-snug">
                            Manage your orders, clients and grow your tailoring business with Sewzella.
                        </p>
                    </div>
                </div>
            </div>

            {/* Features Card - Overlapping */}
            <div className="relative z-20 -mt-10 sm:-mt-16 w-[94%] max-w-[450px] bg-white rounded-[1rem] shadow-md py-2 px-2 border border-gray-50/50">
                <div className="grid grid-cols-4 gap-0 divide-x divide-gray-100">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center gap-1 px-1">
                            <div className="w-8 h-8 flex items-center justify-center">
                                {React.cloneElement(feature.icon, { className: 'w-5 h-5 text-[#2D2F6F]' })}
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter leading-tight px-1">
                                {feature.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Auth Content Area */}
            <div className="w-full max-w-[450px] px-4 mt-4 sm:mt-6 mb-8 sm:mb-12">
                <div className="bg-white rounded-[1.5rem] shadow-xl border border-gray-50/50 overflow-hidden p-5 sm:p-8">
                    <Outlet />
                </div>

                {/* Footer Navigation */}
                <div className="mt-8 text-center">
                    {isLogin ? (
                        <p className="text-gray-600 font-bold text-sm tracking-tight">
                            New to Sewzella Tailor?{' '}
                            <Link to="/partner/signup" className="text-[#2D2F6F] hover:underline font-black">
                                Register Now
                            </Link>
                        </p>
                    ) : (
                        <p className="text-gray-600 font-bold text-sm tracking-tight">
                            Already have an account?{' '}
                            <Link to="/partner/login" className="text-[#2D2F6F] hover:underline font-black">
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


