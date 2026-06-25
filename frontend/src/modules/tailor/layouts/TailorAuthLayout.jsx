import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import partnerLoginImg from '../../../assets/partnerLogin.png';

const TailorAuthLayout = () => {
    const location = useLocation();
    const isLogin = location.pathname.includes('login');

    return (
        <div className="min-h-screen bg-white flex flex-col-reverse justify-end md:justify-start md:flex-row font-sans selection:bg-[#843D9B]/20 overflow-x-hidden">
            {/* Left Side: Auth Content */}
            <div className="w-full md:w-3/5 lg:w-[55%] flex flex-col flex-1 min-h-0">
                <div className="p-4 md:p-10 flex flex-col flex-1 max-w-[550px] mx-auto w-full">
                    {/* Header with Logo (Hidden on mobile as it's in the banner) */}
                    <div className="hidden md:flex justify-between items-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <img src="/sewzella_logo-removebg-preview.png" alt="SewZella" className="h-10 md:h-12 w-auto object-contain" />
                        </motion.div>
                    </div>

                    {/* Main Form Content */}
                    <div className="flex-1 flex flex-col justify-center">
                        <Outlet />
                        
                        {/* Footer Navigation inline with form */}
                        <div className="mt-10 md:mt-12 text-center sm:text-left">
                            {isLogin ? (
                                <p className="text-xs md:text-sm font-bold text-slate-400">
                                    New to Sewzella Tailor?{' '}
                                    <Link to="/partner/signup" className="text-[#843D9B] hover:underline font-black ml-1">
                                        Register Now
                                    </Link>
                                </p>
                            ) : (
                                <p className="text-xs md:text-sm font-bold text-slate-400">
                                    Already have an account?{' '}
                                    <Link to="/partner/login" className="text-[#843D9B] hover:underline font-black ml-1">
                                        Login
                                    </Link>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer Section */}
                    <div className="mt-auto pt-4 md:pt-10 border-t border-slate-50">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                Trusted by 10,000+ <br/>
                                <span className="text-[#843D9B]">Certified Tailors</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Visual Content */}
            <div className="w-full h-[250px] sm:h-[300px] md:h-auto md:w-2/5 lg:w-[45%] relative overflow-hidden bg-[#F8F9FD] max-w-[100vw]">
                <motion.div 
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <img 
                        src={partnerLoginImg} 
                        alt="Expert Tailoring" 
                        className="w-full h-full object-cover object-top md:object-center scale-[1.15] md:scale-100"
                    />
                    {/* Gradient Overlay matching reference */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent md:from-white md:via-white/90 md:to-transparent w-[60%] sm:w-[70%] md:w-[70%]" />
                </motion.div>

                {/* Overlay Content matching reference */}
                <div className="absolute inset-0 flex flex-col items-start px-5 pt-6 md:px-6 md:pt-10 z-10">
                    {/* Logo and small title */}
                    <div className="flex flex-col items-center mb-4 md:mb-8 -ml-2">
                        <img src="/sewzella_logo-removebg-preview.png" alt="SewZella" className="h-12 md:h-20 w-auto drop-shadow-sm" />
                        <div className="flex items-center gap-2 -mt-2">
                             <div className="h-[1px] w-6 md:w-10 bg-[#2D2F6F] opacity-50" />
                             <span className="text-[8px] md:text-[11px] font-black text-[#2D2F6F] tracking-[0.25em] uppercase">Tailored for you</span>
                             <div className="h-[1px] w-6 md:w-10 bg-[#2D2F6F] opacity-50" />
                        </div>
                    </div>

                    {/* Headings */}
                    <div className="hidden md:block max-w-[180px] sm:max-w-[220px] md:max-w-[280px] space-y-2 md:space-y-4">
                        <h1 className="text-lg md:text-3xl font-black text-[#1e293b] leading-[1.1] tracking-tight">
                            Crafting style.<br />
                            <span className="text-[#2D2F6F]">Creating smiles.</span>
                        </h1>
                        <p className="text-[10px] md:text-[13px] font-bold text-gray-700 leading-snug">
                            Manage your orders, clients and grow your tailoring business with Sewzella.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TailorAuthLayout;


