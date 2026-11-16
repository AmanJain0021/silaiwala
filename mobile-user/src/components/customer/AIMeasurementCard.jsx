// Port of modules/customer/components/AIMeasurementCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { PanResponder } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useNavigate } from '../../lib/nav';
import toast from '../../lib/toast';
import FadeSwap from '../ui/FadeSwap';
import { Box, Txt, Btn, Img, I } from '../ui/primitives';

const AIMeasurementCard = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = [
    { id: 'ai-measurement', badge: 'NEW', badgeClass: 'bg-pink-100 text-pink-600', title: 'AI MEASUREMENT', description: 'Get accurate body measurements in 30 seconds. No measuring tape required!', buttonText: 'TRY NOW', onAction: () => toast('AI Measurement coming soon!'), image: '/src/images/mannequin.png', gradient: 'from-[#F6EFFD] via-[#F1E4FA] to-[#EAD5F7]' },
    { id: 'doorstep-measurement', badge: 'FREE VISIT', badgeClass: 'bg-purple-100 text-[#843D9B]', title: 'DOORSTEP MEASURE', description: 'Book master tailor visit at home for perfect fitting & free fabric pickup!', buttonText: 'BOOK VISIT', onAction: () => navigate('/user/services'), image: '/src/images/measurement.png', gradient: 'from-[#F8EEFD] via-[#F3E2FA] to-[#EBD3F8]' },
  ];
  const n = slides.length;

  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => setCurrentIndex((p) => (p + 1) % n), 5000);
    return () => clearInterval(timer);
  }, [paused, n]);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => setPaused(true),
    onPanResponderRelease: (_, g) => {
      if (g.dx < -40) setCurrentIndex((p) => (p + 1) % n);
      else if (g.dx > 40) setCurrentIndex((p) => (p - 1 + n) % n);
      setPaused(false);
    },
    onPanResponderTerminate: () => setPaused(false),
  })).current;

  const s = slides[currentIndex];
  return (
    <Box className="px-4 mt-1.5 mb-2.5">
      <Box {...pan.panHandlers} className={`bg-gradient-to-r ${s.gradient} rounded-2xl border border-purple-100/80 px-3.5 py-2.5 shadow-sm relative overflow-hidden`}>
        <Box className="absolute -right-8 -bottom-8 w-24 h-24 bg-purple-300/30 rounded-full blur-2xl" pointerEvents="none" />
        <Box className="absolute left-1/2 top-0 w-16 h-16 bg-white/40 rounded-full blur-xl" pointerEvents="none" />
        <FadeSwap swapKey={s.id}>
          <Box className="flex items-center justify-between gap-2.5 relative z-10">
            <Box className="flex-1 min-w-0 pr-1">
              <Box className="flex items-center gap-1.5 mb-0.5">
                <Txt className="text-gray-900 font-black text-[11px] tracking-tight uppercase leading-none">{s.title}</Txt>
                <Txt className={`${s.badgeClass} text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0`}>{s.badge}</Txt>
              </Box>
              <Txt className="text-gray-600 text-[9.5px] font-medium leading-tight mt-0.5 max-w-[210px]">{s.description}</Txt>
              <Btn onPress={s.onAction} className="mt-1.5 bg-[#843D9B] text-white px-2.5 py-1 rounded-full text-[9px] font-black flex items-center gap-1 shadow-sm shadow-[#843D9B]/25 uppercase tracking-wide">
                <Txt>{s.buttonText}</Txt>
                <I icon={ArrowRight} size={10} />
              </Btn>
            </Box>
            <Box className="relative shrink-0 flex items-center justify-center w-20 h-20 -my-1 -mr-1">
              <Img src={s.image} className="w-full h-full object-contain scale-110" />
            </Box>
          </Box>
        </FadeSwap>
        <Box className="flex justify-center items-center gap-1.5 mt-1.5 relative z-10">
          {slides.map((sl, idx) => (
            <Btn key={sl.id} onPress={() => setCurrentIndex(idx)} hitSlop={6} accessibilityLabel={`Go to slide ${idx + 1}`}
              className={`rounded-full ${idx === currentIndex ? 'w-4 h-1 bg-[#843D9B] shadow-sm' : 'w-1 h-1 bg-purple-300'}`} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AIMeasurementCard;
