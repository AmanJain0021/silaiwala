// Port of components/service-detail/CustomizationSelector.jsx (logic verbatim)
import React, { useState, useMemo, useEffect } from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Scissors, ChevronRight, CheckCircle2, X, Sparkles, ArrowLeft, Check, RotateCcw, ChevronLeft } from 'lucide-react-native';
import { getImageUrl } from '../../../utils/imageUrl';
import { Sheet } from '../../ui/Sheet';
import { Box, Txt, Btn, Img, I, Input, Scroll } from '../../ui/primitives';

// SVG icons (react-native-svg); currentColor -> color prop
const mk = (paths) => ({ size = 20, color = '#843D9B', strokeWidth = 1.8, style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>{paths(color, strokeWidth)}</Svg>
);
const NecklineIcon = mk((c, w) => (<>
  <Path d="M4 6.5C7 5 9.5 4.5 12 4.5C14.5 4.5 17 5 20 6.5L18.5 11L15 9.5C14 13.5 13 15 12 15C11 15 10 13.5 9 9.5L5.5 11L4 6.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill={c} fillOpacity={0.15} />
  <Path d="M12 4.5V15" stroke={c} strokeWidth={w} strokeDasharray="1.5 2" strokeLinecap="round" />
  <Path d="M7 19.5H17" stroke={c} strokeWidth={w} strokeLinecap="round" />
  <Path d="M9 19.5V14.5" stroke={c} strokeWidth={w} strokeLinecap="round" />
  <Path d="M15 19.5V14.5" stroke={c} strokeWidth={w} strokeLinecap="round" />
</>));
const SleeveIcon = mk((c, w) => (<>
  <Path d="M7 4L3.5 8L6.5 19.5C6.5 20.3 7.2 21 8 21H16C16.8 21 17.5 20.3 17.5 19.5L20.5 8L17 4H7Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill={c} fillOpacity={0.15} />
  <Path d="M3.5 8L8 10.5M20.5 8L16 10.5" stroke={c} strokeWidth={w} strokeLinecap="round" />
  <Path d="M9 4C9 5.7 10.3 7 12 7C13.7 7 15 5.7 15 4" stroke={c} strokeWidth={w} strokeLinecap="round" />
  <Path d="M4.5 13L7 14M19.5 13L17 14" stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray="1.5 1.5" />
</>));
const BottomIcon = mk((c, w) => (<>
  <Path d="M5.5 4H18.5L19.5 7.5L18 20C18 20.6 17.5 21 17 21H13.5L12 12L10.5 21H7C6.5 21 6 20.6 6 20L4.5 7.5L5.5 4Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill={c} fillOpacity={0.15} />
  <Path d="M5.5 7.5H18.5" stroke={c} strokeWidth={w} strokeLinecap="round" />
  <Path d="M12 4V7.5" stroke={c} strokeWidth={w} strokeLinecap="round" />
  <Path d="M7 21H10.5M13.5 21H17" stroke={c} strokeWidth={w + 0.4} strokeLinecap="round" />
</>));
const EmbroideryIcon = mk((c, w) => (<>
  <Path d="M19 4L14 9.5M19 4C19.8 3.2 20.8 3.5 21.2 4C21.7 4.5 21.5 5.5 20.5 6.2L15 11.5" stroke={c} strokeWidth={w} strokeLinecap="round" />
  <Circle cx="19.5" cy="4.5" r="0.75" fill={c} />
  <Path d="M14 9.5L4 19.5C3.6 19.9 3.2 20.2 3.2 20.2C3.2 20.2 3.5 19.8 3.9 19.4L10 13.5" stroke={c} strokeWidth={w} strokeLinecap="round" />
  <Path d="M9 4L10 6L12 7L10 8L9 10L8 8L6 7L8 6L9 4Z" fill={c} fillOpacity={0.3} stroke={c} strokeWidth={w - 0.4} strokeLinejoin="round" />
  <Path d="M16 16L16.5 17.5L18 18L16.5 18.5L16 20L15.5 18.5L14 18L15.5 17.5L16 16Z" fill={c} fillOpacity={0.3} stroke={c} strokeWidth={w - 0.4} strokeLinejoin="round" />
  <Path d="M5 11C7 9 9.5 11 12 9C14.5 7 17 9 19 7" stroke={c} strokeWidth={w - 0.4} strokeDasharray="2 2" strokeLinecap="round" />
</>));
const LaceIcon = mk((c, w) => (<>
  <Path d="M3 6.5H21" stroke={c} strokeWidth={w + 0.4} strokeLinecap="round" />
  <Path d="M3 10H21" stroke={c} strokeWidth={w} strokeDasharray="1.5 2" strokeLinecap="round" />
  <Path d="M3 13.5C4.5 13.5 4.5 16.5 6 16.5C7.5 16.5 7.5 13.5 9 13.5C10.5 13.5 10.5 16.5 12 16.5C13.5 16.5 13.5 13.5 15 13.5C16.5 13.5 16.5 16.5 18 16.5C19.5 16.5 19.5 13.5 21 13.5" stroke={c} strokeWidth={w} strokeLinecap="round" fill={c} fillOpacity={0.2} />
  <Circle cx="6" cy="18" r="1" fill={c} />
  <Circle cx="12" cy="18" r="1" fill={c} />
  <Circle cx="18" cy="18" r="1" fill={c} />
</>));
const LiningIcon = mk((c, w) => (<>
  <Rect x="4" y="4" width="11" height="11" rx="2.5" stroke={c} strokeWidth={w} fill={c} fillOpacity={0.15} />
  <Rect x="9" y="9" width="11" height="11" rx="2.5" stroke={c} strokeWidth={w} fill={c} fillOpacity={0.25} />
  <Path d="M12 12L17 17M12 17L17 12" stroke={c} strokeWidth={w - 0.3} strokeLinecap="round" strokeDasharray="1.5 1.5" />
</>));

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
            <Box className="bg-white rounded-[2rem] p-5 shadow-sm border border-[#843D9B]/15">
                <Box className="flex items-center justify-between gap-3 mb-4">
                    <Box className="flex items-center gap-3 flex-1">
                        <Box className="w-11 h-11 bg-gradient-to-br from-[#843D9B] to-[#682a7c] rounded-2xl flex items-center justify-center shadow-md shadow-[#843D9B]/25">
                            <I icon={Scissors} size={20} strokeWidth={2.2} color="#fff" />
                        </Box>
                        <Box className="flex-1">
                            <Box className="flex items-center gap-2 flex-wrap">
                                <Txt className="text-xs font-black text-gray-900 uppercase tracking-wider leading-tight">Garment Customizations</Txt>
                                {totalActiveCount > 0 && <Txt className="px-2.5 py-0.5 rounded-full bg-[#843D9B] text-white text-[9px] font-black shadow-xs">{totalActiveCount} Selected</Txt>}
                            </Box>
                            <Txt className="text-[11px] text-gray-500 font-medium leading-none mt-1">Tap any design option to customize in full studio view</Txt>
                        </Box>
                    </Box>
                </Box>
                <Box className="flex flex-col gap-2.5">
                    {availableSlots.map((slot) => {
                        const SlotIcon = slot.Icon || Scissors;
                        const slotData = selectedCustomizations[slot.key] || { name: '', price: 0, refImage: '', enabled: false };
                        const isSelected = slotData.enabled && (slotData.name || slotData.refImage || slotData.notes);
                        return (
                            <Btn key={slot.key} onPress={() => openStudioAtSlot(slot.key)}
                                className={`relative p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left ${isSelected ? 'border-[#843D9B]/40 bg-gradient-to-r from-[#843D9B]/10 via-[#843D9B]/5 to-white shadow-xs' : 'border-gray-200/80 bg-gray-50/50'}`}>
                                <Box className="flex items-center gap-3 min-w-0 flex-1">
                                    {slotData.refImage ? (
                                        <Box className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-[#843D9B]/30 shrink-0 shadow-xs">
                                            <Img src={getImageUrl(slotData.refImage)} className="w-full h-full object-cover" />
                                        </Box>
                                    ) : (
                                        <Box className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${isSelected ? 'bg-[#843D9B] border-[#843D9B] shadow-sm shadow-[#843D9B]/20' : 'bg-[#843D9B]/10 border-[#843D9B]/20 shadow-2xs'}`}>
                                            <SlotIcon size={20} strokeWidth={2} color={isSelected ? '#fff' : '#843D9B'} />
                                        </Box>
                                    )}
                                    <Box className="min-w-0 flex-1">
                                        <Box className="flex items-center gap-2">
                                            <Txt className="text-xs font-black text-gray-900 uppercase tracking-wider truncate">{slot.label}</Txt>
                                            {isSelected && (
                                                <Box className="shrink-0 flex items-center gap-1 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                                    <I icon={Check} size={10} strokeWidth={3} color="#047857" />
                                                    <Txt className="text-[9px] font-bold text-emerald-700">Active</Txt>
                                                </Box>
                                            )}
                                        </Box>
                                        {isSelected ? (
                                            <Box className="flex items-center gap-1.5 mt-0.5">
                                                <Txt className="text-[11px] font-bold text-[#843D9B] truncate">{slotData.name || 'Custom Option'}</Txt>
                                                {slotData.price > 0 && <Txt className="bg-[#843D9B]/15 text-[#843D9B] px-1.5 rounded text-[10px] font-black shrink-0">+₹{slotData.price}</Txt>}
                                            </Box>
                                        ) : (
                                            <Txt className="text-[11px] text-gray-400 font-medium truncate mt-0.5">Tap to select design or add notes</Txt>
                                        )}
                                    </Box>
                                </Box>
                                <Box className="flex items-center gap-1.5 shrink-0">
                                    {isSelected ? (
                                        <Txt className="text-[10px] font-black text-[#843D9B] bg-white border border-[#843D9B]/30 px-2.5 py-1 rounded-xl shadow-2xs">Edit</Txt>
                                    ) : (
                                        <Box className="bg-white border border-gray-200/80 px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1">
                                            <Txt className="text-[10px] font-black text-gray-600">Select</Txt>
                                            <I icon={ChevronRight} size={12} color="#4b5563" />
                                        </Box>
                                    )}
                                </Box>
                            </Btn>
                        );
                    })}
                </Box>
            </Box>

            <Sheet visible={isStudioOpen} onClose={() => setIsStudioOpen(false)} className="w-full bg-gray-50 rounded-t-[2.5rem] shadow-2xl border border-white/20" backdropClassName="bg-slate-950/70" style={{ height: '96%' }}>
                <Box className="flex-1 flex flex-col overflow-hidden">
                    <Box className="z-20 bg-white/95 border-b border-gray-100 shadow-xs">
                        <Box className="px-5 py-3.5 flex items-center justify-between">
                            <Box className="flex items-center gap-3 flex-1">
                                <Btn onPress={() => setIsStudioOpen(false)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center" accessibilityLabel="Back">
                                    <I icon={ArrowLeft} size={18} strokeWidth={2.5} color="#374151" />
                                </Btn>
                                <Box className="flex-1">
                                    <Txt className="text-sm font-black text-gray-900 tracking-tight leading-tight">Customization Studio</Txt>
                                    <Txt className="text-[11px] text-gray-500 font-medium">{categoryName ? `${categoryName} styling & design details` : 'Tailor specific design selections'}</Txt>
                                </Box>
                            </Box>
                            <Btn onPress={() => setIsStudioOpen(false)} className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center">
                                <I icon={X} size={18} color="#6b7280" />
                            </Btn>
                        </Box>
                        <Scroll horizontal className="border-t border-gray-100/60" contentClassName="px-4 pb-2.5 pt-1 flex items-center gap-2">
                            {availableSlots.map((slot) => {
                                const TabIcon = slot.Icon || Scissors;
                                const isCurrent = slot.key === activeSlotKey;
                                const sd = selectedCustomizations[slot.key];
                                const filled = sd?.enabled && (sd?.name || sd?.refImage || sd?.notes);
                                return (
                                    <Btn key={slot.key} onPress={() => setActiveSlotKey(slot.key)}
                                        className={`px-3.5 py-2 rounded-2xl text-xs font-black tracking-wider uppercase whitespace-nowrap flex items-center gap-2 ${isCurrent ? 'bg-gradient-to-r from-[#843D9B] to-[#682a7c] text-white shadow-md shadow-[#843D9B]/30' : 'bg-white border border-gray-200/80 text-gray-700'}`}>
                                        <TabIcon size={16} strokeWidth={isCurrent ? 2.3 : 1.8} color={isCurrent ? '#fff' : '#374151'} />
                                        <Txt>{slot.label}</Txt>
                                        {filled && <Txt className={`w-4 h-4 rounded-full text-center text-[9px] font-black ${isCurrent ? 'bg-white text-[#843D9B]' : 'bg-emerald-500 text-white'}`}>✓</Txt>}
                                    </Btn>
                                );
                            })}
                        </Scroll>
                    </Box>

                    <Scroll className="flex-1" contentClassName="p-4 space-y-6">
                        <Box className="bg-white rounded-3xl p-5 border border-[#843D9B]/15 shadow-xs flex flex-col justify-between gap-4">
                            <Box className="flex items-start gap-3.5">
                                <Box className="w-13 h-13 rounded-2xl border border-[#843D9B]/20 bg-[#843D9B]/10 flex items-center justify-center shrink-0">
                                    <CurrentIcon size={24} strokeWidth={2} color="#843D9B" />
                                </Box>
                                <Box className="flex-1">
                                    <Box className="flex items-center gap-2 flex-wrap">
                                        <Txt className="text-base font-black text-gray-900 uppercase tracking-tight">{activeSlotObj.label}</Txt>
                                        {currentSlotData.enabled && (currentSlotData.name || currentSlotData.refImage) && (
                                            <Box className="flex items-center gap-1 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                                <I icon={CheckCircle2} size={12} color="#047857" />
                                                <Txt className="text-[10px] font-black text-emerald-700">Selected</Txt>
                                            </Box>
                                        )}
                                    </Box>
                                    <Txt className="text-xs text-gray-500 font-medium mt-0.5">{activeSlotObj.description}</Txt>
                                </Box>
                            </Box>
                            {currentSlotData.enabled && (currentSlotData.name || currentSlotData.refImage || currentSlotData.notes) && (
                                <Btn onPress={() => handleClearSlot(activeSlotObj.key)} className="self-end px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 text-xs font-bold flex items-center gap-1.5">
                                    <I icon={RotateCcw} size={13} />
                                    <Txt>Reset Selection</Txt>
                                </Btn>
                            )}
                        </Box>

                        {currentSlotData.enabled && !!currentSlotData.name && (
                            <Box className="bg-gradient-to-r from-[#843D9B] to-[#5d236f] rounded-2xl p-4 shadow-lg shadow-[#843D9B]/20 flex items-center justify-between gap-3">
                                <Box className="flex items-center gap-3 min-w-0 flex-1">
                                    <Box className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/30 shrink-0 bg-white/20 flex items-center justify-center">
                                        {currentSlotData.refImage ? <Img src={getImageUrl(currentSlotData.refImage)} className="w-full h-full object-cover" /> : <CurrentIcon size={24} strokeWidth={2} color="#fff" />}
                                    </Box>
                                    <Box className="min-w-0 flex-1">
                                        <Txt className="text-[10px] font-black uppercase tracking-widest text-purple-200">Current Selection</Txt>
                                        <Txt className="text-sm font-black truncate text-white">{currentSlotData.name}</Txt>
                                        <Txt className="text-[11px] font-medium text-purple-100">{currentSlotData.price > 0 ? `+₹${currentSlotData.price} Addon fee` : 'Included in base price'}</Txt>
                                    </Box>
                                </Box>
                                <Btn onPress={() => handleClearSlot(activeSlotObj.key)} className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-bold shrink-0">Remove</Btn>
                            </Box>
                        )}

                        {currentSlotOptions.length > 0 ? (
                            <Box className="space-y-3">
                                <Box className="flex items-center justify-between">
                                    <Box className="flex items-center gap-2 flex-1">
                                        <I icon={Sparkles} size={13} color="#843D9B" />
                                        <Txt className="text-[11px] font-black uppercase text-gray-500 tracking-wider">Catalog Designs & Styles ({currentSlotOptions.length})</Txt>
                                    </Box>
                                    <Txt className="text-[10px] text-gray-400 font-bold">Tap card to select</Txt>
                                </Box>
                                <Box className="grid grid-cols-2 gap-3.5">
                                    {currentSlotOptions.map((opt) => {
                                        const isSelected = currentSlotData.name === opt.name && !currentSlotData.isCustom && currentSlotData.enabled;
                                        return (
                                            <Btn key={opt._id} onPress={() => handleSelectCatalogOption(activeSlotObj.key, opt)}
                                                className={`relative rounded-2xl border-2 flex flex-col justify-between overflow-hidden bg-white shadow-xs text-left ${isSelected ? 'border-[#843D9B] ring-4 ring-[#843D9B]/20 shadow-lg' : 'border-gray-200'}`}>
                                                {opt.image ? (
                                                    <Box className="aspect-[4/3] w-full bg-gray-100 overflow-hidden relative">
                                                        <Img src={getImageUrl(opt.image)} alt={opt.name} className="w-full h-full object-cover" />
                                                        <Box className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                                        <Box className="absolute bottom-2 left-2">
                                                            <Txt className={`text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm text-white ${opt.price > 0 ? 'bg-[#843D9B]' : 'bg-emerald-600'}`}>{opt.price > 0 ? `+₹${opt.price}` : 'Free'}</Txt>
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <Box className="aspect-[4/3] w-full flex items-center justify-center border-b border-[#843D9B]/10 bg-[#843D9B]/5">
                                                        <CurrentIcon size={40} strokeWidth={1.7} color="#843D9B" />
                                                    </Box>
                                                )}
                                                {isSelected && (
                                                    <Box className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#843D9B] flex items-center justify-center shadow-md">
                                                        <I icon={Check} size={14} strokeWidth={3} color="#fff" />
                                                    </Box>
                                                )}
                                                <Box className="p-3 flex flex-col justify-between flex-1 gap-1">
                                                    <Box>
                                                        <Txt className="text-xs font-black text-gray-900 leading-snug line-clamp-2">{opt.name}</Txt>
                                                        {!!opt.description && <Txt className="text-[10px] text-gray-500 font-medium line-clamp-2 mt-0.5">{opt.description}</Txt>}
                                                    </Box>
                                                    <Box className="pt-2 flex items-center justify-between border-t border-gray-100 mt-1">
                                                        <Txt className="text-[10px] font-black text-[#843D9B]">{opt.price > 0 ? `+₹${opt.price}` : 'Included'}</Txt>
                                                        <Txt className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#843D9B] text-white' : 'bg-gray-100 text-gray-600'}`}>{isSelected ? 'Selected ✓' : 'Choose'}</Txt>
                                                    </Box>
                                                </Box>
                                            </Btn>
                                        );
                                    })}
                                </Box>
                            </Box>
                        ) : (
                            <Box className="bg-white rounded-3xl p-6 border border-gray-100 items-center space-y-2">
                                <Box className="w-12 h-12 rounded-2xl flex items-center justify-center border border-[#843D9B]/20 bg-[#843D9B]/10">
                                    <CurrentIcon size={24} strokeWidth={2} color="#843D9B" />
                                </Box>
                                <Txt className="text-sm font-black text-gray-900 text-center">No Pre-set Catalog Cards</Txt>
                                <Txt className="text-xs text-gray-500 max-w-md text-center">You can directly describe your custom style requirement or tap one of the popular suggestions below!</Txt>
                            </Box>
                        )}

                        <Box className="bg-white rounded-3xl p-5 border border-[#843D9B]/15 shadow-xs space-y-4">
                            <Box>
                                <Txt className="text-xs font-black uppercase text-gray-900 tracking-wider mb-1">Custom Style or Specific Request</Txt>
                                <Txt className="text-[11px] text-gray-500 font-medium mb-3">Type custom design details, measurements, collar depth, or choose from popular suggestions:</Txt>
                                {SLOT_SUGGESTIONS[activeSlotObj.key] && (
                                    <Box className="flex flex-wrap gap-2 mb-3">
                                        {SLOT_SUGGESTIONS[activeSlotObj.key].map((sugg) => {
                                            const isTyped = (currentSlotData.name || '').includes(sugg);
                                            return (
                                                <Btn key={sugg} onPress={() => handleCustomTextChange(activeSlotObj.key, currentSlotData.name ? `${currentSlotData.name}, ${sugg}` : sugg)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${isTyped ? 'bg-[#843D9B]/15 text-[#843D9B] border border-[#843D9B]/40 shadow-2xs' : 'bg-gray-100/80 text-gray-700 border border-transparent'}`}>
                                                    <Txt>+</Txt>
                                                    <Txt>{sugg}</Txt>
                                                </Btn>
                                            );
                                        })}
                                    </Box>
                                )}
                                <Input multiline numberOfLines={3} value={currentSlotData.name || ''} onChangeText={(t) => handleCustomTextChange(activeSlotObj.key, t)}
                                    placeholder={`e.g. Please make ${activeSlotObj.label.toLowerCase()} with 7.5-inch deep cut and delicate finish...`}
                                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs font-medium text-gray-900 min-h-[72px] placeholder:text-gray-400" />
                            </Box>
                            <Box className="pt-2 border-t border-gray-100">
                                <Txt className="text-[11px] font-black uppercase text-gray-500 tracking-wider mb-1.5">Special Tailor Instruction / Lining Note (Optional)</Txt>
                                <Input value={currentSlotData.notes || ''} onChangeText={(t) => handleNotesChange(activeSlotObj.key, t)} placeholder="e.g. Double stitch at joints, leave 2-inch margin inside..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder:text-gray-400" />
                            </Box>
                        </Box>
                    </Scroll>

                    <Box className="z-20 bg-white border-t border-gray-100 px-5 py-3.5 shadow-lg flex items-center justify-between gap-3">
                        <Box className="flex items-center gap-2 flex-1">
                            {activeSlotIndex > 0 ? (
                                <Btn onPress={handlePrevSlot} className="p-3 rounded-2xl bg-gray-100 text-gray-700 flex items-center gap-1.5 text-xs font-bold">
                                    <I icon={ChevronLeft} size={16} />
                                </Btn>
                            ) : null}
                            <Box className="flex-1">
                                <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Step {activeSlotIndex + 1} of {availableSlots.length}</Txt>
                                <Txt className="text-xs font-black text-gray-900 leading-tight mt-0.5">{totalActiveCount} Customization{totalActiveCount !== 1 ? 's' : ''} Configured</Txt>
                            </Box>
                        </Box>
                        {activeSlotIndex < availableSlots.length - 1 ? (
                            <Btn onPress={handleNextSlot} className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#843D9B] to-[#682a7c] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#843D9B]/25 flex items-center gap-2">
                                <Txt>Next: {availableSlots[activeSlotIndex + 1]?.label}</Txt>
                                <I icon={ChevronRight} size={16} />
                            </Btn>
                        ) : (
                            <Btn onPress={() => setIsStudioOpen(false)} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#843D9B] to-[#682a7c] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#843D9B]/25 flex items-center gap-2">
                                <I icon={CheckCircle2} size={16} />
                                <Txt>Done & Save</Txt>
                            </Btn>
                        )}
                    </Box>
                </Box>
            </Sheet>
        </>
    );
};

export default CustomizationSelector;
