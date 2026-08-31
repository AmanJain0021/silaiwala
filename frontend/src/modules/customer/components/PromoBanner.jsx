import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { resolveBannerImageUrl, BANNER_LOCATIONS, isUploadedBannerImage } from '../../../utils/bannerImage';

const STITCHING_PAGE = '/user/services';

const PromoBanner = () => {
    const navigate = useNavigate();
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await api.get('/cms/banners/active', {
                    params: { location: BANNER_LOCATIONS.HOME },
                });
                if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    const activeBanners = res.data.data
                        .filter((b) => b.image && isUploadedBannerImage(b.image))
                        .map((b) => ({
                            id: b._id,
                            image: resolveBannerImageUrl(b.image),
                        }));
                    setBanners(activeBanners);
                } else {
                    setBanners([]);
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error('Failed to fetch banners:', error);
                }
                setBanners([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    const goTo = (index, e) => {
        e?.stopPropagation();
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
    };

    const slideVariants = {
        enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
    };

    if (isLoading) {
        return (
            <div className="px-4 pt-3 pb-2">
                <div className="w-full aspect-[2.6/1] bg-gray-100 animate-pulse rounded-2xl sm:rounded-3xl" />
            </div>
        );
    }

    if (banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    return (
        <div className="px-4 pt-3 pb-2 relative z-40">
            <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-purple-900/15 bg-[#f3eef8]">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.button
                        key={currentBanner.id}
                        type="button"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        onClick={() => navigate(STITCHING_PAGE)}
                        className="w-full p-0 border-0 cursor-pointer bg-[#f3eef8] block"
                        aria-label="Go to stitching services"
                    >
                        <img
                            src={currentBanner.image}
                            alt="Promo banner"
                            className="w-full h-auto block rounded-2xl sm:rounded-3xl pointer-events-none select-none"
                            draggable={false}
                            loading="eager"
                            decoding="async"
                        />
                    </motion.button>
                </AnimatePresence>

                {banners.length > 1 && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {banners.map((b, i) => (
                            <button
                                key={b.id}
                                type="button"
                                aria-label={`Go to banner ${i + 1}`}
                                onClick={(e) => goTo(i, e)}
                                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                                    i === currentIndex ? 'w-5 bg-[#843D9B]' : 'w-1.5 bg-white/80 hover:bg-white'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromoBanner;
