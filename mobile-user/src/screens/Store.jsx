// Port of modules/customer/pages/Store.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState, useEffect } from "react";
import { ArrowRight, ChevronRight } from "lucide-react-native";
import StoreHeader from "../components/customer/store/StoreHeader";
import LocationBar from "../components/customer/LocationBar"; // Reusing existing location bar
import CategoryScroll from "../components/customer/store/CategoryScroll";
import SearchFilterBar from "../components/customer/store/SearchFilterBar";
import ProductGrid from "../components/customer/store/ProductGrid";
import FilterDrawer from "../components/customer/store/FilterDrawer";
import RecentlyViewed from "../components/customer/store/RecentlyViewed";
import BottomNav from "../components/customer/BottomNav";
import api from "../lib/api";
import { SOCKET_URL } from "../lib/config";
import useCartStore from "../store/cartStore";
import useWishlistStore from "../store/wishlistStore";
import useBannerStore from "../store/bannerStore";
import { resolveBannerImageUrl } from "../utils/bannerImage";
import Screen from '../components/common/Screen';
import { Box, Img, Txt, Btn, I, Scroll } from '../components/ui/primitives';
const StorePage = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [activeCategory, setActiveCategory] = useState({
    name: "All",
    id: null
  });
  const [searchQuery, setSearchQuery] = useState("");
  const {
    storeBanners,
    fetchStoreBanners
  } = useBannerStore();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  useEffect(() => {
    fetchStoreBanners();
    // Sync Cart & Wishlist from Backend
    useCartStore.getState().fetchCart();
    useWishlistStore.getState().fetchWishlist();
  }, []);

  // Auto rotate store banners if multiple exist
  useEffect(() => {
    if (storeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % storeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [storeBanners]);
  const handleCategorySelect = (name, id) => {
    setActiveCategory({
      name,
      id
    });
  };
  const getImageUrl = img => resolveBannerImageUrl(img, SOCKET_URL);
  const [activeTab, setActiveTab] = useState('store_item');
  return <Screen className="bg-white" bottom={false}>
            <Box className="flex-1 bg-gray-50 font-sans text-[#843D9B]">
            {/* 1. Header */}
            <StoreHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} onOpenFilter={() => setIsFilterOpen(true)} />
            <Scroll className="flex-1" contentClassName="pb-24">

            {/* 2. Dynamic Hero Banner — only admin-uploaded banners for Store page */}
            {storeBanners.length > 0 && <Box className="px-4 md:px-6 lg:px-8 py-3 max-w-[1400px] mx-auto">
                {(() => {
        const activeBanner = storeBanners[currentBannerIndex % storeBanners.length];
        const bannerTitle = activeBanner?.title || '';
        const bannerSubtitle = activeBanner?.subtitle || '';
        const bannerBadge = activeBanner?.badge;
        const bannerImage = getImageUrl(activeBanner?.image);
        const bannerColor = activeBanner?.color || 'bg-[#843D9B]';
        return <Box className={`relative h-44 sm:h-52 md:h-64 overflow-hidden rounded-2xl ${bannerColor} text-white shadow-md transition-all duration-500`}>
                            
                            {/* Full Background Image */}
                            <Box className="absolute inset-0 w-full h-full">
                                <Img src={bannerImage} alt={bannerTitle || 'Store banner'} className="w-full h-full object-cover" />
                            </Box>

                            {/* Dark Gradient Overlay for Text Readability */}
                            <Box className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent pointer-events-none" />

                            <Box className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 max-w-[80%] sm:max-w-[60%] space-y-2">
                                {bannerBadge && <Txt className="inline-flex w-fit px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/20 border border-white/30">
                                        {bannerBadge}
                                    </Txt>}
                                {bannerTitle && <Txt className="text-xl sm:text-3xl font-black tracking-tight leading-tight uppercase italic drop-shadow-md text-white">
                                    {bannerTitle}
                                </Txt>}
                                {bannerSubtitle && <Txt className="text-xs sm:text-sm md:text-base text-gray-200 font-semibold line-clamp-2 drop-shadow-sm">
                                    {bannerSubtitle}
                                </Txt>}
                                <Box className="pt-2">
                                    <Btn className="px-5 py-2.5 bg-white text-black text-xs font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer">
                                        <Txt>SHOP NOW</Txt> <I icon={ChevronRight} size={14} className="stroke-[3]" />
                                    </Btn>
                                </Box>
                            </Box>

                            {/* Pagination Dots */}
                            {storeBanners.length > 1 && <Box className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5 z-20">
                                    {storeBanners.map((_, idx) => <Btn key={idx} onPress={() => setCurrentBannerIndex(idx)} className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentBannerIndex % storeBanners.length ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/70'}`} />)}
                                </Box>}
                        </Box>;
      })()}
            </Box>}

            {/* 3. Category Circles & Material Filter Pills Row */}
            <CategoryScroll activeCategory={activeCategory.name} onSelectCategory={handleCategorySelect} productType={activeTab} />

            {/* 4. 🔥 Trending Fabrics Section */}
            <ProductGrid sectionTitle={<Txt>🔥 Trending Fabrics</Txt>} onViewAll={() => setActiveCategory({
      name: "All",
      id: null
    })} filters={{
      storeSection: "Trending",
      ...filters
    }} categoryId={activeCategory.id} categoryName={activeCategory.name} searchQuery={searchQuery} productType={activeTab} />

            {/* 6. ⭐ Best Sellers & 🆕 New Arrivals */}
            <ProductGrid sectionTitle={<Txt>⭐ Best Sellers <Txt className="text-slate-300 font-normal">|</Txt> <Txt className="text-[#843D9B]">🆕 New Arrivals</Txt></Txt>} onViewAll={() => setActiveCategory({
      name: "All",
      id: null
    })} filters={{
      storeSection: "Best Sellers",
      ...filters
    }} categoryId={null} categoryName="Best Sellers" searchQuery={searchQuery} productType={activeTab} />

            {/* 7. 💜 Recommended For You */}
            <ProductGrid sectionTitle={<Txt>💜 Recommended For You</Txt>} onViewAll={() => setActiveCategory({
      name: "All",
      id: null
    })} filters={{
      storeSection: "Recommended",
      ...filters
    }} categoryId={null} categoryName="Recommended" searchQuery={searchQuery} productType={activeTab} />

            {/* 8. 🛍️ Explore All Products (Shows EVERYTHING) */}
            <ProductGrid sectionTitle={<Txt>🛍️ Explore All Products</Txt>} filters={filters} categoryId={activeCategory.id} categoryName={activeCategory.name} searchQuery={searchQuery} productType={activeTab} />

            </Scroll>
            </Box>
            {/* Filter Drawer */}
            <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} setFilters={setFilters} />

            {/* Bottom Nav */}
            <BottomNav />
        </Screen>;
};
export default StorePage;