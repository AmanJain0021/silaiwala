// Port of modules/customer/components/PopularTailors.jsx
import React, { useEffect } from 'react';
import { Star, MapPin, ChevronRight, ShieldCheck, BadgeCheck, Tag } from 'lucide-react-native';
import { useNavigate } from '../../lib/nav';
import useTailorStore from '../../store/tailorStore';
import useLocationStore from '../../store/locationStore';
import SafeImage from '../common/SafeImage';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { Box, Txt, Btn, I } from '../ui/primitives';

const PopularTailors = () => {
  const { tailors, fetchTailors, isLoading } = useTailorStore();
  const { coordinates } = useLocationStore();
  const { requireAuth } = useRequireAuth();
  const navigate = useNavigate();
  const lat = coordinates?.lat;
  const lng = coordinates?.lng;

  useEffect(() => {
    const params = { strictRadius: true };
    if (lat && lng) { params.lat = lat; params.lng = lng; }
    fetchTailors(params);
  }, [fetchTailors, lat, lng]);

  const open = (id) => {
    if (!requireAuth('Please login to view tailor shop details')) return;
    navigate(`/user/tailor/${id}`);
  };

  const safe = Array.isArray(tailors) ? tailors : [];
  const display = safe.slice(0, 4);
  if (isLoading && safe.length === 0) {
    return <Box className="px-4 py-8 text-center"><Txt className="text-gray-500 text-center">Finding best tailors...</Txt></Box>;
  }

  return (
    <Box className="px-4 py-1.5">
      <Box className="flex justify-between items-center mb-2.5">
        <Box className="flex-1">
          <Txt className="text-[19px] font-black text-gray-900 tracking-tight leading-none">Expert Tailors Near You</Txt>
          <Txt className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Stitching experts at your doorstep</Txt>
        </Box>
        <Btn onPress={() => navigate('/user/tailors')} className="text-xs font-black text-[#843D9B] bg-indigo-50 px-3 py-1.5 rounded-full border border-[#843D9B]/10">See All</Btn>
      </Box>
      <Box className="flex flex-col gap-4">
        {display.map((tailor) => (
          <Btn key={tailor._id} onPress={() => open(tailor._id)} className="flex flex-col gap-4 bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 relative text-left">
            <Box className="relative shrink-0">
              <Box className="h-48 w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                <SafeImage src={tailor.user?.profileImage} alt={tailor.shopName || 'Tailor Partner'} className="h-full w-full" />
              </Box>
            </Box>
            <Box className="flex-1 min-w-0 flex flex-col justify-between">
              <Box>
                <Box className="flex justify-between items-start mb-1 gap-2">
                  <Box className="flex-1 flex items-center gap-1.5 min-w-0">
                    <Txt className="text-lg font-black text-gray-900 leading-tight truncate">{tailor.shopName || 'Tailor Partner'}</Txt>
                    <I icon={BadgeCheck} size={20} color="#fff" fill="#3b82f6" />
                  </Box>
                  <Box className="bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1 shrink-0">
                    <I icon={ShieldCheck} size={12} color="#059669" />
                    <Txt className="text-[10px] font-black tracking-wider text-emerald-600">Top</Txt>
                  </Box>
                </Box>
                <Box className="flex flex-wrap items-center gap-2 mb-3">
                  <Box className="flex items-center gap-1">
                    <I icon={Star} size={14} color="#F59E0B" fill="#F59E0B" />
                    <Txt className="text-xs text-gray-500 font-medium">
                      <Txt className="font-bold text-gray-700">{tailor.rating || '5.0'}</Txt>
                      {` (${tailor.reviews || '90'} Reviews)`}
                    </Txt>
                  </Box>
                  <Box className="flex items-center gap-1">
                    <I icon={MapPin} size={12} color="#6b7280" />
                    <Txt className="text-xs text-gray-500 font-medium">{tailor.distance || '2.1 km away'}</Txt>
                  </Box>
                </Box>
                <Box className="bg-blue-50/70 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 mb-3 border border-blue-100/50">
                  <I icon={Tag} size={12} color="#2563eb" />
                  <Txt className="text-xs font-bold text-blue-600">Starts from ₹{tailor.basePrice || '299'}</Txt>
                </Box>
                <Txt className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{tailor.bio || 'Professional tailoring for all your needs - from everyday wear to special occasions.'}</Txt>
              </Box>
              <Box className="flex items-center gap-3 mt-auto">
                <Box className="bg-[#843D9B] py-2.5 px-6 rounded-xl shadow-sm shadow-purple-200 flex items-center justify-center gap-2 w-full">
                  <Txt className="text-white text-xs font-black tracking-wide">View Tailor</Txt>
                  <I icon={ChevronRight} size={14} color="#fff" />
                </Box>
              </Box>
            </Box>
          </Btn>
        ))}
      </Box>
    </Box>
  );
};

export default PopularTailors;
