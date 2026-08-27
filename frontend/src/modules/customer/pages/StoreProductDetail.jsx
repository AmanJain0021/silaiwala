import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Share2,
    Heart,
    Star,
    ShoppingBag,
    Zap,
    ChevronDown,
    Shirt,
    Scissors,
    RefreshCw,
    ShieldCheck,
    Truck,
    Gem,
} from 'lucide-react';
import useCartStore from '../../../store/cartStore';
import useWishlistStore from '../../../store/wishlistStore';
import api from '../../../utils/api';
import useBrandingStore from '../../../store/brandingStore';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { getImageUrl } from '../../../utils/imageUrl';
import { cn } from '../../../utils/cn';
import VariantSelector from '../components/store-detail/VariantSelector';
import PincodeCheck from '../components/store-detail/PincodeCheck';

const StoreProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [toast, setToast] = useState(null);
    const [productData, setProductData] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [specsOpen, setSpecsOpen] = useState(false);
    const appName = useBrandingStore((state) => state.appName);

    const addToCart = useCartStore((state) => state.addItem);
    const { toggleWishlist, isInWishlist } = useWishlistStore((state) => state);
    const { requireAuth } = useRequireAuth();

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`);
                if (res.data.success) {
                    setProductData(res.data.data);
                    setActiveImage(0);
                }
            } catch (error) {
                console.error('Error fetching product details:', error);
                showToast('Failed to load product details', 'error');
            }
        };
        fetchProduct();
    }, [id]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (!productData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-r-transparent animate-spin" />
                <p className="text-gray-500 font-bold text-sm">Loading Product...</p>
                <Link to="/user/store" className="text-primary underline text-sm font-bold">
                    Return to Store
                </Link>
            </div>
        );
    }

    const isWishlisted = isInWishlist(productData._id || productData.id);
    const price = Number(productData.price) || 0;
    const originalPrice = Number(
        productData.discountPrice || productData.originalPrice || productData.basePrice || 0
    );
    const discount =
        originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    const estStitching = Number(productData.category?.basePrice) || 499;
    const totalPrice = price + estStitching;
    const rating = Number(productData.rating || productData.ratings || 4.5) || 4.5;
    const reviewCount = productData.reviews || productData.numReviews || '120+';
    const storeName =
        productData.tailor?.shopName ||
        productData.tailor?.name ||
        productData.storeName ||
        `${appName} Store`;
    const productTitle = productData.title || productData.name || 'Product';
    const brandLabel = productData.brand || `${appName} Brand`;

    const images =
        productData.images?.length > 0
            ? productData.images
            : [productData.image].filter(Boolean);
    if (images.length === 0) {
        images.push('https://placehold.co/600x800/e6e8f0/843d9b?text=Product');
    }

    const specEntries = [
        { label: 'Fabric', value: productData.fabric },
        { label: 'Fit', value: productData.fitType || productData.fit },
        { label: 'Pattern', value: productData.pattern },
        { label: 'Gender', value: productData.gender },
        { label: 'Occasion', value: productData.occasion },
        { label: 'Wash Care', value: productData.washCare },
        { label: 'Brand', value: productData.brand },
        ...(productData.details || []).map((d) => ({
            label: d.title,
            value: d.content,
        })),
    ].filter((s) => s.value);

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: productTitle,
                    text: `Check out this ${productTitle} on ${appName}!`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard!');
            }
        } catch (err) {
            console.log('Error sharing:', err);
        }
    };

    const handleAddToCart = () => {
        if (!requireAuth('Please login to add items to cart')) return;
        const hasSizes = productData.variants?.some((v) => v.size);
        const hasColors = productData.variants?.some((v) => v.color);
        if (hasSizes && !selectedSize) {
            showToast('Please select a size', 'error');
            return;
        }
        if (hasColors && !selectedColor) {
            showToast('Please select a color', 'error');
            return;
        }
        addToCart(productData, {
            size: selectedSize || 'Standard',
            color: selectedColor || 'Default',
        });
        showToast('Added to Cart!');
    };

    const handleBuyNow = () => {
        if (!requireAuth('Please login to buy this product')) return;
        const hasSizes = productData.variants?.some((v) => v.size);
        const hasColors = productData.variants?.some((v) => v.color);
        if (hasSizes && !selectedSize) {
            showToast('Please select a size', 'error');
            return;
        }
        if (hasColors && !selectedColor) {
            showToast('Please select a color', 'error');
            return;
        }
        addToCart(productData, {
            size: selectedSize || 'Standard',
            color: selectedColor || 'Default',
        });
        navigate('/user/cart');
    };

    return (
        <div className="min-h-screen bg-[#FAFAFB] pb-36 font-sans relative max-w-lg mx-auto">
            {toast && (
                <div
                    className={cn(
                        'fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 fade-in duration-300',
                        toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-primary text-white'
                    )}
                >
                    {toast.message}
                </div>
            )}

            {/* Hero */}
            <div className="relative w-full aspect-[5/4] max-h-[260px] bg-gradient-to-br from-primary/5 via-gray-100 to-gray-50">
                <img
                    src={getImageUrl(images[activeImage])}
                    alt={productTitle}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/600x480/e6e8f0/843d9b?text=Product';
                    }}
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FAFAFB] to-transparent pointer-events-none" />

                <div className="absolute top-0 inset-x-0 px-3.5 py-3 flex items-start justify-between z-20">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-800 active:scale-95 transition"
                        aria-label="Back"
                    >
                        <ArrowLeft size={16} strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (!requireAuth('Please login to use wishlist')) return;
                                toggleWishlist(productData._id || productData.id);
                                showToast(isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist');
                            }}
                            className={cn(
                                'w-9 h-9 rounded-full shadow-md flex items-center justify-center active:scale-95 transition',
                                isWishlisted ? 'bg-rose-50 text-rose-500' : 'bg-white text-gray-700'
                            )}
                            aria-label="Wishlist"
                        >
                            <Heart size={16} className={isWishlisted ? 'fill-current' : ''} strokeWidth={2.25} />
                        </button>
                        <button
                            type="button"
                            onClick={handleShare}
                            className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 active:scale-95 transition"
                            aria-label="Share"
                        >
                            <Share2 size={15} strokeWidth={2.25} />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-5 right-3.5 z-20 bg-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-gray-100/80">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-black text-gray-900">{rating.toFixed(1)}</span>
                    <span className="text-[9px] font-semibold text-gray-400">· {reviewCount}</span>
                </div>
            </div>

            <div className="relative -mt-3 px-4 space-y-3.5">
                {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveImage(idx)}
                                className={cn(
                                    'w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all bg-white',
                                    activeImage === idx ? 'border-primary shadow-sm' : 'border-white opacity-75'
                                )}
                            >
                                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">{brandLabel}</p>
                    <h1 className="mt-1 text-xl font-black text-gray-900 tracking-tight leading-snug">
                        {productTitle}
                    </h1>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/5 border border-primary/10 px-2.5 py-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Store</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-wide truncate max-w-[180px]">
                            {storeName}
                        </span>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-dashed border-gray-100">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-[26px] font-black text-gray-900 tracking-tight leading-none">
                                ₹{price.toLocaleString('en-IN')}
                            </span>
                            {originalPrice > price && (
                                <>
                                    <span className="text-sm text-gray-400 line-through font-semibold">
                                        ₹{originalPrice.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                        {discount}% OFF
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="mt-2 text-[10px] font-semibold text-gray-500 leading-relaxed">
                            Fabric ₹{price.toLocaleString('en-IN')}
                            <span className="text-gray-300 mx-1">·</span>
                            Stitch ₹{estStitching.toLocaleString('en-IN')}
                            <span className="text-gray-300 mx-1">·</span>
                            <span className="text-primary font-black">
                                Total ₹{totalPrice.toLocaleString('en-IN')}*
                            </span>
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-4">
                    <VariantSelector
                        variants={productData.variants || []}
                        onSizeSelect={setSelectedSize}
                        onColorSelect={setSelectedColor}
                    />
                    <PincodeCheck />
                </div>

                <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setSpecsOpen((o) => !o)}
                        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Shirt size={15} />
                            </div>
                            <div>
                                <p className="text-[12px] font-black text-gray-900">Product Specifications</p>
                                <p className="text-[10px] text-gray-400 font-medium">Fabric, fit & care details</p>
                            </div>
                        </div>
                        <ChevronDown
                            size={16}
                            className={cn('text-gray-400 shrink-0 transition-transform', specsOpen && 'rotate-180')}
                        />
                    </button>

                    {specsOpen && (
                        <div className="px-4 pb-4 border-t border-gray-50 space-y-3 pt-3">
                            {specEntries.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {specEntries.map((spec) => (
                                        <div
                                            key={`${spec.label}-${String(spec.value).slice(0, 12)}`}
                                            className="rounded-xl bg-gray-50/80 border border-gray-100/60 px-3 py-2.5"
                                        >
                                            <p className="text-[8px] font-black uppercase tracking-wider text-gray-400 mb-0.5">
                                                {spec.label}
                                            </p>
                                            <p className="text-[12px] font-bold text-gray-900 leading-snug">
                                                {spec.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {productData.description && (
                                <p className="text-[12px] text-gray-500 leading-relaxed font-medium">
                                    {productData.description}
                                </p>
                            )}
                            <div className="rounded-xl bg-gray-50/80 border border-gray-100/60 px-3 py-2.5">
                                <p className="text-[8px] font-black uppercase tracking-wider text-gray-400 mb-0.5">
                                    Return & Exchange
                                </p>
                                <p className="text-[12px] font-bold text-gray-900 leading-snug">
                                    7-day easy returns if unused with tags intact.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2 pb-2">
                    {[
                        { icon: Gem, title: 'Premium Fabric', sub: 'Quality feel' },
                        { icon: Scissors, title: 'Expert Stitch', sub: 'Tailor finish' },
                        { icon: RefreshCw, title: 'Easy Returns', sub: '7-day policy' },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="rounded-2xl bg-white border border-gray-100/80 shadow-sm px-2 py-3 text-center"
                        >
                            <div className="mx-auto w-8 h-8 rounded-full bg-primary/8 text-primary flex items-center justify-center mb-1.5">
                                <item.icon size={14} strokeWidth={2} />
                            </div>
                            <p className="text-[9px] font-black text-gray-900 leading-tight">{item.title}</p>
                            <p className="text-[8px] text-gray-400 font-medium mt-0.5">{item.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 pt-3 pb-safe">
                <div className="max-w-lg mx-auto">
                    <div className="flex gap-2.5">
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="flex-1 h-[48px] rounded-2xl border-2 border-primary text-primary bg-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition"
                        >
                            <ShoppingBag size={15} />
                            Add to Cart
                        </button>
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            className="flex-[1.15] h-[48px] rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-[0.98] transition"
                        >
                            <Zap size={15} fill="currentColor" />
                            Buy · ₹{price.toLocaleString('en-IN')}
                        </button>
                    </div>
                    <div className="mt-2 mb-1.5 flex items-center justify-center gap-3.5 text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                            <ShieldCheck size={10} className="text-primary" /> Secure
                        </span>
                        <span className="flex items-center gap-1">
                            <Truck size={10} className="text-primary" /> Fast delivery
                        </span>
                        <span className="flex items-center gap-1">
                            <RefreshCw size={10} className="text-primary" /> Easy returns
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreProductDetail;
