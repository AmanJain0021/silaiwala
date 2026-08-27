import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, Loader2, Users, Filter, ChevronDown, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../utils/api';
import SafeImage from '../../../components/Common/SafeImage';
import BottomNav from '../components/BottomNav';

const SORT_OPTIONS = [
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'delivery', label: 'Fastest Delivery' },
];

const CategoryServices = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [category, setCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState('price_low');
    const [showSortMenu, setShowSortMenu] = useState(false);

    useEffect(() => {
        const fetchCategoryServices = async () => {
            setIsLoading(true);
            try {
                const [servicesRes, categoriesRes] = await Promise.all([
                    api.get('/services', { params: { category: categoryId } }),
                    api.get('/products/categories', { params: { type: 'service' } }),
                ]);

                if (servicesRes.data.success) {
                    setServices(servicesRes.data.data);
                }

                // Find the matching category
                if (categoriesRes.data.success) {
                    const match = categoriesRes.data.data.find(c => c._id === categoryId);
                    if (match) setCategory(match);
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error('Failed to fetch category services:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategoryServices();
    }, [categoryId]);

    const sortedServices = useMemo(() => {
        const arr = [...services];
        switch (sortBy) {
            case 'price_low':
                return arr.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
            case 'price_high':
                return arr.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
            case 'rating':
                return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'delivery': {
                const extractDays = (str) => {
                    if (!str) return 999;
                    const match = str.match(/(\d+)/);
                    return match ? parseInt(match[1], 10) : 999;
                };
                return arr.sort((a, b) => extractDays(a.deliveryTime) - extractDays(b.deliveryTime));
            }
            default:
                return arr;
        }
    }, [services, sortBy]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#f3f9f8] to-[#e6f4f1] flex flex-col items-center justify-center p-6 text-center">
                <Loader2 size={40} className="text-primary animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading tailors for this service...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f3f9f8] to-[#e6f4f1] pb-24 md:pb-8 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-black text-gray-900 truncate">
                            {category?.name || 'Service'}
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Compare {sortedServices.length} tailor{sortedServices.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {/* Sort Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-100"
                        >
                            <Filter size={13} />
                            Sort
                            <ChevronDown size={12} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {showSortMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[180px] z-40"
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                                sortBy === opt.value
                                                    ? 'text-primary bg-primary/5'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Price Range Banner */}
            {category && category.minPrice != null && category.maxPrice != null && (
                <div className="max-w-4xl mx-auto px-4 mt-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                        {category.image && (
                            <div className="h-14 w-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'; }}
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin-set price range</p>
                            <p className="text-lg font-black text-primary">
                                ₹{category.minPrice} – ₹{category.maxPrice}
                            </p>
                            {category.description && (
                                <p className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">{category.description}</p>
                            )}
                        </div>
                        {category.deliveryTime && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg shrink-0">
                                <Clock size={12} />
                                {category.deliveryTime}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Services List */}
            <div className="max-w-4xl mx-auto px-4 mt-4">
                {sortedServices.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <Users size={48} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 font-bold text-sm">No tailors offer this service yet.</p>
                        <p className="text-gray-300 text-xs mt-1">Check back later or browse other categories.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedServices.map((service, index) => (
                            <motion.div
                                key={service._id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04, duration: 0.3 }}
                                onClick={() => navigate(`/user/services/${service._id}`)}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                            >
                                <div className="flex">
                                    {/* Service Image */}
                                    <div className="relative w-28 sm:w-36 shrink-0 overflow-hidden bg-gray-50">
                                        <img
                                            src={service.image || 'https://images.unsplash.com/photo-1556760544-74c6974b89e0?w=400'}
                                            alt={service.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'; }}
                                        />
                                        {index === 0 && sortBy === 'price_low' && (
                                            <div className="absolute top-2 left-2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                Best Price
                                            </div>
                                        )}
                                        {index === 0 && sortBy === 'rating' && (
                                            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                Top Rated
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-black text-gray-900 truncate group-hover:text-primary transition-colors">
                                                    {service.title}
                                                </h3>
                                                <span className="text-base font-black text-primary shrink-0">
                                                    ₹{service.basePrice}
                                                </span>
                                            </div>

                                            {/* Tailor Info */}
                                            {service.tailor && (
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                        {service.tailor.user?.profileImage ? (
                                                            <img
                                                                src={service.tailor.user.profileImage}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-[8px] font-bold text-gray-500">
                                                                {service.tailor.shopName?.[0] || '?'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-gray-600 truncate">
                                                        {service.tailor.shopName || 'Tailor Partner'}
                                                    </span>
                                                    <ShieldCheck size={12} className="text-blue-500 shrink-0" />
                                                </div>
                                            )}

                                            {service.description && (
                                                <p className="text-[11px] text-gray-400 line-clamp-1 mt-1">{service.description}</p>
                                            )}
                                        </div>

                                        {/* Meta Row */}
                                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                                <Star size={11} className="fill-yellow-400 text-yellow-400" />
                                                {service.rating || '4.5'}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                                <Clock size={11} />
                                                {service.deliveryTime || '5-7 days'}
                                            </div>
                                            {service.isPickupAvailable && (
                                                <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                                    Pickup Available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default CategoryServices;
