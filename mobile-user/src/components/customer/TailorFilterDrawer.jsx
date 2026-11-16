// Port of modules/customer/components/TailorFilterDrawer.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState, useEffect } from "react";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react-native";
import { cn } from "../../lib/cn";
import { Box, Btn, I, Txt, Input, Scroll } from '../ui/primitives';
import { Drawer } from '../ui/Sheet';
import Slider from '@react-native-community/slider';
const FilterSection = ({
  title,
  children,
  isOpen = true
}) => {
  const [open, setOpen] = useState(isOpen);
  return <Box className="border-b border-gray-100 py-4 last:border-0">
            <Btn onPress={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-2 hover:text-[#843D9B]">
                {title}
                <I icon={ChevronDown} className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
            </Btn>
            {open && <Box className="space-y-2 mt-2">{children}</Box>}
        </Box>;
};
const TailorFilterDrawer = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  const [tempFilters, setTempFilters] = useState(filters);

  // Sync temp filters when drawer opens/closes or external filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters, isOpen]);
  const handleApply = () => {
    setFilters(tempFilters);
    onClose();
  };
  const handleClear = () => {
    setTempFilters({
      sortBy: 'priority',
      rating: '',
      minPrice: '',
      maxPrice: 10000
    });
  };
  const updateFilter = (key, value) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  return <Drawer visible={!!isOpen} onClose={onClose} className="w-full max-w-sm bg-white shadow-2xl flex flex-col">
            <Box className="flex-1 flex flex-col">
                {/* Header */}
                <Box className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <Txt className="text-lg font-bold text-[#843D9B] flex items-center gap-2">
                        <I icon={SlidersHorizontal} className="h-5 w-5" />
                        Filters
                    </Txt>
                    <Btn onPress={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <I icon={X} className="h-5 w-5 text-gray-500" />
                    </Btn>
                </Box>

                {/* Content */}
                <Scroll className="flex-1" contentClassName="px-4 py-2">

                    {/* Sort By */}
                    <FilterSection title="Sort By">
                        {[{
            label: 'Recommended (Priority)',
            value: 'priority'
          }, {
            label: 'Rating (High to Low)',
            value: 'rating'
          }, {
            label: 'Price: Low to High',
            value: 'price_low'
          }, {
            label: 'Price: High to Low',
            value: 'price_high'
          }].map(opt => <Btn key={opt.value} onPress={() => updateFilter('sortBy', opt.value)} className="flex flex-row items-center gap-2 mb-1">
                                <Box className={`w-4 h-4 rounded-full border-2 items-center justify-center ${tempFilters.sortBy === opt.value ? 'border-[#843D9B]' : 'border-gray-400'}`}>{tempFilters.sortBy === opt.value && <Box className="w-2 h-2 rounded-full bg-[#843D9B]" />}</Box>
                                <Txt className="text-sm text-gray-600">{opt.label}</Txt>
                            </Btn>)}
                    </FilterSection>

                    {/* Rating */}
                    <FilterSection title="Minimum Rating">
                        {[{
            label: 'Any Rating',
            value: ''
          }, {
            label: '4.0+ Stars',
            value: '4'
          }, {
            label: '3.0+ Stars',
            value: '3'
          }].map(opt => <Btn key={opt.label} onPress={() => updateFilter('rating', opt.value)} className="flex flex-row items-center gap-2 mb-1">
                                <Box className={`w-4 h-4 rounded-full border-2 items-center justify-center ${tempFilters.rating === opt.value ? 'border-[#843D9B]' : 'border-gray-400'}`}>{tempFilters.rating === opt.value && <Box className="w-2 h-2 rounded-full bg-[#843D9B]" />}</Box>
                                <Txt className="text-sm text-gray-600">{opt.label}</Txt>
                            </Btn>)}
                    </FilterSection>

                    {/* Price Range */}
                    <FilterSection title="Max Base Price">
                        <Slider style={{ width: '100%', height: 32 }} minimumValue={100} maximumValue={10000} step={100} value={Number(tempFilters.maxPrice || 10000)}
                            onValueChange={(v) => updateFilter('maxPrice', String(v))} minimumTrackTintColor="#843D9B" maximumTrackTintColor="#e5e7eb" thumbTintColor="#843D9B" />
                        <Box className="flex justify-between text-xs font-bold text-[#843D9B] mt-2">
                            <Txt>Up to</Txt>
                            <Txt>₹{tempFilters.maxPrice || 10000}</Txt>
                        </Box>
                    </FilterSection>

                </Scroll>

                {/* Footer */}
                <Box className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <Btn onPress={handleClear} className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white hover:border-gray-400 transition-all text-sm">
                        Reset
                    </Btn>
                    <Btn onPress={handleApply} className="flex-1 py-2.5 px-4 bg-[#843D9B] text-white rounded-lg font-bold hover:bg-[#68166d] transition-all shadow-lg shadow-[#843D9B]/20 text-sm">
                        Apply Filters
                    </Btn>
                </Box>
            </Box>
        </Drawer>;
};
export default TailorFilterDrawer;
