// Port of modules/customer/components/HomeHeader.jsx
import React, { useState } from 'react';
import { Bell, ShoppingCart, X, Navigation, ChevronDown } from 'lucide-react-native';
import { useNavigate } from '../../lib/nav';
import useCartStore from '../../store/cartStore';
import useCheckoutStore from '../../store/checkoutStore';
import useLocationStore from '../../store/locationStore';
import { useNotifications } from '../../context/NotificationContext';
import LocationModal from './LocationModal';
import AnimatedSearchBar from './AnimatedSearchBar';
import { Dialog } from '../ui/Sheet';
import { Box, Txt, Btn, I, Scroll } from '../ui/primitives';

const HomeHeader = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const productCartItems = useCartStore((s) => s.items);
  const serviceItems = useCheckoutStore((s) => s.serviceItems);
  const cartCount = (productCartItems || []).length + (serviceItems || []).length;
  const { notifications = [], unreadCount, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { address: location } = useLocationStore();

  const handleBellClick = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next && unreadCount > 0 && markAllRead) markAllRead();
  };

  return (
    <>
      <Box className="bg-[#843D9B] pt-4 pb-6 px-4 relative z-20 w-full">
        <Box className="flex justify-between items-center mb-5">
          <Btn className="flex items-center gap-3 flex-1 min-w-0 pr-4" onPress={() => setShowLocationModal(true)}>
            <Box className="w-10 h-10 rounded-full flex items-center justify-center bg-white/15 border border-white/40 shrink-0">
              <I icon={Navigation} size={18} color="#fff" />
            </Box>
            <Box className="flex-1 min-w-0 text-left">
              <Txt className="text-[10px] text-white/80 font-medium leading-none mb-1">Delivering to</Txt>
              <Box className="flex items-center gap-1">
                <Txt className="text-xs font-bold text-white truncate">{location || 'Select Location'}</Txt>
                <I icon={ChevronDown} size={14} color="#fff" />
              </Box>
            </Box>
          </Btn>
          <Box className="flex items-center gap-2 shrink-0">
            <Btn onPress={handleBellClick} accessibilityLabel="Notifications" className="w-10 h-10 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center relative">
              <I icon={Bell} size={18} color="#fff" />
              {unreadCount > 0 && <Box className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border border-[#843D9B]" />}
            </Btn>
            <Btn
              onPress={() => {
                useCheckoutStore.getState().setBuyNowMode(false);
                navigate((serviceItems || []).length > 0 && (productCartItems || []).length === 0 ? '/user/checkout/summary' : '/user/cart');
              }}
              accessibilityLabel="Shopping Cart"
              className="w-10 h-10 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center relative"
            >
              <I icon={ShoppingCart} size={18} color="#fff" />
              {cartCount > 0 && (
                <Box className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-white flex items-center justify-center rounded-full shadow-sm">
                  <Txt className="text-[#843D9B] text-[9px] font-bold leading-none">{cartCount}</Txt>
                </Box>
              )}
            </Btn>
          </Box>
        </Box>
        <Box className="bg-white rounded-[1.25rem] flex items-center shadow-sm relative pl-1 pr-2 h-[46px] z-30">
          <Box className="flex-1 h-full min-w-0">
            <AnimatedSearchBar className="h-full w-full" hideBackground />
          </Box>
        </Box>
      </Box>

      <Dialog visible={showNotifications} onClose={() => setShowNotifications(false)} backdropClassName="bg-black/20" className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 overflow-hidden" containerClassName="px-4">
        <Box className="flex justify-between items-center mb-4">
          <Txt className="text-lg font-bold text-gray-900">Notifications</Txt>
          <Btn onPress={() => setShowNotifications(false)} className="p-1.5 bg-gray-50 rounded-full">
            <I icon={X} size={16} color="#9ca3af" />
          </Btn>
        </Box>
        <Scroll style={{ maxHeight: 288 }} contentClassName="space-y-3">
          {(notifications || []).length > 0 ? (
            notifications.map((n) => (
              <Btn key={n._id} onPress={() => markAsRead(n._id)} className={`p-3 rounded-2xl border text-left ${!n.isRead ? 'bg-purple-50/50 border-purple-100' : 'bg-white border-gray-100'}`}>
                <Box className="flex justify-between items-start mb-1 gap-2">
                  <Txt className="text-xs font-bold text-gray-900 leading-tight flex-1">{n.title}</Txt>
                  <Txt className="text-[9px] font-bold text-gray-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Txt>
                </Box>
                <Txt className="text-[11px] text-gray-500 font-medium leading-snug">{n.message}</Txt>
              </Btn>
            ))
          ) : (
            <Box className="py-8 text-center items-center">
              <I icon={Bell} size={32} color="#e5e7eb" style={{ marginBottom: 8 }} />
              <Txt className="text-xs font-bold text-gray-400">No new notifications</Txt>
            </Box>
          )}
        </Scroll>
      </Dialog>
      <LocationModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
    </>
  );
};

export default HomeHeader;
