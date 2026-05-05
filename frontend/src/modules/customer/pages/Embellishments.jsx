import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Scissors, ShoppingBag, CheckCircle2, ChevronRight, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import api from '../../../utils/api';

const Embellishments = () => {
    const navigate = useNavigate();
    const [selectedDesigns, setSelectedDesigns] = useState({});
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAddons = async () => {
            try {
                const res = await api.get('/style-addons?isActive=true');
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
                            image: addon.image
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

    const calculateTotal = () => {
        return Object.values(selectedDesigns).flat().reduce((sum, d) => sum + d.price, 0);
    };

    return (
        <div className="min-h-screen bg-[#F7F8FC] pb-40 font-sans selection:bg-[#2D2F6E] selection:text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="px-5 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-all active:scale-90">
                            <ArrowLeft size={22} className="text-gray-900" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 leading-none">Embellishments</h1>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Embadding & Finishes</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 mt-6 space-y-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Loading Designs...</p>
                    </div>
                ) : categories.length > 0 ? (
                    categories.map((category) => (
                        <section key={category.id} className="space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{category.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold">{category.description}</p>
                                </div>
                                {selectedDesigns[category.id]?.length > 0 && (
                                    <span className="text-[10px] font-black text-primary bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                                        {selectedDesigns[category.id].length} Selected
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {category.designs.map((design) => {
                                    const isSelected = selectedDesigns[category.id]?.find(d => d.id === design.id);
                                    return (
                                        <motion.div
                                            key={design.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleDesign(category.id, design)}
                                            className={cn(
                                                "relative bg-white rounded-[2rem] overflow-hidden border transition-all cursor-pointer group",
                                                isSelected ? "border-primary shadow-md ring-1 ring-primary/20" : "border-gray-100 shadow-sm hover:border-indigo-200"
                                            )}
                                        >
                                            <div className="aspect-[4/3] relative">
                                                <img src={design.image} alt={design.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                {isSelected && (
                                                    <div className="absolute top-3 right-3 bg-primary text-white p-1 rounded-full shadow-lg">
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-3 left-4">
                                                    <p className="text-[11px] font-black text-white uppercase tracking-wider">{design.name}</p>
                                                    <p className="text-[10px] font-bold text-white/80">₹{design.price}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="bg-white rounded-[2rem] p-10 text-center border border-dashed border-gray-200">
                        <Sparkles className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-sm font-black text-gray-900 uppercase">No Designs Available</h3>
                        <p className="text-[10px] text-gray-400 mt-2">Come back later for new premium embellishments.</p>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-primary">
                            <Info size={18} />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Pricing Policy</h3>
                            <p className="text-[10px] text-gray-400 font-bold">Standard rates per outfit</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                        Embellishment prices are indicative and may vary based on the length and density of the work. Our master will provide a final quote upon fabric inspection.
                    </p>
                </div>
            </div>

            {/* Bottom Panel */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-gray-100 p-4 pb-12">
                <div className="max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Add-on Total</p>
                            <h4 className="text-2xl font-black text-gray-900 leading-none">₹{calculateTotal()}</h4>
                        </div>
                        <div className="flex -space-x-2">
                            {Object.values(selectedDesigns).flat().slice(0, 3).map((d, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                                    <img src={d.image} className="w-full h-full object-cover" alt="" />
                                </div>
                            ))}
                            {Object.values(selectedDesigns).flat().length > 3 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-primary">
                                    +{Object.values(selectedDesigns).flat().length - 3}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/services')}
                        className={cn(
                            "w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg",
                            calculateTotal() > 0 ? "bg-primary text-white shadow-primary/20 active:scale-[0.98]" : "bg-gray-100 text-gray-400"
                        )}
                    >
                        {calculateTotal() > 0 ? (
                            <>Confirm Selection <ChevronRight size={16} /></>
                        ) : (
                            <>Choose Designs to Continue</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Embellishments;
