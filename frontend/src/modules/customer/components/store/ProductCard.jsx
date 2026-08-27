import React, { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import useWishlistStore from '../../../../store/wishlistStore';
import { getImageUrl } from '../../../../utils/imageUrl';
import SafeImage from '../../../../components/Common/SafeImage';
import { useRequireAuth } from '../../../../hooks/useRequireAuth';

const ProductCard = ({ product, onAddClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { toggleWishlist, isInWishlist } = useWishlistStore(state => state);
    const { requireAuth } = useRequireAuth();
    const isWishlisted = isInWishlist(product._id || product.id);

    const currentPrice = Number(product.price) || 0;

    return (
        <div
            className="group relative bg-white border border-slate-100/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
            onClick={(e) => {
                e.preventDefault();
                onAddClick && onAddClick(product);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Wishlist Heart Icon */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!requireAuth('Please login to save items to wishlist')) return;
                    toggleWishlist(product._id || product.id);
                }}
                className={cn(
                    "absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 active:scale-90",
                    isWishlisted ? "text-rose-500 bg-white shadow-sm" : "text-white hover:text-rose-400"
                )}
            >
                <Heart className={cn("h-3.5 w-3.5", isWishlisted && "fill-current")} />
            </button>

            {/* Image Container */}
            <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-slate-50">
                <SafeImage
                    src={getImageUrl(product.image || product.images?.[0])}
                    alt={product.name}
                    className={cn(
                        "object-cover w-full h-full transition-transform duration-700 ease-out",
                        isHovered ? "scale-105" : "scale-100"
                    )}
                    fallback="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80"
                />
            </div>

            {/* Details Section */}
            <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                <div>
                    {/* Rating Line */}
                    {product.rating && (
                        <div className="flex items-center gap-1 mb-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-slate-800">{product.rating}</span>
                            <span className="text-[10px] font-semibold text-slate-400">({product.ratingCount || 0})</span>
                        </div>
                    )}

                    {/* Product Name */}
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-1 mb-0.5 tracking-tight group-hover:text-[#843D9B] transition-colors">
                        {product.name}
                    </h3>
                    
                    {/* Width / Details Subtitle */}
                    {product.width && (
                        <p className="text-[10px] font-semibold text-slate-400 tracking-tight mb-2">
                            {product.width}
                        </p>
                    )}
                </div>

                {/* Bottom Price & Circular Cart Button */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-auto">
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-sm sm:text-base font-black text-[#843D9B]">₹{currentPrice}</span>
                        <span className="text-[10px] font-bold text-slate-400">/m</span>
                    </div>
                    
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAddClick && onAddClick(product);
                        }}
                        className="w-8 h-8 rounded-full bg-[#843D9B] text-white flex items-center justify-center hover:bg-[#843D9B] active:scale-95 transition-all shadow-sm cursor-pointer"
                    >
                        <ShoppingCart size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
