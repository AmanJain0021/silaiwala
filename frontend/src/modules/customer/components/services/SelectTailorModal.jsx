import React, { useState, useMemo } from 'react';
import { X, Star, Clock, CheckCircle2, ShieldCheck, MapPin, ArrowRight, Sparkles, Users, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { calculateDistance } from '../../../../utils/distance';
import { getImageUrl } from '../../../../utils/imageUrl';

const SelectTailorModal = ({
    isOpen,
    onClose,
    serviceGroup,
    userLocation = null,
}) => {
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState('recommended'); // 'recommended', 'price_low', 'price_high', 'rating', 'distance'

    const userLat = userLocation?.lat;
    const userLng = userLocation?.lng;

    const tailorsWithMeta = useMemo(() => {
        if (!serviceGroup?.tailors) return [];

        return serviceGroup.tailors.map(tailor => {
            let distanceKm = null;
            if (userLat && userLng && tailor.location?.coordinates && tailor.location.coordinates.length === 2) {
                const tailorLng = tailor.location.coordinates[0];
                const tailorLat = tailor.location.coordinates[1];
                const d = calculateDistance(userLat, userLng, tailorLat, tailorLng);
                if (!isNaN(d) && d > 0) {
                    distanceKm = parseFloat(d.toFixed(1));
                }
            }
            return {
                ...tailor,
                distanceKm,
            };
        });
    }, [serviceGroup, userLat, userLng]);

    const sortedTailors = useMemo(() => {
        const list = [...tailorsWithMeta];
        switch (sortBy) {
            case 'price_low':
                return list.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
            case 'price_high':
                return list.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
            case 'rating':
                return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'distance':
                return list.sort((a, b) => {
                    if (a.distanceKm == null) return 1;
                    if (b.distanceKm == null) return -1;
                    return a.distanceKm - b.distanceKm;
                });
            case 'recommended':
            default:
                // Recommended: combination of rating and price
                return list.sort((a, b) => {
                    const scoreA = (a.rating || 4.5) * 100 - (a.basePrice || 0) * 0.05;
                    const scoreB = (b.rating || 4.5) * 100 - (b.basePrice || 0) * 0.05;
                    return scoreB - scoreA;
                });
        }
    }, [tailorsWithMeta, sortBy]);

    if (!isOpen || !serviceGroup) return null;

    const handleSelectTailor = (tailor) => {
        onClose();
        navigate(`/user/services/${tailor.serviceId}`, {
            state: {
                tailorId: tailor.tailorId,
                tailorName: tailor.tailorName,
            },
        });
    };

    const hasDistance = tailorsWithMeta.some(t => t.distanceKm != null);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.98 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                        className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Section */}
                        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/60 via-white to-pink-50/40 relative">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm shrink-0">
                                    <img
                                        src={getImageUrl(serviceGroup.image) || 'https://placehold.co/150x150/e6e8f0/843d9b?text=Service'}
                                        alt={serviceGroup.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/150x150/e6e8f0/843d9b?text=Service';
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                            <Sparkles size={11} /> Choose Tailor
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-500">
                                            {sortedTailors.length} tailor{sortedTailors.length !== 1 ? 's' : ''} available
                                        </span>
                                    </div>
                                    <h2 className="text-base sm:text-lg font-black text-gray-900 truncate mt-0.5">
                                        {serviceGroup.title}
                                    </h2>
                                    <p className="text-[11px] text-gray-500 line-clamp-1">
                                        Select a verified tailor who provides this service to order
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors shrink-0 cursor-pointer"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Sort Filter Tabs */}
                            {sortedTailors.length > 1 && (
                                <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pt-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                                        Sort:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSortBy('recommended')}
                                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                                            sortBy === 'recommended'
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        Recommended
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSortBy('price_low')}
                                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                                            sortBy === 'price_low'
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        Price: Low to High
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSortBy('rating')}
                                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                                            sortBy === 'rating'
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        Highest Rated
                                    </button>
                                    {hasDistance && (
                                        <button
                                            type="button"
                                            onClick={() => setSortBy('distance')}
                                            className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                                                sortBy === 'distance'
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            Nearest
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tailors List */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50/50">
                            {sortedTailors.length === 0 ? (
                                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100">
                                    <Store size={40} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm font-bold text-gray-700">No tailors available</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        No tailors are currently offering this service. Please check back later.
                                    </p>
                                </div>
                            ) : (
                                sortedTailors.map((tailor, idx) => {
                                    const isCheapest = idx === 0 && sortBy === 'price_low';
                                    const isTopRated = (tailor.rating || 0) >= 4.7;

                                    return (
                                        <motion.div
                                            key={tailor.serviceId || tailor.tailorId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            onClick={() => handleSelectTailor(tailor)}
                                            className="bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:border-primary/40 active:scale-[0.99] transition-all group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Tailor Avatar */}
                                                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center overflow-hidden shrink-0 border border-primary/10">
                                                    {tailor.tailorImage ? (
                                                        <img
                                                            src={tailor.tailorImage}
                                                            alt={tailor.tailorName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-base font-black text-primary">
                                                            {tailor.tailorName?.[0]?.toUpperCase() || 'T'}
                                                        </span>
                                                    )}
                                                    <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                        <ShieldCheck size={14} className="text-blue-500 fill-blue-50" />
                                                    </span>
                                                </div>

                                                {/* Tailor Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                                                            {tailor.tailorName}
                                                        </h3>
                                                        {isCheapest && (
                                                            <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                                                                Lowest Price
                                                            </span>
                                                        )}
                                                        {isTopRated && (
                                                            <span className="text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                                                                Top Rated
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-gray-500">
                                                        <div className="flex items-center gap-0.5 font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                            <Star size={11} className="fill-amber-400 text-amber-400" />
                                                            <span>{tailor.rating ? Number(tailor.rating).toFixed(1) : '4.8'}</span>
                                                            {tailor.reviewsCount ? (
                                                                <span className="text-gray-400 font-normal">({tailor.reviewsCount})</span>
                                                            ) : null}
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <Clock size={11} className="text-gray-400" />
                                                            <span>{tailor.deliveryTime || '2-4 Days'}</span>
                                                        </div>

                                                        {tailor.distanceKm != null && (
                                                            <div className="flex items-center gap-1 text-primary font-semibold">
                                                                <MapPin size={11} />
                                                                <span>{tailor.distanceKm} km away</span>
                                                            </div>
                                                        )}

                                                        {tailor.isPickupAvailable && (
                                                            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                                                <CheckCircle2 size={10} /> Pickup
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Price & Book Button */}
                                                <div className="flex flex-col items-end shrink-0 pl-2">
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                                        Price
                                                    </span>
                                                    <span className="text-base sm:text-lg font-black text-primary leading-tight">
                                                        ₹{tailor.basePrice}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectTailor(tailor)}
                                                        className="mt-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark active:scale-95 text-white rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <span>Select</span>
                                                        <ArrowRight size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3 text-xs text-gray-500">
                            <span className="text-[11px] font-medium text-gray-500">
                                Stitching price varies by tailor expertise & delivery time.
                            </span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SelectTailorModal;
