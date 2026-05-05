import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── TOP: Needle with curved thread (matching first image reference) ── */
const NeedleWithThread = () => (
    <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Curved dashed thread line */}
        <motion.path
            d="M120 5 Q 140 20, 130 40 Q 120 60, 100 70 Q 80 80, 70 95 Q 60 110, 65 130"
            stroke="rgba(180,150,120,0.45)"
            strokeWidth="1.2"
            strokeDasharray="5 6"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, delay: 0.3, ease: "easeInOut" }}
        />
        {/* Thread loop at eye of needle */}
        <motion.path
            d="M68 122 Q 55 115, 60 105 Q 65 95, 72 100"
            stroke="rgba(180,150,120,0.4)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 2.5 }}
        />
        {/* Needle body (diagonal) */}
        <motion.line
            x1="68" y1="125" x2="78" y2="100"
            stroke="rgba(200,170,140,0.7)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
        />
        {/* Needle point (sharp tip) */}
        <motion.line
            x1="78" y1="100" x2="82" y2="92"
            stroke="rgba(220,190,160,0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8 }}
        />
        {/* Needle eye hole */}
        <motion.ellipse
            cx="66" cy="128"
            rx="2" ry="3.5"
            stroke="rgba(200,170,140,0.5)"
            strokeWidth="0.8"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
        />
    </svg>
);

/* ── BOTTOM: Thread Spool (matching second image) ── */
const ThreadSpool = () => (
    <motion.svg
        width="65" height="85"
        viewBox="0 0 65 85"
        fill="none"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 0.75, y: 0 }}
        transition={{ delay: 1.8, duration: 1 }}
    >
        {/* Spool top cap */}
        <ellipse cx="32" cy="18" rx="20" ry="7" fill="rgba(140,70,80,0.5)" />
        {/* Spool body (thread wrapped) */}
        <rect x="12" y="18" width="40" height="40" rx="2" fill="rgba(140,70,80,0.45)" />
        {/* Spool bottom cap */}
        <ellipse cx="32" cy="58" rx="20" ry="7" fill="rgba(140,70,80,0.55)" />
        {/* Thread wrapping texture */}
        {[26, 32, 38, 44, 50].map((y, i) => (
            <line key={i} x1="14" y1={y} x2="50" y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.7" />
        ))}
        {/* Thread tail coming off spool */}
        <motion.path
            d="M50 38 Q 58 30, 55 20 Q 52 10, 42 14"
            stroke="rgba(140,70,80,0.4)"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 2.5, duration: 1.2 }}
        />
    </motion.svg>
);

/* ── BOTTOM: Sewing Button ── */
const SewingButton = ({ size = 30, color = "rgba(180,60,60,0.55)", delay = 2 }) => (
    <motion.svg
        width={size} height={size}
        viewBox="0 0 32 32"
        fill="none"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.65, scale: 1 }}
        transition={{ delay, duration: 0.7, type: "spring" }}
    >
        <circle cx="16" cy="16" r="14" fill={color} />
        <circle cx="16" cy="16" r="11" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" fill="none" />
        {/* Four holes */}
        <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.2)" />
        <circle cx="20" cy="12" r="1.5" fill="rgba(255,255,255,0.2)" />
        <circle cx="12" cy="20" r="1.5" fill="rgba(255,255,255,0.2)" />
        <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.2)" />
        {/* Cross threads */}
        <line x1="12" y1="12" x2="20" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <line x1="20" y1="12" x2="12" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
    </motion.svg>
);

/* ── BOTTOM: Curved stitch line (matching second image) ── */
const BottomStitchLine = () => (
    <svg width="240" height="50" viewBox="0 0 240 50" fill="none" className="absolute bottom-20 right-4">
        <motion.path
            d="M0 40 Q 30 20, 60 30 Q 90 40, 120 25 Q 150 10, 180 20 Q 210 30, 240 15"
            stroke="rgba(180,150,120,0.3)"
            strokeWidth="1"
            strokeDasharray="4 6"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 2 }}
        />
    </svg>
);

const SplashScreen = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500);
        }, 5500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(170deg, #252660 0%, #2D2F6E 35%, #1E1F4D 100%)' }}
                >
                    {/* ── Subtle fabric texture overlay ── */}
                    <div
                        className="absolute inset-0 opacity-[0.025] pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 0.5px, transparent 0)`,
                            backgroundSize: '20px 20px'
                        }}
                    />

                    {/* ═══ TOP SECTION: Needle with Thread ═══ */}
                    <div className="absolute top-8 right-4 z-10">
                        <NeedleWithThread />
                    </div>

                    {/* ═══ CENTER: Logo Image ═══ */}
                    <div className="relative flex flex-col items-center z-10">
                        <motion.img
                            src="/sewzella_logo-removebg-preview.png"
                            alt="SewZella Logo"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 1.2,
                                delay: 0.4,
                                ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                            className="w-56 h-auto object-contain drop-shadow-2xl"
                            style={{
                                filter: 'brightness(1.3) contrast(1.1) drop-shadow(0 8px 32px rgba(0,0,0,0.3))'
                            }}
                        />
                        {/* Tagline below logo */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0.45, y: 0 }}
                            transition={{ delay: 1.3, duration: 0.8 }}
                            className="text-center mt-4"
                            style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '10px',
                                letterSpacing: '5px',
                                fontWeight: 400,
                                textTransform: 'uppercase'
                            }}
                        >
                            Tailoring, Simplified.
                        </motion.p>
                    </div>

                    {/* ═══ BOTTOM SECTION: Thread Spool + Buttons + Stitch Line ═══ */}
                    <div className="absolute bottom-8 left-4 flex items-end gap-1.5 z-10">
                        <ThreadSpool />
                        <div className="flex flex-col gap-1.5 mb-4">
                            <SewingButton size={34} color="rgba(170,55,55,0.55)" delay={2.2} />
                            <SewingButton size={24} color="rgba(190,80,65,0.45)" delay={2.5} />
                        </div>
                        <SewingButton size={16} color="rgba(160,70,70,0.3)" delay={2.8} />
                    </div>

                    {/* Bottom stitch trail (like in second image) */}
                    <BottomStitchLine />

                    {/* ── Subtle corner stitch markers ── */}
                    <svg className="absolute top-5 left-5 opacity-[0.08]" width="35" height="35" viewBox="0 0 35 35" fill="none">
                        <path d="M0 35 L0 0" stroke="white" strokeWidth="0.5" strokeDasharray="3 5" />
                        <path d="M0 0 L35 0" stroke="white" strokeWidth="0.5" strokeDasharray="3 5" />
                    </svg>
                    <svg className="absolute bottom-5 right-5 opacity-[0.08]" width="35" height="35" viewBox="0 0 35 35" fill="none">
                        <path d="M35 0 L35 35" stroke="white" strokeWidth="0.5" strokeDasharray="3 5" />
                        <path d="M35 35 L0 35" stroke="white" strokeWidth="0.5" strokeDasharray="3 5" />
                    </svg>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
