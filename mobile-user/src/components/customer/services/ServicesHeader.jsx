// Port of components/services/ServicesHeader.jsx
import React, { useState, useEffect } from 'react';
import { Filter, ArrowLeft, Bell, LayoutGrid, Star, Tag, Zap } from 'lucide-react-native';
import { useNavigate } from '../../../lib/nav';
import api from '../../../lib/api';
import useCheckoutStore from '../../../store/checkoutStore';
import AnimatedSearchBar from '../AnimatedSearchBar';
import { Box, Txt, Btn, I, Scroll } from '../../ui/primitives';

const ServicesHeader = ({ searchQuery, setSearchQuery, activeFilter, setActiveFilter }) => {
  const navigate = useNavigate();
  const basketCount = useCheckoutStore((s) => s.serviceItems?.length || 0);
  const [adminCategories, setAdminCategories] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/products/categories', { params: { type: 'service' }, noDedupe: true });
        if (res.data.success) setAdminCategories(res.data.data || []);
      } catch (_) { /* pills fall back to static */ }
    })();
  }, []);

  const dynamicGenderTags = Array.from(new Set(adminCategories.map((c) => c.gender).filter((g) => g && g !== 'all').map((g) => g.charAt(0).toUpperCase() + g.slice(1))));
  const adminCategoryNames = adminCategories.map((c) => c.name).filter(Boolean).filter((name) => !dynamicGenderTags.some((t) => t.toLowerCase() === name.toLowerCase()));
  const staticFilterOptions = [
    { id: 'All', label: 'All', icon: LayoutGrid },
    { id: 'Popular', label: 'Popular', icon: Star },
    { id: 'Under ₹500', label: 'Under ₹500', icon: Tag },
    { id: 'Express Delivery', label: 'Express Delivery', icon: Zap },
  ];
  const all = [staticFilterOptions[0], ...dynamicGenderTags.map((t) => ({ id: t, label: t })), ...adminCategoryNames.map((n) => ({ id: n, label: n })), ...staticFilterOptions.slice(1)];

  return (
    <Box className="z-[100] bg-white border-b border-gray-100 shadow-sm px-4 pb-4">
      <Box className="flex items-center justify-between pt-3 mb-4">
        <Box className="flex items-center gap-3 flex-1">
          <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full" accessibilityLabel="Back">
            <I icon={ArrowLeft} size={22} color="#111827" />
          </Btn>
          <Box className="flex-1">
            <Txt className="text-lg font-black text-gray-900 tracking-tight leading-tight">{basketCount > 0 ? 'Add another garment' : 'Stitching Services'}</Txt>
            <Txt className="text-[11px] text-gray-500 font-medium">{basketCount > 0 ? 'Same tailor · select service for your order' : 'Find the perfect tailor for your style'}</Txt>
          </Box>
        </Box>
        <Btn onPress={() => navigate('/user/notifications')} className="relative p-2 rounded-full" accessibilityLabel="Notifications">
          <I icon={Bell} size={20} color="#4b5563" />
        </Btn>
      </Box>
      <Box className="flex items-center gap-3 z-50">
        <Box className="relative flex-1">
          <AnimatedSearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onSearch={(v) => setSearchQuery(v)} />
        </Box>
        <Btn className="h-11 w-11 flex items-center justify-center bg-primary/5 rounded-[1.25rem] border border-primary/20 shrink-0">
          <I icon={Filter} size={20} color="#843D9B" />
        </Btn>
      </Box>
      <Scroll horizontal className="mt-4" contentClassName="flex gap-2 pb-1">
        {all.map((f) => {
          const active = activeFilter === f.id;
          return (
            <Btn key={f.id} onPress={() => setActiveFilter && setActiveFilter(f.id)} className={`flex items-center shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap ${active ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white border-gray-200 text-gray-600'}`}>
              {f.icon ? <I icon={f.icon} size={14} style={{ marginRight: 4 }} /> : null}
              <Txt>{f.label}</Txt>
            </Btn>
          );
        })}
      </Scroll>
    </Box>
  );
};

export default ServicesHeader;
