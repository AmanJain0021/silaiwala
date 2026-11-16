// Port of components/services/ServicesGrid.jsx (grouping/filter/sort logic copied verbatim)
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle2, Star, Users, ArrowRight, Heart, Info, ChevronDown } from 'lucide-react-native';
import { useNavigate, useLocation as useRouteLocation } from '../../../lib/nav';
import api from '../../../lib/api';
import toast from '../../../lib/toast';
import useUnifiedLocation from '../../../shared/hooks/useUnifiedLocation';
import useCheckoutStore, { resolveTailorId, resolveTailorName } from '../../../store/checkoutStore';
import ServiceDetailsModal from './ServiceDetailsModal';
import SelectTailorModal from './SelectTailorModal';
import Spin from '../../ui/Spin';
import { Box, Txt, Btn, Img, I, Scroll } from '../../ui/primitives';

const PH = 'https://placehold.co/400x500/e6e8f0/843d9b/png?text=Service';
const PH_CAT = 'https://placehold.co/150x150/e6e8f0/843d9b/png?text=Cat';

const ServiceCard = ({ service, onSelectTailor, isGrouped = false }) => {
  const navigate = useNavigate();
  const location = useRouteLocation();
  const [showDetails, setShowDetails] = useState(false);
  const isPopular = (service.rating || 0) >= 4.5;

  const handleAction = () => {
    if (isGrouped) {
      onSelectTailor?.(service);
    } else {
      const serviceTailorId = resolveTailorId(service.tailor, service.tailorId, service) || location.state?.tailorId || null;
      const serviceTailorName = resolveTailorName(service.tailor, service.tailorName, service) || location.state?.tailorName || 'Tailor Partner';
      navigate(`/user/services/${service._id}`, { state: { ...location.state, tailorId: serviceTailorId, tailorName: serviceTailorName } });
    }
  };

  const tailorsCount = service.tailors?.length || 0;
  const priceDisplay = isGrouped
    ? (service.minPrice === service.maxPrice || !service.maxPrice ? `₹${service.minPrice}` : `₹${service.minPrice} - ₹${service.maxPrice}`)
    : `₹${service.basePrice || service.price || 0}`;

  return (
    <>
      <Btn onPress={handleAction} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-row text-left">
        <Box className="relative w-2/5 aspect-[4/5] overflow-hidden bg-gray-100 shrink-0">
          <Img src={service.image || PH} fallback={PH} alt={service.title} className="w-full h-full object-cover" />
          <Btn className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm z-10" onPress={() => {}}>
            <I icon={Heart} size={14} color="#9ca3af" />
          </Btn>
          <Box className="absolute bottom-2 left-2 bg-white/95 px-2 py-0.5 rounded shadow-sm flex items-center gap-1 z-10">
            <I icon={Star} size={10} color="#facc15" fill="#facc15" />
            <Txt className="text-[10px] font-bold">{service.rating ? Number(service.rating).toFixed(1) : '4.8'}</Txt>
          </Box>
          {isGrouped && tailorsCount > 0 && (
            <Box className="absolute top-2 left-2 bg-black/65 px-2 py-0.5 rounded-full flex items-center gap-1 z-10 shadow-sm">
              <I icon={Users} size={10} color="#fff" />
              <Txt className="text-white text-[9px] font-bold">{tailorsCount} {tailorsCount === 1 ? 'Tailor' : 'Tailors'}</Txt>
            </Box>
          )}
        </Box>
        <Box className="p-3 flex flex-col flex-1 min-w-0">
          {isPopular && <Txt className="self-start px-2 py-0.5 bg-primary text-white text-[8px] uppercase font-bold tracking-wider rounded mb-1.5">POPULAR</Txt>}
          <Box className="flex justify-between items-start mb-0.5 gap-2">
            <Txt onPress={handleAction} className="font-bold text-gray-900 text-sm line-clamp-1 flex-1">{service.title}</Txt>
            <Box className="items-end shrink-0">
              {isGrouped && service.minPrice !== service.maxPrice && <Txt className="text-[8px] text-gray-400 font-bold uppercase leading-none">Starts from</Txt>}
              <Txt className="font-black text-primary text-sm">{priceDisplay}</Txt>
            </Box>
          </Box>
          <Txt className="text-[10px] text-gray-500 line-clamp-2 mb-2">{service.description}</Txt>
          <Box className="flex items-center gap-2 mb-2 flex-wrap">
            <Box className="flex items-center gap-1">
              <I icon={Clock} size={10} color="#6b7280" />
              <Txt className="text-[9px] text-gray-500">Est. {service.deliveryTime || '2-4 Days'}</Txt>
            </Box>
            {isGrouped ? (
              <Box className="flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded">
                <I icon={Users} size={10} color="#843D9B" />
                <Txt className="text-primary font-bold text-[9px]">{tailorsCount} {tailorsCount === 1 ? 'Tailor' : 'Tailors'}</Txt>
              </Box>
            ) : (
              <Box className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                <I icon={CheckCircle2} size={10} color="#16a34a" />
                <Txt className="text-green-600 font-bold text-[9px]">Pickup Available</Txt>
              </Box>
            )}
          </Box>
          {service.tags && service.tags.length > 0 && (
            <Box className="flex gap-1 flex-wrap mb-3">
              {service.tags.slice(0, 3).map((tag) => <Txt key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-medium rounded-full">{tag}</Txt>)}
            </Box>
          )}
          <Box className="flex gap-2 mt-auto">
            <Btn onPress={() => setShowDetails(true)} className="flex-1 py-1.5 px-3 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-700">Details</Btn>
            <Btn onPress={handleAction} className="flex-[1.5] py-1.5 px-3 rounded-xl bg-primary text-white text-[10px] font-bold shadow-sm flex items-center justify-center gap-1">
              <Txt>{isGrouped ? 'Select Tailor' : 'Book Now'}</Txt>
              <I icon={ArrowRight} size={12} />
            </Btn>
          </Box>
        </Box>
      </Btn>
      <ServiceDetailsModal service={service} isOpen={showDetails} onClose={() => setShowDetails(false)} onBookNow={handleAction} />
    </>
  );
};

const CategoryCompareSection = ({ categories }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  if (categories.length === 0) return null;
  const card = (cat, wide) => (
    <Btn key={cat._id} onPress={() => navigate(`/user/services/category/${cat._id}`)} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col items-center ${wide ? 'w-full' : 'shrink-0 w-24'}`}>
      <Box className="h-14 w-14 mb-2 overflow-hidden shrink-0 rounded bg-gray-50">
        <Img src={cat.image || PH_CAT} fallback={PH_CAT} alt={cat.name} className="w-full h-full object-contain" />
      </Box>
      <Txt className="text-[10px] font-black text-gray-900 mb-1 line-clamp-1 w-full text-center">{cat.name}</Txt>
      <Txt className="text-[9px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded w-full line-clamp-1 text-center">
        {cat.minPrice != null && cat.maxPrice != null ? `₹${cat.minPrice} - ₹${cat.maxPrice}` : 'View Prices'}
      </Txt>
    </Btn>
  );
  return (
    <Box className="mb-6">
      <Box className="flex items-center justify-between mb-1">
        <Box className="flex items-center gap-1.5">
          <Txt className="text-sm font-black text-gray-900">Compare Tailors by Category</Txt>
          <I icon={Info} size={14} color="#9ca3af" />
        </Box>
        {categories.length > 4 && (
          <Btn onPress={() => setIsExpanded(!isExpanded)} className="text-[10px] font-bold text-primary flex items-center gap-0.5">
            <Txt>{isExpanded ? 'View Less' : 'View All'}</Txt>
            <I icon={ArrowRight} size={10} className={isExpanded ? '-rotate-90' : ''} />
          </Btn>
        )}
      </Box>
      <Txt className="text-[10px] text-gray-500 font-medium mb-3">See all tailors & their prices for each service type</Txt>
      {isExpanded ? (
        <Box className="grid grid-cols-3 gap-3">{categories.map((c) => card(c, true))}</Box>
      ) : (
        <Scroll horizontal className="-mx-4" contentClassName="flex gap-3 pb-2 px-4">{categories.map((c) => card(c, false))}</Scroll>
      )}
    </Box>
  );
};

const ServicesGrid = ({ searchQuery = '', activeFilter = 'All' }) => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { location = {} } = useUnifiedLocation({ autoDetect: true, fetchAddress: false });
  const { lat, lng } = location || {};
  const routeLocation = useRouteLocation();
  const lockedTailorId = useCheckoutStore((s) => s.lockedTailorId);
  const lockedTailorName = useCheckoutStore((s) => s.lockedTailorName);
  const serviceItems = useCheckoutStore((s) => s.serviceItems);
  const basketCount = serviceItems?.length || 0;
  const isMultiItemLock = basketCount > 0;

  const effectiveTailorId = isMultiItemLock
    ? resolveTailorId(lockedTailorId, routeLocation.state?.tailorId, serviceItems?.[0]?.serviceDetails) || null
    : routeLocation.state?.tailorId ? String(routeLocation.state.tailorId) : null;
  const effectiveTailorName = isMultiItemLock
    ? lockedTailorName || routeLocation.state?.tailorName || serviceItems?.[0]?.serviceDetails?.tailorName || ''
    : routeLocation.state?.tailorName || '';

  const [activeTailorId, setActiveTailorId] = useState(effectiveTailorId);
  const [tailorName, setTailorName] = useState(effectiveTailorName);
  const [sortBy, setSortBy] = useState('Popular');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedServiceForTailor, setSelectedServiceForTailor] = useState(null);
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
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


  const clearCheckout = useCheckoutStore((s) => s.clearCheckout);

  const handleResetBasketAndBrowseAll = () => {
    clearCheckout();
    setActiveTailorId(null);
    setTailorName('');
    navigate('/user/services', { replace: true, state: {} });
    toast.success('Basket reset. Browsing all tailor services.');
  };

  const handleClearTailorFilter = () => {
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


    // Canonical normalizer to ensure services are grouped strictly once and never duplicate
    const getServiceCanonicalInfo = (s) => {
        const rawTitle = (s.title || '').trim();
        const rawCat = (s.category?.name || (typeof s.category === 'string' ? s.category : '')).trim();
        const titleLower = rawTitle.toLowerCase();
        const catLower = rawCat.toLowerCase();

        // Specific garment type matches so identical services across different categories never duplicate
        if (titleLower.includes('shalwar') || catLower.includes('shalwar')) {
            return {
                key: 'canonical_suit_with_shalwar',
                title: 'Suit with Shalwar',
                gender: 'women',
                defaultDelivery: '2-4 Days',
                description: 'Custom tailored salwar suit with perfect fit & stitching.',
            };
        }
        if (titleLower.includes('pant') || catLower.includes('pant')) {
            return {
                key: 'canonical_suit_with_pants',
                title: 'Suit with Pants',
                gender: 'women',
                defaultDelivery: '2-4 Days',
                description: 'Tailored suit paired with comfortable straight or cigarette pants.',
            };
        }
        if (titleLower.includes('kurti') || catLower.includes('kurti')) {
            return {
                key: 'canonical_kurti',
                title: 'Kurti',
                gender: 'women',
                defaultDelivery: '2-3 Days',
                description: 'Designer daily & festive kurti stitching with modern cuts.',
            };
        }
        if (titleLower.includes('kurta') || catLower.includes('kurta')) {
            return {
                key: 'canonical_kurta',
                title: 'Kurta',
                gender: 'men',
                defaultDelivery: '2-4 Days',
                description: 'Classic & modern fit custom stitched kurta.',
            };
        }
        if (titleLower.includes('pajama') || catLower.includes('pajama')) {
            return {
                key: 'canonical_pajama',
                title: 'Pajama',
                gender: 'all',
                defaultDelivery: '2-3 Days',
                description: 'Custom stitched comfort pajama & churidar.',
            };
        }
        if (titleLower.includes('blouse') || catLower.includes('blouse')) {
            return {
                key: 'canonical_blouse',
                title: 'Blouse',
                gender: 'women',
                defaultDelivery: '2-4 Days',
                description: 'Expert saree & lehenga blouse stitching with customized necklines.',
            };
        }
        if (titleLower.includes('lehenga') || catLower.includes('lehenga')) {
            return {
                key: 'canonical_bridal_lehenga',
                title: 'Bridal Lehenga',
                gender: 'bridal',
                defaultDelivery: '5-7 Days',
                description: 'Luxurious bridal & festive lehenga choli custom stitching.',
            };
        }
        if (titleLower.includes('suit') || catLower.includes('suit')) {
            return {
                key: 'canonical_simple_suit',
                title: 'Simple Suit',
                gender: 'all',
                defaultDelivery: '3-5 Days',
                description: 'Daily wear tailored suit with precision measurements.',
            };
        }

        // Fallback: group by category._id if available, or normalized title
        if (s.category?._id) {
            return {
                key: `cat_${s.category._id}`,
                title: rawCat || rawTitle,
                gender: s.category.gender || 'all',
                defaultDelivery: '2-4 Days',
                description: s.category.description || s.description,
            };
        }

        return {
            key: `title_${titleLower || 'other'}`,
            title: rawTitle || rawCat || 'Custom Tailoring',
            gender: 'all',
            defaultDelivery: '2-4 Days',
            description: s.description || 'Custom tailoring service.',
        };
    };

    // Group services into unique service items when browsing all tailors
    const groupedServices = useMemo(() => {
        // If viewing services of a specific tailor, do NOT group
        if (activeTailorId) return services;

        const map = new Map();
        for (const s of services) {
            const canonical = getServiceCanonicalInfo(s);
            const groupKey = canonical.key;

            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    _id: s._id,
                    key: groupKey,
                    categoryId: s.category?._id || null,
                    title: canonical.title,
                    description: canonical.description || s.category?.description || s.description,
                    image: s.category?.image && s.category.image !== 'no-photo.jpg' && !s.category.image.includes('placehold') ? s.category.image : s.image,
                    tags: Array.from(new Set([...(s.tags || []), ...(s.category?.tags || [])])),
                    category: s.category,
                    gender: canonical.gender || s.category?.gender || 'all',
                    minPrice: s.basePrice || s.price || 0,
                    maxPrice: s.basePrice || s.price || 0,
                    deliveryTime: s.deliveryTime || canonical.defaultDelivery,
                    rating: s.rating || 4.8,
                    reviewsCount: s.reviewsCount || 0,
                    tailors: [],
                    services: [],
                });
            }

            const group = map.get(groupKey);
            const price = s.basePrice || s.price || 0;
            if (group.minPrice === 0 || price < group.minPrice) group.minPrice = price;
            if (price > group.maxPrice) group.maxPrice = price;

            // Prefer valid real image over placeholder
            if ((!group.image || group.image.includes('placehold') || group.image === 'no-photo.jpg') && s.image && !s.image.includes('placehold') && s.image !== 'no-photo.jpg') {
                group.image = s.image;
            }

            const tailorId = s.tailor?._id || s.tailor;
            if (tailorId) {
                const tidStr = String(tailorId);
                const existingIdx = group.tailors.findIndex(t => String(t.tailorId) === tidStr);
                const tailorEntry = {
                    serviceId: s._id,
                    tailorId: tidStr,
                    tailorName: s.tailor?.shopName || s.tailor?.user?.name || s.tailorName || 'Tailor Partner',
                    tailorImage: s.tailor?.user?.profileImage || s.tailor?.shopImage || '',
                    rating: s.tailor?.rating || s.rating || 4.8,
                    reviewsCount: s.tailor?.reviewsCount || s.reviewsCount || 0,
                    basePrice: price,
                    deliveryTime: s.deliveryTime || canonical.defaultDelivery,
                    isPickupAvailable: s.isPickupAvailable !== false,
                    location: s.tailor?.location,
                    rawService: s,
                };

                if (existingIdx >= 0) {
                    if (price < group.tailors[existingIdx].basePrice) {
                        group.tailors[existingIdx] = tailorEntry;
                    }
                } else {
                    group.tailors.push(tailorEntry);
                }
            }

            group.services.push(s);
        }

        return Array.from(map.values());
    }, [services, activeTailorId]);

    const filteredServices = useMemo(() => {
        let result = groupedServices;

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
            if (s.gender) return s.gender.toLowerCase();
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
                result = result.filter(s => (s.minPrice || s.basePrice || s.price || 0) < 500);
            } else if (activeFilter === 'Express Delivery') {
                result = result.filter(s => (s.deliveryTime || '').includes('2-4') || (s.deliveryTime || '').includes('1-2'));
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
                (s.tags || []).some(tag => (tag || '').toLowerCase().includes(query)) ||
                (s.tailors || []).some(t => (t.tailorName || '').toLowerCase().includes(query))
            );
        }

        // Apply Sort
        if (sortBy === 'Price: Low to High') {
            result = [...result].sort((a, b) => (a.minPrice || a.basePrice || a.price || 0) - (b.minPrice || b.basePrice || b.price || 0));
        } else if (sortBy === 'Price: High to Low') {
            result = [...result].sort((a, b) => (b.maxPrice || b.basePrice || b.price || 0) - (a.maxPrice || a.basePrice || a.price || 0));
        } else if (sortBy === 'Popular') {
            result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return result;
    }, [groupedServices, activeFilter, searchQuery, sortBy, isMultiItemLock, activeTailorId, effectiveTailorId]);


  if (isLoading) {
    return (
      <Box className="p-12 flex flex-col items-center justify-center gap-3">
        <Spin color="#843D9B" />
        <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cataloging Services...</Txt>
      </Box>
    );
  }

  const browsingAll = !activeTailorId && activeFilter === 'All' && !searchQuery;

  return (
    <Box className="p-4">
      {(activeTailorId || (isMultiItemLock && effectiveTailorId)) && (
        <Box className="bg-white/95 border border-primary/15 rounded-2xl p-3 shadow-sm mb-5">
          <Box className="flex items-center gap-2.5 min-w-0">
            <Box className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <I icon={Users} size={16} color="#843D9B" />
            </Box>
            <Box className="min-w-0 flex-1">
              <Txt className="text-[8px] font-black text-primary uppercase tracking-wider leading-none mb-0.5">{isMultiItemLock ? 'Same tailor only' : 'Tailor Catalog'}</Txt>
              <Txt className="text-xs font-black text-gray-900 truncate">
                {'Services by '}
                <Txt className="text-primary">{tailorName || effectiveTailorName || 'Selected Tailor'}</Txt>
              </Txt>
              {isMultiItemLock ? (
                <Box className="mt-2">
                  <Txt className="text-[9px] text-gray-500 font-medium">Showing only this tailor — matching your basket</Txt>
                  <Box className="flex items-center gap-1.5 mt-2">
                    <Btn onPress={handleResetBasketAndBrowseAll} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">Clear Basket & Browse All</Btn>
                    <Btn onPress={() => navigate('/user/checkout/summary')} className="px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 whitespace-nowrap">
                      <Txt>View Basket</Txt>
                      <I icon={ArrowRight} size={11} />
                    </Btn>
                  </Box>
                </Box>
              ) : (
                <Box className="flex items-center gap-1.5 mt-2">
                  <Btn onPress={handleClearTailorFilter} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">Browse all</Btn>
                  <Btn onPress={() => navigate('/user/tailors')} className="px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 whitespace-nowrap">
                    <Txt>Tailors</Txt>
                    <I icon={ArrowRight} size={11} />
                  </Btn>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {browsingAll && <CategoryCompareSection categories={serviceCategories} />}

      <Box className="flex items-center justify-between mb-4 z-50">
        <Txt className="text-lg font-black text-gray-900 flex-1">
          {activeTailorId ? `Services by ${tailorName || 'Tailor'}` : (activeFilter === 'All' && !searchQuery ? 'All Services' : `Results for ${searchQuery ? `"${searchQuery}"` : activeFilter}`)}
        </Txt>
        {browsingAll && (
          <Box className="flex items-center gap-2 relative">
            <Txt className="text-[10px] font-medium text-gray-500">Sort by</Txt>
            <Btn onPress={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-1 border border-gray-200 rounded-md px-2 py-1 bg-white shadow-sm">
              <Txt className="text-[10px] font-bold text-gray-900">{sortBy}</Txt>
              <I icon={ChevronDown} size={14} color="#111827" className={isSortOpen ? 'rotate-180' : ''} />
            </Btn>
            {isSortOpen && (
              <Box className="absolute top-full right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden py-1" style={{ elevation: 8 }}>
                {sortOptions.map((option) => (
                  <Btn key={option} onPress={() => { setSortBy(option); setIsSortOpen(false); }} className={`w-full text-left px-3 py-2 text-xs font-bold ${sortBy === option ? 'bg-primary/5 text-primary' : 'text-gray-700'}`}>{option}</Btn>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {filteredServices.length === 0 ? (
        <Box className="py-20 bg-white rounded-3xl border border-gray-100 items-center">
          <Txt className="text-gray-400 font-bold text-sm">No services found.</Txt>
        </Box>
      ) : (
        <Box className="flex flex-col gap-4">
          {filteredServices.map((service) => (
            <ServiceCard key={service.key || service._id} service={service} isGrouped={!activeTailorId}
              onSelectTailor={(srv) => { setSelectedServiceForTailor(srv); setIsTailorModalOpen(true); }} />
          ))}
        </Box>
      )}

      <SelectTailorModal isOpen={isTailorModalOpen} onClose={() => { setIsTailorModalOpen(false); setSelectedServiceForTailor(null); }} serviceGroup={selectedServiceForTailor} userLocation={{ lat, lng }} />
    </Box>
  );
};

export default ServicesGrid;
