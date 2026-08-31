import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, Star, Loader2, Users, ArrowRight, X, Heart, Info, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import api from '../../../../utils/api';
import useUnifiedLocation from '../../../../shared/hooks/useUnifiedLocation';
import useCheckoutStore, { resolveTailorId } from '../../../../store/checkoutStore';
import ServiceDetailsModal from './ServiceDetailsModal';

const ServiceCard = ({ service }) => {
    const navigate = useNavigate();
    const location = useRouteLocation();
    const [showDetails, setShowDetails] = useState(false);
    const isPopular = (service.rating || 0) >= 4.5;
    const selectServiceIntoBasket = useCheckoutStore((s) => s.selectServiceIntoBasket);
    const serviceItems = useCheckoutStore((s) => s.serviceItems);

    const handleBookNow = () => {
        const store = useCheckoutStore.getState();
        const lock = store.ensureLockedTailor({
            tailorId: location.state?.tailorId,
            tailorName: location.state?.tailorName,
        });
        const hasBasket = (serviceItems?.length || 0) > 0;
        const tailorId = lock.tailorId || location.state?.tailorId;
        const tailorName = lock.tailorName || location.state?.tailorName;

        // Multi-item flow: selecting a service must appear in basket immediately
        if (hasBasket) {
            const { index, item, created, blocked } = selectServiceIntoBasket(service, { tailorId, tailorName });
            if (blocked) {
                import('react-hot-toast').then(({ toast }) => {
                    toast.error('Only services from the same tailor can be added to this order');
                });
                return;
            }
            if (created) {
                import('react-hot-toast').then(({ toast }) => {
                    toast.success(`Added to basket: ${service.title}`);
                });
            }
            navigate(`/user/services/${service._id}`, {
                state: {
                    tailorId,
                    tailorName,
                    fromMultiItemBasket: true,
                    editBasketIndex: index,
                    restoreBasketItem: item,
                    fromBasket: true,
                },
            });
            return;
        }

        navigate(`/user/services/${service._id}`, { state: location.state });
    };

    return (
        <>
        <div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-row sm:flex-col h-full"
        >
            <div className="relative w-2/5 sm:w-full aspect-[4/5] sm:aspect-[4/3] overflow-hidden bg-gray-100 shrink-0">
                <img
                    src={service.image || 'https://placehold.co/400x500/e6e8f0/843d9b?text=Service'}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x500/e6e8f0/843d9b?text=Service'; }}
                />
                <button className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors z-10" onClick={(e) => e.stopPropagation()}>
                    <Heart size={14} />
                </button>
                <div className="absolute bottom-2 left-2 bg-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm flex items-center gap-1 z-10">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    {service.rating || '4.8'}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
                {isPopular && (
                    <span className="self-start px-2 py-0.5 bg-primary text-white text-[8px] sm:text-[10px] uppercase font-bold tracking-wider rounded mb-1.5">
                        POPULAR
                    </span>
                )}
                <div className="flex justify-between items-start mb-0.5 gap-2">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-primary transition-colors line-clamp-1 flex-1">{service.title}</h3>
                    <span className="font-black text-primary text-sm sm:text-base shrink-0">₹{service.basePrice}</span>
                </div>

                <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 mb-2 flex-1">{service.description}</p>

                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>Est. {service.deliveryTime || '2-4 Days'}</span>
                    </div>
                    <span className="text-green-600 font-bold flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 size={10} /> Pickup Available
                    </span>
                </div>

                <div className="flex gap-1 flex-wrap mb-3">
                    {service.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-medium rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex gap-2 mt-auto">
                    <button
                        type="button"
                        onClick={() => setShowDetails(true)}
                        className="flex-1 py-1.5 sm:py-2 px-3 rounded-xl border border-gray-200 text-[10px] sm:text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Details
                    </button>
                    <button
                        type="button"
                        onClick={handleBookNow}
                        className="flex-[1.5] py-1.5 sm:py-2 px-3 rounded-xl bg-primary text-white text-[10px] sm:text-xs font-bold hover:bg-primary-dark shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                        Book Now <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        </div>

        <ServiceDetailsModal
            service={service}
            isOpen={showDetails}
            onClose={() => setShowDetails(false)}
            onBookNow={handleBookNow}
        />
        </>
    );
};

const CategoryCompareSection = ({ categories }) => {
    const navigate = useNavigate();
    const comparableCategories = categories;
    const [isExpanded, setIsExpanded] = useState(false);

    if (comparableCategories.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-gray-900">Compare Tailors by Category</h3>
                    <Info size={14} className="text-gray-400" />
                </div>
                {comparableCategories.length > 4 && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[10px] font-bold text-primary flex items-center gap-0.5"
                    >
                        {isExpanded ? 'View Less' : 'View All'} <ArrowRight size={10} className={`transition-transform ${isExpanded ? '-rotate-90' : ''}`} />
                    </button>
                )}
            </div>
            <p className="text-[10px] text-gray-500 font-medium mb-3">See all tailors & their prices for each service type</p>
            
            <div className={`transition-all duration-300 ${isExpanded ? 'grid grid-cols-3 sm:grid-cols-4 gap-3' : 'flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x'}`}>
                {comparableCategories.map(cat => (
                    <button
                        key={cat._id}
                        onClick={() => navigate(`/user/services/category/${cat._id}`)}
                        className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center hover:shadow-md transition-all flex flex-col items-center cursor-pointer group ${isExpanded ? 'w-full' : 'flex-shrink-0 w-24 sm:w-28 snap-start'}`}
                    >
                        <div className="h-14 w-14 sm:h-16 sm:w-16 mb-2 overflow-hidden shrink-0 rounded bg-gray-50">
                            <img
                                src={cat.image || 'https://placehold.co/150x150/e6e8f0/843d9b?text=Cat'}
                                alt={cat.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150/e6e8f0/843d9b?text=Cat'; }}
                            />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-black text-gray-900 mb-1 line-clamp-1 w-full">
                            {cat.name}
                        </span>
                        <div className="text-[9px] sm:text-[10px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded w-full line-clamp-1 text-center">
                            {cat.minPrice != null && cat.maxPrice != null 
                                ? `₹${cat.minPrice} - ₹${cat.maxPrice}` 
                                : 'View Prices'}
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
    const lockedTailorId = useCheckoutStore((s) => s.lockedTailorId);
    const lockedTailorName = useCheckoutStore((s) => s.lockedTailorName);
    const serviceItems = useCheckoutStore((s) => s.serviceItems);
    const basketCount = serviceItems?.length || 0;
    // Only lock tailor when user is actively building a multi-garment order
    const isMultiItemLock = basketCount > 0;

    const effectiveTailorId = isMultiItemLock
        ? resolveTailorId(
              lockedTailorId,
              routeLocation.state?.tailorId,
              serviceItems?.[0]?.serviceDetails
          ) || null
        : routeLocation.state?.tailorId
          ? String(routeLocation.state.tailorId)
          : null;
    const effectiveTailorName = isMultiItemLock
        ? lockedTailorName ||
          routeLocation.state?.tailorName ||
          serviceItems?.[0]?.serviceDetails?.tailorName ||
          ''
        : routeLocation.state?.tailorName || '';

    const [activeTailorId, setActiveTailorId] = useState(effectiveTailorId);
    const [tailorName, setTailorName] = useState(effectiveTailorName);
    const [sortBy, setSortBy] = useState('Popular');
    const [isSortOpen, setIsSortOpen] = useState(false);
    
    const sortOptions = ['Popular', 'Price: Low to High', 'Price: High to Low'];

    useEffect(() => {
        if (isMultiItemLock) {
            const lock = useCheckoutStore.getState().ensureLockedTailor({
                tailorId: routeLocation.state?.tailorId || effectiveTailorId,
                tailorName: routeLocation.state?.tailorName || effectiveTailorName,
            });
            const tid = lock.tailorId || effectiveTailorId;
            if (tid) {
                setActiveTailorId(tid);
                setTailorName(lock.tailorName || effectiveTailorName || 'Selected Tailor');
            }
            return;
        }
        if (routeLocation.state?.tailorId !== undefined) {
            setActiveTailorId(routeLocation.state?.tailorId || null);
            setTailorName(routeLocation.state?.tailorName || '');
            return;
        }
        if (!isMultiItemLock) {
            setActiveTailorId(null);
            setTailorName('');
        }
    }, [routeLocation.state, lockedTailorId, lockedTailorName, isMultiItemLock, effectiveTailorId, effectiveTailorName, basketCount]);

    const handleClearTailorFilter = () => {
        // Locked multi-item basket: cannot browse other tailors
        if (isMultiItemLock && (lockedTailorId || activeTailorId || effectiveTailorId)) {
            import('react-hot-toast').then(({ toast }) => {
                toast.error('Only this tailor’s services are available for this order');
            });
            return;
        }
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
                const tailorParam = isMultiItemLock
                    ? (activeTailorId || effectiveTailorId || undefined)
                    : (activeTailorId || undefined);
                const [servicesRes, catsRes] = await Promise.all([
                    api.get('/services', { params: { tailor: tailorParam } }),
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
    }, [activeTailorId, effectiveTailorId, isMultiItemLock]);

    const filteredServices = useMemo(() => {
        let result = services;

        // Hard client filter: multi-item order → only first item's tailor
        const lockId = isMultiItemLock ? (activeTailorId || effectiveTailorId) : null;
        if (lockId) {
            result = result.filter((s) => {
                const sid = resolveTailorId(s);
                return sid && String(sid) === String(lockId);
            });
        }

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

        // Apply Sort
        if (sortBy === 'Price: Low to High') {
            result = [...result].sort((a, b) => (a.basePrice || a.price || 0) - (b.basePrice || b.price || 0));
        } else if (sortBy === 'Price: High to Low') {
            result = [...result].sort((a, b) => (b.basePrice || b.price || 0) - (a.basePrice || a.price || 0));
        } else if (sortBy === 'Popular') {
            result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return result;
    }, [services, activeFilter, searchQuery, sortBy, isMultiItemLock, activeTailorId, effectiveTailorId]);

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
            {(activeTailorId || (isMultiItemLock && effectiveTailorId)) && (
                <div className="bg-white/95 backdrop-blur-xl border border-primary/15 rounded-2xl p-3 sm:p-4 shadow-sm mb-5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                            <Users size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-black text-primary uppercase tracking-wider block leading-none mb-0.5">
                                {isMultiItemLock ? 'Same tailor only' : 'Tailor Catalog'}
                            </span>
                            <h3 className="text-xs sm:text-sm font-black text-gray-900 truncate">
                                Services by <span className="text-primary">{tailorName || effectiveTailorName || 'Selected Tailor'}</span>
                            </h3>
                            {isMultiItemLock ? (
                                <p className="text-[9px] text-gray-500 font-medium mt-0.5">
                                    Showing only this tailor — same as your first basket item
                                </p>
                            ) : (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <button
                                        onClick={handleClearTailorFilter}
                                        className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                                    >
                                        Browse all
                                    </button>
                                    <button
                                        onClick={() => navigate('/user/tailors')}
                                        className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                    >
                                        Tailors <ArrowRight size={11} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Compare by Category Section (only if browsing all tailors) */}
            {!activeTailorId && activeFilter === 'All' && !searchQuery && (
                <CategoryCompareSection categories={serviceCategories} />
            )}

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">
                    {activeTailorId
                        ? `Services by ${tailorName || 'Tailor'}`
                        : (activeFilter === 'All' && !searchQuery ? 'All Services' : `Results for ${searchQuery ? '"' + searchQuery + '"' : activeFilter}`)}
                </h2>
                {!activeTailorId && activeFilter === 'All' && !searchQuery && (
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 relative">
                        <span>Sort by</span>
                        <button 
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="flex items-center gap-1 font-bold text-gray-900 border border-gray-200 rounded-md px-2 py-1 bg-white shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            {sortBy} <ChevronDown size={14} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isSortOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                                <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                                    {sortOptions.map(option => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setSortBy(option);
                                                setIsSortOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${sortBy === option ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
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
