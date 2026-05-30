import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, ChevronRight, CheckCircle2, ShieldCheck, Tag, Info, Clock, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import useCheckoutStore from '../../../store/checkoutStore';
import api from '../../../utils/api';
import SafeImage from '../../../components/Common/SafeImage';

const FabricDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const setTailorInStore = useCheckoutStore(state => state.setTailor);

    const [fabric, setFabric] = useState(null);
    const [tailor, setTailor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Fabric Details
                const fabricRes = await api.get(`/products/${id}`);
                const fabricData = fabricRes.data.data;
                setFabric(fabricData);

                // 2. Fetch Tailor Details using the tailor ID from fabric
                if (fabricData?.tailor) {
                    const tailorId = typeof fabricData.tailor === 'object' ? fabricData.tailor._id : fabricData.tailor;
                    const tailorRes = await api.get(`/tailors/${tailorId}`);
                    setTailor(tailorRes.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch fabric detail:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-[#2D2F6E] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!fabric || !tailor) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900">Fabric Not Found</h2>
            <button onClick={() => navigate(-1)} className="mt-4 text-[#2D2F6E] font-bold">Go Back</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F7F8FC] pb-32 font-sans overflow-x-hidden">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 pt-safe flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-all active:scale-90"
                >
                    <ArrowLeft size={22} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-black text-gray-900 truncate leading-none">Fabric Details</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Stitching Exclusive</p>
                </div>
            </div>

            {/* Product Image */}
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-200">
                <SafeImage
                    src={fabric.images?.[0] || fabric.image}
                    alt={fabric.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 shadow-xl flex items-center gap-1.5">
                        <Tag size={12} className="text-[#2D2F6E]" />
                        <span className="text-[10px] font-black text-[#2D2F6E] uppercase tracking-wider">{fabric.category?.name || 'Fabric'}</span>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="relative z-10 -mt-10 px-4">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100"
                >
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2 leading-tight">{fabric.name}</h2>
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-[#2D2F6E]">₹{fabric.price}</span>
                            <div className="h-4 w-px bg-gray-200" />
                            <div className="flex items-center gap-1.5 text-green-600">
                                <CheckCircle2 size={16} />
                                <span className="text-xs font-black uppercase tracking-widest">{fabric.inStock ? 'In Stock' : 'Out of Stock'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Fabric Specifications */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Stock Status</span>
                            <span className="text-sm font-black text-gray-900">{fabric.stock || 0} units</span>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Quality Guaranteed</span>
                            <span className="text-sm font-black text-gray-900">{fabric.isActive ? 'Verified' : 'Reviewing'}</span>
                        </div>
                    </div>

                    {/* Delivery Impact */}
                    <div className="mb-8 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0 border border-amber-100">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Artisan Availability</h4>
                            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                {fabric.inStock
                                    ? "This fabric is currently available in the tailor's store. Ready for immediate stitching selection."
                                    : "This fabric is currently out of stock. Contact the tailor for restocking details."}
                            </p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xs font-black text-gray-900 tracking-widest uppercase mb-3 opacity-40 flex items-center gap-2">
                            <Info size={14} /> Artisan's Description
                        </h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                            {fabric.description || "No description provided for this premium fabric."}
                        </p>
                    </div>

                    <div className="h-px bg-gray-100 w-full mb-8" />

                    {/* Tailor Information Section */}
                    <div>
                        <h3 className="text-xs font-black text-gray-900 tracking-widest uppercase mb-4 opacity-40">Artisan Mastermind</h3>
                        <Link to={`/user/tailor/${tailor._id}`} className="flex items-center gap-4 bg-white p-4 rounded-[2.5rem] border-2 border-gray-50 active:scale-95 transition-transform group shadow-sm hover:border-[#2D2F6E]/10">
                            <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-white shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-500">
                                <SafeImage src={tailor.user?.profileImage} alt={tailor.shopName} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <h4 className="font-black text-gray-900 truncate group-hover:text-[#2D2F6E] transition-colors">{tailor.shopName || tailor.user?.name}</h4>
                                    <ShieldCheck size={14} className="text-[#2D2F6E]" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[10px] font-black text-[#2D2F6E] bg-indigo-50 px-2 py-0.5 rounded-lg border border-[#2D2F6E]/5">
                                        {tailor.rating} <Star size={10} className="fill-current" />
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Expert Artisan
                                    </div>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#2D2F6E] group-hover:bg-indigo-50 transition-all">
                                <ChevronRight size={18} />
                            </div>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-white/80 backdrop-blur-xl border-t border-gray-100 z-[40]">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={() => {
                            setTailorInStore(tailor._id, tailor.shopName || tailor.user?.name);
                            navigate('/user/services', { state: { selectedFabric: fabric, tailorId: tailor._id, tailorName: tailor.shopName || tailor.user?.name, fabricSource: 'platform' } });
                        }}
                        className="w-full bg-[#2D2F6E] text-white py-4 rounded-2xl shadow-xl shadow-[#2D2F6E]/30 font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <Scissors size={18} />
                        Book Stitching With This Fabric
                    </button>
                    <p className="text-[10px] text-gray-400 text-center mt-3 font-bold uppercase tracking-widest">Pricing excludes base stitching charges</p>
                </div>
            </div>
        </div>
    );
};

export default FabricDetail;
