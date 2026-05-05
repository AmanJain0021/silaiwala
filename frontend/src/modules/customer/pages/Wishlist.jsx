import React, { useEffect } from 'react';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useWishlistStore from '../../../store/wishlistStore';
import ProductCard from '../components/store/ProductCard';

const WishlistPage = () => {
    const navigate = useNavigate();
    const { items, clearWishlist, fetchWishlist, isLoading } = useWishlistStore(state => state);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Heart size={32} className="text-gray-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Your Wishlist is Empty</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-xs">Save items that you like to your wishlist to review them later.</p>
                <Link
                    to="/store"
                    className="px-6 py-3 rounded-xl bg-[#2D2F6E] text-white font-bold text-sm shadow-lg hover:bg-[#1E1F4D] transition-all"
                >
                    Explore Store
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans relative">
            {/* 1. Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between pt-safe">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">My Wishlist</h1>
                        <p className="text-[10px] text-gray-500">{items.length} Items saved</p>
                    </div>
                </div>
                <button
                    onClick={clearWishlist}
                    className="text-[10px] font-bold text-error uppercase tracking-wider px-3 py-1 hover:bg-indigo-50 rounded-full transition-colors"
                >
                    Clear All
                </button>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 animate-in fade-in duration-500">
                    {items.map((product) => (
                        <ProductCard key={product._id || product.id} product={product} />
                    ))}
                </div>
            </div>

            {/* Quick Link to Cart if items available */}
            <Link
                to="/cart"
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#2D2F6E] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 md:hidden"
            >
                <ShoppingBag size={24} />
            </Link>

        </div>
    );
};

export default WishlistPage;
