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
        <div className="px-4 md:px-6 lg:px-8 mt-4 mb-4">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4 relative">
                <div className="flex-1 flex justify-center items-center">
                    <div className="flex items-center gap-1">
                        <div className="text-[#843D9B] opacity-60 font-black text-[10px] italic">
                            //
                        </div>
                        <h2 className="text-[11px] font-black text-[#682498] uppercase tracking-[0.15em] mx-1">What We Offer</h2>
                        <div className="text-[#843D9B] opacity-60 font-black text-[10px] italic">
                            //
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/user/what-we-offer')}
                    className="absolute right-0 text-[9px] font-bold text-[#843D9B] hover:text-[#682498] flex items-center gap-0.5"
                >
                    View All <ArrowRight size={10} />
                </button>
            </div>

            {/* Scrollable Services */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x justify-between sm:justify-start">
                {services.map((service, index) => (
                    <motion.div
                        key={index}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(service.path)}
                        className="flex flex-col items-center gap-1.5 min-w-[90px] cursor-pointer group snap-center"
                    >
                        <div className="w-[88px] h-[88px] flex items-center justify-center transition-transform group-hover:scale-105">
                            <img src={service.imgSrc} alt={service.title} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-gray-900 leading-tight text-center">
                                {service.title}
                            </span>
                            <span className="text-[7px] font-medium text-gray-500 leading-tight text-center">
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
