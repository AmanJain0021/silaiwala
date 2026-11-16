// Port of modules/customer/components/ServiceGrid.jsx
import React from 'react';
import { ArrowRight } from 'lucide-react-native';
import { useNavigate } from '../../lib/nav';
import { Box, Txt, Btn, Img, I } from '../ui/primitives';

const services = [
  { title: 'Tailors', subtitle: 'Expert Professionals', imgSrc: '/icons/service_icon_0.png', path: '/user/tailors' },
  { title: 'Stitching', subtitle: 'Perfectly Crafted', imgSrc: '/icons/service_icon_1.png', path: '/user/services' },
  { title: 'Style Add-ons', subtitle: 'Elevate Your Look', imgSrc: '/icons/service_icon_2.png', path: '/user/embellishments' },
  { title: 'Bridal', subtitle: 'Made For Your Day', imgSrc: '/icons/service_icon_3.png', path: '/user/tailors?service=bridal' },
];

const ServiceGrid = () => {
  const navigate = useNavigate();
  return (
    <Box className="px-4 mt-3 mb-5">
      <Box className="flex items-center justify-between mb-3 relative">
        <Box className="flex-1 flex justify-center items-center">
          <Box className="flex items-center gap-1.5">
            <Txt className="text-[#843D9B] opacity-60 font-black text-xs italic">{'//'}</Txt>
            <Txt className="text-xs font-black text-[#682498] uppercase tracking-[0.18em]">WHAT WE OFFER</Txt>
            <Txt className="text-[#843D9B] opacity-60 font-black text-xs italic">{'//'}</Txt>
          </Box>
        </Box>
        <Btn onPress={() => navigate('/user/what-we-offer')} className="absolute right-0 text-[10px] font-black text-[#843D9B] flex items-center gap-0.5 uppercase tracking-wider">
          <Txt>View All</Txt>
          <I icon={ArrowRight} size={12} />
        </Btn>
      </Box>
      <Box className="grid grid-cols-4 gap-1.5">
        {services.map((s, index) => (
          <Btn key={index} onPress={() => navigate(s.path)} className="flex flex-col items-center gap-1">
            <Box className="w-[76px] h-[76px] flex items-center justify-center">
              <Img src={s.imgSrc} alt={s.title} className="w-full h-full object-contain" />
            </Box>
            <Box className="flex flex-col items-center text-center">
              <Txt className="text-[10px] font-bold text-gray-900 leading-tight text-center whitespace-nowrap">{s.title}</Txt>
              <Txt className="text-[8px] font-medium text-gray-500 leading-tight text-center mt-0.5">{s.subtitle}</Txt>
            </Box>
          </Btn>
        ))}
      </Box>
    </Box>
  );
};

export default ServiceGrid;
