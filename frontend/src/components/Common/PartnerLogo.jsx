import React from 'react';
import { motion } from 'framer-motion';

const PartnerLogo = ({ className = "", textColor = "text-white", scale = 1, showTagline = true }) => {
    
    // Golden color palette
    const goldMain = "#D4AF37"; // Metallic Gold
    const goldLight = "#F9F4E0"; // Light Shine
    const goldDark = "#996515"; // Dark shadow

    return (
        <div className={`flex flex-col items-center ${className}`} style={{ transform: `scale(${scale})` }}>
            <div className="relative w-40 h-48 mb-4">
                <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <defs>
                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#BF953F" />
                            <stop offset="20%" stopColor="#FCF6BA" />
                            <stop offset="40%" stopColor="#B38728" />
                            <stop offset="60%" stopColor="#FBF5B7" />
                            <stop offset="80%" stopColor="#AA771C" />
                            <stop offset="100%" stopColor="#BF953F" />
                        </linearGradient>
                        <filter id="goldShine" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
                            <feOffset in="blur" dx="1" dy="1" result="offsetBlur" />
                            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.75" specularExponent="20" lightingColor="white" result="specOut">
                                <fePointLight x="-5000" y="-10000" z="20000" />
                            </feSpecularLighting>
                            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
                            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litGraphic" />
                        </filter>
                    </defs>

                    {/* Neck / Head detail */}
                    <motion.path 
                        d="M45 10 L 55 10 L 55 6 L 45 6 Z M 48 6 L 52 6 L 52 2 L 48 2 Z" 
                        fill="url(#goldGradient)"
                        filter="url(#goldShine)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                    
                    {/* Main Dress Form Shape */}
                    <motion.path 
                        d="M50 10 
                           C 45 10, 35 12, 32 18
                           C 28 25, 30 35, 35 45
                           C 38 50, 38 60, 35 70
                           C 32 80, 30 90, 35 100
                           L 65 100
                           C 70 90, 68 80, 65 70
                           C 62 60, 62 50, 65 45
                           C 70 35, 72 25, 68 18
                           C 65 12, 55 10, 50 10 Z" 
                        stroke="url(#goldGradient)" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        filter="url(#goldShine)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Lower Measuring Tapes (Wrapped around hips/bottom) */}
                    <motion.path 
                        d="M32 75 C 32 75, 50 82, 68 75 C 72 75, 75 80, 68 85 C 50 92, 32 85, 32 85 C 28 85, 25 80, 32 75 Z" 
                        fill="url(#goldGradient)" 
                        filter="url(#goldShine)"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="origin-center"
                    />
                    
                    <motion.path 
                        d="M30 85 C 30 85, 50 95, 70 85 C 75 85, 78 90, 70 98 C 50 108, 25 98, 25 90 C 25 85, 30 85, 30 85 Z" 
                        fill="url(#goldGradient)" 
                        filter="url(#goldShine)"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 1.1 }}
                        className="origin-center"
                    />

                    {/* Button on the right (Hip level) */}
                    <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.4, type: "spring" }}
                        filter="url(#goldShine)"
                    >
                        <circle cx="82" cy="80" r="10" fill="url(#goldGradient)" />
                        <circle cx="79" cy="77" r="1.5" fill="black" opacity="0.3" />
                        <circle cx="85" cy="77" r="1.5" fill="black" opacity="0.3" />
                        <circle cx="79" cy="83" r="1.5" fill="black" opacity="0.3" />
                        <circle cx="85" cy="83" r="1.5" fill="black" opacity="0.3" />
                    </motion.g>
                </svg>
            </div>
            
            <div className="text-center relative z-20">
                <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-6xl italic mb-0 leading-tight" 
                    style={{ 
                        fontFamily: "'Dancing Script', cursive", 
                        background: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 45%, #B38728 70%, #AA771C 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    Sewzella
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="text-[14px] tracking-[0.6em] font-black uppercase mt-[-5px]"
                    style={{
                        background: 'linear-gradient(135deg, #BF953F, #FCF6BA, #AA771C)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    TAILOR APP
                </motion.p>
                
                {showTagline && (
                    <>
                        <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '14rem', opacity: 1 }}
                            transition={{ delay: 1.2, duration: 1 }}
                            className="h-[1px] mx-auto my-4 bg-gradient-to-r from-transparent via-[#BF953F]/40 to-transparent" 
                        />
                        
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            transition={{ delay: 1.8, duration: 1 }}
                            className="text-[#F9F4E0] text-[12px] font-medium tracking-wider opacity-60"
                        >
                            Stitching perfection, delivered with care.
                        </motion.p>
                    </>
                )}
            </div>

            {/* Import Google Font if not present */}
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=swap');
                `}
            </style>
        </div>
    );
};

export default PartnerLogo;
