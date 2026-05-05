import React from 'react';
import { Star, MapPin, ChevronRight, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useTailorStore from '../../../store/tailorStore';
import useLocationStore from '../../../store/locationStore';
import SafeImage from '../../../components/Common/SafeImage';

const PopularTailors = () => {
    const { tailors, fetchTailors, isLoading } = useTailorStore();
    const { coordinates } = useLocationStore();

    React.useEffect(() => {
        fetchTailors();
    }, [fetchTailors]);

    // Show top 4 prominently
    const displayTailors = tailors.length > 0 ? tailors.slice(0, 4) : [];

    if (isLoading && tailors.length === 0) {
        return <div className="px-4 py-8 text-center text-gray-500">Finding best tailors...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Expert Tailors Near You</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Stitching experts at your doorstep</p>
                </div>
                <Link to="/tailors" className="text-xs font-black text-[#2D2F6E] bg-indigo-50 px-3 py-1.5 rounded-full border border-[#2D2F6E]/10 hover:shadow-sm transition-all">
                    See All
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayTailors.map((tailor, index) => (
                    <motion.div
                        key={tailor._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            to={`/tailor/${tailor._id}`}
                            className="flex gap-4 bg-white p-4 rounded-[1.5rem] shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-100 active:scale-[0.98] transition-transform group relative overflow-hidden"
                        >
                            {/* Visual Indicator of Fabric availability */}
                            {tailor.isAvailable && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[8px] font-black border border-amber-100/50 shadow-sm">
                                    <Clock size={10} className="animate-pulse" /> AVAILABLE
                                </div>
                            )}

                            <div className="relative shrink-0">
                                <div className="h-20 w-20 rounded-2xl overflow-hidden border border-gray-100 shadow-sm group-hover:rotate-2 transition-transform">
                                    <SafeImage
                                        src={tailor.user?.profileImage}
                                        alt={tailor.user?.name}
                                        className="h-full w-full group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-[#2D2F6E] text-white p-1 rounded-lg border-2 border-white shadow-sm">
                                    <ShieldCheck size={10} />
                                </div>
                            </div>

                            <div className="flex-1 pt-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <h3 className="text-sm font-black text-gray-900 leading-none group-hover:text-[#2D2F6E] transition-colors">{tailor.shopName || tailor.user?.name}</h3>
                                </div>
                                <p className="text-[11px] text-[#2D2F6E] font-bold mt-1 bg-indigo-50 w-fit px-2 py-0.5 rounded-full border border-[#2D2F6E]/5 italic">
                                    {tailor.specializations?.[0] || 'Expert Tailor'}
                                </p>

                                <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400 font-bold uppercase">
                                    <div className="flex items-center gap-1 text-[#2D2F6E]">
                                        <Star size={10} className="fill-[#2D2F6E]" />
                                        {tailor.rating || 0}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin size={10} />
                                        {tailor.distance || 'Near you'}
                                    </div>
                                    <div className="ml-auto flex items-center gap-1 text-gray-800">
                                        View <ChevronRight size={12} />
                                    </div>
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
