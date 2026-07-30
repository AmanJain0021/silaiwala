import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import StoreHeader from '../components/store/StoreHeader';
import LocationBar from '../components/LocationBar'; // Reusing existing location bar
import CategoryScroll from '../components/store/CategoryScroll';
import SearchFilterBar from '../components/store/SearchFilterBar';
import ProductGrid from '../components/store/ProductGrid';
import FilterDrawer from '../components/store/FilterDrawer';
import RecentlyViewed from '../components/store/RecentlyViewed';
import BottomNav from '../components/BottomNav';
import api from '../../../utils/api';
import { SOCKET_URL } from '../../../config/constants';
import useCartStore from '../../../store/cartStore';
import useWishlistStore from '../../../store/wishlistStore';
import SafeImage from '../../../components/Common/SafeImage';


const StorePage = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [activeCategory, setActiveCategory] = useState({ name: "All", id: null });
    const [searchQuery, setSearchQuery] = useState("");
    const [storeBanners, setStoreBanners] = useState([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                // Fetch Banners
                const response = await api.get('/cms/banners/active');
                if (response.data.success && Array.isArray(response.data.data)) {
                    const filtered = response.data.data.filter(b => 
                        b.targetLocation === 'Store Tab - Header Banner' || 
                        b.targetLocation === 'Store Page - Top Banner' || 
                        b.targetLocation === 'Store Page'
                    );
                    setStoreBanners(filtered.length > 0 ? filtered : response.data.data);
                }
            } catch (error) {
                console.error('Error fetching store data:', error);
            }
        };

        fetchStoreData();
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
        setActiveCategory({ name, id });
    };

    const getImageUrl = (img) => {
        if (!img) return '';
        if (img.startsWith('http')) return img;
        return `${SOCKET_URL}${img}`;
    };

    const [activeTab, setActiveTab] = useState('store_item');

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 font-sans text-[#843D9B]">
            {/* 1. Header */}
            <StoreHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenFilter={() => setIsFilterOpen(true)}
            />

            {/* 2. Dynamic Hero Banner (Admin CMS Powered) */}
            <div className="px-4 md:px-6 lg:px-8 py-3 max-w-[1400px] mx-auto">
                {(() => {
                    const activeBanner = storeBanners.length > 0 ? storeBanners[currentBannerIndex % storeBanners.length] : null;
                    const bannerTitle = activeBanner?.title || "New Eid Collection";
                    const bannerSubtitle = activeBanner?.subtitle || "Fabrics for every celebration";
                    const bannerBadge = activeBanner?.badge;
                    const bannerImage = activeBanner?.image;
                    const bannerColor = activeBanner?.color || 'bg-[#4b1b68]';

                    return (
                        <div className={`relative h-44 sm:h-52 md:h-64 overflow-hidden rounded-2xl ${bannerColor} text-white shadow-md transition-all duration-500`}>
                            
                            {/* Full Background Image */}
                            <div className="absolute inset-0 w-full h-full">
                                <SafeImage
                                    src={getImageUrl(bannerImage)}
                                    alt={bannerTitle}
                                    className="w-full h-full object-cover"
                                    fallback="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&auto=format&fit=crop&q=80"
                                />
                            </div>

                            {/* Dark Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent pointer-events-none" />

                            <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 max-w-[80%] sm:max-w-[60%] space-y-2">
                                <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight uppercase italic drop-shadow-md text-white">
                                    {bannerTitle}
                                </h2>
                                <p className="text-xs sm:text-sm md:text-base text-gray-200 font-semibold line-clamp-2 drop-shadow-sm">
                                    {bannerSubtitle}
                                </p>
                                <div className="pt-2">
                                    <button className="px-5 py-2.5 bg-white text-black text-xs font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer">
                                        SHOP NOW <ChevronRight size={14} className="stroke-[3]" />
                                    </button>
                                </div>
                            </div>

                            {/* Pagination Dots */}
                            {storeBanners.length > 1 && (
                                <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1.5 z-20">
                                    {storeBanners.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentBannerIndex(idx)}
                                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                                idx === (currentBannerIndex % storeBanners.length)
                                                    ? 'w-5 bg-white shadow-sm'
                                                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* 3. Category Circles & Material Filter Pills Row */}
            <CategoryScroll
                activeCategory={activeCategory.name}
                onSelectCategory={handleCategorySelect}
                productType={activeTab}
            />

            {/* 4. 🔥 Trending Fabrics Section */}
            <ProductGrid 
                sectionTitle={<span>🔥 Trending Fabrics</span>}
                onViewAll={() => setActiveCategory({ name: "All", id: null })}
                filters={{ storeSection: "Trending", ...filters }} 
                categoryId={activeCategory.id} 
                categoryName={activeCategory.name} 
                searchQuery={searchQuery} 
                productType={activeTab} 
                layout="horizontal" 
            />

            {/* 6. ⭐ Best Sellers & 🆕 New Arrivals */}
            <ProductGrid 
                sectionTitle={<span>⭐ Best Sellers <span className="text-slate-300 font-normal">|</span> <span className="text-[#7a3299]">🆕 New Arrivals</span></span>}
                onViewAll={() => setActiveCategory({ name: "All", id: null })}
                filters={{ storeSection: "Best Sellers", ...filters }} 
                categoryId={null} 
                categoryName="Best Sellers" 
                searchQuery={searchQuery} 
                productType={activeTab} 
                layout="horizontal" 
            />

            {/* 7. 💜 Recommended For You */}
            <ProductGrid 
                sectionTitle={<span>💜 Recommended For You</span>}
                onViewAll={() => setActiveCategory({ name: "All", id: null })}
                filters={{ storeSection: "Recommended", ...filters }} 
                categoryId={null} 
                categoryName="Recommended" 
                searchQuery={searchQuery} 
                productType={activeTab} 
                layout="horizontal" 
            />

            {/* 8. 🛍️ Explore All Products (Shows EVERYTHING) */}
            <ProductGrid 
                sectionTitle={<span>🛍️ Explore All Products</span>}
                filters={filters} 
                categoryId={activeCategory.id} 
                categoryName={activeCategory.name} 
                searchQuery={searchQuery} 
                productType={activeTab} 
                layout="grid" 
            />

            {/* Filter Drawer */}
            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
            />

            {/* Bottom Nav */}
            <BottomNav />
        </div>
    );
};

export default StorePage;
