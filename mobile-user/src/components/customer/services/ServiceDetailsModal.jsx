// Port of components/services/ServiceDetailsModal.jsx
import React, { useEffect, useState } from 'react';
import { X, Star, Clock, CheckCircle2, Tag, Scissors, ArrowRight } from 'lucide-react-native';
import { useNavigate } from '../../../lib/nav';
import api from '../../../lib/api';
import { getImageUrl } from '../../../utils/imageUrl';
import { Sheet } from '../../ui/Sheet';
import Spin from '../../ui/Spin';
import { Box, Txt, Btn, Img, I, Scroll } from '../../ui/primitives';

const PH = 'https://placehold.co/400x500/e6e8f0/843d9b/png?text=Service';

const ServiceDetailsModal = ({ service, isOpen, onClose, onBookNow }) => {
  const navigate = useNavigate();
  const [details, setDetails] = useState(service || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !service?._id) return undefined;
    setDetails(service);
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/services/${service._id}`, { noDedupe: true });
        if (!cancelled && res.data?.success && res.data?.data) setDetails(res.data.data);
      } catch (_) { /* keep list data */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, service?._id, service]);

  if (!service) return null;
  const data = details || service;
  const imageUrl = getImageUrl(data.image) || PH;
  const categoryName = typeof data.category === 'object' ? data.category?.name : data.category;
  const tailorName = data.tailor?.shopName || (typeof data.tailor === 'object' ? data.tailor?.name : null) || 'Tailor Partner';
  const styles = data.selectedStyles || [];
  const ranged = data.minPrice && data.maxPrice && data.minPrice !== data.maxPrice;

  return (
    <Sheet visible={!!isOpen} onClose={onClose} className="w-full bg-white rounded-t-3xl shadow-2xl" style={{ maxHeight: '92%' }}>
      <Box className="relative aspect-[4/3] bg-gray-100 shrink-0">
        <Img src={imageUrl} fallback={PH} alt={data.title} className="w-full h-full object-cover" />
        <Btn onPress={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-md">
          <I icon={X} size={18} color="#374151" />
        </Btn>
        {(data.rating || 0) >= 4.5 && <Txt className="absolute top-3 left-3 px-2 py-0.5 bg-primary text-white text-[9px] uppercase font-bold tracking-wider rounded">Popular</Txt>}
      </Box>
      <Scroll style={{ flexShrink: 1 }} contentClassName="px-4 py-4 space-y-4">
        {loading && (
          <Box className="flex items-center gap-2">
            <Spin size={14} color="#9ca3af" />
            <Txt className="text-[11px] font-bold text-gray-400">Loading details…</Txt>
          </Box>
        )}
        <Box className="flex items-start justify-between gap-3">
          <Box className="min-w-0 flex-1">
            <Txt className="text-lg font-black text-gray-900 leading-tight">{data.title}</Txt>
            {!!categoryName && <Txt className="text-[11px] font-bold text-gray-500 mt-1">{categoryName}</Txt>}
            {data.tailors && data.tailors.length > 1
              ? <Txt className="text-[11px] text-[#843D9B] font-bold mt-1">{data.tailors.length} Verified Tailors offering this service</Txt>
              : <Txt className="text-[11px] text-[#843D9B] font-bold mt-1">by {tailorName}</Txt>}
          </Box>
          <Box className="text-right shrink-0">
            <Txt className="text-[10px] text-gray-400 font-bold uppercase text-right">{ranged ? 'Starting from' : 'Price'}</Txt>
            <Txt className="text-xl font-black text-primary text-right">₹{data.minPrice || data.basePrice}{ranged ? ` - ₹${data.maxPrice}` : ''}</Txt>
          </Box>
        </Box>
        <Box className="flex flex-wrap gap-2">
          <Box className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-50">
            <I icon={Star} size={12} color="#facc15" fill="#facc15" />
            <Txt className="text-yellow-700 text-[10px] font-bold">{data.rating || '4.5'}{data.reviewsCount ? ` (${data.reviewsCount})` : ''}</Txt>
          </Box>
          <Box className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50">
            <I icon={Clock} size={12} color="#4338ca" />
            <Txt className="text-indigo-700 text-[10px] font-bold">Est. {data.deliveryTime || '2-4 Days'}</Txt>
          </Box>
          {data.isPickupAvailable !== false && (
            <Box className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50">
              <I icon={CheckCircle2} size={12} color="#15803d" />
              <Txt className="text-green-700 text-[10px] font-bold">Pickup Available</Txt>
            </Box>
          )}
        </Box>
        {data.tailors && data.tailors.length > 0 && (
          <Box>
            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tailors Offering This Service ({data.tailors.length})</Txt>
            <Box className="space-y-2">
              {data.tailors.map((t) => (
                <Box key={t.serviceId || t.tailorId} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Box className="min-w-0 flex-1 flex items-center gap-2.5">
                    <Box className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Txt className="text-primary font-bold text-xs">{t.tailorName?.[0] || 'T'}</Txt>
                    </Box>
                    <Box className="min-w-0 flex-1">
                      <Txt className="text-xs font-bold text-gray-900 truncate">{t.tailorName}</Txt>
                      <Box className="flex items-center gap-2">
                        <Box className="flex items-center gap-0.5">
                          <I icon={Star} size={10} color="#fbbf24" fill="#fbbf24" />
                          <Txt className="text-amber-600 font-bold text-[10px]">{t.rating ? Number(t.rating).toFixed(1) : '4.8'}</Txt>
                        </Box>
                        <Txt className="text-[10px] text-gray-500">•</Txt>
                        <Txt className="text-[10px] text-gray-500">{t.deliveryTime || '2-4 Days'}</Txt>
                      </Box>
                    </Box>
                  </Box>
                  <Box className="flex items-center gap-2 shrink-0">
                    <Txt className="text-sm font-black text-primary">₹{t.basePrice}</Txt>
                    <Btn onPress={() => { onClose(); navigate(`/user/services/${t.serviceId}`, { state: { tailorId: t.tailorId, tailorName: t.tailorName } }); }} className="px-2.5 py-1 bg-primary text-white rounded-lg text-[10px] font-bold">Select</Btn>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        {!!data.description && (
          <Box>
            <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">About this service</Txt>
            <Txt className="text-sm text-gray-700 leading-relaxed">{data.description}</Txt>
          </Box>
        )}
        {data.tags?.length > 0 && (
          <Box>
            <Box className="flex items-center gap-1 mb-2">
              <I icon={Tag} size={12} color="#9ca3af" />
              <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags</Txt>
            </Box>
            <Box className="flex flex-wrap gap-1.5">
              {data.tags.map((tag) => <Txt key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full">{tag}</Txt>)}
            </Box>
          </Box>
        )}
        {styles.length > 0 && (
          <Box>
            <Box className="flex items-center gap-1 mb-2">
              <I icon={Scissors} size={12} color="#9ca3af" />
              <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available styles</Txt>
            </Box>
            <Box className="grid grid-cols-2 gap-2">
              {styles.map((st) => (
                <Box key={st.name} className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                  {st.image ? <Img src={getImageUrl(st.image)} alt={st.name} className="w-full aspect-square object-cover" /> : null}
                  <Box className="p-2">
                    <Txt className="text-[11px] font-bold text-gray-900">{st.name}</Txt>
                    {!!st.description && <Txt className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{st.description}</Txt>}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Scroll>
      <Box className="shrink-0 p-4 border-t border-gray-100 bg-white flex gap-2">
        <Btn onPress={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700">Close</Btn>
        <Btn onPress={() => { onClose(); onBookNow?.(); }} className="flex-[1.4] py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-sm flex items-center justify-center gap-1">
          <Txt>{data.tailors && data.tailors.length > 1 ? 'Choose Tailor' : 'Book Now'}</Txt>
          <I icon={ArrowRight} size={16} />
        </Btn>
      </Box>
    </Sheet>
  );
};

export default ServiceDetailsModal;
