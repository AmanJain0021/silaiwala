// Port of modules/customer/pages/Embroidery.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState, useEffect } from "react";
import { useNavigate } from '../lib/nav';
import { cn } from "../lib/cn";
import api from "../lib/api";
import DesignDetailModal from "../components/customer/DesignDetailModal";
import { ArrowLeft, Sparkles, Scissors, ShoppingBag, CheckCircle2, ChevronRight, Info, Loader2, Feather } from "lucide-react-native";
import Screen from '../components/common/Screen';
import { Box, Btn, I, Txt, Img, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const EmbroideryPage = () => {
  const navigate = useNavigate();
  const [selectedDesigns, setSelectedDesigns] = useState({});
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailDesign, setDetailDesign] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const res = await api.get('/style-addons?isActive=true&addonType=embroidery');
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
  const calculateTotal = () => {
    return Object.values(selectedDesigns).flat().reduce((sum, d) => sum + d.price, 0);
  };
  return <Screen className="bg-[#F7F8FC]">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <Box className="px-5 py-6 flex items-center justify-between">
                    <Box className="flex items-center gap-3">
                        <Btn onPress={() => navigate('/user')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-all active:scale-90">
                            <I icon={ArrowLeft} size={22} className="text-gray-900" />
                        </Btn>
                        <Box>
                            <Txt className="text-lg font-black text-gray-900 leading-none">Embroidery Hub</Txt>
                            <Txt className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Custom Art for your outfits</Txt>
                        </Box>
                    </Box>
                    <Box className="w-10 h-10 rounded-2xl bg-[#843D9B] flex items-center justify-center text-[#E2C17D] shadow-lg shadow-[#843D9B]/20">
                        <I icon={Feather} size={20} />
                    </Box>
                </Box>
            </Box>

            <Scroll className="flex-1" contentClassName="px-4 mt-6 space-y-8 pb-40">
                {isLoading ? <Box className="flex flex-col items-center justify-center py-20">
                        <Spin className="w-8 h-8 text-primary animate-spin" />
                        <Txt className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Loading Designs...</Txt>
                    </Box> : categories.length > 0 ? categories.map(category => <Box key={category.id} className="space-y-4">
                            <Box className="flex justify-between items-end px-2">
                                <Box>
                                    <Txt className="text-sm font-black text-gray-900 uppercase tracking-widest">{category.name}</Txt>
                                    <Txt className="text-[10px] text-gray-400 font-bold">{category.description}</Txt>
                                </Box>
                                {selectedDesigns[category.id]?.length > 0 && <Txt className="text-[10px] font-black text-primary bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                                        {selectedDesigns[category.id].length} Selected
                                    </Txt>}
                            </Box>

                            <Box className="grid grid-cols-2 gap-4">
                                {category.designs.map(design => {
            const isSelected = selectedDesigns[category.id]?.find(d => d.id === design.id);
            return <Btn key={design.id} onPress={() => {
              setDetailDesign(design);
              setIsDetailModalOpen(true);
            }} className={cn("relative bg-white rounded-[2rem] overflow-hidden border transition-all cursor-pointer group", isSelected ? "border-primary shadow-md ring-1 ring-primary/20" : "border-gray-100 shadow-sm hover:border-indigo-200")}>
                                            <Box className="aspect-[4/3] relative">
                                                <Img src={design.image} alt={design.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <Box className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                {isSelected && <Box className="absolute top-3 right-3 bg-primary text-white p-1 rounded-full shadow-lg">
                                                        <I icon={CheckCircle2} size={14} />
                                                    </Box>}
                                                <Box className="absolute bottom-3 left-4">
                                                    <Txt className="text-[11px] font-black text-white uppercase tracking-wider">{design.name}</Txt>
                                                    <Txt className="text-[10px] font-bold text-white/80">₹{design.price}</Txt>
                                                </Box>
                                            </Box>
                                        </Btn>;
          })}
                            </Box>
                        </Box>) : <Box className="bg-white rounded-[2rem] p-10 text-center border border-dashed border-gray-200">
                        <I icon={Sparkles} className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                        <Txt className="text-sm font-black text-gray-900 uppercase">No Designs Available</Txt>
                        <Txt className="text-[10px] text-gray-400 mt-2">Come back later for new premium embellishments.</Txt>
                    </Box>}

                {/* Info Card */}
                <Box className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-10">
                    <Box className="flex items-center gap-3 mb-4">
                        <Box className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-primary">
                            <I icon={Info} size={18} />
                        </Box>
                        <Box>
                            <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest">Pricing Policy</Txt>
                            <Txt className="text-[10px] text-gray-400 font-bold">Standard rates per outfit</Txt>
                        </Box>
                    </Box>
                    <Txt className="text-[11px] text-gray-500 font-medium leading-relaxed">
                        Embellishment prices are indicative and may vary based on the length and density of the work. Our master will provide a final quote upon fabric inspection.
                    </Txt>
                </Box>
            </Scroll>



            {/* Design Detail Modal */}
            {isDetailModalOpen && detailDesign && <DesignDetailModal design={detailDesign} isSelected={selectedDesigns[detailDesign.categoryId]?.find(d => d.id === detailDesign.id)} onToggle={() => toggleDesign(detailDesign.categoryId, detailDesign)} onClose={() => setIsDetailModalOpen(false)} />}
        </Screen>;
};
export default EmbroideryPage;