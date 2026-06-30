import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../../../store/cartStore';
import useWishlistStore from '../../../../store/wishlistStore';
import { SOCKET_URL } from '../../../../config/constants';
import { cn } from '../../../../utils/cn';

const AddToCartModal = ({ isOpen, onClose, product }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);

    const { addItem } = useCartStore();
    const { toggleWishlist, isInWishlist } = useWishlistStore();
    const navigate = useNavigate();

    useEffect(() => {
        setCurrentImageIndex(0);
        setSelectedSize(null);
        setSelectedColor(null);
    }, [product, isOpen]);

    if (!product) return null;

    const isWishlisted = isInWishlist(product._id || product.id);
    const price = Number(product.price) || 0;
    const originalPrice = Number(product.discountPrice || product.originalPrice) || 0;
    const discount = product.discount || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
    const estStitching = product.category?.basePrice || 499;
    const totalPrice = price + estStitching;

    // Safety check for category object
    const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
    const storeName = product.tailor?.shopName || product.tailor?.name || "Silaiwala Central Store";

    const getImageUrl = (img) => {
        if (!img) return '';
        if (img.startsWith('http')) return img;
        const separator = img.startsWith('/') ? '' : '/';
        return `${SOCKET_URL}${separator}${img}`;
    };

    const displayImages = product.images && product.images.length > 0
        ? product.images
        : [product.image].filter(Boolean);

    if (displayImages.length === 0) {
        displayImages.push('https://via.placeholder.com/400x500?text=No+Image');
    }

    // Parse variants if they are comma-separated or HTML-escaped
    const parseVariantOptions = (field) => {
        if (!product.variants || product.variants.length === 0) return [];
        const set = new Set();
        product.variants.forEach(v => {
            const val = v[field];
            if (!val) return;
            let cleaned = String(val)
                .replace(/&lt;/gi, ',')
                .replace(/&gt;/gi, ',')
                .replace(/&LT;/g, ',')
                .replace(/&GT;/g, ',')
                .replace(/[<>;|/]/g, ',');
            cleaned.split(',').forEach(part => {
                const trimmed = part.trim();
                if (trimmed) {
                    set.add(trimmed);
                }
            });
        });
        return [...set];
    };

    const sizes = parseVariantOptions('size');
    const colors = parseVariantOptions('color');

    const handleAddToCart = async () => {
        if (sizes.length > 0 && !selectedSize) {
            toast.error("Please select a size");
            return;
        }
        if (colors.length > 0 && !selectedColor) {
            toast.error("Please select a color");
            return;
        }

        setIsAdding(true);
        try {
            await addItem(product, { size: selectedSize || 'Standard', color: selectedColor || 'Default' });
            toast.success("Added to cart successfully!");
            onClose();
        } catch (error) {
            toast.error("Failed to add to cart");
        } finally {
            setIsAdding(false);
        }
    };

    const handleBuyNow = async () => {
        if (sizes.length > 0 && !selectedSize) {
            toast.error("Please select a size");
            return;
        }
        if (colors.length > 0 && !selectedColor) {
            toast.error("Please select a color");
            return;
        }

        setIsAdding(true);
        try {
            await addItem(product, { size: selectedSize || 'Standard', color: selectedColor || 'Default' });
            toast.success("Added to cart successfully!");
            onClose();
            navigate('/user/cart');
        } catch (error) {
            toast.error("Failed to proceed to buy");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-md sm:items-center sm:p-0"
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-white overflow-hidden shadow-2xl rounded-[2rem] flex flex-col max-h-[92vh] border border-gray-100/50 animate-in zoom-in-95 duration-300"
                    >
                        {/* Image Section */}
                        <div className="relative aspect-[3/4] bg-gray-50 w-full overflow-hidden shrink-0">
                            {/* Images Carousel */}
                            <div className="relative w-full h-full">
                                <AnimatePresence initial={false} mode="wait">
                                    <motion.img
                                        key={currentImageIndex}
                                        src={getImageUrl(displayImages[currentImageIndex])}
                                        alt={product.name}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute inset-0 object-cover w-full h-full"
                                    />
                                </AnimatePresence>

                                {/* Navigation Arrows */}
                                {displayImages.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentImageIndex(prev => (prev === 0 ? displayImages.length - 1 : prev - 1));
                                            }}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#843D9B] p-1.5 rounded-full transition shadow-md hover:scale-105 active:scale-95 cursor-pointer z-20"
                                        >
                                            <ChevronLeft size={16} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentImageIndex(prev => (prev === displayImages.length - 1 ? 0 : prev + 1));
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#843D9B] p-1.5 rounded-full transition shadow-md hover:scale-105 active:scale-95 cursor-pointer z-20"
                                        >
                                            <ChevronRight size={16} strokeWidth={2.5} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Wishlist Overlay Button (Top-Left) */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWishlist(product._id || product.id);
                                }}
                                className={cn(
                                    "absolute top-4 left-4 p-2 rounded-full transition shadow-lg cursor-pointer z-20",
                                    isWishlisted
                                        ? "bg-rose-50 text-rose-500"
                                        : "bg-white/80 hover:bg-white text-gray-500 hover:text-rose-500"
                                )}
                            >
                                <Heart className={cn("h-4 w-4 stroke-[2.5]", isWishlisted && "fill-current")} />
                            </button>

                            {/* Close Button (Top-Right) */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 bg-white/80 hover:bg-[#843D9B] text-[#843D9B] hover:text-white backdrop-blur-md p-2 rounded-full transition shadow-lg cursor-pointer z-20"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>

                            {/* Rating Overlay (Bottom-Left) */}
                            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-black text-gray-800 shadow-sm flex items-center gap-1 z-20">
                                {product.rating || product.ratings || 0} <Star className="h-2.5 w-2.5 fill-current text-green-600" />
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500 font-bold">12K+</span>
                            </div>
                        </div>

                        {/* Content Section (Scrollable pane) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-4">
                            {/* Color Selection & Image Thumbnails Strip */}
                            {displayImages.length > 1 && (
                                <div className="px-5 pt-4">
                                    <span className="text-[11px] font-bold text-gray-500 block mb-2">
                                        Selected Color: <span className="text-gray-900 font-extrabold capitalize">{selectedColor || 'Default'}</span>
                                    </span>
                                    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1">
                                        {displayImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setCurrentImageIndex(idx);
                                                    if (product.variants && product.variants[idx]) {
                                                        setSelectedColor(product.variants[idx].color || null);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-12 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer",
                                                    currentImageIndex === idx ? "border-[#843D9B]" : "border-transparent opacity-85 hover:opacity-100"
                                                )}
                                            >
                                                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size Selection Grid */}
                            {sizes.length > 0 && (
                                <div className="px-5 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-bold text-gray-800">Select Size</span>
                                        <button type="button" className="text-[10px] font-extrabold text-blue-600 hover:underline cursor-pointer">
                                            Size Chart
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {sizes.map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => setSelectedSize(size)}
                                                className={cn(
                                                    "w-12 h-10 rounded-xl border text-xs font-black transition-all flex items-center justify-center cursor-pointer",
                                                    selectedSize === size
                                                        ? "bg-white text-gray-900 border-[#843D9B] ring-2 ring-[#843D9B]/20"
                                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                )}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Brand & Product Title */}
                            <div className="px-5 pt-5">
                                <span className="text-xs font-extrabold text-gray-900 block uppercase tracking-widest mb-1">
                                    {product.brand || "SILAIWALA BRAND"}
                                </span>
                                <h2 className="text-[13px] font-medium text-gray-500 leading-tight">
                                    {product.name}
                                </h2>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">
                                    Store: <span className="text-[#843D9B] font-black">{storeName}</span>
                                </p>
                            </div>

                            {/* Price & Stitching Breakdown */}
                            <div className="px-5 pt-4 flex flex-col gap-1.5">
                                {/* Hot Deal / Promo Tag */}
                                {discount >= 30 && (
                                    <div className="w-max bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider mb-1">
                                        Hot Deal
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    {discount > 0 && (
                                        <span className="text-emerald-600 text-base font-extrabold flex items-center">
                                            ↓{discount}%
                                        </span>
                                    )}
                                    {originalPrice > price && (
                                        <span className="text-sm text-gray-400 line-through">
                                            ₹{originalPrice}
                                        </span>
                                    )}
                                    <span className="text-xl font-black text-gray-900">
                                        ₹{price}
                                    </span>
                                </div>

                                {/* Clean Estimate Breakdown */}
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                                    <span>Fabric: <strong className="text-gray-800">₹{price}</strong></span>
                                    <span className="text-gray-300">|</span>
                                    <span>Stitching: <strong className="text-gray-800">₹{estStitching}</strong></span>
                                    <span className="text-gray-300">|</span>
                                    <span>Total: <strong className="text-[#843D9B]">₹{totalPrice}*</strong></span>
                                </div>
                            </div>

                            {/* Collapsible Product Specifications */}
                            {(product.fabric || product.fitType || product.pattern || product.washCare || product.gender || product.occasion) && (
                                <div className="px-5 pt-5 pb-2">
                                    <details className="group border-t border-gray-100 pt-3">
                                        <summary className="text-[11px] font-extrabold text-gray-800 uppercase tracking-widest cursor-pointer list-none flex justify-between items-center select-none">
                                            <span>Product Specifications</span>
                                            <span className="transition-transform group-open:rotate-180 text-gray-400 text-xs">▼</span>
                                        </summary>
                                        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[10px] text-gray-600 uppercase tracking-wider mt-3 font-semibold">
                                            {product.fabric && <div><span className="text-gray-400">Fabric:</span> <span className="text-gray-800 font-bold">{product.fabric}</span></div>}
                                            {product.fitType && <div><span className="text-gray-400">Fit:</span> <span className="text-gray-800 font-bold">{product.fitType}</span></div>}
                                            {product.pattern && <div><span className="text-gray-400">Pattern:</span> <span className="text-gray-800 font-bold">{product.pattern}</span></div>}
                                            {product.gender && <div><span className="text-gray-400">Gender:</span> <span className="text-gray-800 font-bold">{product.gender}</span></div>}
                                            {product.occasion && <div><span className="text-gray-400">Occasion:</span> <span className="text-gray-800 font-bold">{product.occasion}</span></div>}
                                            {product.washCare && <div className="col-span-2"><span className="text-gray-400">Wash Care:</span> <span className="text-gray-800 font-bold">{product.washCare}</span></div>}
                                        </div>
                                    </details>
                                </div>
                            )}

                            {/* Brief Description */}
                            {product.description && (
                                <div className="px-5 pt-4">
                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Description</span>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {product.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pinned Footer CTAs */}
                        <div className="mt-auto px-5 py-4 border-t border-gray-50 bg-white flex gap-3 z-10 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={isAdding}
                                className="flex-1 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-all text-center"
                            >
                                Add to cart
                            </button>
                            <button
                                type="button"
                                onClick={handleBuyNow}
                                disabled={isAdding}
                                className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-all text-center shadow-sm"
                            >
                                Buy at ₹{price}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddToCartModal;
