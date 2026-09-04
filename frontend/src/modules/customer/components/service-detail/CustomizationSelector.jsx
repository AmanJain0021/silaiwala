import React, { useState, useMemo, useEffect } from 'react';
import { Scissors, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import api from '../../../../utils/api';
import { toast } from 'react-hot-toast';

const CUSTOMIZATION_SLOTS = [
    { key: 'neck', label: 'Neck Design', icon: '✂️' },
    { key: 'sleeve', label: 'Sleeve Style', icon: '👔' },
    { key: 'bottom', label: 'Bottom Style', icon: '👖' },
    { key: 'embroidery', label: 'Embroidery Work', icon: '🪡' },
    { key: 'lacePiping', label: 'Lace / Piping', icon: '🎀' },
    { key: 'lining', label: 'Inner Lining', icon: '🧵' },
];

const matchesCategory = (addonCat, serviceCat) => {
    if (!addonCat || addonCat === 'All') return true;
    if (!serviceCat) return true;
    const aCat = addonCat.toLowerCase().trim();
    const sCat = serviceCat.toLowerCase().trim();
    return sCat.includes(aCat) || aCat.includes(sCat);
};

const CustomizationSelector = ({ categoryName = '', catalogAddons = [], selectedCustomizations = {}, onChange }) => {
    // Determine which slots have catalog options added by admin for this service category
    const availableSlots = useMemo(() => {
        return CUSTOMIZATION_SLOTS.filter((slot) => {
            // 1. Garment type filters (Top-only vs Bottom-only)
            if (categoryName) {
                const cat = categoryName.toLowerCase();
                const isBottomOnly = ['pant', 'trouser', 'salwar', 'palazzo', 'skirt', 'pyjama', 'pajama', 'churidar', 'sharara', 'garara', 'lower', 'bottom', 'jeans'].some(b => cat.includes(b));
                const isTopOnly = ['blouse', 'top', 'shirt', 'crop top', 'croptop', 'vest', 'jacket', 'waistcoat'].some(t => cat.includes(t));

                if (isBottomOnly && (slot.key === 'neck' || slot.key === 'sleeve')) return false;
                if (isTopOnly && slot.key === 'bottom') return false;
            }

            // 2. Check if admin added catalog options for this slot & category
            const hasCatalogOptions = catalogAddons.some((a) => {
                const isStyleAddon = a.addonType === 'embellishment' || a.addonType === 'styleAddon' || a.addonType === 'addon';
                if (isStyleAddon) return false;
                if (a.customizationType !== slot.key) return false;
                if (a.isActive === false) return false;
                return matchesCategory(a.category, categoryName);
            });

            // 3. Check if user already has an active selection/custom detail for this slot
            const slotData = selectedCustomizations[slot.key];
            const hasUserSelection = Boolean(slotData && slotData.enabled && (slotData.name || slotData.refImage));

            // Slot is visible ONLY if admin added options for this service or user selected data
            return hasCatalogOptions || hasUserSelection;
        });
    }, [categoryName, catalogAddons, selectedCustomizations]);

    const [openSlot, setOpenSlot] = useState(() => availableSlots[0]?.key || null);

    useEffect(() => {
        // Only adjust if openSlot is set to something that no longer exists in availableSlots
        if (openSlot && availableSlots.length > 0 && !availableSlots.some(s => s.key === openSlot)) {
            setOpenSlot(availableSlots[0].key);
        }
    }, [availableSlots, openSlot]);

    if (availableSlots.length === 0) {
        return null; // Return nothing if admin hasn't added options for any slot for this service
    }

    const handleSelectCatalogOption = (slotKey, option) => {
        const current = selectedCustomizations[slotKey];
        if (current && current.name === option.name && current.enabled && !current.isCustom) {
            // Deselect
            onChange({
                ...selectedCustomizations,
                [slotKey]: { name: '', price: 0, refImage: '', enabled: false, isCustom: false }
            });
        } else {
            // Select catalog option
            onChange({
                ...selectedCustomizations,
                [slotKey]: {
                    name: option.name,
                    price: Number(option.price) || 0,
                    refImage: option.image || '',
                    addonId: option._id,
                    enabled: true,
                    isCustom: false
                }
            });
        }
    };

    const handleCustomNameChange = (slotKey, nameStr) => {
        const current = selectedCustomizations[slotKey] || {};
        onChange({
            ...selectedCustomizations,
            [slotKey]: {
                ...current,
                name: nameStr,
                price: current.isCustom ? (current.price || 0) : 0,
                enabled: !!nameStr || !!current.refImage || current.price > 0,
                isCustom: true
            }
        });
    };

    const countActive = Object.values(selectedCustomizations || {}).filter(item => item && item.enabled && (item.name || item.refImage)).length;

    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-primary shadow-xs">
                        <Scissors size={20} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest leading-tight flex items-center gap-2">
                            Garment Customizations
                            {countActive > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black">
                                    {countActive} Selected
                                </span>
                            )}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">
                            Select catalog design options for this service
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {availableSlots.map((slot) => {
                    const isOpen = openSlot === slot.key;
                    const slotData = selectedCustomizations[slot.key] || { name: '', price: 0, refImage: '', enabled: false };

                    // Filter catalog options strictly applicable to this slot & category
                    const slotOptions = catalogAddons.filter((a) => {
                        const isStyleAddon = a.addonType === 'embellishment' || a.addonType === 'styleAddon' || a.addonType === 'addon';
                        if (isStyleAddon) return false;
                        if (a.customizationType !== slot.key) return false;
                        if (a.isActive === false) return false;
                        return matchesCategory(a.category, categoryName);
                    });

                    return (
                        <div
                            key={slot.key}
                            className={`rounded-2xl border transition-all overflow-hidden ${
                                slotData.enabled && (slotData.name || slotData.refImage)
                                    ? 'border-purple-300 bg-purple-50/30 shadow-xs'
                                    : 'border-gray-100 bg-gray-50/40'
                            }`}
                        >
                            {/* Accordion Header */}
                            <button
                                type="button"
                                onClick={() => setOpenSlot(isOpen ? null : slot.key)}
                                className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-sm">{slot.icon}</span>
                                    <span className="text-xs font-black text-gray-800 tracking-wider uppercase">
                                        {slot.label}
                                    </span>

                                    {slotData.enabled && slotData.name && (
                                        <span className="text-[10px] font-bold text-primary bg-purple-100 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                                            {slotData.name} {slotData.price > 0 ? `(+₹${slotData.price})` : ''}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {slotData.enabled && (slotData.name || slotData.refImage) && (
                                        <CheckCircle2 size={16} className="text-green-500" />
                                    )}
                                    {isOpen ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-gray-400" />}
                                </div>
                            </button>

                            {/* Accordion Body */}
                            {isOpen && (
                                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100/60 bg-white">
                                    {/* Catalog Options Grid */}
                                    {slotOptions.length > 0 && (
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                                                Choose Catalog Option
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {slotOptions.map((opt) => {
                                                    const isSelected = slotData.name === opt.name && !slotData.isCustom && slotData.enabled;
                                                    return (
                                                        <div
                                                            key={opt._id}
                                                            onClick={() => handleSelectCatalogOption(slot.key, opt)}
                                                            className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
                                                                isSelected
                                                                    ? 'border-primary bg-purple-50/80 shadow-md ring-2 ring-primary/20'
                                                                    : 'border-gray-200 bg-gray-50/60 hover:border-purple-200'
                                                            }`}
                                                        >
                                                            {opt.image && (
                                                                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-1.5 bg-gray-100">
                                                                    <img src={opt.image} alt={opt.name} className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h4 className="text-[11px] font-black text-gray-900 leading-tight truncate">
                                                                    {opt.name}
                                                                </h4>
                                                                <span className="text-[10px] font-black text-primary block mt-0.5">
                                                                    {opt.price > 0 ? `+₹${opt.price}` : 'Included'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Name Details */}
                                    <div className="pt-2">
                                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">
                                            Or Type Custom Details
                                        </label>
                                        <input
                                            type="text"
                                            value={slotData.isCustom ? (slotData.name || '') : ''}
                                            onChange={(e) => handleCustomNameChange(slot.key, e.target.value)}
                                            placeholder={`Specify custom ${slot.label.toLowerCase()} (e.g. Deep V Neck)...`}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-primary focus:bg-white transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomizationSelector;

