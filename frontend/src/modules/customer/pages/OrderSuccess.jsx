import React, { useEffect, useState } from 'react';
import { 
    Check, 
    Clock, 
    FileText, 
    Send, 
    User, 
    CreditCard, 
    Scissors, 
    Truck, 
    BadgeCheck, 
    PackageCheck, 
    ShoppingBag, 
    Share2, 
    MessageSquare, 
    ChevronRight, 
    ShieldCheck, 
    Bell
} from 'lucide-react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import useCheckoutStore from '../../../store/checkoutStore';
import useCartStore from '../../../store/cartStore';
import api from '../../../utils/api';
import toast from 'react-hot-toast';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state || {};
    const { isAlteration = false, isCustomDesign = false, isFullyPaid = false, isBulk = false, pendingAcceptance = false } = state;
    const savedOrderId = (() => {
        try { return sessionStorage.getItem('lastCreatedOrderId'); } catch(e) { return null; }
    })();
    const savedOrderNum = (() => {
        try { return sessionStorage.getItem('lastCreatedOrderNum'); } catch(e) { return null; }
    })();

    const activeOrderId = state.orderId || savedOrderId;
    const displayOrderNum = state.orderNumber || savedOrderNum;

    const [orderDetails, setOrderDetails] = useState(null);

    const clearCheckout = useCheckoutStore(state => state.clearCheckout);
    const clearCart = useCartStore(state => state.clearCart);

    useEffect(() => {
        if (activeOrderId && !isAlteration && !isCustomDesign) {
            clearCheckout();
            clearCart();

            const fetchOrder = async () => {
                try {
                    const res = await api.get(`/orders/${activeOrderId}`);
                    if (res.data?.success) {
                        setOrderDetails(res.data.data);
                    }
                } catch (err) {
                    console.log('Order fetch info:', err?.message || err);
                }
            };
            fetchOrder();
        } else {
            clearCheckout();
            clearCart();
        }
    }, [activeOrderId, isAlteration, isCustomDesign, clearCheckout, clearCart]);

    // Fallback if accessed without any order context
    if (!activeOrderId && !orderDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3"><Check size={28} className="text-white" /></div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Order Requested!</h3>
                <p className="text-xs text-gray-500 mb-4">Your order has been submitted successfully.</p>
                <button
                    onClick={() => navigate('/user/orders')}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark cursor-pointer"
                >
                    View My Orders
                </button>
            </div>
        );
    }

    // Resolve Tailor Info
    const tailor = orderDetails?.tailor || state.tailor || {};
    const shopName = tailor.shopName || tailor.name || 'Laila The Boutique';
    const rating = tailor.rating || 4.8;
    const totalReviews = tailor.totalReviews || 320;
    const experience = tailor.experienceInYears || 8;
    const tailorProfileId = tailor.tailorProfileId || tailor._id || tailor.id || '';
    const profileImage = tailor.profileImage || tailor.image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop';

    // Order number formatting
    const displayOrderNumber = orderDetails?.orderId || displayOrderNum || (activeOrderId ? `${isAlteration ? 'ALT' : isCustomDesign ? 'DES' : 'ORD'}-${String(activeOrderId).slice(-8).toUpperCase()}` : 'ORD-459CC94A');

    const titleText = isAlteration 
        ? "Alteration Requested!" 
        : isCustomDesign 
        ? "Custom Design Requested!" 
        : "Order Requested Successfully!";

    const subtitleText = isAlteration
        ? "Your alteration request has been submitted to the tailor. You will receive a quote soon."
        : isCustomDesign
        ? "Your custom design request has been submitted to the tailor. You will receive a quote soon."
        : "Your request has been sent to the tailor. You’ll be notified once the tailor accepts your order.";

    const handleCopyOrderId = () => {
        navigator.clipboard.writeText(displayOrderNumber);
        toast.success('ID copied to clipboard!');
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'SilaiWala Order',
                    text: `My SilaiWala request (${displayOrderNumber}) has been submitted successfully!`,
                    url: window.location.href,
                });
            } catch (err) {
                // User cancelled share
            }
        } else {
            handleCopyOrderId();
        }
    };

    const steps = isAlteration ? [
        { icon: <Send size={18} />, label: "Request sent" },
        { icon: <User size={18} />, label: "Tailor quotes" },
        { icon: <CreditCard size={18} />, label: "Accept quote" },
        { icon: <Scissors size={18} />, label: "Garment pickup" },
        { icon: <Truck size={18} />, label: "Delivered" }
    ] : isCustomDesign ? [
        { icon: <Send size={18} />, label: "Design sent" },
        { icon: <User size={18} />, label: "Tailor quotes" },
        { icon: <CreditCard size={18} />, label: "Accept & pay" },
        { icon: <Scissors size={18} />, label: "Crafting" },
        { icon: <Truck size={18} />, label: "Delivered" }
    ] : [
        { icon: <Send size={18} />, label: "Order sent to tailor" },
        { icon: <User size={18} />, label: "Tailor accepts" },
        { icon: <CreditCard size={18} />, label: "Pay advance" },
        { icon: <Scissors size={18} />, label: "Stitching begins" },
        { icon: <Truck size={18} />, label: "Order delivered" }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-500 font-sans text-gray-900">
            <div className="w-full max-w-md space-y-4 py-4">

                {/* Confetti & Top Checkmark Section */}
                <div className="relative pt-6 pb-2 flex flex-col items-center">
                    
                    {/* Festive Floating Confetti Particles */}
                    <div className="absolute inset-x-0 top-0 h-32 overflow-hidden pointer-events-none z-0">
                        <div className="absolute top-2 left-6 w-2.5 h-2.5 bg-pink-400 rotate-12 rounded-xs opacity-80 animate-bounce" style={{ animationDuration: '3s' }} />
                        <div className="absolute top-8 left-16 w-2 h-4 bg-purple-500 -rotate-45 rounded-xs opacity-75 animate-pulse" />
                        <div className="absolute top-4 left-1/4 w-3 h-1.5 bg-yellow-400 rotate-45 opacity-90" />
                        <div className="absolute top-10 right-1/4 w-2.5 h-2.5 bg-emerald-400 rotate-12 rounded-full opacity-80" />
                        <div className="absolute top-3 right-16 w-3 h-2 bg-purple-400 rotate-30 rounded-xs opacity-85" />
                        <div className="absolute top-7 right-6 w-2 h-2 bg-pink-500 rounded-full opacity-70 animate-bounce" style={{ animationDuration: '2.5s' }} />
                        <div className="absolute top-14 left-10 w-2 h-2 bg-amber-400 rotate-45 opacity-80" />
                        <div className="absolute top-16 right-12 w-2.5 h-1.5 bg-indigo-400 -rotate-12 opacity-85" />
                    </div>

                    {/* Green Glow Checkmark Icon */}
                    <div className="relative z-10 w-20 h-20 bg-green-100/90 rounded-full flex items-center justify-center mb-3">
                        <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 transform transition-transform hover:scale-105">
                            <Check size={32} className="text-white stroke-[3]" />
                        </div>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-2xl sm:text-[26px] font-extrabold text-gray-900 tracking-tight mb-2">
                        {titleText}
                    </h1>

                    {/* Order ID Badge */}
                    <button
                        onClick={handleCopyOrderId}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-mono font-bold text-xs sm:text-sm tracking-wide shadow-2xs cursor-pointer active:scale-95"
                        title="Click to copy ID"
                    >
                        <FileText size={16} className="text-primary" />
                        <span>{displayOrderNumber}</span>
                    </button>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm text-gray-600 max-w-xs text-center mt-3 leading-relaxed font-medium">
                        {subtitleText}
                    </p>
                </div>

                {/* Green Notice Box */}
                <div className="w-full bg-green-50 border border-green-200 rounded-3xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">
                                {isAlteration || isCustomDesign ? "Tailor will review and provide quote" : "Tailor will respond within 30–60 minutes"}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-gray-600 font-medium mt-0.5">
                                We’ll notify you as soon as your request is updated.
                            </p>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center relative shrink-0">
                        <Bell size={20} className="text-primary" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">
                            ✓
                        </div>
                    </div>
                </div>

                {/* What Happens Next Card */}
                <div className="w-full bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base text-left mb-5">
                        What happens next?
                    </h3>
                    <div className="relative flex items-start justify-between px-1">
                        <div className="absolute top-5 left-8 right-8 border-t-2 border-dashed border-primary/20 z-0" />

                        {steps.map((step, idx) => (
                            <div key={idx} className="relative z-10 flex flex-col items-center text-center w-1/5">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-primary/10 flex items-center justify-center text-primary shadow-2xs">
                                    {step.icon}
                                </div>
                                <div className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center -mt-1.5 shadow-2xs">
                                    {idx + 1}
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700 leading-tight mt-1.5 max-w-[65px]">
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Your Tailor Card */}
                <div className="w-full text-left">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-2 pl-1">
                        Your Tailor
                    </h3>
                    <div className="w-full bg-white rounded-3xl p-3.5 sm:p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src={profileImage}
                                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover border-2 border-primary/10 shadow-2xs shrink-0"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop';
                                }}
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                                        {shopName}
                                    </h4>
                                    <BadgeCheck size={18} className="text-primary fill-primary shrink-0 stroke-white" />
                                </div>
                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                    <span className="text-amber-500 font-bold">★ {rating}</span> ({totalReviews}) • {experience}+ Years Exp.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (tailorProfileId) navigate(`/user/tailor/${tailorProfileId}`);
                                else navigate('/user/tailors');
                            }}
                            className="px-4 py-2 text-xs font-bold text-primary border border-primary rounded-full hover:bg-primary/5 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                            View Profile
                        </button>
                    </div>
                </div>

                {/* Action Buttons Stack */}
                <div className="w-full space-y-3 pt-2">
                    {/* Track Order Status / View Orders Button */}
                    <Link
                        to={isAlteration || isCustomDesign ? "/user/orders" : `/user/orders/${activeOrderId}/track`}
                        className="w-full py-4 px-6 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-bold rounded-full shadow-lg shadow-primary/30 flex items-center justify-between text-base transition-all active:scale-[0.98] cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <PackageCheck size={20} className="text-white shrink-0" />
                            <span className="text-white font-bold">
                                {isAlteration || isCustomDesign ? "View My Requests" : "Track Order Status"}
                            </span>
                        </div>
                        <ChevronRight size={20} className="text-white shrink-0" />
                    </Link>

                    {/* Back to Home Button (Pill shape) */}
                    <Link
                        to="/user"
                        className="w-full py-3.5 px-6 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-bold rounded-full flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] shadow-sm"
                    >
                        <ShoppingBag size={18} className="text-gray-700 shrink-0" />
                        <span>Back to Home</span>
                    </Link>

                    {/* Share & Support Row (Pill shapes) */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={handleShare}
                            className="w-1/2 py-3 px-4 bg-white border border-gray-200 hover:bg-primary/5 active:bg-primary/10 text-primary font-bold rounded-full text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                            <Share2 size={16} />
                            <span>Share Order</span>
                        </button>

                        <Link
                            to="/user/support"
                            className="w-1/2 py-3 px-4 bg-white border border-gray-200 hover:bg-primary/5 active:bg-primary/10 text-primary font-bold rounded-full text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                        >
                            <MessageSquare size={16} />
                            <span>Chat with Support</span>
                        </Link>
                    </div>
                </div>

                {/* Footer Trust Badges */}
                <div className="pt-3 pb-1 text-xs text-gray-500 font-medium flex items-center justify-center gap-2 flex-wrap opacity-85">
                    <span className="flex items-center gap-1">
                        <ShieldCheck size={14} className="text-primary" />
                        100% Secure
                    </span>
                    <span>•</span>
                    <span>Verified Tailors</span>
                    <span>•</span>
                    <span>Easy Support</span>
                </div>

            </div>
        </div>
    );
};

export default OrderSuccess;


