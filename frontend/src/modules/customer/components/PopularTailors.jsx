import React from 'react';
import { Star, MapPin, ChevronRight, ShieldCheck, Clock, BadgeCheck, Tag, Scissors } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useTailorStore from '../../../store/tailorStore';
import useLocationStore from '../../../store/locationStore';
import SafeImage from '../../../components/Common/SafeImage';
import { useRequireAuth } from '../../../hooks/useRequireAuth';

const PopularTailors = () => {
    const { tailors, fetchTailors, isLoading } = useTailorStore();
    const { coordinates } = useLocationStore();
    const { requireAuth } = useRequireAuth();
    const navigate = useNavigate();

    const handleTailorClick = (e, tailorId) => {
        e.preventDefault();
        if (!requireAuth('Please login to view tailor shop details')) return;
        navigate(`/user/tailor/${tailorId}`);
    };

    const lat = coordinates?.lat;
    const lng = coordinates?.lng;

    React.useEffect(() => {
        const params = { strictRadius: true };
        if (lat && lng) {
            params.lat = lat;
            params.lng = lng;
        }
        fetchTailors(params);
    }, [fetchTailors, lat, lng]);

    // Show top 4 prominently
    const safeTailors = Array.isArray(tailors) ? tailors : [];
    const displayTailors = safeTailors.length > 0 ? safeTailors.slice(0, 4) : [];

    if (isLoading && safeTailors.length === 0) {
        return <div className="px-4 py-8 text-center text-gray-500">Finding best tailors...</div>;
    }

    return (
        <div className="px-4 md:px-6 lg:px-8 py-1.5">
            <div className="flex justify-between items-center mb-2.5">
                <div>
                    <h2 className="text-[19px] md:text-xl font-black text-gray-900 tracking-tight leading-none">Expert Tailors Near You</h2>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Stitching experts at your doorstep</p>
                </div>
                <Link to="/user/tailors" className="text-xs font-black text-[#843D9B] bg-indigo-50 px-3 py-1.5 rounded-full border border-[#843D9B]/10 hover:shadow-sm transition-all">
                    See All
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {displayTailors.map((tailor, index) => (
                    <motion.div
                        key={tailor._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            to={`/user/tailor/${tailor._id}`}
                            onClick={(e) => handleTailorClick(e, tailor._id)}
                            className="flex flex-col sm:flex-row gap-4 sm:gap-5 bg-white p-4 sm:p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:scale-[0.98] transition-all group relative"
                        >
                            <div className="relative shrink-0">
                                <div className="h-48 w-full sm:w-40 sm:h-40 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                                    <SafeImage
                                        src={tailor.user?.profileImage}
                                        alt={tailor.shopName || 'Tailor Partner'}
                                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-1 gap-2">
                                        <h3 className="text-lg font-black text-gray-900 leading-tight flex items-center gap-1.5 truncate">
                                            <span className="truncate">{tailor.shopName || 'Tailor Partner'}</span>
                                            <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0 fill-blue-500 stroke-white" />
                                        </h3>
                                        <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black tracking-wider flex items-center gap-1 shrink-0">
                                            <ShieldCheck size={12} /> <span className="hidden sm:inline">Top Rated</span><span className="sm:hidden">Top</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium mb-3">
                                        <div className="flex items-center gap-1 text-[#F59E0B]">
                                            <Star size={14} className="fill-current" />
                                            <span className="font-bold text-gray-700">{tailor.rating || '5.0'}</span> ({tailor.reviews || '90'} Reviews)
                                        </div>
                                        <span className="text-gray-300 hidden sm:inline">|</span>
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} />
                                            {tailor.distance || '2.1 km away'}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-blue-50/70 text-blue-600 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold mb-3 border border-blue-100/50">
                                        <Tag size={12} /> Starts from ₹{tailor.basePrice || '299'}
                                    </div>

                                    <div className="hidden sm:flex flex-wrap items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold px-2 py-1 bg-purple-50 text-primary border border-purple-100 rounded-md flex items-center gap-1"><Scissors size={10}/> Expert Tailors</span>
                                        <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md flex items-center gap-1"><ShieldCheck size={10}/> Quality Stitching</span>
                                        <span className="text-[10px] font-bold px-2 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-md flex items-center gap-1"><Clock size={10}/> On-time Delivery</span>
                                    </div>
                                    
                                    <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
                                        {tailor.bio || 'Professional tailoring for all your needs - from everyday wear to special occasions.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 mt-auto">
                                    <button className="bg-[#843D9B] text-white py-2.5 px-6 rounded-xl text-xs font-black tracking-wide hover:bg-[#68166d] transition-colors shadow-sm shadow-purple-200 flex items-center justify-center gap-2 sm:w-auto w-full">
                                        View Tailor <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default PopularTailors;
