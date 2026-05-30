import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

const ActiveOrderBanner = ({ order }) => {
    const navigate = useNavigate();
    if (!order) return null;

    const serviceTitle = order.items?.[0]?.service?.title || "Custom stitching";
    const status = order.status?.replace(/-/g, ' ').toUpperCase();
    const displayId = order.orderId || order._id?.substring(0, 8);

    return (
        <div className="px-4 md:px-6 lg:px-8 mb-4" onClick={() => navigate(`/user/orders/${order._id}/track`)}>
            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-4 relative z-10 gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">Active Order #{displayId}</p>
                        <h3 className="text-2xl font-black text-[#2D2F6E] mt-1 leading-tight tracking-tight">{serviceTitle}</h3>
                    </div>
                    <div className="bg-orange-50 text-orange-600 px-3 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2 shrink-0 max-w-[120px] shadow-sm border border-orange-100">
                        <Truck size={18} className="shrink-0" /> 
                        <span className="leading-tight uppercase">{status}</span>
                    </div>
                </div>

                {/* Progress Bar (Dynamic based on tracking history length) */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4 relative z-10 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((order.trackingHistory?.length || 1) * 20, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-[#2D2F6E] h-full rounded-full shadow-lg" 
                    ></motion.div>
                </div>

                <div className="flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Updated {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button className="text-[#2D2F6E] text-xs font-black uppercase tracking-[0.15em] flex items-center gap-1 group">
                        Track Now
                    </button>
                </div>

                {/* Background Decoration */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] rotate-[-15deg] pointer-events-none">
                    <CheckCircle2 size={120} />
                </div>
            </div>
        </div>
    );
};

export default ActiveOrderBanner;
