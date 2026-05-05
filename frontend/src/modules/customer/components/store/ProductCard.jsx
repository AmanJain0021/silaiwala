import React, { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../../utils/cn';
import useWishlistStore from '../../../../store/wishlistStore';

const ProductCard = ({ product, onAddClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { toggleWishlist, isInWishlist } = useWishlistStore(state => state);
    const isWishlisted = isInWishlist(product._id || product.id);

    return (
        <div
            className="group relative bg-white border border-gray-100/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-sm flex flex-col cursor-pointer"
            onClick={(e) => {
                e.preventDefault();
                onAddClick && onAddClick(product);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Discount Badge */}
            {product.discount && (
                <div className="absolute top-2 left-2 z-20 bg-[#FFBC00] text-[#2D2F6E] text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                    -{product.discount}%
                </div>
            )}

            {/* Wishlist Icon */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(product._id || product.id);
                }}
                className={cn(
                    "absolute top-2 right-2 z-20 p-1.5 rounded-full bg-white/90 shadow-sm transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300",
                    isWishlisted ? "text-error opacity-100 translate-y-0" : "text-gray-400 hover:text-error"
                )}
            >
                <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
            </button>

            {/* Image Box */}
            <div className="relative aspect-square overflow-hidden bg-gray-50/50">
                <img
                    src={product.image}
                    alt={product.name}
                    className={cn(
                        "object-cover w-full h-full transition-transform duration-700 ease-out",
                        isHovered ? "scale-105" : "scale-100"
                    )}
                />
            </div>

            {/* Compact Details (Matches Image 2) */}
            <div className="p-3 pb-4">
                {/* Category & Rating */}
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                        {typeof product.category === 'object' ? product.category?.name : product.category || 'FABRICS'}
                    </span>
                    <div className="flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded-md text-[10px] font-black text-[#2D2F6E]">
                        {product.rating || product.ratings || 0} <Star className="h-2 w-2 fill-current" />
                    </div>
                </div>

                {/* Name & Subtitle */}
                <h3 className="text-[13px] font-black text-gray-900 line-clamp-1 mb-0.5 tracking-tight group-hover:text-[#2D2F6E] transition-colors">
                    {product.name}
                </h3>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
                    Available at: <span className="text-[#2D2F6E] truncate">{product.tailor?.shopName || product.tailor?.name || "Silaiwala Central Store"}</span>
                </p>

                {/* Price - simple and clean */}
                <div className="flex items-baseline gap-2">
                    <span className="text-[15px] font-black text-[#2D2F6E]">₹{product.price}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">/ meter</span>
                    {product.originalPrice && (
                        <span className="text-[11px] text-gray-400 font-bold line-through ml-1">₹{product.originalPrice}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
