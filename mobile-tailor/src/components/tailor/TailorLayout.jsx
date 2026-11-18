// Port of layouts/TailorLayout.jsx (mobile layout only; the desktop sidebar is not part of the app):
// top header, orders sub-navigation, scrollable content with pull-to-refresh, bottom navigation.
import React, { useEffect, useState, useCallback } from 'react';
import { Keyboard, RefreshControl } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, ClipboardList, ShoppingBag, UserCircle, Wallet, Bell } from 'lucide-react-native';
import useBrandingStore from '../../store/brandingStore';
import useSocketStore from '../../store/socketStore';
import { useTailorAuth } from '../../context/tailor/AuthContext';
import { useNotifications } from '../../context/tailor/NotificationContext';
import { registerForPush } from '../../lib/push';
import { getToken } from '../../lib/auth';
import { useNavigate, TAB_ROOTS } from '../../lib/nav';
import api from '../../lib/api';
import useRefreshOnReturn from '../../lib/useRefreshOnReturn';
import Screen from '../common/Screen';
import { Box, Btn, I, Img, Scroll, Txt } from '../ui/primitives';

const ORDER_SECTION = ['/partner/orders', '/partner/shop-orders', '/partner/alterations', '/partner/custom-designs', '/partner/issues'];
const ORDER_TABS = [
  { path: '/partner/orders', label: 'Stitching' },
  { path: '/partner/shop-orders', label: 'Shop' },
  { path: '/partner/alterations', label: 'Alterations' },
  { path: '/partner/custom-designs', label: 'Custom' },
  { path: '/partner/issues', label: 'Issues' },
];
const FULL_BLEED = ['/partner', '/partner/settings', '/partner/wallet', '/partner/earnings'];

export default function TailorLayout({ children, scroll = true }) {
  const pathname = usePathname();
  const navigate = useNavigate();
  const insets = useSafeAreaInsets();
  const { user, status } = useTailorAuth();
  const { unreadCount = 0 } = useNotifications() || {};
  const { appName, logos } = useBrandingStore();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const returnKey = useRefreshOnReturn();
  const userId = user?._id || user?.id;
  const isOrderSection = ORDER_SECTION.includes(pathname);

  // usePushNotifications(user)
  useEffect(() => {
    if (userId) registerForPush(userId);
  }, [userId]);

  // Hide the bottom nav while typing (web: visualViewport / focusin)
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Pending orders badge + live refresh over the tailor socket
  useEffect(() => {
    if (!userId) return undefined;
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/tailors/dashboard');
        if (response.data.success && response.data.data.summary) setPendingOrdersCount(response.data.data.summary.pendingOrders || 0);
      } catch (_) { /* badge only */ }
    };
    fetchDashboardData();
    if (!getToken()) return undefined;
    const socket = useSocketStore.getState().connect(String(userId), 'tailor');
    if (socket) {
      socket.on('new_order', fetchDashboardData);
      socket.on('receive_new_order', fetchDashboardData);
      socket.on('order_status_updated', fetchDashboardData);
    }
    return () => {
      if (socket) {
        socket.off('new_order', fetchDashboardData);
        socket.off('receive_new_order', fetchDashboardData);
        socket.off('order_status_updated', fetchDashboardData);
      }
    };
  }, [userId]);

  // Pull to refresh: the web reloads the page; natively the page is re-mounted (re-fetches its data)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const go = (path) => {
    if (path === pathname) return;
    navigate(path, { replace: isOrderSection && ORDER_SECTION.includes(path) && !TAB_ROOTS.includes(path) });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/partner' },
    { icon: ClipboardList, label: 'Orders', path: '/partner/orders', badge: pendingOrdersCount },
    { icon: Wallet, label: 'Wallet', path: '/partner/wallet' },
    { icon: ShoppingBag, label: 'Services', path: '/partner/products' },
    { icon: UserCircle, label: 'Profile', path: '/partner/settings' },
  ];
  const rawAvatar = user?.profile?.profileImage || user?.profileImage;
  // the backend's placeholder is not a loadable URL: show the initial instead of an empty box
  const avatar = rawAvatar && rawAvatar !== 'default_profile.png' ? rawAvatar : null;
  const content = (
    <Box key={`${refreshKey}-${returnKey}`} className={`flex-1 ${isOrderSection ? 'p-4' : ''}`}>
      {children}
    </Box>
  );

  return (
    <Screen className="bg-[#F7F8FC]" bottom={false}>
      {/* ── MOBILE TOP HEADER ── */}
      <Box className="w-full bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm z-40">
        <Btn onPress={() => go('/partner')} className="flex items-center gap-2.5">
          <Box className="w-8 h-8 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm shrink-0">
            <Img src={logos?.tailor} alt={appName} className="w-full h-full p-0.5" contentFit="contain" />
          </Box>
          <Box>
            <Txt className="text-base font-black text-gray-900 leading-none tracking-tight">{appName}</Txt>
            <Txt className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Partner Portal</Txt>
          </Box>
        </Btn>
        <Box className="flex items-center gap-2.5">
          {status ? (
            <Box className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
              <Box className={`h-1.5 w-1.5 rounded-full ${status === 'APPROVED' ? 'bg-[#843D9B]' : 'bg-orange-400'}`} />
              <Txt className="text-[8px] font-black uppercase text-gray-500 tracking-widest">{status}</Txt>
            </Box>
          ) : null}
          <Btn onPress={() => navigate('/partner/notifications')} className="p-2 text-gray-600 rounded-xl relative border border-gray-100 flex items-center justify-center">
            <I icon={Bell} size={18} color="#4b5563" />
            {unreadCount > 0 ? (
              <Box className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center z-10">
                <Txt className="text-[7px] font-black text-white">{unreadCount > 99 ? '99+' : unreadCount}</Txt>
              </Box>
            ) : null}
          </Btn>
          {avatar ? (
            <Btn onPress={() => go('/partner/settings')} className="w-8 h-8 rounded-xl overflow-hidden shadow-md shrink-0 bg-white border border-gray-200">
              <Img src={avatar} alt="Profile" className="w-full h-full" />
            </Btn>
          ) : (
            <Btn onPress={() => go('/partner/settings')} className="w-8 h-8 rounded-xl bg-[#843D9B] flex items-center justify-center shadow-md border border-white shrink-0">
              <Txt className="text-white font-black text-xs">{user?.name?.charAt(0)?.toUpperCase() || 'T'}</Txt>
            </Btn>
          )}
        </Box>
      </Box>

      {/* ── SUB-NAVIGATION FOR ORDERS SECTION ── */}
      {isOrderSection ? (
        <Box className="bg-white border-b border-gray-100 shadow-sm z-30">
          <Scroll horizontal contentClassName="px-4 py-3 flex gap-3">
            {ORDER_TABS.map((tab) => (
              <Btn
                key={tab.path}
                onPress={() => go(tab.path)}
                className={`px-4 py-2.5 rounded-xl shadow-sm ${pathname === tab.path ? 'bg-[#843D9B]' : 'bg-white border border-gray-100'}`}
              >
                <Txt className={`whitespace-nowrap text-[11px] font-black uppercase tracking-widest ${pathname === tab.path ? 'text-white' : 'text-gray-500'}`}>{tab.label}</Txt>
              </Btn>
            ))}
          </Scroll>
        </Box>
      ) : null}

      {scroll ? (
        <Scroll
          className="flex-1"
          contentClassName={FULL_BLEED.includes(pathname) ? 'pb-6' : 'pb-6'}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#843D9B']} />}
        >
          {content}
        </Scroll>
      ) : content}

      {/* ── BOTTOM NAVIGATION ── */}
      {!keyboardOpen ? (
        <Box className="bg-white border-t border-gray-100 px-4 pt-2 flex items-center justify-between gap-2 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]" style={{ paddingBottom: Math.max(8, insets.bottom), elevation: 12 }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path === '/partner/orders' && isOrderSection);
            return (
              <Btn key={item.path} onPress={() => go(item.path)} accessibilityLabel={item.label} className="flex flex-col items-center gap-1 relative min-w-[56px] py-1">
                {isActive ? <Box className="absolute -top-2 w-8 h-0.5 bg-[#843D9B] rounded-full" /> : null}
                <Box className={`p-2.5 rounded-2xl flex items-center justify-center relative ${isActive ? 'bg-[#843D9B] shadow-lg shadow-[#843D9B]/30' : ''}`}>
                  {item.badge > 0 ? (
                    <Box className="absolute -top-1 -right-1.5 h-[14px] min-w-[14px] px-1 bg-rose-500 rounded-full border-[1.5px] border-white flex items-center justify-center z-10">
                      <Txt className="text-[7px] font-black text-white">{item.badge > 99 ? '99+' : item.badge}</Txt>
                    </Box>
                  ) : null}
                  <I icon={item.icon} size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? '#ffffff' : '#9ca3af'} />
                </Box>
                <Txt className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-[#843D9B]' : 'text-gray-400'}`}>{item.label}</Txt>
              </Btn>
            );
          })}
        </Box>
      ) : null}
    </Screen>
  );
}

export const withTailorLayout = (ScreenComponent, opts = {}) => {
  const Wrapped = (props) => (
    <TailorLayout scroll={opts.scroll !== false}>
      <ScreenComponent {...props} />
    </TailorLayout>
  );
  Wrapped.displayName = `withTailorLayout(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return Wrapped;
};
