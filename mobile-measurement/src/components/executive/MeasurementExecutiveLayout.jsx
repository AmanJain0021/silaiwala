// Port of modules/measurement-executive/layouts/MeasurementExecutiveLayout.jsx at phone width: page area + bottom navigation.
// The desktop sidebar is left out; the new-request alert and socket live at the app root (MeasurementAuthContext).
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardList, User, Wallet } from 'lucide-react-native';
import { useLocation, useNavigate } from '../../lib/nav';
import Screen from '../common/Screen';
import { Box, Btn, I, Txt } from '../ui/primitives';

const NAVIGATION = [
  { name: 'Dashboard', href: '/executive/dashboard', icon: Home },
  { name: 'Requests', href: '/executive/requests', icon: ClipboardList },
  { name: 'Wallet', href: '/executive/wallet', icon: Wallet },
  { name: 'Profile', href: '/executive/profile', icon: User },
];

export default function MeasurementExecutiveLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const insets = useSafeAreaInsets();
  const purpleHeader = /\/executive\/(wallet|profile)/.test(location.pathname);
  return (
    <Screen className="bg-gray-50" bottom={false} statusBg={purpleHeader ? 'bg-[#843D9B]' : 'bg-white'} statusBar={purpleHeader ? 'light' : 'dark'}>
      <Box className="flex-1">{children}</Box>
      <Box className="bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] px-4 pt-2 flex flex-row items-center justify-between gap-2" style={{ paddingBottom: 8 + insets.bottom }}>
        {NAVIGATION.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Btn key={item.name} onPress={() => navigate(item.href)} className="flex flex-col items-center gap-1 relative min-w-[64px] py-1">
              {isActive ? <Box className="absolute -top-2 w-8 h-0.5 bg-[#843D9B] rounded-full" /> : null}
              <Box className={`p-2.5 rounded-2xl flex items-center justify-center ${isActive ? 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/30 scale-110' : 'text-gray-400'}`}>
                <I icon={item.icon} size={20} strokeWidth={isActive ? 2.5 : 2} />
              </Box>
              <Txt className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-[#843D9B]' : 'text-gray-400'}`}>{item.name}</Txt>
            </Btn>
          );
        })}
      </Box>
    </Screen>
  );
}
