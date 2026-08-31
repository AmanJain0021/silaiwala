import React, { useEffect, useState } from 'react';
import { X, Star, Clock, CheckCircle2, Tag, Scissors, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../../utils/api';
import { getImageUrl } from '../../../../utils/imageUrl';

const ServiceDetailsModal = ({ service, isOpen, onClose, onBookNow }) => {
    const [details, setDetails] = useState(service || null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !service?._id) return;
        setDetails(service);
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/services/${service._id}`);
                if (!cancelled && res.data?.success && res.data?.data) {
                    setDetails(res.data.data);
                }
            } catch {
                // Keep list data if fetch fails
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [isOpen, service?._id, service]);

    if (!isOpen || !service) return null;

    const data = details || service;
    const imageUrl = getImageUrl(data.image) || 'https://placehold.co/400x500/e6e8f0/843d9b?text=Service';
    const categoryName =
        typeof data.category === 'object' ? data.category?.name : data.category;
    const tailorName =
        data.tailor?.shopName ||
        (typeof data.tailor === 'object' ? data.tailor?.name : null) ||
        'Tailor Partner';
    const styles = data.selectedStyles || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.button
                        type="button"
                        aria-label="Close"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative aspect-[4/3] bg-gray-100 shrink-0">
                            <img
                                src={imageUrl}
                                alt={data.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/400x500/e6e8f0/843d9b?text=Service';
                                }}
                            />
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-md text-gray-700 hover:bg-white cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                            {(data.rating || 0) >= 4.5 && (
                                <span className="absolute top-3 left-3 px-2 py-0.5 bg-primary text-white text-[9px] uppercase font-bold tracking-wider rounded">
                                    Popular
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                            {loading && (
                                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                                    <Loader2 size={14} className="animate-spin" /> Loading details…
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-lg font-black text-gray-900 leading-tight">{data.title}</h2>
                                    {categoryName && (
                                        <p className="text-[11px] font-bold text-gray-500 mt-1">{categoryName}</p>
                                    )}
                                    <p className="text-[11px] text-[#843D9B] font-bold mt-1">by {tailorName}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">From</p>
                                    <p className="text-xl font-black text-primary">₹{data.basePrice}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-[10px] font-bold">
                                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                    {data.rating || '4.5'}
                                    {data.reviewsCount ? ` (${data.reviewsCount})` : ''}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                    <Clock size={12} />
                                    Est. {data.deliveryTime || '2-4 Days'}
                                </span>
                                {(data.isPickupAvailable !== false) && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-bold">
                                        <CheckCircle2 size={12} />
                                        Pickup Available
                                    </span>
                                )}
                            </div>

                            {data.description && (
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">About this service</h3>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.description}</p>
                                </div>
                            )}

                            {data.tags?.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <Tag size={12} /> Tags
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.tags.map((tag) => (
                                            <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {styles.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                        <Scissors size={12} /> Available styles
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {styles.map((style) => (
                                            <div key={style.name} className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                                                {style.image ? (
                                                    <img
                                                        src={getImageUrl(style.image)}
                                                        alt={style.name}
                                                        className="w-full aspect-square object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : null}
                                                <div className="p-2">
                                                    <p className="text-[11px] font-bold text-gray-900">{style.name}</p>
                                                    {style.description && (
                                                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{style.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 p-4 border-t border-gray-100 bg-white flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onBookNow?.();
                                }}
                                className="flex-[1.4] py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            >
                                Book Now <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ServiceDetailsModal;
