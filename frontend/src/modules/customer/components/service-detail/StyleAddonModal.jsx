import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Search, Plus, Wand2, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../../utils/api';
import { cn } from '../../../../utils/cn';

/**
 * Style Add-ons sources:
 * 1) Admin → Style Add-ons catalog (/admin/style-addons)
 *    - category === service category → that service only
 *    - category === "All" (universal) → every service
 * 2) Admin → Services → category.styleAddons (embedded per category)
 */
const normalizeCat = (value) => String(value || '').toLowerCase().trim();

const isUniversalCategory = (addonCategory) => {
    const c = normalizeCat(addonCategory);
    return !c || c === 'all' || c === 'universal' || c === 'all services' || c === 'all categories';
};

const matchesServiceCategory = (addonCategory, serviceCategory) => {
    const addonCat = normalizeCat(addonCategory);
    const serviceCat = normalizeCat(serviceCategory);
    if (!serviceCat) return false;
    if (addonCat === serviceCat) return true;
    // Flexible match: "Pajama" ↔ "Pajamas" / partial names
    return serviceCat.includes(addonCat) || addonCat.includes(serviceCat);
};

const StyleAddonModal = ({
    isOpen,
    onClose,
    selectedAddons = [],
    onUpdate,
    category,
    serviceTitle,
    directStyleAddons = [],
}) => {
    const [catalogAddons, setCatalogAddons] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const categoryName = (typeof category === 'object' ? category?.name : category) || '';
    const categoryAddonsFromSchema =
        directStyleAddons?.length > 0
            ? directStyleAddons
            : (typeof category === 'object' ? category?.styleAddons : null) || [];

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        const fetchAddons = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/style-addons?isActive=true&addonType=embellishment');
                if (cancelled) return;
                const list = response.data?.success ? response.data.data || [] : [];
                setCatalogAddons(Array.isArray(list) ? list : []);
            } catch (error) {
                if (error?.name === 'CanceledError') return;
                console.error('Failed to fetch style addons:', error);
                if (!cancelled) setCatalogAddons([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchAddons();
        return () => {
            cancelled = true;
        };
    }, [isOpen]);

    const addons = useMemo(() => {
        const schemaItems = (categoryAddonsFromSchema || [])
            .filter((item) => item?.name?.trim())
            .map((item, i) => ({
                _id: item._id || `cat_addon_${i}_${normalizeCat(item.name).replace(/[^a-z0-9]/g, '')}`,
                name: item.name,
                price: item.price || 0,
                description: item.description || '',
                image: item.image || '',
                category: categoryName || 'Service Custom',
                _source: 'schema',
            }));

        const fromCatalog = (catalogAddons || []).filter((addon) => {
            if (addon?.isActive === false) return false;
            if (isUniversalCategory(addon.category)) return true;
            return matchesServiceCategory(addon.category, categoryName);
        });

        const combined = [...schemaItems];
        fromCatalog.forEach((item) => {
            const already = combined.some(
                (c) => normalizeCat(c.name) === normalizeCat(item.name)
            );
            if (!already) {
                combined.push({
                    ...item,
                    _source: 'catalog',
                });
            }
        });

        return combined;
    }, [catalogAddons, categoryAddonsFromSchema, categoryName]);

    const filteredAddons = addons.filter((addon) =>
        addon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleAddon = (addon) => {
        const isSelected = selectedAddons.some((a) => a._id === addon._id);
        if (isSelected) {
            onUpdate(selectedAddons.filter((a) => a._id !== addon._id));
        } else {
            onUpdate([...selectedAddons, addon]);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-6 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-primary">
                                <Wand2 size={18} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                                    Style Add-ons
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                    {categoryName || serviceTitle || 'This service'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="px-6 py-4 bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search styles (e.g. Pockets, Embroidery)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs focus:ring-2 focus:ring-[#843D9B]/10 focus:outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                                <Loader2 size={28} className="animate-spin mb-3 text-primary" />
                                <p className="text-xs font-bold uppercase tracking-widest">Loading add-ons…</p>
                            </div>
                        ) : filteredAddons.length === 0 ? (
                            <div className="text-center py-12">
                                <Info size={28} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                    No style add-ons for this service
                                </p>
                                <p className="text-[10px] text-gray-400 mt-2 px-6">
                                    Add them in Admin → Style Add-ons (for this category or Universal / All),
                                    or under Admin → Services for this category.
                                </p>
                            </div>
                        ) : (
                            filteredAddons.map((addon) => {
                                const isSelected = selectedAddons.some((a) => a._id === addon._id);
                                return (
                                    <button
                                        key={addon._id}
                                        type="button"
                                        onClick={() => toggleAddon(addon)}
                                        className={cn(
                                            'w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3',
                                            isSelected
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-gray-100 bg-white hover:border-gray-200'
                                        )}
                                    >
                                        {addon.image ? (
                                            <img
                                                src={addon.image}
                                                alt={addon.name}
                                                className="w-14 h-14 rounded-xl object-cover shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-indigo-50 text-primary flex items-center justify-center shrink-0">
                                                <Wand2 size={18} />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate">{addon.name}</p>
                                            {addon.description && (
                                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                                                    {addon.description}
                                                </p>
                                            )}
                                            <p className="text-xs font-black text-primary mt-1">₹{addon.price}</p>
                                        </div>
                                        <div
                                            className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border',
                                                isSelected
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'bg-white border-gray-200 text-gray-300'
                                            )}
                                        >
                                            {isSelected ? <Check size={16} /> : <Plus size={16} />}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div className="p-5 border-t border-gray-50 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary-dark transition-all"
                        >
                            Done{selectedAddons.length > 0 ? ` · ${selectedAddons.length} selected` : ''}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StyleAddonModal;
