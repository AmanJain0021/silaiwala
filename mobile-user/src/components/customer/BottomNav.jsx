// Port of modules/customer/components/BottomNav.jsx
import { useNavigate, TAB_ROOTS } from '../../lib/nav';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shirt, ShoppingBag, ClipboardList, User } from 'lucide-react-native';
import { Box, Txt, Btn, I } from '../ui/primitives';

const isActiveFor = (to, path) => {
  if (to === '/user') {
    return path === '/user' || path === '/user/' || path.startsWith('/user/services') || path.startsWith('/user/what-we-offer')
      || path.startsWith('/user/embellishments') || path.startsWith('/user/embroidery') || path.startsWith('/user/tailor');
  }
  if (to === '/user/store') return path.startsWith('/user/store') || path.startsWith('/user/fabric');
  if (to === '/user/orders') {
    return path.startsWith('/user/orders') || path.startsWith('/user/alteration') || path.startsWith('/user/custom-design') || path.startsWith('/user/bulk-order');
  }
  if (to === '/user/profile') {
    return ['/user/profile', '/user/wallet', '/user/refer', '/user/coupons', '/user/language', '/user/notifications', '/user/payments', '/user/faq',
      '/user/support', '/user/activity', '/user/wishlist', '/user/reviews', '/user/membership', '/user/loyalty'].some((p) => path.startsWith(p));
  }
  return path === to || path.startsWith(`${to}/`);
};

const NavItem = ({ to, icon, label }) => {
  const navigate = useNavigate();
  const path = usePathname();
  const router = useRouter();
  const isActive = isActiveFor(to, path);
  const scale = useRef(new Animated.Value(isActive ? 1.05 : 1)).current;
  useEffect(() => {
    Animated.timing(scale, { toValue: isActive ? 1.05 : 1, duration: 300, useNativeDriver: true }).start();
  }, [isActive, scale]);

  return (
    <Btn
      onPress={() => {
        if (path === to) return;
        // On a tab root: switch tabs (screens stay mounted). Deeper in the stack: pop back to the tabs
        // instead of pushing another copy of the tab screen.
        if (TAB_ROOTS.includes(path) || !router.canDismiss()) router.navigate(to);
        else router.dismissTo(to);
      }}
      accessibilityLabel={label}
      className="flex flex-col items-center gap-0.5 relative min-w-[56px] py-0.5"
    >
      {isActive && <Box className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#843D9B] rounded-full z-10" />}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Box className={`p-1.5 rounded-xl flex items-center justify-center relative ${isActive ? 'bg-[#843D9B] shadow-md shadow-[#843D9B]/30' : ''}`}>
          <I icon={icon} size={18} strokeWidth={isActive ? 2.5 : 2} color={isActive ? '#ffffff' : '#9ca3af'} />
        </Box>
      </Animated.View>
      <Txt className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-[#843D9B]' : 'text-gray-400'}`}>{label}</Txt>
    </Btn>
  );
};

const BottomNav = () => {
  const insets = useSafeAreaInsets();
  return (
    <Box
      className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-2xl pt-2.5 px-4"
      style={{ paddingBottom: insets.bottom + 20, elevation: 12 }}
    >
      <Box className="w-full max-w-md mx-auto flex items-center justify-between">
        <NavItem to="/user" icon={Shirt} label="Services" />
        <NavItem to="/user/store" icon={ShoppingBag} label="Store" />
        <NavItem to="/user/orders" icon={ClipboardList} label="Orders" />
        <NavItem to="/user/profile" icon={User} label="Profile" />
      </Box>
    </Box>
  );
};

export default BottomNav;
