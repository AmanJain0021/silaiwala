// Port of modules/customer/pages/Services.jsx
import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, X } from 'lucide-react-native';
import { useLocation, useNavigate } from '../lib/nav';
import toast from '../lib/toast';
import useCheckoutStore from '../store/checkoutStore';
import { getImageUrl } from '../utils/imageUrl';
import Screen from '../components/common/Screen';
import BottomNav from '../components/customer/BottomNav';
import ServicesHeader from '../components/customer/services/ServicesHeader';
import ServicesGrid from '../components/customer/services/ServicesGrid';
import TrustBenefits from '../components/customer/services/TrustBenefits';
import { Box, Txt, Btn, Img, I, Scroll } from '../components/ui/primitives';

const Services = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialSearch = new URLSearchParams(location.search).get('search') || '';
  const initialFilter = location.state?.filter || 'All';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const serviceItems = useCheckoutStore((s) => s.serviceItems);
  const removeServiceItem = useCheckoutStore((s) => s.removeServiceItem);
  const setBuyNowMode = useCheckoutStore((s) => s.setBuyNowMode);
  const clearCheckout = useCheckoutStore((s) => s.clearCheckout);
  const lockedTailorId = useCheckoutStore((s) => s.lockedTailorId);
  const lockedTailorName = useCheckoutStore((s) => s.lockedTailorName);
  const basketCount = serviceItems?.length || 0;
  const basketTotal = (serviceItems || []).reduce((sum, item) => sum + (item.pricing?.total || 0), 0);

  useEffect(() => {
    if (location.state?.filter) setActiveFilter(location.state.filter);
    const s = new URLSearchParams(location.search).get('search');
    if (s !== null) setSearchQuery(s);
  }, [location.state, location.search]);

  useEffect(() => {
    if (basketCount === 0) {
      const store = useCheckoutStore.getState();
      if (store.lockedTailorId || store.lockedTailorName) useCheckoutStore.setState({ lockedTailorId: null, lockedTailorName: null });
      if (location.state?.fromMultiItemBasket && !location.state?.tailorId) {
        navigate('/user/services', { replace: true, state: location.state?.filter ? { filter: location.state.filter } : {} });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basketCount, location.state?.fromMultiItemBasket, location.state?.tailorId, location.state?.filter]);

  useEffect(() => {
    if (!basketCount || !location.state?.fromMultiItemBasket) return;
    const { tailorId, tailorName } = useCheckoutStore.getState().ensureLockedTailor({ tailorId: lockedTailorId, tailorName: lockedTailorName });
    if (!tailorId || String(location.state?.tailorId || '') === String(tailorId)) return;
    navigate('/user/services', { replace: true, state: { ...location.state, tailorId, tailorName: tailorName || 'Selected Tailor', fromMultiItemBasket: true } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basketCount, lockedTailorId, lockedTailorName, location.state]);

  return (
    <Screen className="bg-white" bottom={false}>
      <Box className="flex-1 font-['Plus_Jakarta_Sans',sans-serif]">
        <ServicesHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        <Scroll className="flex-1" contentClassName="pb-28">
          {basketCount > 0 && (
            <Box className="z-[90] px-4 pt-2 space-y-2">
              <Box className="bg-primary rounded-2xl px-4 py-3 shadow-lg shadow-primary/25">
                <Box className="flex items-center justify-between gap-3">
                  <Box className="flex items-center gap-3 min-w-0 flex-1">
                    <Box className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <I icon={ShoppingBag} size={16} color="#fff" />
                    </Box>
                    <Box className="text-left min-w-0 flex-1">
                      <Txt className="text-[11px] font-black uppercase tracking-wider truncate text-white">Basket · {basketCount} garment{basketCount > 1 ? 's' : ''}</Txt>
                      <Txt className="text-[10px] font-semibold text-white/80">Neeche se next service choose karo · ₹{basketTotal.toLocaleString()}</Txt>
                    </Box>
                  </Box>
                  <Box className="flex items-center gap-1.5 shrink-0">
                    <Btn onPress={() => { clearCheckout(); navigate('/user/services', { replace: true, state: {} }); toast.success('Basket cleared'); }} className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-2 rounded-xl">Clear</Btn>
                    <Btn onPress={() => { setBuyNowMode(false, null); navigate('/user/checkout/summary'); }} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white text-primary px-3 py-2 rounded-xl shrink-0">
                      <Txt>Checkout</Txt>
                      <I icon={ChevronRight} size={14} />
                    </Btn>
                  </Box>
                </Box>
                <Scroll nestedScrollEnabled className="mt-3 max-h-40" contentClassName="space-y-2">
                  {serviceItems.map((item, idx) => {
                    const img = getImageUrl(item.configuration?.selectedStyle?.image || item.serviceDetails?.image);
                    const sid = item.serviceDetails?._id || item.serviceDetails?.id;
                    return (
                      <Box key={item.basketId || idx} className="flex items-center gap-2 bg-white/10 rounded-xl p-2">
                        <Btn className="flex items-center gap-2 min-w-0 flex-1 text-left" onPress={() => {
                          if (!sid) return;
                          navigate(`/user/services/${sid}`, { state: { tailorId: item.serviceDetails?.tailorId, tailorName: item.serviceDetails?.tailorName, editBasketIndex: idx, restoreBasketItem: item, fromBasket: true } });
                        }}>
                          <Box className="w-9 h-11 rounded-lg overflow-hidden bg-white/20 shrink-0">{img ? <Img src={img} className="w-full h-full object-cover" /> : null}</Box>
                          <Box className="min-w-0 flex-1">
                            <Txt className="text-[11px] font-bold truncate text-white">{item.serviceDetails?.title || `Item ${idx + 1}`}</Txt>
                            <Txt className="text-[9px] text-white/70 font-semibold">{item.configuration?.pending ? 'Pending · tap to fill' : 'Tap to edit'}</Txt>
                          </Box>
                        </Btn>
                        <Btn onPress={() => removeServiceItem(idx)} className="p-1.5 rounded-lg bg-white/15" accessibilityLabel="Remove">
                          <I icon={X} size={14} color="#fff" />
                        </Btn>
                      </Box>
                    );
                  })}
                </Scroll>
              </Box>
            </Box>
          )}
          <ServicesGrid searchQuery={searchQuery} activeFilter={activeFilter} />
          <TrustBenefits />
        </Scroll>
      </Box>
      <BottomNav />
    </Screen>
  );
};

export default Services;
