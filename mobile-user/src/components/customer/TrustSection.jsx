// Port of modules/customer/components/TrustSection.jsx
import React from 'react';
import { ShieldCheck, Star, Truck } from 'lucide-react-native';
import { Box, Txt, I } from '../ui/primitives';

const Item = ({ icon, title, sub }) => (
  <Box className="flex-1 bg-white border border-gray-100 shadow-sm rounded-xl p-2.5 flex items-center gap-2">
    <Box className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
      <I icon={icon} size={16} color="#843D9B" />
    </Box>
    <Box className="flex-1">
      <Txt className="text-[10px] font-black text-gray-900 leading-tight">{title}</Txt>
      <Txt className="text-[8px] text-gray-500 font-bold leading-tight">{sub}</Txt>
    </Box>
  </Box>
);

const TrustSection = () => (
  <Box className="px-4 py-2 mb-4">
    <Box className="flex gap-2">
      <Item icon={ShieldCheck} title="500+" sub="Verified Tailors" />
      <Item icon={Star} title="10,000+" sub="Orders Completed" />
      <Item icon={Truck} title="Doorstep" sub="Pickup & Delivery" />
    </Box>
  </Box>
);

export default TrustSection;
