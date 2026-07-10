import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

const FilterSection = ({ title, children, isOpen = true }) => {
    const [open, setOpen] = useState(isOpen);
    return (
        <div className="border-b border-gray-100 py-4 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-2 hover:text-[#843D9B]"
            >
                {title}
                <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
            </button>
            {open && <div className="space-y-2 mt-2">{children}</div>}
        </div>
    );
};

const TailorFilterDrawer = ({ isOpen, onClose, filters, setFilters }) => {
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
        setTempFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-[#843D9B] flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5" />
                        Filters
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin">

                    {/* Sort By */}
                    <FilterSection title="Sort By">
                        {[
                            { label: 'Recommended (Priority)', value: 'priority' },
                            { label: 'Rating (High to Low)', value: 'rating' },
                            { label: 'Price: Low to High', value: 'price_low' },
                            { label: 'Price: High to Low', value: 'price_high' }
                        ].map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group mb-1">
                                <input 
                                    type="radio" 
                                    name="sort" 
                                    className="accent-[#843D9B] w-4 h-4 cursor-pointer" 
                                    checked={tempFilters.sortBy === opt.value}
                                    onChange={() => updateFilter('sortBy', opt.value)}
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">{opt.label}</span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Rating */}
                    <FilterSection title="Minimum Rating">
                        {[
                            { label: 'Any Rating', value: '' },
                            { label: '4.0+ Stars', value: '4' },
                            { label: '3.0+ Stars', value: '3' }
                        ].map((opt) => (
                            <label key={opt.label} className="flex items-center gap-2 cursor-pointer group mb-1">
                                <input 
                                    type="radio" 
                                    name="rating" 
                                    className="accent-[#843D9B] w-4 h-4 cursor-pointer" 
                                    checked={tempFilters.rating === opt.value}
                                    onChange={() => updateFilter('rating', opt.value)}
                                />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">{opt.label}</span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Price Range */}
                    <FilterSection title="Max Base Price">
                        <input 
                            type="range" 
                            min="100" 
                            max="10000" 
                            step="100"
                            value={tempFilters.maxPrice || 10000}
                            onChange={(e) => updateFilter('maxPrice', e.target.value)}
                            className="w-full accent-[#843D9B] cursor-pointer" 
                        />
                        <div className="flex justify-between text-xs font-bold text-[#843D9B] mt-2">
                            <span>Up to</span>
                            <span>₹{tempFilters.maxPrice || 10000}</span>
                        </div>
                    </FilterSection>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white hover:border-gray-400 transition-all text-sm"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-2.5 px-4 bg-[#843D9B] text-white rounded-lg font-bold hover:bg-[#68166d] transition-all shadow-lg shadow-[#843D9B]/20 text-sm"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    );
};

export default TailorFilterDrawer;
