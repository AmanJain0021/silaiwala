import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Star, MapPin, Heart, ShieldCheck, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../utils/api';
import useLocationStore from '../../../store/locationStore';
import SafeImage from '../../../components/Common/SafeImage';

const TailorListing = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [tailors, setTailors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { coordinates } = useLocationStore();

    useEffect(() => {
        const fetchTailors = async () => {
            try {
                const response = await api.get('/customers/tailors');
                if (response.data.success) {
                    setTailors(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching tailors:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTailors();
    }, []);

    const filteredTailors = tailors.filter(t =>
        (t.shopName || t.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (t.specializations || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Loader2 size={40} className="text-[#2D2F6E] animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Searching Experts...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F8FC] pb-24 font-sans selection:bg-[#2D2F6E] selection:text-white">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white -z-10" />

            {/* 1. Premium Sticky Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-5 pt-safe shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors active:scale-90"
                        >
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 leading-none">Find Experts</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Available Near You</p>
                        </div>
                    </div>
                    <button className="p-2.5 bg-gray-50 rounded-xl text-gray-500 border border-gray-100 active:scale-95 transition-all">
                        <Filter size={18} />
                    </button>
                </div>

                {/* Search Bar with Internal Shadows */}
                <div className="max-w-3xl mx-auto relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#2D2F6E] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, expertise..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-100/50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D2F6E]/10 focus:bg-white focus:border-[#2D2F6E]/20 transition-all placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* 2. Tailor Count & Sort info */}
            <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                    {filteredTailors.length} Verified Tailors Found
                </span>
                <div className="flex gap-2">
                    <div className="h-5 w-px bg-gray-200" />
                    <span className="text-xs font-black text-[#2D2F6E] cursor-pointer">Sort By: Distance</span>
                </div>
            </div>

            {/* 3. Modern List */}
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredTailors.length > 0 ? (
                        filteredTailors.map((tailor, index) => (
                            <motion.div
                                key={tailor._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    to={`/tailor/${tailor._id}`}
                                    className="block bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden h-full"
                                >
                                    {/* Subtle Gradient Hover Effect */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#2D2F6E]/5 to-transparent rounded-bl-full translate-x-10 -translate-y-10 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-500"></div>

                                    <div className="flex gap-4 items-start relative z-10">
                                        {/* Profile Picture with Status Ring */}
                                        <div className="relative shrink-0">
                                            <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 border-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                                <SafeImage src={tailor.user?.profileImage} alt={tailor.shopName || tailor.user?.name} className="w-full h-full scale-110" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-2 ring-green-500/20"></div>
                                        </div>

                                        {/* Core Info */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <h3 className="font-black text-gray-900 truncate tracking-tight">{tailor.shopName || tailor.user?.name}</h3>
                                                    <ShieldCheck size={14} className="text-[#2D2F6E] shrink-0" />
                                                </div>
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-[#2D2F6E] rounded-lg text-[10px] font-black border border-[#2D2F6E]/10">
                                                    {tailor.rating || 0} <Star size={8} className="fill-[#2D2F6E] text-[#2D2F6E]" />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-[11px] text-[#2D2F6E] font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                                                    {tailor.specializations?.[0] || 'Expert Tailor'}
                                                </p>
                                                {tailor.isAvailable && (
                                                    <div className="flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md font-black border border-amber-100 shadow-sm animate-pulse">
                                                        <Clock size={8} /> AVAILABLE
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                <span className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-300" /> {tailor.distance || 'Near You'}</span>
                                                <span className="text-gray-200">|</span>
                                                <span>{tailor.totalReviews || 0} Reviews</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footnote */}
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {(tailor.specializations || []).slice(0, 2).map((tag, i) => (
                                                <span key={i} className="text-[9px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-full uppercase">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <button className="text-[11px] font-black text-[#2D2F6E] flex items-center gap-1 group/btn">
                                            View Details <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </Link>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No Experts Found</h3>
                            <p className="text-xs text-gray-400 px-10 leading-relaxed mt-2">
                                We couldn't find any tailors matching "{search}". Try searching for categories like 'Bridal' or 'Suits'.
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TailorListing;
