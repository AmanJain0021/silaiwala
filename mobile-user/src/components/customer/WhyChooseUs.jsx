// Port of modules/customer/components/WhyChooseUs.jsx
import React from 'react';
import { UserCheck, Award, Clock, ShieldCheck } from 'lucide-react-native';
import useBrandingStore from '../../store/brandingStore';
import { Box, Txt, I } from '../ui/primitives';

const items = [
  { icon: UserCheck, color: '#F59E0B', t: 'Expert Tailors', s: 'Professionals with years of experience' },
  { icon: Award, color: '#EC4899', t: 'Premium Quality', s: 'Finest fabrics & stitching quality' },
  { icon: Clock, color: '#10B981', t: 'On-time Delivery', s: 'Always on time, every time' },
  { icon: ShieldCheck, color: '#3B82F6', t: 'Secure Payments', s: '100% safe & secure payments' },
];

const WhyChooseUs = () => {
  const appName = useBrandingStore((s) => s.appName);
  return (
    <Box className="px-4 py-4 mb-4">
      <Box className="relative flex items-center justify-center mb-6 px-2">
        <Box className="absolute left-0 right-0 border-t border-dashed border-gray-300" />
        <Box className="relative bg-[#F7F8FC] px-4">
          <Txt className="text-[11px] font-bold text-[#843D9B] uppercase tracking-[0.3em] whitespace-nowrap">Why Choose {appName}?</Txt>
        </Box>
      </Box>
      <Box className="grid grid-cols-4 gap-2">
        {items.map((it) => (
          <Box key={it.t} className="flex flex-col items-center text-center gap-1">
            <Box className="w-8 h-8 flex items-center justify-center">
              <I icon={it.icon} size={24} color={it.color} />
            </Box>
            <Txt className="text-[9px] font-black text-gray-900 leading-tight text-center">{it.t}</Txt>
            <Txt className="text-[7px] text-gray-400 font-bold leading-tight text-center">{it.s}</Txt>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default WhyChooseUs;
