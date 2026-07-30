import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import api from '../../../../utils/api';
import { getImageUrl } from '../../../../utils/imageUrl';
import SafeImage from '../../../../components/Common/SafeImage';

const defaultMaterials = ["All", "Cotton", "Linen", "Silk", "Lawn"];

const CategoryScroll = ({ onSelectCategory, activeCategory, productType = 'store_item' }) => {
    const scrollRef = useRef(null);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMaterial, setSelectedMaterial] = useState("All");

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            // Removed type filter so ALL categories (Product, Garment, etc) added by admin show up
            const response = await api.get('/products/categories').catch(() => null);

            if (response?.data?.success && Array.isArray(response.data.data)) {
                setCategories(response.data.data);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [productType]);

    const displayCategories = categories;

    return (
        <div className="bg-white py-3 border-b border-slate-100 transition-all duration-300">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 space-y-3">
                
                {/* 1. Category Circular Avatars Row */}
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-5 md:gap-8 py-3 px-2 md:justify-center no-scrollbar snap-x relative items-start"
                >
                    {/* All Categories Pill */}
                    <button
                        onClick={() => {
                            if (onSelectCategory) onSelectCategory("All", null);
                        }}
                        className={`flex flex-col items-center gap-2 min-w-[80px] snap-center transition-all duration-300 group cursor-pointer ${
                            activeCategory === "All" || !activeCategory ? 'scale-105' : 'opacity-90 hover:opacity-100 hover:-translate-y-1'
                        }`}
                    >
                        <div className={`w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden border-[3px] flex items-center justify-center transition-all duration-300 relative shadow-sm group-hover:shadow-lg ${
                            activeCategory === "All" || !activeCategory
                                ? 'border-[#4b1b68] ring-4 ring-[#4b1b68]/20 bg-[#4b1b68] text-white shadow-[#4b1b68]/30' 
                                : 'border-slate-100 bg-purple-50 text-[#4b1b68] hover:border-[#4b1b68]/40'
                        }`}>
                            <img 
                                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80" 
                                alt="All" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className={`text-xs font-extrabold text-center whitespace-nowrap tracking-tight transition-colors ${
                            activeCategory === "All" || !activeCategory ? 'text-[#4b1b68]' : 'text-slate-700'
                        }`}>
                            All Categories
                        </span>
                    </button>

                    {/* Dynamic Category List */}
                    {displayCategories.map((cat, idx) => {
                        const categoryName = typeof cat === 'string' ? cat : cat.name;
                        const isSelected = activeCategory === categoryName;
                        const catImage = cat.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop&q=80";

                        return (
                            <button
                                key={cat._id || idx}
                                onClick={() => {
                                    if (onSelectCategory) onSelectCategory(categoryName, cat._id);
                                }}
                                className={`flex flex-col items-center gap-2 min-w-[80px] snap-center transition-all duration-300 group cursor-pointer ${
                                    isSelected ? 'scale-105' : 'opacity-90 hover:opacity-100 hover:-translate-y-1'
                                }`}
                            >
                                <div className={`w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden border-[3px] flex items-center justify-center transition-all duration-300 relative shadow-sm group-hover:shadow-lg ${
                                    isSelected 
                                        ? 'border-[#4b1b68] ring-4 ring-[#4b1b68]/20 shadow-[#4b1b68]/30' 
                                        : 'border-slate-100 bg-slate-50 hover:border-[#4b1b68]/40'
                                }`}>
                                    <SafeImage
                                        src={getImageUrl(catImage)}
                                        alt={categoryName}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        fallback="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop&q=80"
                                    />
                                </div>
                                <span className={`text-xs font-extrabold text-center whitespace-nowrap tracking-tight transition-colors capitalize ${
                                    isSelected ? 'text-[#4b1b68]' : 'text-slate-700'
                                }`}>
                                    {categoryName}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* 2. Sub-Category / Material Filter Pills Row */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar">
                    {defaultMaterials.map((mat) => {
                        const isMatActive = selectedMaterial === mat;
                        return (
                            <button
                                key={mat}
                                onClick={() => setSelectedMaterial(mat)}
                                className={`px-5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                    isMatActive 
                                        ? 'bg-[#7a3299] text-white shadow-sm' 
                                        : 'bg-white border border-slate-200/90 text-slate-700 hover:border-[#7a3299]'
                                }`}
                            >
                                {mat}
                            </button>
                        );
                    })}
                    <button 
                        onClick={onSelectCategory}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-white border border-slate-200/90 text-slate-700 flex items-center gap-1.5 hover:border-[#7a3299] transition-all cursor-pointer shadow-2xs ml-auto"
                    >
                        <SlidersHorizontal size={14} className="text-[#7a3299]" />
                        Filter
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CategoryScroll;
