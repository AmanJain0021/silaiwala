import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Scissors, ClipboardList, Users, Sparkles, Heart, Layers, Feather, Ruler, Wand2 } from 'lucide-react';

const ICON_COLOR = "#FFFFFF";
const ICON_SIZE = 24;
const STROKE_WIDTH = 1.5;

const ServiceGrid = () => {
    const navigate = useNavigate();

    const services = [
        {
            label: 'Tailors',
            icon: <Users size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/tailors'
        },
        {
            label: 'My Orders',
            icon: <ClipboardList size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/orders'
        },
        {
            label: 'Stitching',
            icon: <Scissors size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/services'
        },
        {
            label: 'Style Add-ons',
            icon: <Sparkles size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/embellishments'
        },
        {
            label: 'Bridal',
            icon: <Heart size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/tailors?service=bridal'
        },
        {
            label: 'Bulk Order',
            icon: <Layers size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/bulk-order'
        },
        {
            label: 'Embroidery',
            icon: <Feather size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/embroidery'
        },
        {
            label: 'Alteration',
            icon: <Ruler size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/alteration'
        },
        {
            label: 'Custom Design',
            icon: <Wand2 size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/custom-design'
        }
    ];

    const handleActionClick = (action) => {
        if (action.path) {
            navigate(action.path);
        }
    };

    return (
        <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
            {/* Header with Title and Toggle */}
            <div className="relative flex items-center justify-center mb-6 px-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-dashed border-gray-300"></div>
                </div>
                <div className="relative bg-[#F7F8FC] px-4">
                    <h2 className="text-[11px] sm:text-[13px] font-bold text-[#843D9B] uppercase tracking-[0.3em] whitespace-nowrap">What We Offer</h2>
                </div>
            </div>

            <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                <AnimatePresence mode="popLayout">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex-col items-center gap-2 cursor-pointer group flex min-w-[70px] snap-center"
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleActionClick(service)}
                        >
                            <div className="w-14 h-14 bg-[#843D9B] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg mx-auto shadow-sm border-2 border-[#843D9B] shrink-0">
                                {service.icon}
                            </div>
                            <span className="text-[8px] sm:text-[9px] font-black text-center text-gray-800 uppercase tracking-wider leading-tight w-full max-w-[60px] break-words mx-auto">
                                {service.label}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ServiceGrid;
