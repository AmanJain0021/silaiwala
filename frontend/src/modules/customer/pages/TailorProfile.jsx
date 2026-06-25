import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Award, Phone, ShieldCheck, Heart, Share2, Scissors, ChevronRight, Tag, CheckCircle2, Info, ShoppingBag, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/store/ProductCard';
import useCheckoutStore from '../../../store/checkoutStore';
import api from '../../../utils/api';
import SafeImage from '../../../components/Common/SafeImage';

const TailorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const setTailorInStore = useCheckoutStore(state => state.setTailor);
    const [tailor, setTailor] = useState(null);
    const [fabrics, setFabrics] = useState([]);
    const [workSamples, setWorkSamples] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    
    // Bridal Booking State
    const [isBridalModalOpen, setIsBridalModalOpen] = useState(false);
    const [bookingData, setBookingData] = useState({ date: '', time: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [tailorRes, fabricsRes, samplesRes, servicesRes] = await Promise.all([
                    api.get(`/tailors/${id}`),
                    api.get(`/tailors/${id}/fabrics`),
                    api.get(`/tailors/${id}/work-samples`),
                    api.get(`/tailors/${id}/services`)
                ]);
                setTailor(tailorRes.data.data);
                setFabrics(fabricsRes.data.data);

                // Merge work samples and services for the portfolio view
                const uniqueContent = new Map();

                // Add work samples first
                (samplesRes.data.data || []).forEach(item => {
                    uniqueContent.set(item._id, { ...item, type: 'sample' });
                });

                // Add services, mapping basePrice to laborPrice
                (servicesRes.data.data || []).forEach(item => {
                    if (!uniqueContent.has(item._id)) {
                        uniqueContent.set(item._id, {
                            ...item,
                            type: 'service',
                            isBookable: true,
                            laborPrice: item.basePrice
                        });
                    }
                });

                setWorkSamples(Array.from(uniqueContent.values()));
            } catch (error) {
                console.error('Failed to fetch tailor data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleBridalSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Note: Sending to the main order checkout endpoint with special flags
            const res = await api.post('/orders', {
                tailorId: tailor._id,
                items: [{
                    serviceType: 'bridal-consultation',
                    name: 'Bridal Consultation',
                    quantity: 1
                }],
                fabricPickupRequired: false,
                isBridalConsultation: true,
                isMeasurementHome: true,
                bridalNotes: bookingData.notes,
                bridalDate: bookingData.date,
                bridalTime: bookingData.time
            });
            if (res.data.success) {
                alert('Bridal Consultation booked successfully!');
                setIsBridalModalOpen(false);
                setBookingData({ date: '', time: '', notes: '' });
                navigate('/user/orders');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#843D9B] border-t-transparent rounded-full animate-spin" />
    </div>;

    if (!tailor) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">Tailor Not Found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#843D9B] font-bold">Go Back</button>
    </div>;

    return (
        <div className="min-h-screen bg-[#F7F8FC] pb-32 font-sans overflow-x-hidden">
            {/* 1. Dynamic Header with Parallax-like feel */}
            <div className="relative h-44 w-full overflow-hidden bg-[#843D9B]">
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10 z-10"></div>
                <SafeImage
                    src={tailor.user?.profileImage}
                    fallback='https://images.unsplash.com/photo-1556760544-74c6974b89e0?w=800'
                    alt="Cover"
                    className="w-full h-full opacity-60 blur-sm scale-110"
                />

                <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-10 sm:pt- safe flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex gap-2">
                        <button className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-all">
                            <Share2 size={18} />
                        </button>
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`p-2.5 backdrop-blur-md rounded-full border border-white/20 active:scale-90 transition-all ${isFavorite ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/10 text-white'}`}
                        >
                            <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Overlapping Profile Card */}
            <div className="relative z-30 -mt-12 px-4">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[2.5rem] p-4 sm:p-6 shadow-xl border border-gray-100"
                >
                    <div className="flex gap-4 items-start">
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-2xl rotate-2 group">
                                <SafeImage src={tailor.user?.profileImage} alt={tailor.shopName} className="w-full h-full group-hover:scale-110 transition-transform duration-700" />
                            </div>
                            {tailor.isApproved && (
                                <div className="absolute -bottom-1 -right-1 bg-[#843D9B] p-1.5 rounded-full border-2 border-white shadow-lg ring-4 ring-[#843D9B]/10">
                                    <ShieldCheck size={14} className="text-white" />
                                </div>
                            )}
                        </div>
                        <div className="pt-2 flex-1">
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">{tailor.shopName || tailor.user?.name}</h2>
                            </div>
                            <div className="flex items-center gap-1.5 mb-3">
                                <div className="bg-[#843D9B] text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase">Expert Artisan</div>
                                <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{tailor.specializations?.[0] || 'Expert Tailor'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-lg">
                                    <Star size={12} className="fill-[#843D9B] text-[#843D9B]" />
                                    <span className="font-black text-[#843D9B]">{tailor.rating || 0}</span>
                                    <span className="text-[#843D9B]/40 text-[10px] font-bold">({tailor.totalReviews || 0})</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400 font-bold">
                                    <MapPin size={12} className="text-[#843D9B]/30" />
                                    <span>Near you</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                        <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-50 text-center">
                            <Award size={18} className="mx-auto mb-1 text-[#843D9B]" />
                            <span className="block text-xs font-black text-gray-900 leading-none">{tailor.experienceInYears || 0}y</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 block">Experience</span>
                        </div>
                        <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100 text-center">
                            <CheckCircle2 size={18} className="mx-auto mb-1 text-green-600" />
                            <span className="block text-xs font-black text-gray-900 leading-none">100+</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 block">Finished</span>
                        </div>
                        <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100 text-center">
                            <Clock size={18} className="mx-auto mb-1 text-amber-600" />
                            <span className="block text-xs font-black text-gray-900 leading-none">3-5d</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 block">Delivery</span>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="mt-4 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1.5 opacity-40">Artisan's Bio</h3>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            {tailor.bio || "Crafting perfect fits with dedication and precision. Every stitch tells a story of elegance and comfort."}
                        </p>
                    </div>

                    {/* Location Sneak Peek */}
                    <div className="mt-4">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2 opacity-40 px-1">Artisan's Atelier</h3>
                        <div className="bg-gray-100 h-24 rounded-2xl relative overflow-hidden active:scale-[0.99] transition-transform">
                            <img src="https://images.unsplash.com/photo-1524613032530-449a5d94c285?w=600" className="w-full h-full object-cover blur-[1px] grayscale-[0.5]" alt="Map" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white shadow-xl flex items-center gap-2">
                                    <MapPin size={14} className="text-error" />
                                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Open in Maps</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-2 px-1 flex items-center gap-1">
                            <Info size={10} /> {tailor.location?.address}
                        </p>
                    </div>

                    {/* Bridal Consultation Button */}
                    <div className="mt-5">
                        <button
                            onClick={() => setIsBridalModalOpen(true)}
                            className="w-full py-3.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <Heart size={16} className="text-rose-500 fill-rose-500" />
                            <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Book Bridal Consultation</span>
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* 3. Shop Fabrics (High Impact) */}
            {fabrics && fabrics.length > 0 && (
                <div className="mt-6 px-4">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Artisan's Collection</h3>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Exclusive fabrics available in-store</p>
                        </div>
                        <div className="p-2.5 bg-[#843D9B]/5 rounded-2xl border border-[#843D9B]/5">
                            <Tag size={18} className="text-[#843D9B]" />
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar snap-x">
                        {fabrics.map((fabric, idx) => (
                            <motion.div
                                key={fabric._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="snap-start flex-shrink-0 w-52"
                            >
                                <div
                                    onClick={() => {
                                        setTailorInStore(tailor._id, tailor.shopName || tailor.user?.name);
                                        navigate(`/user/fabric/${fabric._id}`);
                                    }}
                                    className="bg-white rounded-[2.5rem] p-3 shadow-md border border-gray-100 group cursor-pointer hover:shadow-xl transition-all duration-500 overflow-hidden"
                                >
                                    <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-3 relative shadow-inner">
                                        <SafeImage src={fabric.images?.[0] || fabric.image} alt={fabric.name} className="w-full h-full group-hover:scale-110 transition-transform duration-1000" />
                                        <div className="absolute top-3 left-3">
                                            <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white shadow-sm">
                                                <span className="text-[8px] font-black text-[#843D9B] uppercase">{fabric.category?.name || 'Fabric'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <h4 className="text-[13px] font-black text-gray-800 truncate mb-1">{fabric.name}</h4>
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-black text-[#843D9B]">₹{fabric.price}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase">Incl. Taxes</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[#843D9B] shadow-sm transform group-hover:rotate-12 transition-transform">
                                                <Scissors size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Portfolio / Designs */}
            <div className="mt-6 px-4">
                <div className="flex justify-between items-center mb-4 px-2">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Signature Designs</h3>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Inspired by traditional masteries</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {workSamples.length > 0 ? workSamples.map((sample, idx) => (
                        <motion.div
                            key={sample._id}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div
                                onClick={() => {
                                    if (sample.type === 'service') {
                                        setTailorInStore(tailor._id, tailor.shopName || tailor.user?.name);
                                        navigate(`/user/services/${sample._id}`, { state: { tailorId: tailor._id } });
                                    }
                                }}
                                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-all duration-300"
                            >
                                <div className="aspect-[4/5] overflow-hidden">
                                    <SafeImage src={sample.image} alt={sample.title} className="w-full h-full group-hover:scale-105 transition-transform duration-700" />
                                </div>
                                <div className="p-3">
                                    <h4 className="text-xs font-black text-gray-900 truncate">{sample.title}</h4>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{sample.category?.name || 'Design'}</p>
                                        <p className="text-[10px] font-black text-[#843D9B]">₹{sample.laborPrice || sample.basePrice}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex flex-wrap gap-1">
                                            {sample.tags && sample.tags.slice(0, 2).map((tag, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-[#843D9B]/5 text-[#843D9B] text-[7px] font-black rounded-md uppercase tracking-tighter">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        {sample.isBookable && (
                                            <span className="text-[7px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Bookable</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-2 py-10 text-center opacity-40">
                            <p className="text-xs font-bold uppercase tracking-widest">No signature designs yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Action Footer - DUAL ACTION */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-10 sm:pb-6 bg-white/80 backdrop-blur-2xl border-t border-gray-100 z-[40] animate-in slide-in-from-bottom">
                <div className="max-w-md mx-auto flex gap-2">
                    <button
                        onClick={() => {
                            setTailorInStore(tailor._id, tailor.shopName || tailor.user?.name);
                            navigate('/user/services', { state: { fabricSource: 'customer' } });
                        }}
                        className="flex-1 bg-white border-2 border-[#843D9B] text-[#843D9B] py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        <Scissors size={14} />
                        <span>Stitch Mine</span>
                    </button>
                    <button
                        onClick={() => {
                            const fabricSection = document.querySelector('.mt-10');
                            fabricSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex-[1.2] bg-[#843D9B] text-white py-2.5 rounded-xl shadow-lg shadow-[#843D9B]/20 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                    >
                        <ShoppingBag size={14} />
                        <span>Pick Tailor's</span>
                    </button>
                </div>
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

                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                                <Heart size={24} className="fill-rose-500" />
                            </div>

                            <h3 className="text-xl font-black text-gray-900 mb-1">Bridal Consultation</h3>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                Book an exclusive in-person bridal fitting. {tailor.shopName || tailor.user?.name} will travel to your location to take measurements.
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
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-rose-300 focus:ring-1 focus:ring-rose-300/20 transition-all outline-none"
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
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-rose-300 focus:ring-1 focus:ring-rose-300/20 transition-all outline-none"
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
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:border-rose-300 focus:ring-1 focus:ring-rose-300/20 transition-all outline-none resize-none"
                                        value={bookingData.notes}
                                        onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 active:scale-[0.98] transition-all disabled:opacity-70 mt-2"
                                >
                                    {isSubmitting ? 'Booking...' : 'Book Consultation'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TailorProfile;
