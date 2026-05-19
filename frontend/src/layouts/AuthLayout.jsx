import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// 🩷🟠🔵🟢 Gradient overlay colors — one per image
const overlayGradients = [
    "linear-gradient(135deg, #FFB6C1 0%, #FF69B4 50%, #FFD1DC 100%)",   // 🩷 Pink  (Image 1)
    "linear-gradient(135deg, #FFDAB9 0%, #FFB347 50%, #FFE0B2 100%)",   // 🟠 Orange (Image 2)
    "linear-gradient(135deg, #B5D8FF 0%, #6FA8DC 50%, #D6EBFF 100%)",   // 🔵 Blue  (Image 3)
    "linear-gradient(135deg, #B8F5D8 0%, #7BDCB5 50%, #D4FFEA 100%)"    // 🟢 Green (Image 4)
];

// Page background gradients (lighter tint)
const bgGradients = [
    "linear-gradient(135deg, #FFF0F5 0%, #FFE4EC 40%, #FFF5F7 100%)",
    "linear-gradient(135deg, #FFF5E6 0%, #FFECD2 40%, #FFF9F0 100%)",
    "linear-gradient(135deg, #F0F5FF 0%, #E4ECFF 40%, #F5F7FF 100%)",
    "linear-gradient(135deg, #F0FFF5 0%, #E4FFEC 40%, #F5FFF7 100%)"
];

const PHASE_DURATIONS = [1800, 2200, 1200];

const AuthLayout = () => {
    const location = useLocation();
    const isDelivery = location.pathname.startsWith('/delivery');
    const isPartner = location.pathname.startsWith('/partner');
    const isLogin = location.pathname.endsWith('/login');

    const isCustomerAuth = !isDelivery && !isPartner;

    const config = isDelivery ? {
        images: [
            "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1617469165786-8007eda3caa7?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80"
        ],
        brand: "FAST DELIVERY",
        headings: ["QUICK DELIVERY", "ON TIME", "YOUR PACKAGE", "SAFE HANDS"],
        subheading: "Delivering Happiness Daily",
        loginLink: "/delivery/login",
        signupLink: "/delivery/signup"
    } : isPartner ? {
        images: [
            "/A Comprehensive Guide to Digital Sewing Patterns.jpeg",
            "/Hacoupian brand identity Photoshooting.jpeg",
            "/40 2 Polyester Sewing Thread for Sewing.jpeg",
            "/download.jpeg"
        ],
        brand: "PARTNER PORTAL",
        headings: ["GROW YOUR BRAND", "MASTER CRAFT", "GLOBAL REACH", "SEAMLESS EARNINGS"],
        subheading: "Join our expert tailor network",
        loginLink: "/partner/login",
        signupLink: "/partner/signup"
    } : {
        images: [
            "/download.jpeg",
            "/40 2 Polyester Sewing Thread for Sewing.jpeg",
            "/A Comprehensive Guide to Digital Sewing Patterns.jpeg",
            "/Hacoupian brand identity Photoshooting.jpeg"
        ],
        brand: "SewZella",
        headings: ["STITCH PERFECT", "THREADS OF ART", "MADE FOR YOU", "SILAI MAGIC"],
        subheading: "Stitching Memories Together",
        loginLink: "/login",
        signupLink: "/signup"
    };

    const imgRef = useRef(0);
    const [currentImage, setCurrentImage] = useState(0);
    const [overlayOpacity, setOverlayOpacity] = useState(1);
    const [overlayColorIndex, setOverlayColorIndex] = useState(0);
    const [phase, setPhase] = useState(0);

    useEffect(() => { imgRef.current = currentImage; }, [currentImage]);

    useEffect(() => {
        const t = setTimeout(() => setOverlayOpacity(0), 400);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isCustomerAuth) return; // Skip carousel for customer auth

        const timer = setTimeout(() => {
            if (phase === 0) {
                setPhase(1);
            } else if (phase === 1) {
                const next = (imgRef.current + 1) % (config.images?.length || 1);
                setOverlayColorIndex(next);
                setOverlayOpacity(1);
                setPhase(2);
            } else {
                const next = (imgRef.current + 1) % (config.images?.length || 1);
                setCurrentImage(next);
                setTimeout(() => {
                    setOverlayOpacity(0);
                    setPhase(0);
                }, 150);
            }
        }, PHASE_DURATIONS[phase]);

        return () => clearTimeout(timer);
    }, [phase, config.images?.length, isCustomerAuth]);

    // NEW CUSTOMER SPLIT LAYOUT
    if (isCustomerAuth) {
        return (
            <div className="min-h-screen bg-white flex flex-col-reverse justify-end md:justify-start md:flex-row font-sans selection:bg-[#2D2F6E]/20 overflow-x-hidden">
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
                        </div>

                        {/* Footer Section */}
                        <div className="mt-auto pt-4 md:pt-10 border-t border-slate-50">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                    Trusted by 10,000+ <br/>
                                    <span className="text-[#2D2F6E]">Certified Tailors</span>
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
                            src="/userlogin.png" 
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
                                Book your tailoring services, track orders, and experience perfect fits with Sewzella.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // LEGACY CARD LAYOUT (For Delivery/Partner)
    return (
        <div
            className="min-h-[100dvh] flex items-center justify-center p-2 sm:p-4 font-sans selection:bg-[#2D2F6E]/20 transition-all duration-[1500ms] ease-in-out"
            style={{ background: bgGradients[currentImage] }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[400px] bg-white rounded-[2rem] sm:rounded-[3rem] shadow-[0_20px_60px_-12px_rgba(255,92,138,0.15)] overflow-hidden relative"
            >
                <div className="relative h-[180px] sm:h-[210px] w-full overflow-hidden">
                    {config.images?.map((src, idx) => (
                        <div
                            key={idx}
                            className="absolute inset-0 transition-opacity duration-[600ms] ease-in-out"
                            style={{ opacity: idx === currentImage ? 1 : 0 }}
                        >
                            <div className="absolute inset-0 bg-black/30 z-[1]" />
                            <img src={src} alt="Silai" className="w-full h-full object-cover" />
                        </div>
                    ))}

                    <div
                        className="absolute inset-0 z-[5] transition-opacity duration-[1200ms] ease-in-out"
                        style={{
                            background: overlayGradients[overlayColorIndex],
                            opacity: overlayOpacity,
                        }}
                    />

                    <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-20 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                            <img src="/sewzella_logo.jpeg" alt="" className="w-4 h-4 object-contain invert grayscale brightness-200" />
                        </div>
                        <span className="text-white font-black text-lg tracking-tighter drop-shadow-lg">{config.brand}</span>
                    </div>

                    <div className="absolute top-14 sm:top-16 left-0 right-0 z-20 text-center px-6">
                        <AnimatePresence mode='wait'>
                            <motion.h1
                                key={currentImage}
                                initial={{ y: 15, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -12, opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="text-white text-2xl sm:text-3xl font-black uppercase tracking-tight drop-shadow-lg"
                            >
                                {config.headings?.[currentImage]}
                            </motion.h1>
                        </AnimatePresence>
                        <p className="text-white/80 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 drop-shadow-md">
                            {config.subheading}
                        </p>
                    </div>

                    <div className="absolute bottom-12 sm:bottom-14 left-0 right-0 z-20 flex justify-center gap-1.5">
                        {config.images?.map((_, idx) => (
                            <div
                                key={idx}
                                className="rounded-full transition-all duration-500"
                                style={{
                                    width: idx === currentImage ? 18 : 5,
                                    height: 5,
                                    backgroundColor: idx === currentImage ? '#2D2F6E' : 'rgba(255,255,255,0.5)',
                                }}
                            />
                        ))}
                    </div>

                    <div className="absolute bottom-[-1px] left-0 right-0 z-30 fill-white leading-[0]">
                        <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-[45px] sm:h-[55px]">
                            <path d="M-1.41,61.67 C204.00,165.29 292.04,-43.91 501.97,63.64 L500.00,150.00 L0.00,150.00 Z"></path>
                        </svg>
                    </div>
                </div>

                <div className="absolute top-[155px] sm:top-[180px] left-1/2 -translate-x-1/2 z-40">
                    <div className="p-1 bg-[#FDE5D2] rounded-full shadow-lg">
                        <div className="w-[65px] h-[65px] sm:w-[75px] sm:h-[75px] bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                            <img src="/sewzella_logo.jpeg" alt="SewZella" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                <div className="pt-12 sm:pt-14 pb-6 sm:pb-8 px-5 sm:px-7">
                    <div className="bg-[#F7F8FC] p-1 rounded-[1.5rem] flex items-center relative mb-5 sm:mb-6 shadow-inner border border-pink-50/50">
                        <Link
                            to={config.loginLink}
                            className={`flex-1 text-center py-2.5 text-xs sm:text-sm font-black tracking-wide z-10 transition-colors duration-300 ${isLogin ? 'text-[#2D2F6E]' : 'text-indigo-300'}`}
                        >
                            LOGIN
                        </Link>
                        <Link
                            to={config.signupLink}
                            className={`flex-1 text-center py-2.5 text-xs sm:text-sm font-black tracking-wide z-10 transition-colors duration-300 ${!isLogin ? 'text-[#2D2F6E]' : 'text-indigo-300'}`}
                        >
                            SIGN UP
                        </Link>

                        <motion.div
                            animate={{ x: isLogin ? 0 : '100%' }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            className="absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[1.3rem] shadow-sm border border-pink-50"
                        />
                    </div>

                    <Outlet />
                </div>
            </motion.div>
        </div>
    );
};

export default AuthLayout;
