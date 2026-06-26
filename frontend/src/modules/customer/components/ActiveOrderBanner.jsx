import React, { useState } from 'react';
import { ChevronRight, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../utils/cn';

const ActiveOrderBanner = ({ order }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!order) return null;

    const serviceTitle = order.items?.[0]?.service?.title || "Custom stitching";
    const status = order.status?.replace(/-/g, ' ').toUpperCase() || "PENDING";
    const serviceImage = order.items?.[0]?.service?.image || order.items?.[0]?.image;

    return (
        <AnimatePresence>
            <div className="fixed bottom-[88px] right-4 z-40 flex justify-end">
                <motion.div 
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ 
                        y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                        layout: { type: "spring", stiffness: 300, damping: 25 },
                        default: { duration: 0.2 }
                    }}
                    onClick={() => isExpanded ? navigate(`/user/orders/${order._id}/track`) : setIsExpanded(true)}
                    className={cn(
                        "bg-[#843D9B] text-white shadow-xl shadow-[#843D9B]/30 flex items-center border border-[#6b2f7d] overflow-hidden cursor-pointer h-[64px]",
                        isExpanded ? "rounded-[1.25rem] px-2.5 justify-between w-[calc(100vw-2rem)] max-w-sm" : "rounded-[1.25rem] p-1.5 justify-center w-[64px]"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isExpanded ? (
                            <motion.div 
                                key="expanded"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-between w-full h-full"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {serviceImage ? (
                                        <div className="w-[44px] h-[44px] bg-white rounded-xl overflow-hidden shrink-0 border-2 border-white/20 flex items-center justify-center">
                                            <img src={serviceImage} alt="Order" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-[44px] h-[44px] bg-white/20 rounded-xl flex items-center justify-center shrink-0 border-2 border-white/20">
                                            <Package size={22} className="text-white" />
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0 py-0.5 whitespace-nowrap">
                                        <span className="font-black text-[13px] tracking-wide leading-tight">Track Order</span>
                                        <span className="text-[10px] font-bold text-white/80 truncate mt-0.5 uppercase tracking-wider">
                                            {serviceTitle} • {status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center shrink-0 pr-2 pl-2">
                                    <ChevronRight size={20} className="text-white" />
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsExpanded(false);
                                        }}
                                        className="ml-2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                        <X size={16} className="text-white/80" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="collapsed"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-white/10"
                            >
                                {serviceImage ? (
                                    <img src={serviceImage} alt="Order" className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={24} className="text-white" />
                                )}
                                <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#843D9B] animate-pulse" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ActiveOrderBanner;
