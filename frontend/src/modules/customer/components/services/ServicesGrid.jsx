import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, Star, Loader2, Users, ArrowRight, X } from 'lucide-react';
import { useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import api from '../../../../utils/api';
import useUnifiedLocation from '../../../../shared/hooks/useUnifiedLocation';

const ServiceCard = ({ service }) => {
    const navigate = useNavigate();
    const location = useRouteLocation();

    const handleNavigate = () => {
        navigate(`/user/services/${service._id}`, { state: location.state });
    };

    return (
        <div
            onClick={handleNavigate}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer"
        >
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                <img
                    src={service.image || 'https://images.unsplash.com/photo-1556760544-74c6974b89e0?w=800'}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    {service.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded">
                            {tag}
                        </span>
                    )) || (
                        <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider rounded">
                            Classic
                        </span>
                    )}
                </div>
                <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-0.5">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    {service.rating || 0}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{service.title}</h3>
                    <span className="font-bold text-primary">₹{service.basePrice}</span>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{service.description}</p>

                <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                    <Clock size={12} />
                    <span>Est. {service.deliveryTime || '10-15 Days'}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
                    <span className="text-green-600 font-medium">Pickup Available</span>
                </div>

                <div className="flex gap-2 mt-auto">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Details
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark shadow-sm transition-colors"
                    >
                        Book
                    </button>
                </div>
            </div>
        </div>
    );
};

const CategoryCompareSection = ({ categories }) => {
    const navigate = useNavigate();
    // Only show categories that have minPrice and maxPrice set
    const comparableCategories = categories.filter(c => c.minPrice != null && c.maxPrice != null);

    if (comparableCategories.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-black text-gray-900">Compare Tailors by Category</h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">See all tailors & their prices for each service type</p>
                </div>
                <Users size={16} className="text-primary" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {comparableCategories.map(cat => (
                    <button
                        key={cat._id}
                        onClick={() => navigate(`/user/services/category/${cat._id}`)}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-left hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            {cat.image && (
                                <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'; }}
                                    />
                                </div>
                            )}
                            <span className="text-xs font-black text-gray-900 truncate group-hover:text-primary transition-colors">
                                {cat.name}
                            </span>
                        </div>
                        <div className="text-sm font-black text-primary">
                            ₹{cat.minPrice} – ₹{cat.maxPrice}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-primary/70 group-hover:text-primary transition-colors">
                            Compare Prices <ArrowRight size={10} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

const ServicesGrid = ({ searchQuery = '', activeFilter = 'All' }) => {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [serviceCategories, setServiceCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { location = {}, error: locationError } = useUnifiedLocation({ autoDetect: true, fetchAddress: false });
    const { lat, lng } = location || {};
    const routeLocation = useRouteLocation();
    const [activeTailorId, setActiveTailorId] = useState(routeLocation.state?.tailorId || null);
    const [tailorName, setTailorName] = useState(routeLocation.state?.tailorName || '');

    useEffect(() => {
        if (routeLocation.state?.tailorId !== undefined) {
            setActiveTailorId(routeLocation.state?.tailorId || null);
            setTailorName(routeLocation.state?.tailorName || '');
        }
    }, [routeLocation.state]);

    const handleClearTailorFilter = () => {
        if (window.history.replaceState) {
            window.history.replaceState({}, document.title);
        }
        setActiveTailorId(null);
        setTailorName('');
        navigate('/user/services', { replace: true, state: {} });
    };

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            try {
                const [servicesRes, catsRes] = await Promise.all([
                    api.get('/services', { params: { tailor: activeTailorId || undefined } }),
                    api.get('/products/categories', { params: { type: 'service' } }),
                ]);
                if (servicesRes.data.success) {
                    setServices(servicesRes.data.data);
                }
                if (catsRes.data.success) {
                    setServiceCategories(catsRes.data.data);
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error('Failed to fetch services:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, [activeTailorId]);

    const filteredServices = useMemo(() => {
        let result = services;

        const getCategoryStr = (s) => {
            if (!s.category) return '';
            if (typeof s.category === 'string') return s.category.toLowerCase();
            if (s.category.name) return s.category.name.toLowerCase();
            return '';
        };

        const getCategoryGender = (s) => {
            if (!s.category || typeof s.category === 'string') return 'all';
            return (s.category.gender || 'all').toLowerCase();
        };

        const getTitleStr = (s) => (s.title || '').toLowerCase();
        const getDescStr = (s) => (s.description || '').toLowerCase();

        // Apply activeFilter
        if (activeFilter !== 'All') {
            if (activeFilter === 'Men') {
                result = result.filter(s => getCategoryGender(s) === 'men' || getCategoryStr(s).includes('men') || getTitleStr(s).includes('men'));
            } else if (activeFilter === 'Women') {
                result = result.filter(s => getCategoryGender(s) === 'women' || getCategoryStr(s).includes('women') || getCategoryStr(s).includes('blouse') || getCategoryStr(s).includes('saree') || getTitleStr(s).includes('women') || getTitleStr(s).includes('blouse') || getTitleStr(s).includes('saree'));
            } else if (activeFilter === 'Bridal') {
                result = result.filter(s => getCategoryGender(s) === 'bridal' || getCategoryStr(s).includes('bridal') || getCategoryStr(s).includes('lehenga') || getTitleStr(s).includes('bridal'));
            } else if (activeFilter === 'Kids') {
                result = result.filter(s => getCategoryGender(s) === 'kids' || getCategoryStr(s).includes('kids') || getTitleStr(s).includes('kids'));
            } else if (activeFilter === 'Popular') {
                result = result.filter(s => (s.rating || 0) >= 4.5);
            } else if (activeFilter === 'Under ₹500') {
                result = result.filter(s => (s.basePrice || s.price || 0) < 500);
            } else if (activeFilter === 'Express Delivery') {
                result = result.filter(s => (s.deliveryTime || '').includes('2-4'));
            } else {
                // Dynamic Admin Category or keyword match
                const filterLower = activeFilter.toLowerCase();
                result = result.filter(s => 
                    getCategoryStr(s) === filterLower ||
                    getCategoryStr(s).includes(filterLower) || 
                    getTitleStr(s).includes(filterLower) ||
                    getDescStr(s).includes(filterLower)
                );
            }
        }

        // Apply searchQuery
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter(s => 
                getTitleStr(s).includes(query) || 
                getDescStr(s).includes(query) ||
                (s.tags || []).some(tag => (tag || '').toLowerCase().includes(query))
            );
        }

        return result;
    }, [services, activeFilter, searchQuery]);

    if (isLoading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cataloging Services...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {/* Tailor Filter Active Banner */}
            {activeTailorId && (
                <div className="bg-white/95 backdrop-blur-xl border border-[#843D9B]/15 rounded-2xl p-3 sm:p-4 shadow-sm mb-5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#843D9B]/10 flex items-center justify-center text-[#843D9B] font-bold shrink-0">
                                <Users size={16} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[8px] font-black text-[#843D9B] uppercase tracking-wider block leading-none mb-0.5">
                                    Tailor Catalog
                                </span>
                                <h3 className="text-xs sm:text-sm font-black text-gray-900 truncate">
                                    Services by <span className="text-[#843D9B]">{tailorName || 'Selected Tailor'}</span>
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => navigate('/user/tailors')}
                                className="px-3 py-1.5 bg-[#843D9B] hover:bg-[#6c3080] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                                All Tailors <ArrowRight size={11} />
                            </button>
                            <button
                                onClick={handleClearTailorFilter}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Clear Tailor Filter"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Compare by Category Section (only if browsing all tailors) */}
            {!activeTailorId && activeFilter === 'All' && !searchQuery && (
                <CategoryCompareSection categories={serviceCategories} />
            )}

            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                {activeTailorId
                    ? `Services by ${tailorName || 'Tailor'}`
                    : (activeFilter === 'All' && !searchQuery ? 'All Services' : `Results for ${searchQuery ? '"' + searchQuery + '"' : activeFilter}`)}
            </h2>
            {filteredServices.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                    <p className="text-gray-400 font-bold text-sm">No services found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredServices.map(service => (
                        <ServiceCard key={service._id} service={service} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ServicesGrid;
