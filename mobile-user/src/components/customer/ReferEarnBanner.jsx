// Port of modules/customer/components/ReferEarnBanner.jsx
import React from 'react';
import { ArrowRight } from 'lucide-react-native';
import { useNavigate } from '../../lib/nav';
import { Box, Txt, Btn, Img, I } from '../ui/primitives';

const ReferEarnBanner = () => {
  const navigate = useNavigate();
  return (
    <Btn onPress={() => navigate('/user/refer')} className="px-4 py-2 mb-6 w-full">
      <Box className="bg-[#843D9B] rounded-2xl p-4 pl-2 flex items-center shadow-sm relative overflow-hidden w-full">
        <Box className="w-20 h-20 shrink-0 relative z-10 mr-2 -my-2">
          <Img src="/assets/images/refer_earn_box.png" alt="Refer & Earn" className="w-full h-full object-contain" />
        </Box>
        <Box className="flex-1 relative z-10 text-left">
          <Txt className="text-white font-black text-[13px] tracking-tight">Refer & Earn</Txt>
          <Txt className="text-white/90 text-[9px] font-bold mt-0.5 leading-tight pr-2">Refer your friends — earn loyalty points when they sign up with your code</Txt>
        </Box>
        <Box className="shrink-0 bg-white px-3 py-2 rounded-full flex items-center gap-1 relative z-10 shadow-sm">
          <Txt className="text-[#843D9B] text-[9px] font-black uppercase tracking-widest">Refer Now</Txt>
          <I icon={ArrowRight} size={10} color="#843D9B" />
        </Box>
        <Box className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" pointerEvents="none" />
      </Box>
    </Btn>
  );
};

export default ReferEarnBanner;
