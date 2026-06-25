import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Scissors, ShoppingBag, ClipboardList, Users, Sparkles, Heart, X, Calendar, Clock, Layers, Feather, Ruler, Wand2 } from 'lucide-react';
import api from '../../../utils/api';

const ICON_COLOR = "#E2C17D";
const ICON_SIZE = 28;
const STROKE_WIDTH = 1.5;

const actions = [
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

const QuickActions = () => {
    const navigate = useNavigate();
    const handleActionClick = (action) => {
        if (action.path) {
            navigate(action.path);
        }
    };
    return (
        <div className="px-4 md:px-6 lg:px-8 pt-0.5 pb-1.5">
            {/* Header with Title and Toggle */}
            <div className="relative flex items-center justify-center mb-2 sm:mb-4 px-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-dashed border-gray-300"></div>
                </div>
                <div className="relative bg-[#F7F8FC] px-4">
                    <h2 className="text-[11px] sm:text-[13px] font-bold text-[#843D9B] uppercase tracking-[0.4em] whitespace-nowrap">What We Offer</h2>
                </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-y-3 transition-all duration-500 sm:divide-x sm:divide-gray-200">
                <AnimatePresence mode="popLayout">
                    {actions.map((action, index) => {
                        return (
                            <motion.div
                                key={index}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`flex-col items-center gap-3 cursor-pointer group px-2 sm:px-6 md:px-8 lg:px-10 flex flex-1 min-w-[25%] sm:min-w-0`}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => handleActionClick(action)}
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#843D9B] rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl mx-auto shadow-md">
                                    {action.icon}
                                </div>
                                <span className="text-[8px] sm:text-[9px] font-bold text-center text-gray-500 uppercase tracking-[0.2em] leading-none truncate w-full px-1">
                                    {action.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>


        </div>
    );
};

export default QuickActions;
