import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../utils/api';

const PromoBanner = () => {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const defaultBanners = [
        {
            id: 'default-1',
            title: "FLAT 20% OFF",
            subtitle: "On your first custom stitching order",
            badge: "LIMITED OFFER",
            color: "bg-gradient-to-br from-[#843D9B] to-[#ff85a2]",
            image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
        }
    ];

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await api.get('/cms/banners/active?location=Home Page - Top Carousel');
                if (res.data.success && res.data.data.length > 0) {
                    const activeBanners = res.data.data.map(b => ({
                        id: b._id,
                        title: b.title || "Special Offer",
                        subtitle: b.subtitle || "Premium custom tailoring services",
                        description: b.description || "Expert tailoring services for your dream outfit.",
                        badge: b.badge || "NEW USER OFFER",
                        color: b.color || "bg-[#843D9B]", // Matching the reference image solid purple
                        image: b.image || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                        code: "SEWZELLA10"
                    }));
                    setBanners(activeBanners);
                } else {
                    setBanners(defaultBanners);
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error('Failed to fetch banners:', error);
                    setBanners(defaultBanners);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    const next = () => {
        setDirection(1);
        setCurrentIndex(prev => (prev + 1) % banners.length);
    };
    const prev = () => {
        setDirection(-1);
        setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
    };

    const variants = {
        enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: (direction) => ({ zIndex: 0, x: direction < 0 ? '100%' : '-100%', opacity: 0 })
    };

    if (isLoading) {
        return (
            <div className="px-4 py-3">
                <div className="w-full h-44 bg-gray-100 animate-pulse rounded-3xl" />
            </div>
        );
    }

    if (banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    return (
        <div className="px-4 mt-0 relative z-30 group overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, { offset }) => {
                        if (offset.x < -50) next();
                        else if (offset.x > 50) prev();
                    }}
                    className={`relative overflow-hidden rounded-3xl ${currentBanner.color || 'bg-gradient-to-br from-[#401362] to-[#2B0945]'} text-white shadow-lg shadow-purple-900/20 h-[170px] w-full flex`}
                >
                    {/* Left Content Area */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center relative z-10 w-[60%]">
                        <div className="w-fit px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold tracking-widest flex items-center gap-1 border border-white/40 uppercase mb-2">
                            <Tag size={8} /> {currentBanner.badge}
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black leading-none tracking-tighter mb-1 line-clamp-1">
                            {currentBanner.title}
                        </h2>
                        <h3 className="text-[9px] sm:text-xs font-bold leading-tight mb-1.5 uppercase opacity-90 tracking-widest line-clamp-2 pr-2">
                            {currentBanner.subtitle}
                        </h3>
                        <p className="text-[8px] sm:text-[9px] text-white/80 leading-snug mb-3 max-w-[140px] line-clamp-2">
                            {currentBanner.description}
                        </p>
                        <button className="bg-white text-[#401362] px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black shadow-md hover:bg-gray-50 active:scale-95 transition-transform flex items-center gap-1 w-fit">
                            Book Now <ArrowRight size={12} />
                        </button>
                    </div>

                    {/* Right Image Area */}
                    <div className="absolute top-0 right-0 bottom-0 w-[55%] pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#401362] via-transparent to-transparent z-10 w-full h-full"></div>
                        <img
                            src={currentBanner.image}
                            alt={currentBanner.title}
                            className="w-full h-full object-cover object-left"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>

                    {/* Code Badge */}
                    {currentBanner.code && (
                        <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 rounded px-2 py-1 flex flex-col items-center justify-center shadow-lg z-20 pointer-events-none">
                            <span className="text-[6px] font-medium tracking-widest uppercase opacity-80 leading-none mb-0.5">Code:</span>
                            <span className="text-[10px] font-black tracking-widest leading-none">{currentBanner.code}</span>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Dots */}
            {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                    {banners.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-3 bg-white' : 'w-1 bg-white/40'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromoBanner;
