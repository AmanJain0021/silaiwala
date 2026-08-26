import React, { useState, useEffect } from 'react';
import { Calendar, Ruler, Scissors, Shirt, X, Star, CheckCircle2, ChevronRight, User, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../../utils/api';
import SafeImage from '../../../../../components/Common/SafeImage';
import AboutShopModal from './AboutShopModal';

const ServiceReviewCard = ({ service, config, pricing, onRemove }) => {
    const navigate = useNavigate();
    const [tailorData, setTailorData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!service) return null;

    const tailorId = service?.tailorId || (typeof service?.tailor === 'object' ? (service?.tailor?._id || service?.tailor?.id) : service?.tailor);

    useEffect(() => {
        if (!tailorId) return;

        let isMounted = true;
        const fetchTailorInfo = async () => {
            try {
                const res = await api.get(`/tailors/${tailorId}`);
                if (res.data.success && isMounted) {
                    setTailorData(res.data.data);
                }
            } catch (err) {
                if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
                    console.log('Tailor info fetch notice:', err?.message || err);
                }
            }
        };

        fetchTailorInfo();
        return () => { isMounted = false; };
    }, [tailorId]);

    const deliveryDate = new Date();
    const deliveryDays = config?.deliveryType === 'express' ? 7 : 14;
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    const dateString = deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    // Derive Tailor Profile Info
    const shopName = tailorData?.shopName || service.tailorName || 'LAILA THE BOUTIQUE';
    const ownerName = tailorData?.user?.name || shopName.split(' ')[0] || 'Laila';
    const avatarImg = tailorData?.user?.profileImage || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop';
    const rating = tailorData?.rating || 4.8;
    const totalReviews = tailorData?.totalReviews || 320;
    const experienceText = tailorData?.experienceInYears ? `${tailorData.experienceInYears}+ Years Exp.` : '8+ Years Exp.';

    const isHomeVisitSelected = Boolean(
        config?.isTailorAtHome || 
        config?.measurements?.option === 'visit' || 
        (pricing?.tailorAtHome && pricing.tailorAtHome > 0)
    );

    return (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs mb-4 relative overflow-hidden">
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onRemove();
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors z-10 cursor-pointer"
                    title="Remove Item"
                >
                    <X size={14} />
                </button>
            )}

            {/* Section Title & Price */}
            <div className="flex items-center justify-between mb-3.5 pr-6">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Shirt size={16} className="text-[#843D9B]" />
                    <span>Service & Details</span>
                </h3>
                <span className="text-sm sm:text-base font-extrabold text-slate-900">
                    ₹{pricing?.total ? Math.round(pricing.total).toLocaleString('en-IN') : '1,221'}
                </span>
            </div>

            {/* Main Item Layout */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3.5">
                
                {/* Left Side: Thumbnail & Service Details */}
                <div className="flex-1 flex gap-3 items-start min-w-0">
                    <img
                        src={service.image}
                        alt={service.title}
                        className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-2xl border border-slate-100 shrink-0 shadow-2xs"
                    />

                    <div className="flex-1 space-y-1 min-w-0 text-left">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                            {service.title}
                        </h4>

                        {/* Attribute Badges */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-[#843D9B] bg-[#FAF5FF] px-2 py-0.5 rounded-full border border-purple-100/80">
                                <Scissors size={10} />
                                <span>{config?.fabricSource === 'customer' ? 'Your Fabric' : 'Fabric Provided'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-[#843D9B] bg-[#FAF5FF] px-2 py-0.5 rounded-full border border-purple-100/80">
                                <Ruler size={10} />
                                <span>
                                    {isHomeVisitSelected
                                        ? 'Executive Visit'
                                        : config?.measurements?.type === 'slip'
                                            ? 'Slip Upload'
                                            : config?.measurements?.type === 'sample'
                                                ? 'Sample Garment'
                                                : config?.measurements?.type === 'saved'
                                                    ? 'Saved Profile'
                                                    : 'Self Measured'}
                                </span>
                            </div>
                        </div>

                        {/* Per-item measurement snapshot (multi-garment orders) */}
                        {!isHomeVisitSelected && config?.measurements && (
                            <div className="mt-1.5 w-full rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                    Measurements for this garment
                                </p>
                                {config.measurements.type === 'slip' && (config.measurements.slipImage || config.measurements.image) ? (
                                    <p className="text-[10px] font-semibold text-slate-600">Measurement slip attached</p>
                                ) : config.measurements.type === 'sample' ? (
                                    <p className="text-[10px] font-semibold text-slate-600">Sample garment pickup</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(config.measurements)
                                            .filter(([key, val]) =>
                                                !['type', 'notes', 'slipImage', 'image', 'url', 'slipUrl', 'file', 'isConfirmed', 'saveProfile', 'sampleGarment', 'slipAttached', 'data'].includes(key)
                                                && val !== '' && val != null && typeof val !== 'object'
                                            )
                                            .slice(0, 6)
                                            .map(([key, val]) => (
                                                <span
                                                    key={key}
                                                    className="text-[9px] font-bold text-slate-700 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md"
                                                >
                                                    {key}: {val}
                                                </span>
                                            ))}
                                        {Object.entries(config.measurements).filter(([key, val]) =>
                                            !['type', 'notes', 'slipImage', 'image', 'url', 'slipUrl', 'file', 'isConfirmed', 'saveProfile', 'sampleGarment', 'slipAttached', 'data'].includes(key)
                                            && val !== '' && val != null && typeof val !== 'object'
                                        ).length === 0 && (
                                            <p className="text-[10px] font-semibold text-slate-500">Custom fit details saved</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {isHomeVisitSelected && (
                            <p className="mt-1.5 text-[9px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-2 py-1">
                                Home visit: executive will take measurements for this order (shared visit if multiple garments).
                            </p>
                        )}

                        {/* Selected Style / Custom Reference Design */}
                        {config?.selectedStyle && (
                            <div className="flex items-center gap-2 mt-1.5 p-1.5 bg-purple-50/70 border border-purple-100 rounded-xl">
                                {config.selectedStyle.image && (
                                    <img src={config.selectedStyle.image} alt="Style" className="w-8 h-8 rounded-lg object-cover border border-purple-200 shrink-0" />
                                )}
                                <div className="text-left min-w-0">
                                    <p className="text-[10px] font-bold text-slate-900 truncate">{config.selectedStyle.name || 'Custom Style'}</p>
                                    <p className="text-[8px] text-purple-700 font-bold uppercase">{config.selectedStyle.isCustom ? 'Custom Reference Photo' : 'Selected Style'}</p>
                                </div>
                            </div>
                        )}

                        {/* Delivery Estimated Chip */}
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0] w-fit mt-1">
                            <Calendar size={11} />
                            <span>Delivery by {dateString}</span>
                        </div>

                        {/* Tagline: Measurement Executive or Boutique Tailor */}
                        <div className="pt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] text-[#843D9B] font-extrabold uppercase tracking-wide">
                            {isHomeVisitSelected ? (
                                <>
                                    <Ruler size={10} />
                                    <span>MEASUREMENT EXECUTIVE AT HOME</span>
                                </>
                            ) : (
                                <>
                                    <Scissors size={10} />
                                    <span>TAILORED BY: {shopName}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Tailor Profile Card or Measurement Executive Badge */}
                {!isHomeVisitSelected ? (
                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0 pt-1 sm:pt-0">
                        <div className="flex items-center gap-2 bg-[#F8FAFC] p-2 rounded-2xl border border-slate-100 min-w-[155px]">
                            <SafeImage
                                src={avatarImg}
                                alt={ownerName}
                                className="w-9 h-9 rounded-full object-cover border-2 border-purple-200 shadow-2xs bg-purple-100 shrink-0"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop';
                                }}
                            />

                            <div className="text-left space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1">
                                    <h5 className="text-[11px] font-bold text-slate-900 truncate">{shopName}</h5>
                                    <span className="bg-[#843D9B] text-white text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-full">
                                        VERIFIED
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-700">
                                    <Star size={10} className="fill-amber-400 text-amber-400" />
                                    <span>{rating}</span>
                                    <span className="text-slate-400">({totalReviews})</span>
                                </div>

                                <p className="text-[8px] text-slate-500 font-medium">{experienceText}</p>
                            </div>
                        </div>

                        {/* View Profile Action Button */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full py-1 px-3 bg-white border border-slate-200 hover:border-[#843D9B] hover:bg-purple-50/50 text-slate-800 hover:text-[#843D9B] rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs group cursor-pointer"
                        >
                            <span>View Profile</span>
                            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 pt-1 sm:pt-0">
                        <div className="flex items-center gap-2 bg-[#FAF5FF] p-2.5 rounded-2xl border border-purple-100 min-w-[155px]">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-[#843D9B] flex items-center justify-center font-bold text-xs shrink-0">
                                📏
                            </div>
                            <div className="text-left space-y-0.5">
                                <div className="flex items-center gap-1">
                                    <h5 className="text-[11px] font-bold text-slate-900">Home Visit</h5>
                                    <span className="bg-[#843D9B] text-white text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-full">
                                        Executive
                                    </span>
                                </div>
                                <p className="text-[9px] text-purple-700 font-semibold">Verified Professional</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Row: Measurement Executive Visit Fee (ONLY if home visit selected) */}
            {isHomeVisitSelected && (
                <div className="pt-2 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Measurement Executive Fee</span>
                    <span className="text-[#843D9B] font-bold">+₹{pricing?.tailorAtHome || 150}</span>
                </div>
            )}

            {/* Instructions if any */}
            {config?.instructions && typeof config.instructions === 'string' && (
                <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-900 italic">
                    Note: "{config.instructions}"
                </div>
            )}

            {/* About Shop Modal Popup */}
            <AboutShopModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tailor={tailorData}
                tailorId={tailorId}
            />
        </div>
    );
};

export default ServiceReviewCard;

