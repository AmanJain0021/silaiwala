import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, ShoppingCart, Heart } from 'lucide-react';
import useCartStore from '../../../store/cartStore';
import useWishlistStore from '../../../store/wishlistStore';
import { PRODUCTS } from '../data/products';

// Components
import ProductGallery from '../components/store-detail/ProductGallery';
import ProductInfo from '../components/store-detail/ProductInfo';
import VariantSelector from '../components/store-detail/VariantSelector';
import PincodeCheck from '../components/store-detail/PincodeCheck';
import ActionButtons from '../components/store-detail/ActionButtons';
import AccordionItem from '../components/store-detail/AccordionItem';

const StoreProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [toast, setToast] = useState(null); // { message, type }
    const [productData, setProductData] = useState(null);

    const addToCart = useCartStore(state => state.addItem);
    const { toggleWishlist, isInWishlist } = useWishlistStore(state => state);

    useEffect(() => {
        // Scroll to top
        window.scrollTo(0, 0);

        // Find product
        const found = PRODUCTS.find(p => p.id === parseInt(id));
        setProductData(found || null);
    }, [id]);

    if (!productData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-[#2D2F6E] border-r-transparent animate-spin"></div>
                <p className="text-gray-500 font-bold">Loading Product...</p>
                <Link to="/store" className="text-[#2D2F6E] underline text-sm font-bold">Return to Store</Link>
            </div>
        );
    }

    const isWishlisted = isInWishlist(productData._id || productData.id);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: productData.title,
                    text: `Check out this ${productData.title} on Silaiwala!`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            showToast("Link copied to clipboard!");
        }
    };

    const handleAddToCart = () => {
        if (!selectedSize || !selectedColor) {
            showToast("Please select size and color", "error");
            return;
        }
        addToCart(productData, { size: selectedSize, color: selectedColor.name });
        showToast("Added to Cart!");
    };

    const handleBuyNow = () => {
        if (!selectedSize || !selectedColor) {
            showToast("Please select size and color", "error");
            return;
        }
        addToCart(productData, { size: selectedSize, color: selectedColor.name });
        navigate('/cart');
    };

    return (
        <div className="min-h-screen bg-white pb-32 font-sans relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 fade-in duration-300 ${toast.type === 'error' ? 'bg-indigo-500 text-white' : 'bg-[#2D2F6E] text-white'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* 1. Header */}
            <div className="sticky top-0 z-50 bg-[#2D2F6E] shadow-md px-4 py-3 flex items-center justify-between pt-safe">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-sm font-bold text-white truncate max-w-[50%]">
                    {productData.title}
                </h1>
                <div className="flex gap-1">
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
                        title="Share"
                    >
                        <Share2 size={20} />
                    </button>
                    <button
                        onClick={() => {
                            toggleWishlist(productData._id || productData.id);
                            showToast(isWishlisted ? "Removed from Wishlist" : "Added to Wishlist");
                        }}
                        className={`p-2 rounded-full transition-colors ${isWishlisted ? 'text-error bg-white shadow-sm' : 'text-white hover:bg-white/10'}`}
                        title="Wishlist"
                    >
                        <Heart size={20} className={isWishlisted ? "fill-current" : ""} />
                    </button>
                    <Link to="/cart" className="p-2 relative text-white hover:bg-white/10 rounded-full transition-colors">
                        <ShoppingCart size={20} />
                        <span className="absolute top-1 right-0 w-2 h-2 bg-indigo-500 rounded-full border border-[#2D2F6E]" />
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-4 md:p-8">
                {/* Left: Gallery */}
                <ProductGallery images={productData.images} />

                {/* Right: Info & Actions */}
                <div className="md:sticky md:top-24 h-max">
                    <ProductInfo product={productData} />

                    <div className="h-px bg-gray-100 my-6" />

                    <VariantSelector
                        sizes={productData.sizes}
                        colors={productData.colors}
                        onSizeSelect={setSelectedSize}
                        onColorSelect={setSelectedColor}
                    />

                    <PincodeCheck />

                    {/* Product Details Accordion */}
                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Product Specifications</h3>
                        {productData.details.map((item, idx) => (
                            <AccordionItem key={idx} title={item.title} content={item.content} />
                        ))}
                        <AccordionItem
                            title="Return & Exchange Policy"
                            content="7-day easy returns if product is unused and tags are intact. Exchange available for size issues."
                        />
                    </div>

                    {/* Action Buttons (Desktop placement, Mobile is fixed) */}
                    <div className="hidden md:block mt-8">
                        <ActionButtons onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Actions */}
            <div className="md:hidden">
                <ActionButtons onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
            </div>

        </div>
    );
};

export default StoreProductDetail;
