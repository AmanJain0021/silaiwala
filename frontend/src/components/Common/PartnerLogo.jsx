import React from 'react';
import { motion } from 'framer-motion';
import useBrandingStore from '../../store/brandingStore';

const PartnerLogo = ({ className = "", textColor = "text-white", scale = 1, showTagline = true }) => {
    const { appName, logos } = useBrandingStore();

    return (
        <div className={`flex flex-col items-center ${className}`} style={{ transform: `scale(${scale})` }}>
            <motion.img
                src={logos.tailor}
                alt={appName}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-40 h-48 mb-4 object-contain drop-shadow-2xl"
            />
            
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
                    {appName}
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
        </div>
    );
};

export default PartnerLogo;
