import React, { useState, useMemo, useEffect } from 'react';
import {
    Scissors,
    ChevronRight,
    CheckCircle2,
    X,
    Sparkles,
    ArrowLeft,
    Check,
    RotateCcw,
    SlidersHorizontal,
    Info,
    ChevronLeft
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- Premium Tailored SVG Icons in Theme Color ---

const NecklineIcon = ({ className = "w-5 h-5", strokeWidth = 1.8 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M4 6.5C7 5 9.5 4.5 12 4.5C14.5 4.5 17 5 20 6.5L18.5 11L15 9.5C14 13.5 13 15 12 15C11 15 10 13.5 9 9.5L5.5 11L4 6.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 4.5V15" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray="1.5 2" strokeLinecap="round" />
        <path d="M7 19.5H17" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M9 19.5V14.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M15 19.5V14.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
);

const SleeveIcon = ({ className = "w-5 h-5", strokeWidth = 1.8 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M7 4L3.5 8L6.5 19.5C6.5 20.3 7.2 21 8 21H16C16.8 21 17.5 20.3 17.5 19.5L20.5 8L17 4H7Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
        <path d="M3.5 8L8 10.5M20.5 8L16 10.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M9 4C9 5.7 10.3 7 12 7C13.7 7 15 5.7 15 4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M4.5 13L7 14M19.5 13L17 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray="1.5 1.5" />
    </svg>
);

const BottomIcon = ({ className = "w-5 h-5", strokeWidth = 1.8 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M5.5 4H18.5L19.5 7.5L18 20C18 20.6 17.5 21 17 21H13.5L12 12L10.5 21H7C6.5 21 6 20.6 6 20L4.5 7.5L5.5 4Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
        <path d="M5.5 7.5H18.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M12 4V7.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M7 21H10.5M13.5 21H17" stroke="currentColor" strokeWidth={strokeWidth + 0.4} strokeLinecap="round" />
    </svg>
);

const EmbroideryIcon = ({ className = "w-5 h-5", strokeWidth = 1.8 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M19 4L14 9.5M19 4C19.8 3.2 20.8 3.5 21.2 4C21.7 4.5 21.5 5.5 20.5 6.2L15 11.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="19.5" cy="4.5" r="0.75" fill="currentColor" />
        <path d="M14 9.5L4 19.5C3.6 19.9 3.2 20.2 3.2 20.2C3.2 20.2 3.5 19.8 3.9 19.4L10 13.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M9 4L10 6L12 7L10 8L9 10L8 8L6 7L8 6L9 4Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth={strokeWidth - 0.4} strokeLinejoin="round" />
        <path d="M16 16L16.5 17.5L18 18L16.5 18.5L16 20L15.5 18.5L14 18L15.5 17.5L16 16Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth={strokeWidth - 0.4} strokeLinejoin="round" />
        <path d="M5 11C7 9 9.5 11 12 9C14.5 7 17 9 19 7" stroke="currentColor" strokeWidth={strokeWidth - 0.4} strokeDasharray="2 2" strokeLinecap="round" />
    </svg>
);

const LaceIcon = ({ className = "w-5 h-5", strokeWidth = 1.8 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M3 6.5H21" stroke="currentColor" strokeWidth={strokeWidth + 0.4} strokeLinecap="round" />
        <path d="M3 10H21" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray="1.5 2" strokeLinecap="round" />
        <path d="M3 13.5C4.5 13.5 4.5 16.5 6 16.5C7.5 16.5 7.5 13.5 9 13.5C10.5 13.5 10.5 16.5 12 16.5C13.5 16.5 13.5 13.5 15 13.5C16.5 13.5 16.5 16.5 18 16.5C19.5 16.5 19.5 13.5 21 13.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" fill="currentColor" fillOpacity="0.2" />
        <circle cx="6" cy="18" r="1" fill="currentColor" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
        <circle cx="18" cy="18" r="1" fill="currentColor" />
    </svg>
);

const LiningIcon = ({ className = "w-5 h-5", strokeWidth = 1.8 }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="4" y="4" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity="0.15" />
        <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth={strokeWidth} fill="currentColor" fillOpacity="0.25" />
        <path d="M12 12L17 17M12 17L17 12" stroke="currentColor" strokeWidth={strokeWidth - 0.3} strokeLinecap="round" strokeDasharray="1.5 1.5" />
    </svg>
);

const CUSTOMIZATION_SLOTS = [
    {
        key: 'neck',
        label: 'Neck Design',
        Icon: NecklineIcon,
        description: 'Front & back neckline cut, collar pattern, and depth preferences'
    },
    {
        key: 'sleeve',
        label: 'Sleeve Style',
        Icon: SleeveIcon,
        description: 'Length, cuff pattern, puff, flare, or sleeveless cut'
    },
    {
        key: 'bottom',
        label: 'Bottom Style',
        Icon: BottomIcon,
        description: 'Pants, palazzo, salwar, churidar flare and pocket styling'
    },
    {
        key: 'embroidery',
        label: 'Embroidery Work',
        Icon: EmbroideryIcon,
        description: 'Zari, resham thread, sequins, mirror, or custom handwork'
    },
    {
        key: 'lacePiping',
        label: 'Lace / Piping',
        Icon: LaceIcon,
        description: 'Gota patti, border laces, pearl trims, and contrast piping'
    },
    {
        key: 'lining',
        label: 'Inner Lining',
        Icon: LiningIcon,
        description: 'Mulmul, cotton, butter crepe, or satin inner lining'
    },
];

const SLOT_SUGGESTIONS = {
    neck: ['Deep V-Neck', 'Sweetheart Neck', 'Boat Neck', 'Mandarin Collar', 'Square Neck', 'Round Neck with Keyhole', 'Collar with Slit', 'U-Shape Deep Back'],
    sleeve: ['Full Length Sleeves', '3/4th Sleeves', 'Sleeveless', 'Puff Sleeves with Cuffs', 'Bell Flare Sleeves', 'Cold Shoulder Cut', 'Cap Sleeves'],
    bottom: ['Straight Fit Pants', 'Wide Leg Palazzo', 'Palazzo with Pockets', 'Churidar Gathering', 'Patiala Salwar Pleats', 'Flared Sharara', 'Ankle Length Fit'],
    embroidery: ['Minimal Neckline Thread Work', 'Heavy Zari Work', 'Sequin Trims on Border', 'Mirror Work Detailing', 'Subtle Floral Buttis', 'Contrast Hand Embroidery'],
    lacePiping: ['Gold Gota Patti Lace', 'Contrast Satin Piping', 'Delicate Pearl Border Lace', 'Crochet Lace Trims', 'Organza Border Insertion', 'Scallop Edge Piping'],
    lining: ['Soft Breathable Mulmul', '100% Cotton Lining', 'Butter Crepe Soft Lining', 'Heavy Satin Lining', 'Full Garment Lining', 'Torso Only Lining'],
};

const matchesCategory = (addonCat, serviceCat) => {
    if (!addonCat || addonCat === 'All') return true;
    if (!serviceCat) return true;
    const aCat = addonCat.toLowerCase().trim();
    const sCat = serviceCat.toLowerCase().trim();
    return sCat.includes(aCat) || aCat.includes(sCat);
};

const CustomizationSelector = ({ categoryName = '', catalogAddons = [], selectedCustomizations = {}, onChange }) => {
    // Determine which slots have catalog options or user selections
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

            return hasCatalogOptions || hasUserSelection;
        });
    }, [categoryName, catalogAddons, selectedCustomizations]);

    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [activeSlotKey, setActiveSlotKey] = useState(() => availableSlots[0]?.key || 'neck');

    // Lock body scroll when studio modal is open
    useEffect(() => {
        if (isStudioOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isStudioOpen]);

    // Keep activeSlotKey synchronized with availableSlots
    useEffect(() => {
        if (availableSlots.length > 0 && !availableSlots.some(s => s.key === activeSlotKey)) {
            setActiveSlotKey(availableSlots[0].key);
        }
    }, [availableSlots, activeSlotKey]);

    if (availableSlots.length === 0) {
        return null;
    }

    const openStudioAtSlot = (slotKey) => {
        setActiveSlotKey(slotKey);
        setIsStudioOpen(true);
    };

    const handleSelectCatalogOption = (slotKey, option) => {
        const current = selectedCustomizations[slotKey];
        if (current && current.name === option.name && current.enabled && !current.isCustom) {
            // Deselect
            onChange({
                ...selectedCustomizations,
                [slotKey]: { name: '', price: 0, refImage: '', enabled: false, isCustom: false, notes: '' }
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
                    isCustom: false,
                    notes: current?.notes || ''
                }
            });
        }
    };

    const handleCustomTextChange = (slotKey, text) => {
        const current = selectedCustomizations[slotKey] || {};
        onChange({
            ...selectedCustomizations,
            [slotKey]: {
                ...current,
                name: text,
                price: current.isCustom ? (current.price || 0) : 0,
                enabled: !!text.trim() || !!current.refImage || current.price > 0,
                isCustom: true
            }
        });
    };

    const handleNotesChange = (slotKey, notesText) => {
        const current = selectedCustomizations[slotKey] || {};
        onChange({
            ...selectedCustomizations,
            [slotKey]: {
                ...current,
                notes: notesText,
                enabled: current.enabled || !!notesText.trim()
            }
        });
    };

    const handleClearSlot = (slotKey) => {
        onChange({
            ...selectedCustomizations,
            [slotKey]: { name: '', price: 0, refImage: '', enabled: false, isCustom: false, notes: '' }
        });
    };

    const activeSlotIndex = availableSlots.findIndex(s => s.key === activeSlotKey);
    const activeSlotObj = availableSlots[activeSlotIndex] || availableSlots[0];
    const CurrentIcon = activeSlotObj?.Icon || Scissors;
    const currentSlotData = selectedCustomizations[activeSlotObj?.key] || { name: '', price: 0, refImage: '', enabled: false, isCustom: false, notes: '' };

    // Filter catalog options strictly applicable to current active slot
    const currentSlotOptions = catalogAddons.filter((a) => {
        const isStyleAddon = a.addonType === 'embellishment' || a.addonType === 'styleAddon' || a.addonType === 'addon';
        if (isStyleAddon) return false;
        if (a.customizationType !== activeSlotObj?.key) return false;
        if (a.isActive === false) return false;
        return matchesCategory(a.category, categoryName);
    });

    const totalActiveCount = Object.values(selectedCustomizations || {}).filter(
        item => item && item.enabled && (item.name || item.refImage || item.notes)
    ).length;

    const totalCustomizationPrice = Object.values(selectedCustomizations || {}).reduce((sum, item) => {
        if (item && item.enabled && item.price) {
            return sum + (Number(item.price) || 0);
        }
        return sum;
    }, 0);

    const handleNextSlot = () => {
        if (activeSlotIndex < availableSlots.length - 1) {
            setActiveSlotKey(availableSlots[activeSlotIndex + 1].key);
        } else {
            setIsStudioOpen(false);
        }
    };

    const handlePrevSlot = () => {
        if (activeSlotIndex > 0) {
            setActiveSlotKey(availableSlots[activeSlotIndex - 1].key);
        }
    };

    return (
        <>
            {/* 1. In-Page Garment Customizations Card */}
            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-[#843D9B]/15 hover:shadow-md transition-all">
                {/* Header with theme gradient badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#843D9B] to-[#682a7c] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#843D9B]/25">
                            <Scissors size={20} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider leading-tight">
                                    Garment Customizations
                                </h3>
                                {totalActiveCount > 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#843D9B] text-white text-[9px] font-black shadow-xs">
                                        {totalActiveCount} Selected
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium leading-none mt-1">
                                Tap any design option to customize in full studio view
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => openStudioAtSlot(availableSlots[0].key)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#843D9B]/10 hover:bg-[#843D9B]/20 text-[#843D9B] text-[11px] font-black tracking-wider uppercase transition-colors cursor-pointer"
                    >
                        <SlidersHorizontal size={13} />
                        Studio
                    </button>
                </div>

                {/* List of Customization Slot Cards */}
                <div className="grid grid-cols-1 gap-2.5">
                    {availableSlots.map((slot) => {
                        const SlotIcon = slot.Icon || Scissors;
                        const slotData = selectedCustomizations[slot.key] || { name: '', price: 0, refImage: '', enabled: false };
                        const isSelected = slotData.enabled && (slotData.name || slotData.refImage || slotData.notes);

                        return (
                            <div
                                key={slot.key}
                                onClick={() => openStudioAtSlot(slot.key)}
                                className={`group relative p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                                    isSelected
                                        ? 'border-[#843D9B]/40 bg-gradient-to-r from-[#843D9B]/10 via-[#843D9B]/5 to-white shadow-xs hover:border-[#843D9B]'
                                        : 'border-gray-200/80 bg-gray-50/50 hover:bg-white hover:border-[#843D9B]/30 hover:shadow-xs'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Icon / Image Preview */}
                                    {slotData.refImage ? (
                                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-[#843D9B]/30 shrink-0 shadow-xs">
                                            <img src={slotData.refImage} alt={slot.label} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border ${
                                            isSelected ? 'bg-[#843D9B] text-white border-[#843D9B] shadow-sm shadow-[#843D9B]/20' : 'bg-[#843D9B]/10 text-[#843D9B] border-[#843D9B]/20 shadow-2xs'
                                        }`}>
                                            <SlotIcon className="w-5 h-5" strokeWidth={2} />
                                        </div>
                                    )}

                                    {/* Title & Status */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider truncate">
                                                {slot.label}
                                            </h4>
                                            {isSelected && (
                                                <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                                    <Check size={10} className="stroke-[3]" />
                                                    Active
                                                </span>
                                            )}
                                        </div>

                                        {isSelected ? (
                                            <p className="text-[11px] font-bold text-[#843D9B] truncate mt-0.5 flex items-center gap-1.5">
                                                <span className="truncate">{slotData.name || 'Custom Option'}</span>
                                                {slotData.price > 0 && (
                                                    <span className="bg-[#843D9B]/15 text-[#843D9B] px-1.5 py-0.2 rounded text-[10px] font-black shrink-0">
                                                        +₹{slotData.price}
                                                    </span>
                                                )}
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                                                Tap to select design or add notes
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Action Chevron / Edit Pill */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isSelected ? (
                                        <span className="text-[10px] font-black text-[#843D9B] bg-white border border-[#843D9B]/30 px-2.5 py-1 rounded-xl shadow-2xs group-hover:bg-[#843D9B] group-hover:text-white transition-colors">
                                            Edit
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black text-gray-600 bg-white border border-gray-200/80 px-2.5 py-1 rounded-xl shadow-2xs group-hover:border-[#843D9B]/40 group-hover:text-[#843D9B] transition-colors flex items-center gap-1">
                                            Select
                                            <ChevronRight size={12} />
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. Ultra-Aesthetic Full-Page Customization Studio Modal */}
            <AnimatePresence>
                {isStudioOpen && (
                    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center">
                        {/* Backdrop with rich blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsStudioOpen(false)}
                            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
                        />

                        {/* Full Screen / Large Sheet Modal Container */}
                        <motion.div
                            initial={{ y: '100%', opacity: 0.8 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="relative w-full h-[96vh] sm:h-[90vh] sm:max-w-4xl bg-gray-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden z-10 border border-white/20"
                        >
                            {/* Studio Header */}
                            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xs">
                                <div className="px-5 py-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsStudioOpen(false)}
                                            className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 active:scale-95 transition-all cursor-pointer"
                                            aria-label="Back"
                                        >
                                            <ArrowLeft size={18} className="stroke-[2.5]" />
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight leading-tight">
                                                    Customization Studio
                                                </h2>
                                                <span className="hidden sm:inline-flex items-center gap-1 bg-[#843D9B]/10 text-[#843D9B] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                                    <Sparkles size={11} />
                                                    Bespoke Tailoring
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium">
                                                {categoryName ? `${categoryName} styling & design details` : 'Tailor specific design selections'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        {totalCustomizationPrice > 0 && (
                                            <div className="text-right hidden xs:block">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Addons Total</p>
                                                <p className="text-xs font-black text-[#843D9B] leading-tight mt-0.5">+₹{totalCustomizationPrice}</p>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setIsStudioOpen(false)}
                                            className="w-9 h-9 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Horizontal Interactive Category Navigation Tabs */}
                                <div className="px-4 pb-2.5 pt-1 overflow-x-auto no-scrollbar flex items-center gap-2 border-t border-gray-100/60">
                                    {availableSlots.map((slot) => {
                                        const TabIcon = slot.Icon || Scissors;
                                        const isCurrent = slot.key === activeSlotKey;
                                        const slotData = selectedCustomizations[slot.key];
                                        const isSlotFilled = slotData?.enabled && (slotData?.name || slotData?.refImage || slotData?.notes);

                                        return (
                                            <button
                                                key={slot.key}
                                                type="button"
                                                onClick={() => setActiveSlotKey(slot.key)}
                                                className={`px-3.5 py-2 rounded-2xl text-xs font-black tracking-wider uppercase whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                                                    isCurrent
                                                        ? 'bg-gradient-to-r from-[#843D9B] to-[#682a7c] text-white shadow-md shadow-[#843D9B]/30 ring-2 ring-[#843D9B]/30'
                                                        : 'bg-white border border-gray-200/80 text-gray-700 hover:border-[#843D9B]/30 hover:bg-[#843D9B]/5'
                                                }`}
                                            >
                                                <TabIcon className="w-4 h-4" strokeWidth={isCurrent ? 2.3 : 1.8} />
                                                <span>{slot.label}</span>
                                                {isSlotFilled && (
                                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                                                        isCurrent ? 'bg-white text-[#843D9B]' : 'bg-emerald-500 text-white'
                                                    }`}>
                                                        ✓
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Studio Body Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                                {/* Current Slot Banner / Title */}
                                <div className="bg-white rounded-3xl p-5 border border-[#843D9B]/15 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start sm:items-center gap-3.5">
                                        <div className="w-13 h-13 rounded-2xl border border-[#843D9B]/20 bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center shadow-inner shrink-0">
                                            <CurrentIcon className="w-6 h-6" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-tight">
                                                    {activeSlotObj.label}
                                                </h3>
                                                {currentSlotData.enabled && (currentSlotData.name || currentSlotData.refImage) && (
                                                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle2 size={12} />
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                                {activeSlotObj.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Clear Slot Button */}
                                    {currentSlotData.enabled && (currentSlotData.name || currentSlotData.refImage || currentSlotData.notes) && (
                                        <button
                                            type="button"
                                            onClick={() => handleClearSlot(activeSlotObj.key)}
                                            className="self-end sm:self-center px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <RotateCcw size={13} />
                                            Reset Selection
                                        </button>
                                    )}
                                </div>

                                {/* Active Selection Summary Bar (if selected) */}
                                {currentSlotData.enabled && currentSlotData.name && (
                                    <div className="bg-gradient-to-r from-[#843D9B] to-[#5d236f] rounded-2xl p-4 text-white shadow-lg shadow-[#843D9B]/20 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {currentSlotData.refImage ? (
                                                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/30 shrink-0 bg-white/20">
                                                    <img src={currentSlotData.refImage} alt={currentSlotData.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl border-2 border-white/30 shrink-0 bg-white/20 flex items-center justify-center">
                                                    <CurrentIcon className="w-6 h-6 text-white" strokeWidth={2} />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-purple-200">Current Selection</p>
                                                <h4 className="text-sm font-black truncate">{currentSlotData.name}</h4>
                                                <p className="text-[11px] font-medium text-purple-100">
                                                    {currentSlotData.price > 0 ? `+₹${currentSlotData.price} Addon fee` : 'Included in base price'}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleClearSlot(activeSlotObj.key)}
                                            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}

                                {/* Catalog Options Grid */}
                                {currentSlotOptions.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-2">
                                                <Sparkles size={13} className="text-[#843D9B]" />
                                                Catalog Designs & Styles ({currentSlotOptions.length})
                                            </label>
                                            <span className="text-[10px] text-gray-400 font-bold">Tap card to select</span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                                            {currentSlotOptions.map((opt) => {
                                                const isSelected = currentSlotData.name === opt.name && !currentSlotData.isCustom && currentSlotData.enabled;

                                                return (
                                                    <div
                                                        key={opt._id}
                                                        onClick={() => handleSelectCatalogOption(activeSlotObj.key, opt)}
                                                        className={`group relative rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between overflow-hidden bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                                                            isSelected
                                                                ? 'border-[#843D9B] ring-4 ring-[#843D9B]/20 shadow-lg'
                                                                : 'border-gray-200 hover:border-[#843D9B]/40'
                                                        }`}
                                                    >
                                                        {/* Option Image Container */}
                                                        {opt.image ? (
                                                            <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden relative">
                                                                <img
                                                                    src={opt.image}
                                                                    alt={opt.name}
                                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                                                
                                                                {/* Price Badge over Image */}
                                                                <div className="absolute bottom-2 left-2">
                                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm ${
                                                                        opt.price > 0
                                                                            ? 'bg-[#843D9B] text-white'
                                                                            : 'bg-emerald-600 text-white'
                                                                    }`}>
                                                                        {opt.price > 0 ? `+₹${opt.price}` : 'Free'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="aspect-[4/3] w-full flex items-center justify-center border-b border-[#843D9B]/10 bg-[#843D9B]/5 text-[#843D9B]">
                                                                <CurrentIcon className="w-10 h-10" strokeWidth={1.7} />
                                                            </div>
                                                        )}

                                                        {/* Selection Check Indicator in Corner */}
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center shadow-md">
                                                                <Check size={14} className="stroke-[3]" />
                                                            </div>
                                                        )}

                                                        {/* Details */}
                                                        <div className="p-3 flex flex-col justify-between flex-1 gap-1">
                                                            <div>
                                                                <h4 className="text-xs font-black text-gray-900 leading-snug line-clamp-2">
                                                                    {opt.name}
                                                                </h4>
                                                                {opt.description && (
                                                                    <p className="text-[10px] text-gray-500 font-medium line-clamp-2 mt-0.5">
                                                                        {opt.description}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="pt-2 flex items-center justify-between border-t border-gray-100 mt-1">
                                                                <span className="text-[10px] font-black text-[#843D9B]">
                                                                    {opt.price > 0 ? `+₹${opt.price}` : 'Included'}
                                                                </span>
                                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                                    isSelected ? 'bg-[#843D9B] text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-[#843D9B]/10 group-hover:text-[#843D9B]'
                                                                }`}>
                                                                    {isSelected ? 'Selected ✓' : 'Choose'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 text-center space-y-2">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border border-[#843D9B]/20 bg-[#843D9B]/10 text-[#843D9B]">
                                            <CurrentIcon className="w-6 h-6" strokeWidth={2} />
                                        </div>
                                        <h4 className="text-sm font-black text-gray-900">No Pre-set Catalog Cards</h4>
                                        <p className="text-xs text-gray-500 max-w-md mx-auto">
                                            You can directly describe your custom style requirement or tap one of the popular suggestions below!
                                        </p>
                                    </div>
                                )}

                                {/* Quick Suggestions & Custom Input Box */}
                                <div className="bg-white rounded-3xl p-5 border border-[#843D9B]/15 shadow-xs space-y-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-900 tracking-wider mb-1">
                                            Custom Style or Specific Request
                                        </label>
                                        <p className="text-[11px] text-gray-500 font-medium mb-3">
                                            Type custom design details, measurements, collar depth, or choose from popular suggestions:
                                        </p>

                                        {/* Suggestion Chips */}
                                        {SLOT_SUGGESTIONS[activeSlotObj.key] && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {SLOT_SUGGESTIONS[activeSlotObj.key].map((sugg) => {
                                                    const isTyped = (currentSlotData.name || '').includes(sugg);
                                                    return (
                                                        <button
                                                            key={sugg}
                                                            type="button"
                                                            onClick={() => {
                                                                const newText = currentSlotData.name ? `${currentSlotData.name}, ${sugg}` : sugg;
                                                                handleCustomTextChange(activeSlotObj.key, newText);
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                                isTyped
                                                                    ? 'bg-[#843D9B]/15 text-[#843D9B] border border-[#843D9B]/40 shadow-2xs'
                                                                    : 'bg-gray-100/80 hover:bg-[#843D9B]/10 text-gray-700 border border-transparent hover:border-[#843D9B]/30'
                                                            }`}
                                                        >
                                                            <span>+</span>
                                                            <span>{sugg}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Custom Name / Description Input */}
                                        <div className="relative">
                                            <textarea
                                                rows={3}
                                                value={currentSlotData.name || ''}
                                                onChange={(e) => handleCustomTextChange(activeSlotObj.key, e.target.value)}
                                                placeholder={`e.g. Please make ${activeSlotObj.label.toLowerCase()} with 7.5-inch deep cut and delicate finish...`}
                                                className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-[#843D9B] focus:bg-white focus:ring-4 focus:ring-[#843D9B]/15 transition-all resize-none text-gray-900 placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Tailor Extra Notes Section */}
                                    <div className="pt-2 border-t border-gray-100">
                                        <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                                            Special Tailor Instruction / Lining Note (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={currentSlotData.notes || ''}
                                            onChange={(e) => handleNotesChange(activeSlotObj.key, e.target.value)}
                                            placeholder="e.g. Double stitch at joints, leave 2-inch margin inside..."
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#843D9B] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Studio Bottom Sticky Footer */}
                            <div className="sticky bottom-0 z-20 bg-white border-t border-gray-100 px-5 py-3.5 shadow-lg flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    {activeSlotIndex > 0 ? (
                                        <button
                                            type="button"
                                            onClick={handlePrevSlot}
                                            className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                                        >
                                            <ChevronLeft size={16} />
                                            <span className="hidden sm:inline">Previous</span>
                                        </button>
                                    ) : null}

                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                                            Step {activeSlotIndex + 1} of {availableSlots.length}
                                        </p>
                                        <p className="text-xs font-black text-gray-900 leading-tight mt-0.5">
                                            {totalActiveCount} Customization{totalActiveCount !== 1 ? 's' : ''} Configured
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {activeSlotIndex < availableSlots.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={handleNextSlot}
                                            className="px-4 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-[#843D9B] to-[#682a7c] hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#843D9B]/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            <span>Next: {availableSlots[activeSlotIndex + 1]?.label}</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsStudioOpen(false)}
                                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#843D9B] to-[#682a7c] hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#843D9B]/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            <CheckCircle2 size={16} />
                                            <span>Done & Save</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CustomizationSelector;
