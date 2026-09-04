import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowLeft, Bell, LayoutGrid, Star, Tag, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimatedSearchBar from '../AnimatedSearchBar';
import api from '../../../../utils/api';
import useCheckoutStore from '../../../../store/checkoutStore';

const ServicesHeader = ({ searchQuery, setSearchQuery, activeFilter, setActiveFilter }) => {
    const navigate = useNavigate();
    const basketCount = useCheckoutStore((s) => s.serviceItems?.length || 0);
    const [adminCategories, setAdminCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/products/categories', { params: { type: 'service' } });
                if (res.data.success) {
                    setAdminCategories(res.data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch categories for header:', error);
            }
        };
        fetchCategories();
    }, []);

    // Dynamically build filter pills from Admin Categories data
    const dynamicGenderTags = Array.from(new Set(
        adminCategories
            .map(c => c.gender)
            .filter(g => g && g !== 'all')
            .map(g => g.charAt(0).toUpperCase() + g.slice(1))
    ));

    const adminCategoryNames = adminCategories
        .map(c => c.name)
        .filter(Boolean)
        .filter(name => !dynamicGenderTags.some(t => t.toLowerCase() === name.toLowerCase()));

    const staticFilterOptions = [
        { id: 'All', label: 'All', icon: <LayoutGrid size={14} className="mr-1" /> },
        { id: 'Popular', label: 'Popular', icon: <Star size={14} className="mr-1" /> },
        { id: 'Under ₹500', label: 'Under ₹500', icon: <Tag size={14} className="mr-1" /> },
        { id: 'Express Delivery', label: 'Express Delivery', icon: <Zap size={14} className="mr-1" /> }
    ];

    // Combine static options with dynamic ones
    const dynamicOptions = [
        ...dynamicGenderTags.map(tag => ({ id: tag, label: tag })),
        ...adminCategoryNames.map(name => ({ id: name, label: name }))
    ];

    const allFilterOptions = [
        staticFilterOptions[0],
        ...dynamicOptions,
        ...staticFilterOptions.slice(1)
    ];

    return (
        <div className="sticky top-0 md:top-20 z-[100] bg-white border-b border-gray-100 shadow-sm px-4 md:px-6 lg:px-8 pb-4 transition-all duration-300">
            {/* Top Bar - Mobile Only */}
            <div className="flex items-center justify-between pt-3 mb-4 md:hidden">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-900 active:scale-90 transition-transform"
                        aria-label="Back"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-tight">
                            {basketCount > 0 ? 'Add another garment' : 'Stitching Services'}
                        </h1>
                        <p className="text-[11px] text-gray-500 font-medium">
                            {basketCount > 0
                                ? 'Same tailor · select service for your order'
                                : 'Find the perfect tailor for your style'}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/user/notifications')}
                    className="relative p-2 rounded-full hover:bg-gray-50 text-gray-600 active:scale-90 transition-all cursor-pointer"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <AnimatedSearchBar 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onSearch={(val) => setSearchQuery(val)}
                        placeholder="Search tailors, designs, stitching..."
                    />
                </div>
                <button className="h-11 w-11 sm:h-[50px] sm:w-[50px] flex items-center justify-center bg-primary/5 rounded-[1.25rem] sm:rounded-2xl border border-primary/20 hover:bg-primary/10 transition-colors text-primary flex-shrink-0">
                    <Filter size={20} />
                </button>
            </div>

            {/* Filter Pills (Scrollable) */}
            <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
                {allFilterOptions.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter && setActiveFilter(filter.id)}
                        className={`flex items-center flex-shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all whitespace-nowrap snap-start cursor-pointer ${
                            activeFilter === filter.id 
                                ? 'bg-primary text-white border-primary shadow-sm' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                        }`}
                    >
                        {filter.icon}
                        {filter.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ServicesHeader;
