// Port of modules/customer/components/store/FilterDrawer.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState } from "react";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react-native";
import { Check } from "lucide-react-native";
import { cn } from "../../../lib/cn";
import { Box, Btn, I, Txt, Input, Scroll } from '../../ui/primitives';
import { Drawer } from '../../ui/Sheet';
import Slider from '@react-native-community/slider';
const FilterSection = ({
  title,
  children,
  isOpen = true
}) => {
  const [open, setOpen] = useState(isOpen);
  return <Box className="border-b border-gray-100 py-4 last:border-0">
            <Btn onPress={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-2 hover:text-primary">
                {title}
                <I icon={ChevronDown} className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
            </Btn>
            {open && <Box className="space-y-2 mt-2">{children}</Box>}
        </Box>;
};
const FilterDrawer = ({
  isOpen,
  onClose,
  filters,
  setFilters
}) => {
  const [tempFilters, setTempFilters] = useState(filters);
  // visual-only controls (the web inputs are uncontrolled and do not change filters either)
  const [sortOpt, setSortOpt] = useState(null);
  const [inStock, setInStock] = useState(false);
  const handleApply = () => {
    setFilters(tempFilters);
    onClose();
  };
  const handleClear = () => {
    setTempFilters({}); // Reset to defaults
  };
  return <Drawer visible={!!isOpen} onClose={onClose} className="w-full max-w-sm bg-white shadow-2xl flex flex-col">
            <Box className="flex-1 flex flex-col">
                {/* Header */}
                <Box className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <Txt className="text-lg font-bold text-primary flex items-center gap-2">
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
                        {['Price: Low to High', 'Price: High to Low', 'Popular', 'Newest'].map(opt => <Btn key={opt} onPress={() => setSortOpt(opt)} className="flex flex-row items-center gap-2">
                                <Box className={`w-4 h-4 rounded-full border-2 items-center justify-center ${sortOpt === opt ? 'border-primary' : 'border-gray-400'}`}>{sortOpt === opt && <Box className="w-2 h-2 rounded-full bg-primary" />}</Box>
                                <Txt className="text-sm text-gray-600">{opt}</Txt>
                            </Btn>)}
                    </FilterSection>

                    {/* Price Range */}
                    <FilterSection title="Price Range">
                        <Slider style={{ width: '100%', height: 32 }} minimumValue={0} maximumValue={100} minimumTrackTintColor="#843D9B" maximumTrackTintColor="#e5e7eb" thumbTintColor="#843D9B" />
                        <Box className="flex justify-between text-xs text-gray-500 mt-1">
                            <Txt>₹500</Txt>
                            <Txt>₹10,000+</Txt>
                        </Box>
                    </FilterSection>

                    {/* Size */}
                    <FilterSection title="Size">
                        <Box className="flex flex-wrap gap-2">
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => <Btn key={size} className="px-3 py-1 border rounded-md text-xs font-medium hover:border-primary hover:bg-primary/5 transition-colors">
                                    {size}
                                </Btn>)}
                        </Box>
                    </FilterSection>

                    {/* Color */}
                    <FilterSection title="Color">
                        <Box className="flex flex-wrap gap-3">
                            {['#000', '#fff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map(color => <Btn key={color} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm relative hover:scale-110 transition-transform" style={{
              backgroundColor: color
            }} />)}
                        </Box>
                    </FilterSection>

                    {/* Availability */}
                    <FilterSection title="Availability">
                        <Btn onPress={() => setInStock(!inStock)} className="flex flex-row items-center gap-2">
                            <Box className={`w-4 h-4 rounded border items-center justify-center ${inStock ? 'bg-primary border-primary' : 'border-gray-400'}`}>{inStock && <I icon={Check} size={11} strokeWidth={3} color="#fff" />}</Box>
                            <Txt className="text-sm text-gray-600">In Stock Only</Txt>
                        </Btn>
                    </FilterSection>

                </Scroll>

                {/* Footer */}
                <Box className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <Btn onPress={handleClear} className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white hover:border-gray-400 transition-all text-sm">
                        Clear All
                    </Btn>
                    <Btn onPress={handleApply} className="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-all shadow-lg shadow-indigo-900/10 text-sm">
                        Apply Filters
                    </Btn>
                </Box>
            </Box>
        </Drawer>;
};
export default FilterDrawer;
