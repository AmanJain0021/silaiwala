// Port of components/service-detail/StyleAddonModal.jsx (logic verbatim)
import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Search, Plus, Wand2, Info } from 'lucide-react-native';
import api from '../../../lib/api';
import { getImageUrl } from '../../../utils/imageUrl';
import { Sheet } from '../../ui/Sheet';
import Spin from '../../ui/Spin';
import { Box, Txt, Btn, Img, I, Input, Scroll } from '../../ui/primitives';

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

    return (
        <Sheet visible={!!isOpen} onClose={onClose} className="w-full bg-white rounded-t-[2.5rem] shadow-2xl" backdropClassName="bg-black/40" style={{ maxHeight: '90%' }}>
            <Box className="p-6 flex items-center justify-between border-b border-gray-50">
                <Box className="flex items-center gap-3 flex-1">
                    <Box className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <I icon={Wand2} size={18} color="#843D9B" />
                    </Box>
                    <Box className="flex-1">
                        <Txt className="text-lg font-black text-gray-900 tracking-tight leading-none">Style Add-ons</Txt>
                        <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{categoryName || serviceTitle || 'This service'}</Txt>
                    </Box>
                </Box>
                <Btn onPress={onClose} className="p-2.5 bg-gray-50 rounded-xl">
                    <I icon={X} size={20} color="#9ca3af" />
                </Btn>
            </Box>
            <Box className="px-6 py-4 bg-gray-50/50">
                <Box className="relative justify-center">
                    <Box className="absolute left-3.5 z-10"><I icon={Search} size={16} color="#9ca3af" /></Box>
                    <Input placeholder="Search styles (e.g. Pockets, Embroidery)" value={searchTerm} onChangeText={setSearchTerm}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs placeholder:text-gray-400" />
                </Box>
            </Box>
            <Scroll style={{ flexShrink: 1 }} contentClassName="p-6 space-y-4">
                {isLoading ? (
                    <Box className="flex flex-col items-center justify-center py-14">
                        <Spin size={28} color="#843D9B" style={{ marginBottom: 12 }} />
                        <Txt className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading add-ons…</Txt>
                    </Box>
                ) : filteredAddons.length === 0 ? (
                    <Box className="items-center py-12">
                        <I icon={Info} size={28} color="#d1d5db" style={{ marginBottom: 12 }} />
                        <Txt className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center">No style add-ons for this service</Txt>
                        <Txt className="text-[10px] text-gray-400 mt-2 px-6 text-center">Add them in Admin → Style Add-ons (for this category or Universal / All), or under Admin → Services for this category.</Txt>
                    </Box>
                ) : (
                    filteredAddons.map((addon) => {
                        const isSelected = selectedAddons.some((a) => a._id === addon._id);
                        return (
                            <Btn key={addon._id} onPress={() => toggleAddon(addon)} className={`w-full text-left p-4 rounded-2xl border flex items-center gap-3 ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-100 bg-white'}`}>
                                {addon.image ? (
                                    <Img src={getImageUrl(addon.image)} alt={addon.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                                ) : (
                                    <Box className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                        <I icon={Wand2} size={18} color="#843D9B" />
                                    </Box>
                                )}
                                <Box className="flex-1 min-w-0">
                                    <Txt className="text-sm font-black text-gray-900 truncate">{addon.name}</Txt>
                                    {!!addon.description && <Txt className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{addon.description}</Txt>}
                                    <Txt className="text-xs font-black text-primary mt-1">₹{addon.price}</Txt>
                                </Box>
                                <Box className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}>
                                    <I icon={isSelected ? Check : Plus} size={16} color={isSelected ? '#fff' : '#d1d5db'} />
                                </Box>
                            </Btn>
                        );
                    })
                )}
            </Scroll>
            <Box className="p-5 border-t border-gray-50 bg-white">
                <Btn onPress={onClose} className="w-full py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl">
                    {`Done${selectedAddons.length > 0 ? ` · ${selectedAddons.length} selected` : ''}`}
                </Btn>
            </Box>
        </Sheet>
    );
};

export default StyleAddonModal;
