import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, ShoppingBag, CheckCircle2, ChevronRight, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import api from '../../../utils/api';
import DesignDetailModal from '../components/DesignDetailModal';

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
                return { ...prev, [categoryId]: current.filter(d => d.id !== design.id) };
            }
            return { ...prev, [categoryId]: [...current, design] };
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

    return (
        <div className="min-h-screen bg-[#FDFBF9] pb-40 font-sans selection:bg-[#3c1e2f] selection:text-[#E2C17D]">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#FDFBF9]/90 backdrop-blur-xl border-b border-gray-100">
                <div className="px-5 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-white transition-all active:scale-90 shadow-sm">
                            <ArrowLeft size={22} className="text-gray-900" />
                        </button>
                        <div>
                            {selectedCategory ? (
                                <>
                                    <h1 className="text-lg font-black text-[#3c1e2f] leading-none">{selectedCategory.name}</h1>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Premium Customization</p>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-lg font-black text-[#3c1e2f] leading-none">Select Category</h1>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-0">Hidden</p>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Cart Icon (just visual) */}
                    <button className="relative p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors">
                        <ShoppingBag size={20} />
                        {totalSelected > 0 && (
                            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#3c1e2f] rounded-full border-2 border-[#FDFBF9]"></div>
                        )}
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-3 mt-4 space-y-4 sm:space-y-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-[#E2C17D] animate-spin" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Curating Styles...</p>
                    </div>
                ) : categories.length > 0 ? (
                    <AnimatePresence mode="wait">
                        {!selectedCategory ? (
                            <motion.div 
                                key="category-list"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4 sm:space-y-6"
                            >
                                {/* Hero Title */}
                                <div className="text-center mb-6 mt-2">
                                    <p className="text-[8px] font-black text-[#CEAA69] uppercase tracking-[0.2em] mb-2">Tailoring Studio</p>
                                    <h2 className="text-2xl sm:text-[32px] font-black text-[#3c1e2f] leading-[1.1] tracking-tight">Design Your<br />Masterpiece</h2>
                                    <div className="w-10 h-[2px] bg-[#CEAA69]/30 mx-auto mt-4 rounded-full"></div>
                                </div>

                                {/* Category Cards */}
                                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                                    {categories.map((category) => (
                                        <motion.div
                                            key={category.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedCategory(category)}
                                            className="relative w-full aspect-[4/5] bg-[#3c1e2f] rounded-3xl overflow-hidden cursor-pointer shadow-lg shadow-gray-200/50 group"
                                        >
                                            {category.designs[0] && (
                                                <img 
                                                    src={category.designs[0].image} 
                                                    alt={category.name} 
                                                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out" 
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#2a1320]/90 via-[#2a1320]/20 to-transparent" />
                                            
                                            <div className="absolute bottom-4 left-4 right-4 flex flex-col justify-end">
                                                <p className="text-[8px] font-black text-[#CEAA69] uppercase tracking-widest mb-1 shadow-sm line-clamp-1">Embellishments</p>
                                                <h3 className="text-sm sm:text-lg font-black text-white tracking-tight leading-none mb-1 line-clamp-2">{category.name}</h3>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] sm:text-[11px] font-bold text-white/70 italic">{category.designs.length}+ Styles</p>
                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#CEAA69]/30 flex items-center justify-center text-[#CEAA69] group-hover:bg-[#CEAA69] group-hover:text-[#2a1320] transition-colors">
                                                        <ChevronRight size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="design-list"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4 sm:space-y-8 mt-2"
                            >
                                {/* Subcategory Header */}
                                <div className="mb-2 px-1 text-center sm:text-left">
                                    <h2 className="text-xl sm:text-2xl font-black text-[#3c1e2f] tracking-tight mb-2">Curate Your Silhouette</h2>
                                    <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed font-medium">Select from our signature atelier {selectedCategory.name.toLowerCase()}. Each design is meticulously measured and drafted to enhance the shape of your garment.</p>
                                </div>

                                {/* Design Cards */}
                                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                                    {selectedCategory.designs.map((design) => {
                                        const isSelected = selectedDesigns[selectedCategory.id]?.find(d => d.id === design.id);
                                        return (
                                            <div key={design.id} className="flex flex-col gap-2">
                                                <motion.div
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        setDetailDesign(design);
                                                        setIsDetailModalOpen(true);
                                                    }}
                                                    className={cn(
                                                        "relative w-full aspect-[4/5] rounded-[1.5rem] overflow-hidden cursor-pointer bg-gray-900 shadow-lg group",
                                                        isSelected ? "ring-2 ring-[#CEAA69]" : ""
                                                    )}
                                                >
                                                    <img 
                                                        src={design.image} 
                                                        alt={design.name} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100" 
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                    
                                                    <div className="absolute bottom-4 left-4 right-4">
                                                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight mb-0.5 line-clamp-2">{design.name}</h3>
                                                        <p className="text-[8px] sm:text-[9px] font-bold text-white/70 tracking-wide line-clamp-1">
                                                            {design.description || 'Timeless & Classic'}
                                                        </p>
                                                    </div>
                                                    
                                                    {isSelected && (
                                                        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-[#CEAA69] p-1 rounded-full border border-[#CEAA69]/50 shadow-lg">
                                                            <CheckCircle2 size={16} className="fill-[#CEAA69] text-[#2a1320]" />
                                                        </div>
                                                    )}
                                                </motion.div>
                                                
                                                {/* Price & Tag Strip */}
                                                <div className="px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/50 pb-3 gap-1">
                                                    <div className="flex items-baseline gap-0.5">
                                                        <span className="text-[#CEAA69] font-serif text-sm sm:text-base leading-none">₹</span>
                                                        <span className="text-sm sm:text-lg font-black text-[#CEAA69] leading-none tracking-tight">{design.price}</span>
                                                    </div>
                                                    <p className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                        {design.price === 0 ? 'Complimentary' : 'Bespoke Finish'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                ) : (
                    <div className="bg-white rounded-[2rem] p-10 text-center border border-dashed border-gray-200">
                        <Sparkles className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-sm font-black text-gray-900 uppercase">No Designs Available</h3>
                        <p className="text-[10px] text-gray-400 mt-2">Come back later for new premium embellishments.</p>
                    </div>
                )}
            </div>

            {/* Design Detail Modal */}
            {isDetailModalOpen && detailDesign && (
                <DesignDetailModal 
                    design={detailDesign}
                    isSelected={selectedDesigns[detailDesign.categoryId]?.find(d => d.id === detailDesign.id)}
                    onToggle={() => toggleDesign(detailDesign.categoryId, detailDesign)}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Embellishments;
