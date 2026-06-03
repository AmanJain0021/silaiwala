import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Clock, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import api from '../../../utils/api';

const PromoBanner = () => {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const defaultBanners = [
        {
            id: 'default-1',
            title: "FLAT 20% OFF",
            subtitle: "On your first custom stitching order",
            badge: "LIMITED OFFER",
            color: "bg-gradient-to-br from-[#2D2F6E] to-[#ff85a2]",
            image: "https://cdn-icons-png.flaticon.com/128/9284/9284227.png"
        },
        {
            id: 'default-2',
            title: "EXPRESS DELIVERY",
            subtitle: "Get your outfit stitched in 24 hours",
            badge: "PREMIUM SERVICE",
            color: "bg-gradient-to-br from-[#1e3e5a] to-[#2d5a8c]",
            image: "https://cdn-icons-png.flaticon.com/128/9420/9420653.png"
        }
    ];

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await api.get('/cms/banners/active?location=Home Page - Top Carousel');
                if (res.data.success && res.data.data.length > 0) {
                    // Filter for Home Page placement or use all active as needed
                    const activeBanners = res.data.data.map(b => ({
                        id: b._id,
                        title: b.title || "Special Offer",
                        subtitle: b.subtitle || "Premium custom tailoring services",
                        badge: b.badge || "FEATURED",
                        color: b.color || "bg-gradient-to-br from-[#2D2F6E] to-[#ff85a2]",
                        image: b.image || "https://cdn-icons-png.flaticon.com/128/9284/9284227.png"
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

    const next = () => setCurrentIndex(prev => (prev + 1) % banners.length);
    const prev = () => setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);

    if (isLoading) {
        return (
            <div className="px-4 md:px-6 lg:px-8 py-3">
                <div className="w-full h-42 bg-gray-100 animate-pulse rounded-3xl flex items-center justify-center">
                    <Sparkles size={24} className="text-gray-200" />
                </div>
            </div>
        );
    }

    if (banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    return (
        <div className="px-3 md:px-6 lg:px-8 py-1.5 relative group">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6 }}
                    className={`relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] ${currentBanner.color || 'bg-gray-900'} text-white shadow-xl h-32 sm:h-64 lg:h-72 flex items-center`}
                >
                    {/* Full Background Image */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src={currentBanner.image}
                            alt={currentBanner.title}
                            className="w-full h-full object-cover opacity-60"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col gap-1.5 sm:gap-3 px-6 sm:px-12">
                        <div className="bg-white/20 w-fit px-2.5 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-widest backdrop-blur-md flex items-center gap-1.5 border border-white/10 uppercase">
                            <Sparkles size={8} className="text-indigo-300" /> {currentBanner.badge || 'PROMO'}
                        </div>
                        <div className="max-w-md">
                            <h2 className="text-xl sm:text-3xl lg:text-5xl font-black leading-none tracking-tighter uppercase drop-shadow-lg">
                                {currentBanner.title}
                            </h2>
                            <p className="text-[10px] sm:text-sm lg:text-base text-white/90 mt-0.5 sm:mt-3 font-bold tracking-tight drop-shadow-md leading-tight">{currentBanner.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 sm:mt-6">
                            <button className="bg-[#2D2F6E] text-white px-5 sm:px-8 py-2 sm:py-3.5 rounded-lg sm:rounded-2xl text-[9px] sm:text-xs font-black shadow-xl shadow-indigo-900/20 hover:bg-[#1E1F4D] active:scale-95 transition-all flex items-center gap-1.5 uppercase tracking-widest">
                                Book Now <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Dots */}
            {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {banners.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/30'}`}
                        />
                    ))}
                </div>
            )}

            {/* Navigation Arrows (Visible on Hover in Desktop) */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft size={16} className="text-white" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight size={16} className="text-white" />
                    </button>
                </>
            )}
        </div>
    );
};

export default PromoBanner;
