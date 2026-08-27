import React from 'react';
import { X, Star, MapPin, Award, CheckCircle2, ChevronRight, Scissors, Phone, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SafeImage from '../../../../../components/Common/SafeImage';

const AboutShopModal = ({ isOpen, onClose, tailor, tailorId }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const resolvedId = tailor?._id || tailor?.id || tailor?.user?._id || tailorId;
    const shopName = tailor?.shopName || 'Expert Tailor Shop';
    const profileImage = tailor?.user?.profileImage || tailor?.profileImage;
    const rating = tailor?.rating || 4.8;
    const totalReviews = tailor?.totalReviews || 320;
    const experience = tailor?.experienceInYears ? `${tailor.experienceInYears}+ Years Exp.` : '8+ Years Exp.';
    const bio = tailor?.bio || 'Dedicated to crafting high-quality bespoke garments, custom bridal fits, and fine alterations with master level precision.';
    const specializations = tailor?.specializations && tailor.specializations.length > 0 
        ? tailor.specializations 
        : ['Custom Fit', 'Bridal Suits', 'Designer Stitching', 'Express Alterations'];
    
    const address = tailor?.location?.address || tailor?.location?.city 
        ? `${tailor?.location?.address || ''} ${tailor?.location?.city || ''}`.trim()
        : 'Available in Your Area';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative border border-gray-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Banner */}
                <div className="h-28 bg-gradient-to-r from-[#843D9B] via-[#6d2f83] to-[#552069] relative p-4 flex justify-between items-start">
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                        Shop Profile
                    </span>
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Avatar & Main Info */}
                <div className="px-6 pb-6 pt-0 relative">
                    <div className="flex justify-between items-end -mt-12 mb-4">
                        <div className="relative">
                            <SafeImage
                                src={profileImage}
                                alt={shopName}
                                className="w-22 h-22 w-20 h-20 rounded-2xl border-4 border-white shadow-xl object-cover bg-purple-50"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white shadow">
                                <CheckCircle2 size={12} />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-[#843D9B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                <CheckCircle2 size={12} className="fill-[#843D9B] text-white" />
                                Verified
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-gray-900 leading-tight">{shopName}</h3>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <Scissors size={12} className="text-[#843D9B]" /> {shopName}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 my-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold shrink-0 border border-amber-100">
                                <Star size={16} className="fill-amber-400 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-900">{rating} <span className="text-[10px] text-gray-400 font-normal">({totalReviews})</span></p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Rating</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 border-l border-gray-200 pl-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center font-bold shrink-0 border border-purple-100">
                                <Award size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-900">{experience}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Experience</p>
                            </div>
                        </div>
                    </div>

                    {/* About Description */}
                    <div className="space-y-2 mb-4">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">About Shop</h4>
                        <p className="text-xs text-gray-600 leading-relaxed font-normal bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                            {bio}
                        </p>
                    </div>

                    {/* Specializations */}
                    <div className="space-y-2 mb-5">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Specializations</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {specializations.map((spec, i) => (
                                <span 
                                    key={i} 
                                    className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200/60"
                                >
                                    ✨ {spec}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    {address && (
                        <div className="flex items-start gap-2 text-xs text-gray-500 mb-5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <MapPin size={14} className="text-[#843D9B] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{address}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                        {resolvedId && (
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate(`/user/tailor/${resolvedId}`);
                                }}
                                className="flex-1 py-3 bg-[#843D9B] hover:bg-[#723287] active:scale-[0.98] text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-lg shadow-[#843D9B]/25 transition-all flex items-center justify-center gap-1.5"
                            >
                                Visit Full Shop Profile <ChevronRight size={14} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutShopModal;
