// Port of modules/customer/components/PromoBanner.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../lib/nav';
import useBannerStore from '../../store/bannerStore';
import FadeSwap from '../ui/FadeSwap';
import { Box, Btn, Img } from '../ui/primitives';

const STITCHING_PAGE = '/user/services';

const PromoBanner = () => {
  const navigate = useNavigate();
  const { homeBanners: banners, isHomeBannersLoading: isLoading, fetchHomeBanners } = useBannerStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { fetchHomeBanners(); }, [fetchHomeBanners]);
  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (isLoading) {
    return (
      <Box className="px-4 pt-3 pb-2">
        <Box className="w-full aspect-[2.6/1] bg-gray-100 rounded-2xl" />
      </Box>
    );
  }
  if (banners.length === 0) return null;
  const currentBanner = banners[currentIndex % banners.length];

  return (
    <Box className="px-4 pt-3 pb-2 relative z-40">
      <Box className="relative w-full rounded-2xl overflow-hidden shadow-lg shadow-purple-900/15 bg-[#f3eef8]">
        <FadeSwap swapKey={currentBanner.id} dx={40} duration={350}>
          <Btn onPress={() => navigate(STITCHING_PAGE)} className="w-full p-0 bg-[#f3eef8]" accessibilityLabel="Go to stitching services">
            <Img src={currentBanner.image} alt="Promo banner" autoHeight className="w-full rounded-2xl" />
          </Btn>
        </FadeSwap>
        {banners.length > 1 && (
          <Box className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-20">
            {banners.map((b, i) => (
              <Btn key={b.id} onPress={() => setCurrentIndex(i)} accessibilityLabel={`Go to banner ${i + 1}`} hitSlop={6}
                className={`h-1.5 rounded-full shadow-sm ${i === currentIndex ? 'w-5 bg-[#843D9B]' : 'w-1.5 bg-white/80'}`} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PromoBanner;
