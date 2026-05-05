import React, { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '../../../../utils/cn';

const FilterSection = ({ title, children, isOpen = true }) => {
    const [open, setOpen] = useState(isOpen);
    return (
        <div className="border-b border-gray-100 py-4 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-2 hover:text-primary"
            >
                {title}
                <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
            </button>
            {open && <div className="space-y-2 mt-2">{children}</div>}
        </div>
    );
};

const FilterDrawer = ({ isOpen, onClose, filters, setFilters }) => {
    const [tempFilters, setTempFilters] = useState(filters);

    const handleApply = () => {
        setFilters(tempFilters);
        onClose();
    };

    const handleClear = () => {
        setTempFilters({}); // Reset to defaults
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
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
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
                        {['Price: Low to High', 'Price: High to Low', 'Popular', 'Newest'].map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                                <input type="radio" name="sort" className="accent-primary w-4 h-4 cursor-pointer" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-900">{opt}</span>
                            </label>
                        ))}
                    </FilterSection>

                    {/* Price Range */}
                    <FilterSection title="Price Range">
                        <input type="range" min="500" max="10000" className="w-full accent-primary cursor-pointer" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>₹500</span>
                            <span>₹10,000+</span>
                        </div>
                    </FilterSection>

                    {/* Size */}
                    <FilterSection title="Size">
                        <div className="flex flex-wrap gap-2">
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                                <button
                                    key={size}
                                    className="px-3 py-1 border rounded-md text-xs font-medium hover:border-primary hover:bg-primary/5 transition-colors"
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Color */}
                    <FilterSection title="Color">
                        <div className="flex flex-wrap gap-3">
                            {['#000', '#fff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map((color) => (
                                <button
                                    key={color}
                                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm relative hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </FilterSection>

                    {/* Availability */}
                    <FilterSection title="Availability">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-primary rounded w-4 h-4" />
                            <span className="text-sm text-gray-600">In Stock Only</span>
                        </label>
                    </FilterSection>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white hover:border-gray-400 transition-all text-sm"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-all shadow-lg shadow-indigo-900/10 text-sm"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    );
};

export default FilterDrawer;
