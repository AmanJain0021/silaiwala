import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { getImageUrl } from '../../../../utils/imageUrl';

const ProductGallery = ({ images = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const displayImages = images?.length > 0 ? images : ['https://via.placeholder.com/400x500?text=No+Image'];

    return (
        <div className="flex flex-col md:flex-row gap-4">
            {/* Main Image (Mobile: Slider, Desktop: Zoomable) */}
            <div className="relative aspect-[3/4] md:aspect-square bg-gray-100 rounded-2xl overflow-hidden flex-1 group">
                <img
                    src={getImageUrl(displayImages[activeIndex])}
                    alt="Product Main"
                    className="w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-500 cursor-zoom-in"
                />

                {/* Mobile Navigation Arrows */}
                <button
                    onClick={() => setActiveIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-sm md:hidden"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={() => setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-sm md:hidden"
                >
                    <ChevronRight size={20} />
                </button>

                {/* Mobile Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
                    {displayImages.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn("w-1.5 h-1.5 rounded-full", activeIndex === idx ? "bg-primary" : "bg-white/60")}
                        />
                    ))}
                </div>
            </div>

            {/* Thumbnail Strip (Desktop Left/Right/Bottom) */}
            <div className="hidden md:flex flex-row md:flex-col gap-3 order-first md:order-last">
                {displayImages.map((img, idx) => (
                    <div
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className={cn(
                            "w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                            activeIndex === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                        )}
                    >
                        <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductGallery;
