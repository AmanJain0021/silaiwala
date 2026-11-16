// Port of components/services/SelectTailorModal.jsx
import React, { useState, useMemo } from 'react';
import { X, Star, Clock, CheckCircle2, ShieldCheck, MapPin, ArrowRight, Sparkles, Store } from 'lucide-react-native';
import { useNavigate } from '../../../lib/nav';
import { calculateDistance } from '../../../utils/distance';
import { getImageUrl } from '../../../utils/imageUrl';
import { Sheet } from '../../ui/Sheet';
import { Box, Txt, Btn, Img, I, Scroll } from '../../ui/primitives';

const PH = 'https://placehold.co/150x150/e6e8f0/843d9b/png?text=Service';
const SORTS = [['recommended', 'Recommended'], ['price_low', 'Price: Low to High'], ['rating', 'Highest Rated']];

const SelectTailorModal = ({ isOpen, onClose, serviceGroup, userLocation = null }) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('recommended');
  const userLat = userLocation?.lat;
  const userLng = userLocation?.lng;

  const tailorsWithMeta = useMemo(() => {
    if (!serviceGroup?.tailors) return [];
    return serviceGroup.tailors.map((t) => {
      let distanceKm = null;
      if (userLat && userLng && t.location?.coordinates?.length === 2) {
        const d = calculateDistance(userLat, userLng, t.location.coordinates[1], t.location.coordinates[0]);
        if (!Number.isNaN(d) && d > 0) distanceKm = parseFloat(d.toFixed(1));
      }
      return { ...t, distanceKm };
    });
  }, [serviceGroup, userLat, userLng]);

  const sortedTailors = useMemo(() => {
    const list = [...tailorsWithMeta];
    switch (sortBy) {
      case 'price_low': return list.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
      case 'price_high': return list.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
      case 'rating': return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'distance': return list.sort((a, b) => (a.distanceKm == null ? 1 : b.distanceKm == null ? -1 : a.distanceKm - b.distanceKm));
      default: return list.sort((a, b) => ((b.rating || 4.5) * 100 - (b.basePrice || 0) * 0.05) - ((a.rating || 4.5) * 100 - (a.basePrice || 0) * 0.05));
    }
  }, [tailorsWithMeta, sortBy]);

  if (!serviceGroup) return null;
  const select = (t) => {
    onClose();
    navigate(`/user/services/${t.serviceId}`, { state: { tailorId: t.tailorId, tailorName: t.tailorName } });
  };
  const hasDistance = tailorsWithMeta.some((t) => t.distanceKm != null);
  const sorts = hasDistance ? [...SORTS, ['distance', 'Nearest']] : SORTS;

  return (
    <Sheet visible={!!isOpen} onClose={onClose} className="w-full bg-white rounded-t-3xl shadow-2xl" style={{ maxHeight: '92%' }}>
      <Box className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50/60 via-white to-pink-50/40 relative">
        <Box className="flex items-center gap-3">
          <Box className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm shrink-0">
            <Img src={getImageUrl(serviceGroup.image) || PH} fallback={PH} className="w-full h-full object-cover" />
          </Box>
          <Box className="flex-1 min-w-0">
            <Box className="flex items-center gap-2">
              <Box className="bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <I icon={Sparkles} size={11} color="#843D9B" />
                <Txt className="text-[10px] font-black uppercase tracking-wider text-primary">Choose Tailor</Txt>
              </Box>
              <Txt className="text-[10px] font-bold text-gray-500">{sortedTailors.length} tailor{sortedTailors.length !== 1 ? 's' : ''} available</Txt>
            </Box>
            <Txt className="text-base font-black text-gray-900 truncate mt-0.5">{serviceGroup.title}</Txt>
            <Txt className="text-[11px] text-gray-500 line-clamp-1">Select a verified tailor who provides this service to order</Txt>
          </Box>
          <Btn onPress={onClose} className="p-2 rounded-xl bg-gray-100 shrink-0" accessibilityLabel="Close">
            <I icon={X} size={18} color="#6b7280" />
          </Btn>
        </Box>
        {sortedTailors.length > 1 && (
          <Scroll horizontal className="mt-3 pt-1" contentClassName="flex items-center gap-1.5">
            <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Sort:</Txt>
            {sorts.map(([id, label]) => (
              <Btn key={id} onPress={() => setSortBy(id)} className={`px-3 py-1 rounded-xl text-[10px] font-bold shrink-0 ${sortBy === id ? 'bg-primary text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600'}`}>{label}</Btn>
            ))}
          </Scroll>
        )}
      </Box>
      <Scroll style={{ flexShrink: 1 }} className="bg-gray-50/50" contentClassName="p-4 space-y-3">
        {sortedTailors.length === 0 ? (
          <Box className="items-center py-12 px-4 bg-white rounded-2xl border border-gray-100">
            <I icon={Store} size={40} color="#d1d5db" style={{ marginBottom: 8 }} />
            <Txt className="text-sm font-bold text-gray-700 text-center">No tailors available</Txt>
            <Txt className="text-xs text-gray-400 mt-1 text-center">No tailors are currently offering this service. Please check back later.</Txt>
          </Box>
        ) : sortedTailors.map((t, idx) => {
          const isCheapest = idx === 0 && sortBy === 'price_low';
          const isTopRated = (t.rating || 0) >= 4.7;
          return (
            <Btn key={t.serviceId || t.tailorId} onPress={() => select(t)} className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm text-left">
              <Box className="flex items-center gap-3">
                <Box className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center shrink-0 border border-primary/10">
                  {t.tailorImage ? <Img src={getImageUrl(t.tailorImage)} className="w-full h-full object-cover rounded-2xl" /> : <Txt className="text-base font-black text-primary">{t.tailorName?.[0]?.toUpperCase() || 'T'}</Txt>}
                  <Box className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <I icon={ShieldCheck} size={14} color="#3b82f6" fill="#eff6ff" />
                  </Box>
                </Box>
                <Box className="flex-1 min-w-0">
                  <Box className="flex items-center gap-1.5 flex-wrap">
                    <Txt className="text-sm font-bold text-gray-900 truncate">{t.tailorName}</Txt>
                    {isCheapest && <Txt className="text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Lowest Price</Txt>}
                    {isTopRated && <Txt className="text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Top Rated</Txt>}
                  </Box>
                  <Box className="flex items-center gap-2 mt-1 flex-wrap">
                    <Box className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded">
                      <I icon={Star} size={11} color="#fbbf24" fill="#fbbf24" />
                      <Txt className="font-bold text-amber-600 text-[10px]">{t.rating ? Number(t.rating).toFixed(1) : '4.8'}</Txt>
                      {t.reviewsCount ? <Txt className="text-gray-400 text-[10px]">({t.reviewsCount})</Txt> : null}
                    </Box>
                    <Box className="flex items-center gap-1">
                      <I icon={Clock} size={11} color="#9ca3af" />
                      <Txt className="text-[10px] text-gray-500">{t.deliveryTime || '2-4 Days'}</Txt>
                    </Box>
                    {t.distanceKm != null && (
                      <Box className="flex items-center gap-1">
                        <I icon={MapPin} size={11} color="#843D9B" />
                        <Txt className="text-[10px] text-primary font-semibold">{t.distanceKm} km away</Txt>
                      </Box>
                    )}
                    {t.isPickupAvailable && (
                      <Box className="flex items-center gap-0.5">
                        <I icon={CheckCircle2} size={10} color="#059669" />
                        <Txt className="text-[10px] text-emerald-600 font-semibold">Pickup</Txt>
                      </Box>
                    )}
                  </Box>
                </Box>
                <Box className="flex flex-col items-end shrink-0 pl-2">
                  <Txt className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Price</Txt>
                  <Txt className="text-base font-black text-primary leading-tight">₹{t.basePrice}</Txt>
                  <Btn onPress={() => select(t)} className="mt-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-bold shadow-sm flex items-center gap-1">
                    <Txt>Select</Txt>
                    <I icon={ArrowRight} size={12} />
                  </Btn>
                </Box>
              </Box>
            </Btn>
          );
        })}
      </Scroll>
      <Box className="p-3 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
        <Txt className="text-[11px] font-medium text-gray-500 flex-1">Stitching price varies by tailor expertise & delivery time.</Txt>
        <Btn onPress={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 shrink-0">Cancel</Btn>
      </Box>
    </Sheet>
  );
};

export default SelectTailorModal;
