// Port of modules/customer/pages/CategoryServices.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Star, Clock, Users, Filter, ChevronDown, ShieldCheck } from 'lucide-react-native';
import { useParams, useNavigate } from '../lib/nav';
import api from '../lib/api';
import Screen from '../components/common/Screen';
import BottomNav from '../components/customer/BottomNav';
import Spin from '../components/ui/Spin';
import { Box, Txt, Btn, Img, I, Scroll } from '../components/ui/primitives';

const FALLBACK = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800';
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
    (async () => {
      setIsLoading(true);
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          api.get('/services', { params: { category: categoryId } }),
          api.get('/products/categories', { params: { type: 'service' } }),
        ]);
        if (servicesRes.data.success) setServices(servicesRes.data.data);
        if (categoriesRes.data.success) {
          const match = categoriesRes.data.data.find((c) => c._id === categoryId);
          if (match) setCategory(match);
        }
      } catch (_) { /* empty state */ } finally {
        setIsLoading(false);
      }
    })();
  }, [categoryId]);

  const sortedServices = useMemo(() => {
    const arr = [...services];
    const days = (s) => { const m = (s || '').match(/(\d+)/); return m ? parseInt(m[1], 10) : 999; };
    switch (sortBy) {
      case 'price_low': return arr.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
      case 'price_high': return arr.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
      case 'rating': return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'delivery': return arr.sort((a, b) => days(a.deliveryTime) - days(b.deliveryTime));
      default: return arr;
    }
  }, [services, sortBy]);

  if (isLoading) {
    return (
      <Screen className="bg-[#f3f9f8]">
        <Box className="flex-1 bg-gradient-to-b from-[#f3f9f8] to-[#e6f4f1] flex flex-col items-center justify-center p-6 text-center">
          <Spin size={40} color="#843D9B" style={{ marginBottom: 16 }} />
          <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading tailors for this service...</Txt>
        </Box>
      </Screen>
    );
  }

  return (
    <Screen className="bg-white" bottom={false}>
      <Box className="flex-1 bg-gradient-to-b from-[#f3f9f8] to-[#e6f4f1] font-sans">
        <Box className="z-30 bg-white/90 border-b border-gray-100 shadow-sm">
          <Box className="px-4 py-3 flex items-center gap-3">
            <Btn onPress={() => navigate(-1)} className="h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <I icon={ArrowLeft} size={18} color="#4b5563" />
            </Btn>
            <Box className="flex-1 min-w-0">
              <Txt className="text-base font-black text-gray-900 truncate">{category?.name || 'Service'}</Txt>
              <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Compare {sortedServices.length} tailor{sortedServices.length !== 1 ? 's' : ''}</Txt>
            </Box>
            <Box className="relative">
              <Btn onPress={() => setShowSortMenu(!showSortMenu)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                <I icon={Filter} size={13} color="#4b5563" />
                <Txt className="text-[10px] font-bold text-gray-600">Sort</Txt>
                <I icon={ChevronDown} size={12} color="#4b5563" className={showSortMenu ? 'rotate-180' : ''} />
              </Btn>
              {showSortMenu && (
                <Box className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[180px] z-40" style={{ elevation: 10 }}>
                  {SORT_OPTIONS.map((opt) => (
                    <Btn key={opt.value} onPress={() => { setSortBy(opt.value); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold ${sortBy === opt.value ? 'text-primary bg-primary/5' : 'text-gray-600'}`}>{opt.label}</Btn>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        <Scroll className="flex-1" contentClassName="pb-24">
          {category && category.minPrice != null && category.maxPrice != null && (
            <Box className="px-4 mt-4">
              <Box className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                {!!category.image && (
                  <Box className="h-14 w-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                    <Img src={category.image} fallback={FALLBACK} className="w-full h-full object-cover" />
                  </Box>
                )}
                <Box className="flex-1 min-w-0">
                  <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin-set price range</Txt>
                  <Txt className="text-lg font-black text-primary">₹{category.minPrice} – ₹{category.maxPrice}</Txt>
                  {!!category.description && <Txt className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">{category.description}</Txt>}
                </Box>
                {!!category.deliveryTime && (
                  <Box className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg shrink-0">
                    <I icon={Clock} size={12} color="#6b7280" />
                    <Txt className="text-[10px] font-bold text-gray-500">{category.deliveryTime}</Txt>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          <Box className="px-4 mt-4">
            {sortedServices.length === 0 ? (
              <Box className="items-center py-20 bg-white rounded-3xl border border-gray-100">
                <I icon={Users} size={48} color="#e5e7eb" style={{ marginBottom: 12 }} />
                <Txt className="text-gray-400 font-bold text-sm">No tailors offer this service yet.</Txt>
                <Txt className="text-gray-300 text-xs mt-1">Check back later or browse other categories.</Txt>
              </Box>
            ) : (
              <Box className="space-y-3">
                {sortedServices.map((service, index) => (
                  <Btn key={service._id} onPress={() => {
                    const tId = service.tailor?._id || service.tailorId || (typeof service.tailor === 'string' ? service.tailor : null);
                    const tName = service.tailor?.shopName || service.tailorName || 'Tailor Partner';
                    navigate(`/user/services/${service._id}`, { state: { tailorId: tId, tailorName: tName } });
                  }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
                    <Box className="flex">
                      <Box className="relative w-28 shrink-0 overflow-hidden bg-gray-50">
                        <Img src={service.image || 'https://images.unsplash.com/photo-1556760544-74c6974b89e0?w=400'} fallback={FALLBACK} className="w-full h-full object-cover" />
                        {index === 0 && sortBy === 'price_low' && <Txt className="absolute top-2 left-2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Best Price</Txt>}
                        {index === 0 && sortBy === 'rating' && <Txt className="absolute top-2 left-2 bg-yellow-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Top Rated</Txt>}
                      </Box>
                      <Box className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <Box>
                          <Box className="flex items-start justify-between gap-2">
                            <Txt className="text-sm font-black text-gray-900 truncate flex-1">{service.title}</Txt>
                            <Txt className="text-base font-black text-primary shrink-0">₹{service.basePrice}</Txt>
                          </Box>
                          {!!service.tailor && (
                            <Box className="flex items-center gap-2 mt-1.5">
                              <Box className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                {service.tailor.user?.profileImage
                                  ? <Img src={service.tailor.user.profileImage} className="w-full h-full object-cover" />
                                  : <Txt className="text-[8px] font-bold text-gray-500">{service.tailor.shopName?.[0] || '?'}</Txt>}
                              </Box>
                              <Txt className="text-[11px] font-bold text-gray-600 truncate">{service.tailor.shopName || 'Tailor Partner'}</Txt>
                              <I icon={ShieldCheck} size={12} color="#3b82f6" />
                            </Box>
                          )}
                          {!!service.description && <Txt className="text-[11px] text-gray-400 line-clamp-1 mt-1">{service.description}</Txt>}
                        </Box>
                        <Box className="flex items-center gap-3 mt-3 flex-wrap">
                          <Box className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                            <I icon={Star} size={11} color="#facc15" fill="#facc15" />
                            <Txt className="text-[10px] font-bold text-gray-400">{service.rating || '4.5'}</Txt>
                          </Box>
                          <Box className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                            <I icon={Clock} size={11} color="#9ca3af" />
                            <Txt className="text-[10px] font-bold text-gray-400">{service.deliveryTime || '5-7 days'}</Txt>
                          </Box>
                          {service.isPickupAvailable && <Txt className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Pickup Available</Txt>}
                        </Box>
                      </Box>
                    </Box>
                  </Btn>
                ))}
              </Box>
            )}
          </Box>
        </Scroll>
      </Box>
      <BottomNav />
    </Screen>
  );
};

export default CategoryServices;
