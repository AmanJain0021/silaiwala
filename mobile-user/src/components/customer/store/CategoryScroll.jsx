// Port of modules/customer/components/store/CategoryScroll.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, ArrowLeft, SlidersHorizontal } from "lucide-react-native";
import api from "../../../lib/api";
import { getImageUrl } from "../../../utils/imageUrl";
import SafeImage from "../../common/SafeImage";
import { Box, Btn, Img, Txt, I, Scroll } from '../../ui/primitives';
const defaultMaterials = ["All", "Cotton", "Linen", "Silk", "Lawn"];
const CategoryScroll = ({
  onSelectCategory,
  activeCategory,
  productType = 'store_item'
}) => {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState("All");
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Fetch store categories matching productType and exclude stitching services
      const response = await api.get('/products/categories', {
        params: {
          type: productType || 'product'
        }
      }).catch(() => null);
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

  // Exclude stitching service categories from Store category scroll bar
  const displayCategories = categories.filter(cat => {
    if (!cat) return false;
    const catType = typeof cat === 'string' ? '' : (cat.type || '').toLowerCase();
    if (catType === 'service') return false;
    return true;
  });
  return <Box className="bg-white py-3 border-b border-slate-100 transition-all duration-300">
            <Box className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 space-y-3">
                
                {/* 1. Category Circular Avatars Row */}
                <Scroll contentClassName="flex overflow-x-auto gap-5 md:gap-8 py-3 px-2 md:justify-center no-scrollbar snap-x relative items-start" horizontal>
                    {/* All Categories Pill */}
                    <Btn onPress={() => {
          if (onSelectCategory) onSelectCategory("All", null);
        }} className={`flex flex-col items-center gap-2 min-w-[80px] snap-center transition-all duration-300 group cursor-pointer ${activeCategory === "All" || !activeCategory ? 'scale-105' : 'opacity-90 hover:opacity-100 hover:-translate-y-1'}`}>
                        <Box className={`w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden border-[3px] flex items-center justify-center transition-all duration-300 relative shadow-sm group-hover:shadow-lg ${activeCategory === "All" || !activeCategory ? 'border-[#843D9B] ring-4 ring-[#843D9B]/20 bg-[#843D9B] text-white shadow-[#843D9B]/30' : 'border-slate-100 bg-purple-50 text-[#843D9B] hover:border-[#843D9B]/40'}`}>
                            <Img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80" alt="All" className="w-full h-full object-cover" />
                        </Box>
                        <Txt className={`text-xs font-extrabold text-center whitespace-nowrap tracking-tight transition-colors ${activeCategory === "All" || !activeCategory ? 'text-[#843D9B]' : 'text-slate-700'}`}>
                            All Categories
                        </Txt>
                    </Btn>

                    {/* Dynamic Category List */}
                    {displayCategories.map((cat, idx) => {
          const categoryName = typeof cat === 'string' ? cat : cat.name;
          const isSelected = activeCategory === categoryName;
          const catImage = cat.image || "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop&q=80";
          return <Btn key={cat._id || idx} onPress={() => {
            if (onSelectCategory) onSelectCategory(categoryName, cat._id);
          }} className={`flex flex-col items-center gap-2 min-w-[80px] snap-center transition-all duration-300 group cursor-pointer ${isSelected ? 'scale-105' : 'opacity-90 hover:opacity-100 hover:-translate-y-1'}`}>
                                <Box className={`w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-full overflow-hidden border-[3px] flex items-center justify-center transition-all duration-300 relative shadow-sm group-hover:shadow-lg ${isSelected ? 'border-[#843D9B] ring-4 ring-[#843D9B]/20 shadow-[#843D9B]/30' : 'border-slate-100 bg-slate-50 hover:border-[#843D9B]/40'}`}>
                                    <SafeImage src={getImageUrl(catImage)} alt={categoryName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" fallback="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=300&auto=format&fit=crop&q=80" />
                                </Box>
                                <Txt className={`text-xs font-extrabold text-center whitespace-nowrap tracking-tight transition-colors capitalize ${isSelected ? 'text-[#843D9B]' : 'text-slate-700'}`}>
                                    {categoryName}
                                </Txt>
                            </Btn>;
        })}
                </Scroll>

                {/* 2. Sub-Category / Material Filter Pills Row */}
                <Scroll contentClassName="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar" horizontal>
                    {defaultMaterials.map(mat => {
          const isMatActive = selectedMaterial === mat;
          return <Btn key={mat} onPress={() => setSelectedMaterial(mat)} className={`px-5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${isMatActive ? 'bg-[#843D9B] text-white shadow-sm' : 'bg-white border border-slate-200/90 text-slate-700 hover:border-[#843D9B]'}`}>
                                {mat}
                            </Btn>;
        })}
                    <Btn onPress={onSelectCategory} className="px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-white border border-slate-200/90 text-slate-700 flex items-center gap-1.5 hover:border-[#843D9B] transition-all cursor-pointer shadow-2xs ml-auto">
                        <I icon={SlidersHorizontal} size={14} className="text-[#843D9B]" />
                        Filter
                    </Btn>
                </Scroll>

            </Box>
        </Box>;
};
export default CategoryScroll;