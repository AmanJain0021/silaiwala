// Port of modules/customer/components/DesignDetailModal.jsx (snap carousel -> paging ScrollView)
import React, { useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { getImageUrl } from '../../utils/imageUrl';
import { FullScreenModal } from '../ui/Sheet';
import { Box, Btn, I, Txt, Img, Scroll } from '../ui/primitives';

const DesignDetailModal = ({ design, isSelected, onToggle, onClose }) => {
  const { width } = useWindowDimensions();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollRef = useRef(null);
  if (!design) return null;
  const allImages = [design.image];
  if (design.referenceImages) {
    ['left', 'right', 'front', 'back'].forEach((k) => { if (design.referenceImages[k]) allImages.push(design.referenceImages[k]); });
  }
  const scrollToImage = (idx) => {
    setActiveImageIndex(idx);
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  return (
    <FullScreenModal visible onClose={onClose} className="bg-white">
      <Box className="flex-1 bg-white flex flex-col overflow-hidden font-sans">
        <Box className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent" pointerEvents="box-none">
          <Btn onPress={onClose} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <I icon={ArrowLeft} size={20} color="#fff" />
          </Btn>
          <Txt className="text-white font-bold text-sm bg-black/30 px-4 py-1.5 rounded-full">Design Details</Txt>
          <Box className="w-10" />
        </Box>
        <Box className="relative w-full aspect-[4/5] bg-gray-100">
          <Scroll ref={scrollRef} horizontal pagingEnabled className="w-full h-full"
            onMomentumScrollEnd={(e) => setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {allImages.map((img, idx) => (
              <Box key={idx} style={{ width }} className="h-full">
                <Img src={getImageUrl(img)} alt={`${design.name} view ${idx + 1}`} className="w-full h-full object-cover" />
              </Box>
            ))}
          </Scroll>
          <Box className="absolute bottom-4 right-4 bg-white/80 px-3 py-1 rounded-full shadow-sm" pointerEvents="none">
            <Txt className="text-[10px] font-black text-[#843D9B] tracking-widest">{activeImageIndex + 1} / {allImages.length}</Txt>
          </Box>
        </Box>
        <Scroll className="flex-1 bg-gray-50 rounded-t-[2rem] -mt-6 relative z-20" contentClassName="pb-28">
          <Scroll horizontal contentClassName="flex gap-3 px-6 pt-6">
            {allImages.map((img, idx) => (
              <Btn key={idx} onPress={() => scrollToImage(idx)} className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 ${activeImageIndex === idx ? 'border-[#843D9B] shadow-md' : 'border-transparent opacity-70'}`}>
                <Img src={getImageUrl(img)} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
              </Btn>
            ))}
          </Scroll>
          <Box className="p-6 space-y-6">
            <Box className="flex justify-between items-start gap-4">
              <Box className="flex-1">
                <Txt className="text-xs font-black text-[#843D9B] uppercase tracking-widest mb-1">Embellishments</Txt>
                <Txt className="text-2xl font-black text-gray-900 leading-tight">{design.name}</Txt>
              </Box>
              <Box className="items-end shrink-0">
                <Txt className="text-2xl font-black text-[#843D9B]">₹{design.price}</Txt>
                <Txt className="text-[10px] font-bold text-gray-400 uppercase">Tax included</Txt>
              </Box>
            </Box>
            <Box className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
              <Txt className="text-xs text-gray-500 leading-relaxed font-medium">{design.description || 'A premium artisan embellishment featuring intricate embroidery and handcrafted finishes. Perfect for special occasions and boutique styling.'}</Txt>
            </Box>
          </Box>
        </Scroll>
        <Box className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <Btn onPress={() => { onToggle(); onClose(); }} className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg ${isSelected ? 'bg-red-50 text-red-500 border border-red-100 shadow-red-500/10' : 'bg-[#843D9B] text-white shadow-[#843D9B]/20'}`}>
            {isSelected ? 'Remove Design' : 'Select Design'}
          </Btn>
        </Box>
      </Box>
    </FullScreenModal>
  );
};

export default DesignDetailModal;
