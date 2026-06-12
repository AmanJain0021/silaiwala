import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import StoreHeader from '../components/store/StoreHeader';
import LocationBar from '../components/LocationBar'; // Reusing existing location bar
import CategoryScroll from '../components/store/CategoryScroll';
import SearchFilterBar from '../components/store/SearchFilterBar';
import ProductGrid from '../components/store/ProductGrid';
import FilterDrawer from '../components/store/FilterDrawer';
import RecentlyViewed from '../components/store/RecentlyViewed';
import TrustSection from '../components/store/TrustSection';
import BottomNav from '../components/BottomNav';
import api from '../../../utils/api';
import { SOCKET_URL } from '../../../config/constants';
import useCartStore from '../../../store/cartStore';
import useWishlistStore from '../../../store/wishlistStore';


const StorePage = () => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [activeCategory, setActiveCategory] = useState({ name: "All", id: null });
    const [searchQuery, setSearchQuery] = useState("");
    const [storeBanners, setStoreBanners] = useState([]);

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                // Fetch Banners
                const response = await api.get('/cms/banners/active');
                if (response.data.success) {
                    const filtered = response.data.data.filter(b => b.targetLocation === 'Store Tab - Header Banner');
                    setStoreBanners(filtered);
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
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 font-sans text-[#2D2F6E]">
            {/* 1. Unified Sticky Header */}
            <div className="sticky top-0 md:top-20 z-[100] shadow-md bg-white">
                <StoreHeader
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onOpenFilter={() => setIsFilterOpen(true)}
                />
                <div className="flex px-4 pt-2 gap-2">
                    <button onClick={() => setActiveTab('store_item')} className={`flex-1 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'store_item' ? 'bg-[#2D2F6E] text-white' : 'bg-gray-100 text-gray-500'}`}>Garments</button>
                    <button onClick={() => setActiveTab('fabric')} className={`flex-1 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'fabric' ? 'bg-[#2D2F6E] text-white' : 'bg-gray-100 text-gray-500'}`}>Fabrics</button>
                </div>
                <CategoryScroll
                    activeCategory={activeCategory.name}
                    onSelectCategory={handleCategorySelect}
                />
            </div>

            {/* 2. Dynamic Store Banner */}
            {storeBanners.length > 0 && (
                <div className="px-4 md:px-6 lg:px-8 py-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative h-32 overflow-hidden rounded-[2.5rem] shadow-xl group cursor-pointer border border-indigo-100/50"
                    >
                        {/* Background Image */}
                        <motion.img
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.8 }}
                            src={getImageUrl(storeBanners[0].image)}
                            alt="Promo"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col justify-center px-6 gap-1">
                            {storeBanners[0].badge && (
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 w-fit px-2 py-0.5 rounded-lg text-[8px] font-black tracking-[0.2em] text-gray-300 uppercase mb-1">
                                    {storeBanners[0].badge}
                                </div>
                            )}
                            <h2 className="text-xl font-black text-gray-200 leading-tight uppercase italic drop-shadow-md">
                                {storeBanners[0].title}
                            </h2>
                            {storeBanners[0].subtitle && (
                                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                                    {storeBanners[0].subtitle}
                                </p>
                            )}
                            <div className="mt-3">
                                <button className="px-4 py-2 bg-white text-black text-[9px] font-black rounded-full shadow-lg hover:scale-105 transition-transform uppercase tracking-widest flex items-center gap-2">
                                    Browse Now <ArrowRight size={10} />
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}

            {/* 5. Product Grid (Infinite Scroll) */}
            <ProductGrid filters={filters} categoryId={activeCategory.id} categoryName={activeCategory.name} searchQuery={searchQuery} productType={activeTab} />

            {/* 6. Recently Viewed */}
            <RecentlyViewed />

            {/* 7. Trust Section */}
            <TrustSection />

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
