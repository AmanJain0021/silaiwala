import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Scissors, ShoppingBag, ClipboardList, Users, Sparkles, Heart, X, Calendar, Clock, Layers, Feather, Ruler } from 'lucide-react';
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
        action: 'modal_bridal'
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
    }
];

const QuickActions = () => {
    const navigate = useNavigate();
    const [isBridalModalOpen, setIsBridalModalOpen] = useState(false);
    const [bookingData, setBookingData] = useState({ date: '', time: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleActionClick = (action) => {
        if (action.action === 'modal_bridal') {
            setIsBridalModalOpen(true);
        } else if (action.path) {
            navigate(action.path);
        }
    };

    const handleBridalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post('/custom-bookings', {
                bookingType: 'bridal',
                date: bookingData.date,
                time: bookingData.time,
                notes: bookingData.notes
            });
            if (res.data.success) {
                alert('Bridal service requested successfully! An admin will assign a tailor shortly.');
                setIsBridalModalOpen(false);
                setBookingData({ date: '', time: '', notes: '' });
                // Alternatively navigate to a status page if created
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
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


            {/* Bridal Booking Modal */}
            <AnimatePresence>
                {isBridalModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setIsBridalModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
                        >
                            <button
                                onClick={() => setIsBridalModalOpen(false)}
                                className="absolute right-4 top-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                            >
                                <X size={16} />
                            </button>

                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
                                <Heart size={24} />
                            </div>

                            <h3 className="text-xl font-black text-gray-900 mb-1">Bridal Consultation</h3>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                Book a specialized tailor for custom bridal fitting and stitching services. An expert will be assigned to your request manually.
                            </p>

                            <form onSubmit={handleBridalSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Preferred Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B]/20 transition-all outline-none"
                                            value={bookingData.date}
                                            onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Preferred Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="time"
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B]/20 transition-all outline-none"
                                            value={bookingData.time}
                                            onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Requirements Note</label>
                                    <textarea
                                        placeholder="Specific requests, dress type, etc."
                                        rows="2"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B]/20 transition-all outline-none resize-none"
                                        value={bookingData.notes}
                                        onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 rounded-xl bg-[#843D9B] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-[#843D9B]/20 hover:bg-[#1E1F4D] active:scale-[0.98] transition-all disabled:opacity-70 mt-2"
                                >
                                    {isSubmitting ? 'Requesting...' : 'Request Booking'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickActions;
