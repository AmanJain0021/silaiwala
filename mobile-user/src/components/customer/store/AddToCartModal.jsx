// Port of modules/customer/components/store/AddToCartModal.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState, useEffect } from "react";
import { Star, X, Heart, Share2, ShoppingBag, Zap, ChevronDown, Shirt, Scissors, RefreshCw, ShieldCheck, Truck, Gem } from "lucide-react-native";
import toast from '../../../lib/toast';
import { useNavigate } from '../../../lib/nav';
import useCartStore from "../../../store/cartStore";
import useWishlistStore from "../../../store/wishlistStore";
import useBrandingStore from "../../../store/brandingStore";
import { getImageUrl } from "../../../utils/imageUrl";
import { cn } from "../../../lib/cn";
import SafeImage from "../../common/SafeImage";
import { Box, Btn, I, Txt, Img, Scroll } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { shareLink, webUrl } from '../../../lib/share';
const SPEC_ICONS = {
  fabric: Shirt,
  fit: Shirt,
  fitType: Shirt,
  pattern: Gem,
  gender: Shirt,
  occasion: Gem,
  washCare: RefreshCw,
  brand: Gem
};
const AddToCartModal = ({
  isOpen,
  onClose,
  product
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [specsOpen, setSpecsOpen] = useState(true);
  const {
    addItem
  } = useCartStore();
  const {
    toggleWishlist,
    isInWishlist
  } = useWishlistStore();
  const appName = useBrandingStore(s => s.appName);
  const navigate = useNavigate();
  useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setSpecsOpen(false);
  }, [product, isOpen]);
  if (!product) return null;
  const isWishlisted = isInWishlist(product._id || product.id);
  const price = Number(product.price) || 0;
  const originalPrice = Number(product.discountPrice || product.originalPrice) || 0;
  const discount = product.discount || (originalPrice > price ? Math.round((originalPrice - price) / originalPrice * 100) : 0);
  const estStitching = Number(product.category?.basePrice) || 499;
  const totalPrice = price + estStitching;
  const rating = Number(product.rating || product.ratings || 4.5) || 4.5;
  const reviewCount = product.reviews || product.numReviews || '120+';
  const storeName = product.tailor?.shopName || product.storeName || `${appName} Store`;
  const productTitle = product.title || product.name || 'Product';
  const brandLabel = product.brand || `${appName} Brand`;
  const displayImages = product.images?.length > 0 ? product.images : [product.image].filter(Boolean);
  if (displayImages.length === 0) {
    displayImages.push('https://placehold.co/600x800/e6e8f0/843d9b?text=Product');
  }
  const parseVariantOptions = field => {
    if (!product.variants?.length) return [];
    const set = new Set();
    product.variants.forEach(v => {
      const val = v[field];
      if (!val) return;
      String(val).replace(/&lt;/gi, ',').replace(/&gt;/gi, ',').replace(/[<>;|/]/g, ',').split(',').forEach(part => {
        const trimmed = part.trim();
        if (trimmed) set.add(trimmed);
      });
    });
    return [...set];
  };
  const sizes = parseVariantOptions('size');
  const colors = parseVariantOptions('color');
  const specEntries = [{
    key: 'fabric',
    label: 'Fabric',
    value: product.fabric
  }, {
    key: 'fitType',
    label: 'Fit',
    value: product.fitType || product.fit
  }, {
    key: 'pattern',
    label: 'Pattern',
    value: product.pattern
  }, {
    key: 'gender',
    label: 'Gender',
    value: product.gender
  }, {
    key: 'occasion',
    label: 'Occasion',
    value: product.occasion
  }, {
    key: 'washCare',
    label: 'Wash Care',
    value: product.washCare
  }, {
    key: 'brand',
    label: 'Brand',
    value: product.brand
  }].filter(s => s.value);
  const handleShare = async () => {
    const url = webUrl(`/user/store/product/${product._id || product.id}`);
    await shareLink({ title: productTitle, text: `Check out ${productTitle} on ${appName}`, url });
  };
  const validateVariants = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return false;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return false;
    }
    return true;
  };
  const handleAddToCart = async () => {
    if (!validateVariants()) return;
    setIsAdding(true);
    try {
      await addItem(product, {
        size: selectedSize || 'Standard',
        color: selectedColor || 'Default'
      });
      toast.success('Added to cart');
      onClose();
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };
  const handleBuyNow = async () => {
    if (!validateVariants()) return;
    setIsAdding(true);
    try {
      await addItem(product, {
        size: selectedSize || 'Standard',
        color: selectedColor || 'Default'
      });
      onClose();
      navigate('/user/cart');
    } catch {
      toast.error('Failed to proceed');
    } finally {
      setIsAdding(false);
    }
  };
  return <React.Fragment>
            <Sheet visible={!!isOpen} onClose={onClose} backdropClassName="bg-black/40" className="w-full flex flex-col bg-[#FAFAFB] rounded-t-[1.75rem] overflow-hidden shadow-2xl" style={{ height: '95%' }}>
                    <Box className="flex-1 flex flex-col">
                        {/* Scrollable body */}
                        <Scroll className="flex-1" contentClassName="pb-36">
                            {/* Hero */}
                            <Box className="relative w-full aspect-[5/4] max-h-[260px] bg-gradient-to-br from-primary/5 via-gray-100 to-gray-50">
                                <SafeImage src={getImageUrl(displayImages[currentImageIndex])} alt={productTitle} className="absolute inset-0 w-full h-full" fallback="https://placehold.co/600x480/e6e8f0/843d9b?text=Product" />
                                <Box className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FAFAFB] to-transparent pointer-events-none" />

                                <Box className="absolute top-0 inset-x-0 px-3.5 py-3 flex items-start justify-between z-20">
                                    <Btn onPress={onClose} className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-800 active:scale-95 transition">
                                        <I icon={X} size={16} strokeWidth={2.5} />
                                    </Btn>
                                    <Box className="flex items-center gap-2">
                                        <Btn onPress={() => toggleWishlist(product._id || product.id)} className={cn('w-9 h-9 rounded-full shadow-md flex items-center justify-center active:scale-95 transition', isWishlisted ? 'bg-rose-50 text-rose-500' : 'bg-white text-gray-700')}>
                                            <I icon={Heart} size={16} className={isWishlisted ? 'fill-current' : ''} strokeWidth={2.25} />
                                        </Btn>
                                        <Btn onPress={handleShare} className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 active:scale-95 transition">
                                            <I icon={Share2} size={15} strokeWidth={2.25} />
                                        </Btn>
                                    </Box>
                                </Box>

                                <Box className="absolute bottom-5 right-3.5 z-20 bg-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-gray-100/80">
                                    <I icon={Star} size={11} className="fill-amber-400 text-amber-400" />
                                    <Txt className="text-[11px] font-black text-gray-900">{rating.toFixed(1)}</Txt>
                                    <Txt className="text-[9px] font-semibold text-gray-400">
                                        · {reviewCount}
                                    </Txt>
                                </Box>

                                {displayImages.length > 1 && <Box className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                                        {displayImages.map((_, idx) => <Btn key={idx} onPress={() => setCurrentImageIndex(idx)} className={cn('h-1.5 rounded-full transition-all', currentImageIndex === idx ? 'w-5 bg-primary' : 'w-1.5 bg-white/80')} />)}
                                    </Box>}
                            </Box>

                            {/* Content sheet */}
                            <Box className="relative -mt-3 px-4 space-y-3.5">
                                {displayImages.length > 1 && <Scroll contentClassName="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5" horizontal>
                                        {displayImages.map((img, idx) => <Btn key={idx} onPress={() => setCurrentImageIndex(idx)} className={cn('w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all bg-white', currentImageIndex === idx ? 'border-primary shadow-sm' : 'border-white opacity-75')}>
                                                <Img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                            </Btn>)}
                                    </Scroll>}

                                {/* Title card */}
                                <Box className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-4">
                                    <Box className="flex items-start justify-between gap-3">
                                        <Box className="min-w-0">
                                            <Txt className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                                                {brandLabel}
                                            </Txt>
                                            <Txt className="mt-1 text-xl font-black text-gray-900 tracking-tight leading-snug">
                                                {productTitle}
                                            </Txt>
                                            <Box className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/5 border border-primary/10 px-2.5 py-1">
                                                <Txt className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Store
                                                </Txt>
                                                <Txt className="text-[10px] font-black text-primary uppercase tracking-wide truncate max-w-[160px]">
                                                    {storeName}
                                                </Txt>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box className="mt-4 pt-3.5 border-t border-dashed border-gray-100">
                                        <Box className="flex items-end justify-between gap-3">
                                            <Box>
                                                <Box className="flex items-baseline gap-2 flex-wrap">
                                                    <Txt className="text-[26px] font-black text-gray-900 tracking-tight leading-none">
                                                        ₹{price.toLocaleString('en-IN')}
                                                    </Txt>
                                                    {originalPrice > price && <>
                                                            <Txt className="text-sm text-gray-400 line-through font-semibold">
                                                                ₹{originalPrice.toLocaleString('en-IN')}
                                                            </Txt>
                                                            <Txt className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                                                {discount}% OFF
                                                            </Txt>
                                                        </>}
                                                </Box>
                                                <Txt className="mt-2 text-[10px] font-semibold text-gray-500 leading-relaxed">
                                                    Fabric ₹{price.toLocaleString('en-IN')}
                                                    <Txt className="text-gray-300 mx-1">·</Txt>
                                                    Stitch ₹{estStitching.toLocaleString('en-IN')}
                                                    <Txt className="text-gray-300 mx-1">·</Txt>
                                                    <Txt className="text-primary font-black">
                                                        Total ₹{totalPrice.toLocaleString('en-IN')}*
                                                    </Txt>
                                                </Txt>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Variants */}
                                {(colors.length > 0 || sizes.length > 0) && <Box className="bg-white rounded-2xl border border-gray-100/80 shadow-sm p-4 space-y-4">
                                        {colors.length > 0 && <Box>
                                                <Txt className="text-[10px] font-black text-gray-900 uppercase tracking-wider mb-2">
                                                    Color
                                                    {selectedColor && <Txt className="text-gray-400 font-semibold normal-case tracking-normal">
                                                            {' '}
                                                            · {selectedColor}
                                                        </Txt>}
                                                </Txt>
                                                <Box className="flex flex-wrap gap-2">
                                                    {colors.map(color => <Btn key={color} onPress={() => setSelectedColor(color)} className={cn('px-3.5 py-2 rounded-xl border text-[11px] font-bold capitalize transition-all', selectedColor === color ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 bg-gray-50')}>
                                                            {color}
                                                        </Btn>)}
                                                </Box>
                                            </Box>}
                                        {sizes.length > 0 && <Box>
                                                <Txt className="text-[10px] font-black text-gray-900 uppercase tracking-wider mb-2">
                                                    Size
                                                </Txt>
                                                <Box className="flex flex-wrap gap-2">
                                                    {sizes.map(size => <Btn key={size} onPress={() => setSelectedSize(size)} className={cn('min-w-[44px] h-10 px-3 rounded-xl border text-xs font-black transition-all', selectedSize === size ? 'border-primary bg-primary text-white shadow-sm' : 'border-gray-200 text-gray-700 bg-gray-50')}>
                                                            {size}
                                                        </Btn>)}
                                                </Box>
                                            </Box>}
                                    </Box>}

                                {/* Specs */}
                                {(specEntries.length > 0 || product.description) && <Box className="bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden">
                                        <Btn onPress={() => setSpecsOpen(o => !o)} className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left">
                                            <Box className="flex items-center gap-3 min-w-0">
                                                <Box className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <I icon={Shirt} size={15} />
                                                </Box>
                                                <Box>
                                                    <Txt className="text-[12px] font-black text-gray-900">
                                                        Product Specifications
                                                    </Txt>
                                                    <Txt className="text-[10px] text-gray-400 font-medium">
                                                        Fabric, fit & care details
                                                    </Txt>
                                                </Box>
                                            </Box>
                                            <I icon={ChevronDown} size={16} className={cn('text-gray-400 shrink-0 transition-transform', specsOpen && 'rotate-180')} />
                                        </Btn>

                                        <React.Fragment>
                                            {specsOpen && <Box className="overflow-hidden">
                                                    <Box className="px-4 pb-4 pt-0 border-t border-gray-50">
                                                        <Box className="pt-3 grid grid-cols-2 gap-2">
                                                            {specEntries.map(spec => {
                        const Icon = SPEC_ICONS[spec.key] || Shirt;
                        return <Box key={spec.key} className="rounded-xl bg-gray-50/80 border border-gray-100/60 px-3 py-2.5">
                                                                        <Box className="flex items-center gap-1 text-primary mb-0.5">
                                                                            <I icon={Icon} size={11} />
                                                                            <Txt className="text-[8px] font-black uppercase tracking-wider text-gray-400">
                                                                                {spec.label}
                                                                            </Txt>
                                                                        </Box>
                                                                        <Txt className="text-[12px] font-bold text-gray-900 leading-snug">
                                                                            {spec.value}
                                                                        </Txt>
                                                                    </Box>;
                      })}
                                                        </Box>
                                                        {product.description && <Txt className="mt-3 text-[12px] text-gray-500 leading-relaxed font-medium">
                                                                {product.description}
                                                            </Txt>}
                                                    </Box>
                                                </Box>}
                                        </React.Fragment>
                                    </Box>}

                                {/* Highlights */}
                                <Box className="grid grid-cols-3 gap-2 pb-2">
                                    {[{
                icon: Gem,
                title: 'Premium Fabric',
                sub: 'Quality feel'
              }, {
                icon: Scissors,
                title: 'Expert Stitch',
                sub: 'Tailor finish'
              }, {
                icon: RefreshCw,
                title: 'Easy Returns',
                sub: '7-day policy'
              }].map(item => <Box key={item.title} className="rounded-2xl bg-white border border-gray-100/80 shadow-sm px-2 py-3 text-center">
                                            <Box className="mx-auto w-8 h-8 rounded-full bg-primary/8 text-primary flex items-center justify-center mb-1.5">
                                                <I icon={item.icon} size={14} strokeWidth={2} />
                                            </Box>
                                            <Txt className="text-[9px] font-black text-gray-900 leading-tight">
                                                {item.title}
                                            </Txt>
                                            <Txt className="text-[8px] text-gray-400 font-medium mt-0.5">
                                                {item.sub}
                                            </Txt>
                                        </Box>)}
                                </Box>
                            </Box>
                        </Scroll>

                        {/* Sticky bottom */}
                        <Box className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 pt-3 pb-safe z-30">
                            <Box className="flex gap-2.5">
                                <Btn onPress={handleAddToCart} disabled={isAdding} className="flex-1 h-[48px] rounded-2xl border-2 border-primary text-primary bg-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50">
                                    <I icon={ShoppingBag} size={15} />
                                    Add to Cart
                                </Btn>
                                <Btn onPress={handleBuyNow} disabled={isAdding} className="flex-[1.15] h-[48px] rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-[0.98] transition disabled:opacity-50">
                                    <I icon={Zap} size={15} fill="currentColor" />
                                    Buy · ₹{price.toLocaleString('en-IN')}
                                </Btn>
                            </Box>
                            <Box className="mt-2 mb-1.5 flex items-center justify-center gap-3.5 text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                                <Txt className="flex items-center gap-1">
                                    <I icon={ShieldCheck} size={10} className="text-primary" /> Secure
                                </Txt>
                                <Txt className="flex items-center gap-1">
                                    <I icon={Truck} size={10} className="text-primary" /> Fast delivery
                                </Txt>
                                <Txt className="flex items-center gap-1">
                                    <I icon={RefreshCw} size={10} className="text-primary" /> Easy returns
                                </Txt>
                            </Box>
                        </Box>
                    </Box>
            </Sheet>
        </React.Fragment>;
};
export default AddToCartModal;
