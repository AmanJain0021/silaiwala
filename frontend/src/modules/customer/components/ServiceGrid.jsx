import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const ServiceGrid = () => {
    const navigate = useNavigate();

    const services = [
        {
            title: 'Tailors',
            subtitle: 'Expert Professionals',
            imgSrc: '/icons/service_icon_0.png',
            path: '/user/tailors'
        },
        {
            title: 'Stitching',
            subtitle: 'Perfectly Crafted',
            imgSrc: '/icons/service_icon_1.png',
            path: '/user/services'
        },
        {
            title: 'Style Add-ons',
            subtitle: 'Elevate Your Look',
            imgSrc: '/icons/service_icon_2.png',
            path: '/user/embellishments'
        },
        {
            title: 'Bridal',
            subtitle: 'Made For Your Day',
            imgSrc: '/icons/service_icon_3.png',
            path: '/user/tailors?service=bridal'
        }
    ];

    return (
        <div className="px-4 md:px-6 lg:px-8 mt-3 mb-5">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-3 relative">
                <div className="flex-1 flex justify-center items-center">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[#843D9B] opacity-60 font-black text-xs italic">//</span>
                        <h2 className="text-xs sm:text-sm font-black text-[#682498] uppercase tracking-[0.18em]">WHAT WE OFFER</h2>
                        <span className="text-[#843D9B] opacity-60 font-black text-xs italic">//</span>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/user/what-we-offer')}
                    className="absolute right-0 text-[10px] sm:text-xs font-black text-[#843D9B] hover:text-[#682498] flex items-center gap-0.5 uppercase tracking-wider cursor-pointer"
                >
                    View All <ArrowRight size={12} />
                </button>
            </div>

            {/* 4 Category Icons Row */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
                {services.map((service, index) => (
                    <motion.div
                        key={index}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(service.path)}
                        className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                        <div className="w-[76px] h-[76px] sm:w-[92px] sm:h-[92px] flex items-center justify-center transition-transform group-hover:scale-105">
                            <img 
                                src={service.imgSrc} 
                                alt={service.title} 
                                className="w-full h-full object-contain" 
                            />
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-900 leading-tight text-center whitespace-nowrap">
                                {service.title}
                            </span>
                            <span className="text-[8px] sm:text-[9px] font-medium text-gray-500 leading-tight text-center mt-0.5">
                                {service.subtitle}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ServiceGrid;
