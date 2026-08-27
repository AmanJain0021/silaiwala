import React from 'react';
import { Search, ShoppingBag, Heart, SlidersHorizontal, Camera, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from '../../../../store/cartStore';
import useWishlistStore from '../../../../store/wishlistStore';
import useBrandingStore from '../../../../store/brandingStore';
import { getImageUrl } from '../../../../utils/imageUrl';

const StoreHeader = ({ searchQuery, setSearchQuery, onOpenFilter }) => {
    const cartCount = useCartStore((state) => state.getTotalItems());
    const wishlistCount = useWishlistStore((state) => state.items.length);
    const { appName, logos } = useBrandingStore();

    const logoSrc = getImageUrl(logos?.customer) || logos?.customer || '/sewzella_logo.jpeg';
    const displayName = appName || 'SewZella';

    return (
        <div className="bg-white border-b border-slate-100 transition-all duration-300 shadow-2xs">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-3">
                {/* Branding Row */}
                <div className="flex justify-between items-center mb-3 gap-3">
                    <Link
                        to="/user"
                        className="flex items-center gap-2.5 min-w-0 group active:scale-[0.98] transition-transform"
                        aria-label={displayName}
                    >
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white border border-primary/10 shadow-sm flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-black/[0.03]">
                            <img
                                src={logoSrc}
                                alt={displayName}
                                className="w-[88%] h-[88%] object-contain"
                                onError={(e) => {
                                    e.currentTarget.src = '/sewzella_logo-removebg-preview.png';
                                }}
                            />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-[1.35rem] sm:text-2xl font-black text-primary leading-none tracking-tight truncate">
                                {displayName}
                            </h1>
                            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block mt-1 tracking-tight truncate">
                                The Future of Tailoring
                            </span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            to="/user/wishlist"
                            className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all relative active:scale-90 shadow-2xs"
                        >
                            <Heart size={18} className={wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4.5 w-4.5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            to="/user/cart"
                            className="w-10 h-10 rounded-full border border-slate-200/80 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all relative active:scale-90 shadow-2xs"
                        >
                            <ShoppingBag size={18} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4.5 w-4.5 bg-primary text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <button
                            type="button"
                            onClick={onOpenFilter}
                            className="w-10 h-10 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-90 transition-all shadow-2xs cursor-pointer"
                        >
                            <SlidersHorizontal size={18} />
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search fabrics, suits, designs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50/80 border border-slate-200/80 rounded-full py-2.5 pl-10 pr-20 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 shadow-inner"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-2.5">
                        <button type="button" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                            <Camera size={18} />
                        </button>
                        <button type="button" className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                            <Mic size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreHeader;
