import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import mannequinGraphic from '../../../assets/images/ChatGPT Image Aug 25, 2026, 12_08_10 PM.png';
import measurementGraphic from '../../../assets/images/ChatGPT Image Aug 25, 2026, 12_44_40 PM.png';

const AIMeasurementCard = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    const slides = [
        {
            id: 'ai-measurement',
            badge: 'NEW',
            badgeClass: 'bg-pink-100 text-pink-600',
            title: 'AI MEASUREMENT',
            description: 'Get accurate body measurements in 30 seconds. No measuring tape required!',
            buttonText: 'TRY NOW',
            onAction: () => toast('AI Measurement coming soon!'),
            image: mannequinGraphic,
            imageAlt: 'AI Measurement Mannequin',
            gradient: 'from-[#F6EFFD] via-[#F1E4FA] to-[#EAD5F7]',
            imgClass: 'w-full h-full object-contain relative z-10 drop-shadow-md scale-110'
        },
        {
            id: 'doorstep-measurement',
            badge: 'FREE VISIT',
            badgeClass: 'bg-purple-100 text-[#843D9B]',
            title: 'DOORSTEP MEASURE',
            description: 'Book master tailor visit at home for perfect fitting & free fabric pickup!',
            buttonText: 'BOOK VISIT',
            onAction: () => navigate('/user/services'),
            image: measurementGraphic,
            imageAlt: 'Doorstep Tailor Measurement',
            gradient: 'from-[#F8EEFD] via-[#F3E2FA] to-[#EBD3F8]',
            imgClass: 'w-full h-full object-contain relative z-10 drop-shadow-md scale-110'
        }
    ];

    useEffect(() => {
        if (isPaused || slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isPaused, slides.length]);

    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const diff = touchStartX.current - touchEndX.current;
        if (diff > 40) {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        } else if (diff < -40) {
            setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    const currentSlide = slides[currentIndex];

    return (
        <div className="px-4 md:px-6 lg:px-8 mt-1.5 mb-2.5">
            <div 
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`bg-gradient-to-r ${currentSlide.gradient} rounded-2xl sm:rounded-3xl border border-purple-100/80 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-sm relative overflow-hidden transition-colors duration-500`}
            >
                {/* Background ambient glow */}
                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-purple-300/30 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute left-1/2 top-0 w-16 h-16 bg-white/40 rounded-full blur-xl pointer-events-none" />

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div 
                        key={currentSlide.id}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex items-center justify-between gap-2.5 relative z-10"
                    >
                        {/* Left text content */}
                        <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="text-gray-900 font-black text-[11px] sm:text-xs tracking-tight uppercase leading-none">
                                    {currentSlide.title}
                                </h3>
                                <span className={`${currentSlide.badgeClass} text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0`}>
                                    {currentSlide.badge}
                                </span>
                            </div>
                            <p className="text-gray-600 text-[9.5px] sm:text-[11px] font-medium leading-tight mt-0.5 max-w-[210px] sm:max-w-xs">
                                {currentSlide.description}
                            </p>
                            <button 
                                onClick={currentSlide.onAction}
                                className="mt-1.5 bg-[#843D9B] hover:bg-[#682498] text-white px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black flex items-center gap-1 shadow-sm shadow-[#843D9B]/25 active:scale-95 transition-all uppercase tracking-wide cursor-pointer"
                            >
                                {currentSlide.buttonText} <ArrowRight size={10} />
                            </button>
                        </div>

                        {/* Right illustration */}
                        <div className="relative shrink-0 flex items-center justify-center w-20 sm:w-24 h-20 sm:h-24 -my-1 -mr-1">
                            <img 
                                src={currentSlide.image} 
                                alt={currentSlide.imageAlt} 
                                loading="lazy"
                                decoding="async"
                                className={currentSlide.imgClass}
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Bottom carousel pagination dots */}
                <div className="flex justify-center items-center gap-1.5 mt-1.5 relative z-10">
                    {slides.map((slide, idx) => (
                        <button
                            key={slide.id}
                            type="button"
                            aria-label={`Go to slide ${idx + 1}`}
                            onClick={() => setCurrentIndex(idx)}
                            className={`transition-all duration-300 rounded-full cursor-pointer border-0 p-0 ${
                                idx === currentIndex
                                    ? 'w-4 h-1 bg-[#843D9B] shadow-sm'
                                    : 'w-1 h-1 bg-purple-300 hover:bg-purple-400'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIMeasurementCard;
