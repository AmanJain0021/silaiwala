import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, X, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useCartStore from '../../../../store/cartStore';
import useWishlistStore from '../../../../store/wishlistStore';
import { SOCKET_URL } from '../../../../config/constants';
import { cn } from '../../../../utils/cn';

const AddToCartModal = ({ isOpen, onClose, product }) => {
    const [isAdding, setIsAdding] = useState(false);
    const { addItem } = useCartStore();
    const { toggleWishlist, isInWishlist } = useWishlistStore();

    if (!product) return null;

    const isWishlisted = isInWishlist(product._id || product.id);
    const price = Number(product.price) || 0;
    const estStitching = product.category?.basePrice || 499;
    const totalPrice = price + estStitching;

    // Safety check for category object
    const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
    const storeName = product.tailor?.shopName || product.tailor?.name || "Silaiwala Central Store";

    const getImageUrl = (img) => {
        if (!img) return '';
        if (img.startsWith('http')) return img;
        return `${SOCKET_URL}${img}`;
    };

    const handleAddToCart = async () => {
        setIsAdding(true);
        try {
            await addItem(product);
            toast.success("Added to cart successfully!");
            onClose();
        } catch (error) {
            toast.error("Failed to add to cart");
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
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md sm:items-center sm:p-0"
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[92%] sm:max-w-sm bg-white overflow-hidden shadow-2xl rounded-[2.5rem] flex flex-col max-h-[90vh]"
                    >
                        {/* Image Section */}
                        <div className="relative aspect-square sm:aspect-video bg-gray-100 w-full overflow-hidden shrink-0">
                            <img
                                src={getImageUrl(product.image)}
                                alt={product.name}
                                className="object-cover w-full h-full"
                            />
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 bg-white/50 backdrop-blur-md p-2 rounded-full text-gray-800 hover:bg-white transition"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>

                            {/* Discount Badge */}
                            {product.discount && (
                                <div className="absolute top-4 left-4 bg-[#FFBC00] text-[#2D2F6E] text-[10px] font-black px-2.5 py-1 rounded-lg border border-white/20 uppercase tracking-widest">
                                    -{product.discount}%
                                </div>
                            )}
                        </div>

                        {/* Content Section (Matches Image 3 perfectly!) */}
                        <div className="p-4 sm:p-5 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center -mb-1">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    {categoryName || 'FABRICS'}
                                </span>
                                <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md text-[10px] font-black text-[#2D2F6E]">
                                    {product.rating || product.ratings || 0} <Star className="h-3 w-3 fill-current" />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-black text-gray-900 leading-tight tracking-tight">
                                    {product.name}
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                                    Available At: <span className="text-[#2D2F6E]">{storeName}</span>
                                </p>
                            </div>

                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-black text-[#2D2F6E]">₹{price}</span>
                                {product.type === 'fabric' && <span className="text-[11px] text-gray-500 font-bold">/ meter</span>}
                                {product.originalPrice && (
                                    <span className="text-sm font-bold text-gray-400 line-through">₹{product.originalPrice}</span>
                                )}
                            </div>

                            {/* Estimate Box */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col gap-2 shadow-inner mt-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Est. Stitching</span>
                                    <span className="text-xs font-black text-[#2D2F6E]">₹{estStitching}</span>
                                </div>
                                <div className="h-[1px] w-full bg-gray-200 border-dashed border-b border-gray-200"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Total Est.</span>
                                    <span className="text-sm font-black text-[#2D2F6E]">₹{totalPrice}*</span>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex gap-2">
                                {product.codAvailable !== false && (
                                    <div className="inline-block text-[10px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 mt-1 uppercase tracking-widest">
                                        COD Available
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-4 pt-1">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleWishlist(product._id || product.id);
                                    }}
                                    className="p-4 rounded-[1.2rem] border border-gray-100 bg-gray-50 flex items-center justify-center active:scale-95 transition-all w-14 shrink-0"
                                >
                                    <Heart className={cn("h-6 w-6 stroke-2", isWishlisted ? "fill-red-500 text-error" : "text-gray-400")} />
                                </button>

                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAdding}
                                    className="flex-1 bg-[#2D2F6E] text-white rounded-[1.2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-900/20 disabled:opacity-50"
                                >
                                    {isAdding ? "Adding..." : (
                                        <>
                                            <ShoppingCart size={18} strokeWidth={2.5} />
                                            Add to Cart
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddToCartModal;
