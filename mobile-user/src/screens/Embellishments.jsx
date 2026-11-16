// Port of modules/customer/pages/Embellishments.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState, useEffect } from "react";
import { useNavigate } from '../lib/nav';
import { ArrowLeft, Sparkles, ShoppingBag, CheckCircle2, ChevronRight, Info, Loader2 } from "lucide-react-native";
import { cn } from "../lib/cn";
import api from "../lib/api";
import DesignDetailModal from "../components/customer/DesignDetailModal";
import Screen from '../components/common/Screen';
import { Box, Btn, I, Txt, Img, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const Embellishments = () => {
  const navigate = useNavigate();
  const [selectedDesigns, setSelectedDesigns] = useState({});
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailDesign, setDetailDesign] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // UI State for 2-step process
  const [selectedCategory, setSelectedCategory] = useState(null);
  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const res = await api.get('/style-addons?isActive=true&addonType=embellishment');
        if (res.data.success) {
          // Group add-ons by category
          const grouped = res.data.data.reduce((acc, addon) => {
            const cat = addon.category || 'General';
            if (!acc[cat]) {
              acc[cat] = {
                id: cat.toLowerCase().replace(/\s+/g, '-'),
                name: cat,
                description: `Premium ${cat} additions & finishes`,
                designs: []
              };
            }
            acc[cat].designs.push({
              id: addon._id,
              name: addon.name,
              price: addon.price,
              image: addon.image,
              description: addon.description,
              referenceImages: addon.referenceImages,
              categoryId: cat.toLowerCase().replace(/\s+/g, '-')
            });
            return acc;
          }, {});
          setCategories(Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (error) {
        console.error('Failed to fetch embellishments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAddons();
  }, []);
  const toggleDesign = (categoryId, design) => {
    setSelectedDesigns(prev => {
      const current = prev[categoryId] || [];
      if (current.find(d => d.id === design.id)) {
        return {
          ...prev,
          [categoryId]: current.filter(d => d.id !== design.id)
        };
      }
      return {
        ...prev,
        [categoryId]: [...current, design]
      };
    });
  };
  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      navigate('/user');
    }
  };
  const totalSelected = Object.values(selectedDesigns).flat().length;
  return <Screen className="bg-[#FDFBF9]">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-[#FDFBF9]/90 backdrop-blur-xl border-b border-gray-100">
                <Box className="px-5 py-6 flex items-center justify-between">
                    <Box className="flex items-center gap-3">
                        <Btn onPress={handleBack} className="p-2 -ml-2 rounded-full hover:bg-white transition-all active:scale-90 shadow-sm">
                            <I icon={ArrowLeft} size={22} className="text-gray-900" />
                        </Btn>
                        <Box>
                            {selectedCategory ? <>
                                    <Txt className="text-lg font-black text-[#3c1e2f] leading-none">{selectedCategory.name}</Txt>
                                    <Txt className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Premium Customization</Txt>
                                </> : <>
                                    <Txt className="text-lg font-black text-[#3c1e2f] leading-none">Select Category</Txt>
                                    <Txt className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-0">Hidden</Txt>
                                </>}
                        </Box>
                    </Box>
                    {/* Cart Icon (just visual) */}
                    <Btn className="relative p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <I icon={ShoppingBag} size={20} />
                        {totalSelected > 0 && <Box className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#3c1e2f] rounded-full border-2 border-[#FDFBF9]"></Box>}
                    </Btn>
                </Box>
            </Box>

            <Scroll className="flex-1" contentClassName="px-3 mt-4 space-y-4 pb-40">
                {isLoading ? <Box className="flex flex-col items-center justify-center py-20">
                        <Spin className="w-8 h-8 text-[#E2C17D] animate-spin" />
                        <Txt className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Curating Styles...</Txt>
                    </Box> : categories.length > 0 ? <React.Fragment>
                        {!selectedCategory ? <Box key="category-list" className="space-y-4 sm:space-y-6">
                                {/* Hero Title */}
                                <Box className="text-center mb-6 mt-2">
                                    <Txt className="text-[8px] font-black text-[#CEAA69] uppercase tracking-[0.2em] mb-2">Tailoring Studio</Txt>
                                    <Txt className="text-2xl sm:text-[32px] font-black text-[#3c1e2f] leading-[1.1] tracking-tight">Design Your{'\n'}Masterpiece</Txt>
                                    <Box className="w-10 h-[2px] bg-[#CEAA69]/30 mx-auto mt-4 rounded-full"></Box>
                                </Box>

                                {/* Category Cards */}
                                <Box className="grid grid-cols-2 gap-3 sm:gap-6">
                                    {categories.map(category => <Btn key={category.id} onPress={() => setSelectedCategory(category)} className="relative w-full aspect-[4/5] bg-[#3c1e2f] rounded-3xl overflow-hidden cursor-pointer shadow-lg shadow-gray-200/50 group">
                                            {category.designs[0] && <Img src={category.designs[0].image} alt={category.name} className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out" />}
                                            <Box className="absolute inset-0 bg-gradient-to-t from-[#2a1320]/90 via-[#2a1320]/20 to-transparent" />
                                            
                                            <Box className="absolute bottom-4 left-4 right-4 flex flex-col justify-end">
                                                <Txt className="text-[8px] font-black text-[#CEAA69] uppercase tracking-widest mb-1 shadow-sm line-clamp-1">Embellishments</Txt>
                                                <Txt className="text-sm sm:text-lg font-black text-white tracking-tight leading-none mb-1 line-clamp-2">{category.name}</Txt>
                                                <Box className="flex items-center justify-between">
                                                    <Txt className="text-[9px] sm:text-[11px] font-bold text-white/70 italic">{category.designs.length}+ Styles</Txt>
                                                    <Box className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#CEAA69]/30 flex items-center justify-center text-[#CEAA69] group-hover:bg-[#CEAA69] group-hover:text-[#2a1320] transition-colors">
                                                        <I icon={ChevronRight} size={12} />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Btn>)}
                                </Box>
                            </Box> : <Box key="design-list" className="space-y-4 sm:space-y-8 mt-2">
                                {/* Subcategory Header */}
                                <Box className="mb-2 px-1 text-center sm:text-left">
                                    <Txt className="text-xl sm:text-2xl font-black text-[#3c1e2f] tracking-tight mb-2">Curate Your Silhouette</Txt>
                                    <Txt className="text-[10px] sm:text-xs text-gray-500 leading-relaxed font-medium">Select from our signature atelier {selectedCategory.name.toLowerCase()}. Each design is meticulously measured and drafted to enhance the shape of your garment.</Txt>
                                </Box>

                                {/* Design Cards */}
                                <Box className="grid grid-cols-2 gap-3 sm:gap-6">
                                    {selectedCategory.designs.map(design => {
              const isSelected = selectedDesigns[selectedCategory.id]?.find(d => d.id === design.id);
              return <Box key={design.id} className="flex flex-col gap-2">
                                                <Btn onPress={() => {
                  setDetailDesign(design);
                  setIsDetailModalOpen(true);
                }} className={cn("relative w-full aspect-[4/5] rounded-[1.5rem] overflow-hidden cursor-pointer bg-gray-900 shadow-lg group", isSelected ? "ring-2 ring-[#CEAA69]" : "")}>
                                                    <Img src={design.image} alt={design.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100" />
                                                    <Box className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                    
                                                    <Box className="absolute bottom-4 left-4 right-4">
                                                        <Txt className="text-sm sm:text-base font-black text-white tracking-tight mb-0.5 line-clamp-2">{design.name}</Txt>
                                                        <Txt className="text-[8px] sm:text-[9px] font-bold text-white/70 tracking-wide line-clamp-1">
                                                            {design.description || 'Timeless & Classic'}
                                                        </Txt>
                                                    </Box>
                                                    
                                                    {isSelected && <Box className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-[#CEAA69] p-1 rounded-full border border-[#CEAA69]/50 shadow-lg">
                                                            <I icon={CheckCircle2} size={16} className="fill-[#CEAA69] text-[#2a1320]" />
                                                        </Box>}
                                                </Btn>
                                                
                                                {/* Price & Tag Strip */}
                                                <Box className="px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/50 pb-3 gap-1">
                                                    <Box className="flex items-baseline gap-0.5">
                                                        <Txt className="text-[#CEAA69] font-serif text-sm sm:text-base leading-none">₹</Txt>
                                                        <Txt className="text-sm sm:text-lg font-black text-[#CEAA69] leading-none tracking-tight">{design.price}</Txt>
                                                    </Box>
                                                    <Txt className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                        {design.price === 0 ? 'Complimentary' : 'Bespoke Finish'}
                                                    </Txt>
                                                </Box>
                                            </Box>;
            })}
                                </Box>
                            </Box>}
                    </React.Fragment> : <Box className="bg-white rounded-[2rem] p-10 text-center border border-dashed border-gray-200">
                        <I icon={Sparkles} className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                        <Txt className="text-sm font-black text-gray-900 uppercase">No Designs Available</Txt>
                        <Txt className="text-[10px] text-gray-400 mt-2">Come back later for new premium embellishments.</Txt>
                    </Box>}
            </Scroll>

            {/* Design Detail Modal */}
            {isDetailModalOpen && detailDesign && <DesignDetailModal design={detailDesign} isSelected={selectedDesigns[detailDesign.categoryId]?.find(d => d.id === detailDesign.id)} onToggle={() => toggleDesign(detailDesign.categoryId, detailDesign)} onClose={() => setIsDetailModalOpen(false)} />}
        </Screen>;
};
export default Embellishments;