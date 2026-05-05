import React, { useState, useEffect } from 'react';
import { X, Check, Search, Plus, Minus, Wand2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../../utils/api';
import { cn } from '../../../../utils/cn';

const StyleAddonModal = ({ isOpen, onClose, selectedAddons = [], onUpdate, category }) => {
    const [addons, setAddons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAddons = async () => {
            if (!isOpen) return;
            setIsLoading(true);
            try {
                // Determine search category - mapping known UI categories to DB synonyms if needed
                let searchCat = category?.name || category || '';

                // Fetch addons. Try specific category first, then fallback to all if needed
                const response = await api.get(`/style-addons?isActive=true${searchCat ? `&category=${searchCat}` : ''}`);

                if (response.data.success) {
                    // If no specific category items found, fetch all as fallback so user isn't stuck
                    if (response.data.data.length === 0 && searchCat) {
                        const allResponse = await api.get('/style-addons?isActive=true');
                        setAddons(allResponse.data.data);
                    } else {
                        setAddons(response.data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch style addons:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAddons();
    }, [isOpen, category]);

    const filteredAddons = addons.filter(addon =>
        addon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleAddon = (addon) => {
        const isSelected = selectedAddons.some(a => a._id === addon._id);
        if (isSelected) {
            onUpdate(selectedAddons.filter(a => a._id !== addon._id));
        } else {
            onUpdate([...selectedAddons, addon]);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ y: '100%', opacity: 0.5 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0.5 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl z-10"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#2D2F6E] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <Wand2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none">Style Add-ons</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Customize Your Fit</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-6 py-4 bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search styles (e.g. Pockets, Embroidery)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs focus:ring-2 focus:ring-[#2D2F6E]/10 focus:outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-10 h-10 border-2 border-[#2D2F6E] border-t-transparent rounded-full font-black"
                                />
                                <p className="text-[10px] font-black uppercase tracking-widest">Designing Options...</p>
                            </div>
                        ) : filteredAddons.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No matching styles found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredAddons.map((addon) => {
                                    const isSelected = selectedAddons.some(a => a._id === addon._id);
                                    return (
                                        <motion.div
                                            key={addon._id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleAddon(addon)}
                                            className={cn(
                                                "p-4 rounded-[1.5rem] border transition-all cursor-pointer flex items-center gap-4 group",
                                                isSelected
                                                    ? "border-[#2D2F6E] bg-indigo-50/30 shadow-sm"
                                                    : "border-gray-100 bg-white hover:border-[#2D2F6E]/30"
                                            )}
                                        >
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                                                <img
                                                    src={addon.image}
                                                    alt={addon.name}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544441893-675973e31d85?w=200'; }}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-black text-gray-900 leading-none mb-1">{addon.name}</h4>
                                                <p className="text-[10px] text-gray-400 line-clamp-1 font-medium">{addon.description}</p>
                                                <p className="text-xs font-black text-[#2D2F6E] mt-2">+₹{addon.price}</p>
                                            </div>
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                                isSelected ? "bg-[#2D2F6E] text-white" : "bg-gray-50 text-gray-300"
                                            )}>
                                                {isSelected ? <Check size={18} /> : <Plus size={18} />}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-white pt-safe">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Add-ons</p>
                            <p className="text-lg font-black text-gray-900 leading-none mt-1">₹{selectedAddons.reduce((sum, a) => sum + a.price, 0)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-[#2D2F6E] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                        >
                            Confirm Selection
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StyleAddonModal;
