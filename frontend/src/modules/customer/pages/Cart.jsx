import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, ShoppingCart, Info, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../../../store/cartStore';
import CartItem from '../components/cart/CartItem';
import { cn } from '../../../utils/cn';

const CartPage = () => {
    const navigate = useNavigate();
    const { items, getTotalPrice, removeItem, updateQuantity } = useCartStore(state => state);
    const totalPrice = getTotalPrice();
    const deliveryFee = totalPrice > 999 ? 0 : 49;
    const finalTotal = totalPrice + deliveryFee;

    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

    const handleCheckout = () => {
        setIsCheckoutLoading(true);
        setTimeout(() => {
            navigate('/checkout/address'); // Proceed to checkout flow
        }, 1000);
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ShoppingBag size={32} className="text-gray-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-xs">Looks like you haven't added anything to your cart yet.</p>
                <Link
                    to="/store"
                    className="px-6 py-3 rounded-xl bg-[#2D2F6E] text-white font-bold text-sm shadow-lg hover:bg-[#1E1F4D] transition-all"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans relative">
            {/* 1. Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between pt-safe">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">Your Cart</h1>
                        <p className="text-[10px] text-gray-500">{items.length} Items</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300">

                <div className="flex-1 space-y-4">
                    {/* 2. Cart Items */}
                    <div className="space-y-3">
                        {items.map((item) => (
                            <CartItem
                                key={item.cartId}
                                item={item}
                                onUpdateQuantity={updateQuantity}
                                onRemove={removeItem}
                            />
                        ))}
                    </div>

                    {/* 3. Offers & Coupons */}
                    <div className="bg-white rounded-xl p-3 border border-dashed border-gray-200 flex items-center gap-3 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">%</div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-900">Apply Coupon</p>
                            <p className="text-[10px] text-gray-400">Save more on this order</p>
                        </div>
                    </div>
                </div>

                {/* 4. Order Summary Section */}
                <div className="w-full lg:w-96 space-y-4">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-20">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Order Summary</h3>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{totalPrice}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Delivery Fee</span>
                                {deliveryFee === 0 ? (
                                    <span className="text-[#2D2F6E] font-bold">FREE</span>
                                ) : (
                                    <span>₹{deliveryFee}</span>
                                )}
                            </div>
                            {deliveryFee === 0 && (
                                <div className="text-[10px] text-[#2D2F6E] bg-indigo-50 px-2 py-1.5 rounded-lg flex items-center gap-2">
                                    <Info size={12} />
                                    Free delivery applied over ₹999
                                </div>
                            )}

                            <div className="h-px bg-gray-100 my-2" />

                            <div className="flex justify-between items-center text-base font-bold text-gray-900 mb-6">
                                <span>Total Payable</span>
                                <span>₹{finalTotal}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isCheckoutLoading}
                                className="w-full py-4 rounded-xl bg-[#2D2F6E] text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-[#1E1F4D] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isCheckoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                            </button>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 gap-2 mt-6 text-[10px] text-gray-400 font-medium text-center">
                            <div className="bg-gray-50 rounded-lg p-2">
                                100% Secure
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                                Trusted Delivery
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Mobile Footer Sticky Action */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe z-40">
                <button
                    onClick={handleCheckout}
                    disabled={isCheckoutLoading}
                    className="w-full py-3.5 rounded-xl bg-[#2D2F6E] text-white text-sm font-bold shadow-lg hover:bg-[#1E1F4D] active:scale-95 transition-all flex items-center justify-between px-6 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <div className="text-left">
                        <p className="text-[10px] opacity-80 uppercase tracking-wider font-medium text-white">Total Amount</p>
                        <p className="text-base font-bold text-white">₹{finalTotal}</p>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                        {isCheckoutLoading ? 'Wait...' : 'Checkout'}
                    </div>
                </button>
            </div>

        </div>
    );
};

export default CartPage;
