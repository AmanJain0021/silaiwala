// Port of components/services/TrustBenefits.jsx
import React from 'react';
import { ShieldCheck, Lock, Clock, Award } from 'lucide-react-native';
import { Box, Txt, I, Scroll } from '../../ui/primitives';

const benefits = [
  { id: 1, icon: ShieldCheck, title: 'Verified Tailors', subtitle: '100% Verified' },
  { id: 2, icon: Lock, title: 'Secure Payment', subtitle: 'Safe & Encrypted' },
  { id: 3, icon: Clock, title: 'On-time Delivery', subtitle: 'Punctual & Reliable' },
  { id: 4, icon: Award, title: 'Quality Promise', subtitle: 'Satisfaction Guaranteed' },
];

const TrustBenefits = () => (
  <Box className="w-full py-4 mb-4 border-t border-gray-100 bg-white">
    <Scroll horizontal contentClassName="flex gap-3 px-4">
      {benefits.map((item) => (
        <Box key={item.id} className="flex items-center gap-2 bg-gray-50/80 border border-gray-100 rounded-2xl px-4 py-3 min-w-[160px]">
          <Box className="p-2 rounded-xl bg-primary/10 shrink-0">
            <I icon={item.icon} size={20} color="#843D9B" />
          </Box>
          <Box>
            <Txt className="text-xs font-bold text-gray-900 leading-tight">{item.title}</Txt>
            <Txt className="text-[10px] text-gray-500 font-medium">{item.subtitle}</Txt>
          </Box>
        </Box>
      ))}
    </Scroll>
  </Box>
);

export default TrustBenefits;
