import React, { useState, useEffect } from 'react';
import { cn } from '../../../../utils/cn';
import { Ruler } from 'lucide-react';

const VariantSelector = ({ variants, onSizeSelect, onColorSelect }) => {
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);

    // If no variants, don't render
    if (!variants || variants.length === 0) return null;

    // Extract unique sizes and colors from variants
    const uniqueSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
    const uniqueColors = [...new Set(variants.map(v => v.color).filter(Boolean))];

    const handleSize = (s) => {
        setSelectedSize(s);
        onSizeSelect(s);
    };

    const handleColor = (c) => {
        setSelectedColor(c);
        onColorSelect(c);
    };

    return (
        <div className="mb-6 space-y-6">
            {/* Size Selector */}
            {uniqueSizes.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-gray-900">Select Size</h3>
                        <button className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                            <Ruler size={12} /> Size Chart
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {uniqueSizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => handleSize(size)}
                                className={cn(
                                    "w-10 h-10 rounded-full border flex items-center justify-center text-xs font-semibold transition-all",
                                    selectedSize === size
                                        ? "bg-primary text-white border-primary shadow-md scale-105"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Color Selector */}
            {uniqueColors.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Select Color</h3>
                    <div className="flex flex-wrap gap-4">
                        {uniqueColors.map((color) => {
                            // A simple color mapping for common colors, could be expanded
                            const colorMap = {
                                'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e', 
                                'black': '#000000', 'white': '#ffffff', 'yellow': '#eab308'
                            };
                            const hex = colorMap[color.toLowerCase()] || '#ccc';

                            return (
                                <button
                                    key={color}
                                    onClick={() => handleColor(color)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all relative",
                                        selectedColor === color ? "border-primary scale-110 ring-2 ring-offset-2 ring-primary" : "border-gray-200 hover:scale-105"
                                    )}
                                    style={{ backgroundColor: hex }}
                                    title={color}
                                >
                                    {selectedColor === color && (
                                        <span className={cn(
                                            "absolute inset-0 flex items-center justify-center drop-shadow-sm text-xs",
                                            (color.toLowerCase() === 'white' || color.toLowerCase() === 'yellow') ? 'text-gray-900' : 'text-white/80'
                                        )}>✓</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariantSelector;
