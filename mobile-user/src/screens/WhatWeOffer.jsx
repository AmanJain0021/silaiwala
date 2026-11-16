// Port of modules/customer/pages/WhatWeOffer.jsx
import React from 'react';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigate } from '../lib/nav';
import Screen from '../components/common/Screen';
import BottomNav from '../components/customer/BottomNav';
import { Box, Txt, Btn, Img, I, Scroll } from '../components/ui/primitives';

const services = [
  { label: 'Tailors', imgSrc: '/icons/service_icon_0.png', path: '/user/tailors', desc: 'Find expert tailors near you' },
  { label: 'My Orders', imgSrc: '/icons/offer_my_orders.png', path: '/user/orders', desc: 'Track and manage your orders' },
  { label: 'Stitching', imgSrc: '/icons/service_icon_1.png', path: '/user/services', desc: 'Custom stitching services' },
  { label: 'Style Add-ons', imgSrc: '/icons/service_icon_2.png', path: '/user/embellishments', desc: 'Enhance your outfits' },
  { label: 'Bridal', imgSrc: '/icons/service_icon_3.png', path: '/user/tailors?service=bridal', desc: 'Exclusive bridal collections' },
  { label: 'Bulk Order', imgSrc: '/icons/offer_bulk_order.png', path: '/user/bulk-order', desc: 'Corporate and group orders' },
  { label: 'Embroidery', imgSrc: '/icons/offer_embroidery.png', path: '/user/embroidery', desc: 'Custom embroidery designs' },
  { label: 'Alteration', imgSrc: '/icons/offer_alteration.png', path: '/user/alteration', desc: 'Perfect fit alterations' },
  { label: 'Custom Design', imgSrc: '/icons/offer_custom_design.png', path: '/user/custom-design', desc: 'Design your dream outfit' },
];

const WhatWeOffer = () => {
  const navigate = useNavigate();
  return (
    <Screen className="bg-white" bottom={false}>
      <Box className="flex-1 bg-[#F7F8FC] font-sans">
        <Box className="z-50 bg-white shadow-sm px-4 py-4 flex items-center gap-4">
          <Btn onPress={() => navigate(-1)} className="p-2 rounded-full">
            <I icon={ArrowLeft} size={24} color="#374151" />
          </Btn>
          <Txt className="text-lg font-black text-gray-900 uppercase tracking-widest">What We Offer</Txt>
        </Box>
        <Scroll className="flex-1" contentClassName="p-4 pb-24">
          <Box className="grid grid-cols-2 gap-4">
            {services.map((s) => (
              <Btn key={s.label} onPress={() => navigate(s.path)} className="bg-white rounded-3xl p-4 flex flex-col items-center text-center">
                <Box className="w-20 h-20 rounded-full bg-[#F3EAFF] flex items-center justify-center mb-3 overflow-hidden">
                  <Img src={s.imgSrc} alt={s.label} className="w-[85%] h-[85%] object-contain -mt-1" />
                </Box>
                <Txt className="font-black text-gray-900 text-[11px] uppercase tracking-wider mb-1 text-center">{s.label}</Txt>
                <Txt className="text-[9px] text-gray-500 font-medium leading-relaxed text-center">{s.desc}</Txt>
              </Btn>
            ))}
          </Box>
        </Scroll>
      </Box>
      <BottomNav />
    </Screen>
  );
};

export default WhatWeOffer;
