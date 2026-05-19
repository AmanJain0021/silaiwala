import React, { useState } from 'react';
import { Search, Bell, ShoppingBag, X, Heart, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from '../../../../store/cartStore';
import useWishlistStore from '../../../../store/wishlistStore';
import { motion, AnimatePresence } from 'framer-motion';

const silaiwalaLogo = '/sewzella_logo.jpeg';

const StoreHeader = ({ searchQuery, setSearchQuery, onOpenFilter }) => {
    const cartCount = useCartStore(state => state.getTotalItems());
    const wishlistCount = useWishlistStore(state => state.items.length);

    return (
        <div className="sticky top-0 md:top-20 z-[105] bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 transition-all duration-300">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-2 pt-safe">
                {/* Branding Row - Mobile Only */}
                <div className="flex justify-between items-center mb-2 md:hidden">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-gray-50 rotate-3 active:scale-95 transition-transform">
                            <img src={silaiwalaLogo} alt="Silaiwala" className="w-full h-full object-cover" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 leading-none tracking-tight">SewZ<span className="text-[#2D2F6E]">ella</span></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Link
                            to="/wishlist"
                            className="p-2 bg-gray-50 rounded-2xl text-gray-400 border border-gray-100 hover:bg-white hover:text-[#2D2F6E] transition-all active:scale-90 relative"
                        >
                            <Heart size={18} className={wishlistCount > 0 ? "fill-[#2D2F6E] text-[#2D2F6E]" : ""} />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#FFBC00] text-[#2D2F6E] text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-md">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            to="/cart"
                            className="p-2 bg-gray-50 rounded-2xl text-gray-400 border border-gray-100 hover:bg-white hover:text-[#2D2F6E] transition-all active:scale-90 relative"
                        >
                            <ShoppingBag size={18} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#2D2F6E] text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-md">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <button onClick={onOpenFilter} className="p-0.5 border border-gray-100 rounded-xl overflow-hidden active:scale-90 transition-transform">
                            <div className="w-9 h-9 bg-gray-100 rounded-[0.75rem] flex items-center justify-center text-gray-400">
                                <SlidersHorizontal size={18} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#2D2F6E] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search fabrics, designs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100 border border-transparent rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2D2F6E]/5 focus:border-[#2D2F6E]/20 transition-all placeholder:text-gray-400 shadow-inner"
                    />
                </div>
            </div>
        </div>
    );
};

export default StoreHeader;
