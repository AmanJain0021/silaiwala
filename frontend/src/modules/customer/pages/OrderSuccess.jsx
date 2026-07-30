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
    const { 
        orderId, 
        orderNumber: stateOrderNum, 
        pendingAcceptance = true
    } = state;

    const [orderDetails, setOrderDetails] = useState(null);

    const clearCheckout = useCheckoutStore(state => state.clearCheckout);
    const clearCart = useCartStore(state => state.clearCart);

    useEffect(() => {
        if (orderId) {
            clearCheckout();
            clearCart();

            const fetchOrder = async () => {
                try {
                    const res = await api.get(`/orders/${orderId}`);
                    if (res.data?.success) {
                        setOrderDetails(res.data.data);
                    }
                } catch (err) {
                    console.log('Order fetch info:', err?.message || err);
                }
            };
            fetchOrder();
        }
    }, [orderId, clearCheckout, clearCart]);

    // Redirect if direct access without order data
    if (!orderId) {
        return <Navigate to="/user" replace />;
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
    const displayOrderNumber = orderDetails?.orderId || stateOrderNum || (orderId ? `ORD-${orderId.slice(-8).toUpperCase()}` : 'ORD-459CC94A');

    const handleCopyOrderId = () => {
        navigator.clipboard.writeText(displayOrderNumber);
        toast.success('Order ID copied to clipboard!');
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'SilaiWala Order',
                    text: `My SilaiWala order request (${displayOrderNumber}) has been submitted successfully!`,
                    url: window.location.href,
                });
            } catch (err) {
                // User cancelled share
            }
        } else {
            handleCopyOrderId();
        }
    };

    const steps = [
        { icon: <Send size={18} />, label: "Order sent to tailor" },
        { icon: <User size={18} />, label: "Tailor accepts" },
        { icon: <CreditCard size={18} />, label: "Pay advance" },
        { icon: <Scissors size={18} />, label: "Stitching begins" },
        { icon: <Truck size={18} />, label: "Order delivered" }
    ];

    return (
        <div className="min-h-screen bg-[#FAF9FF] flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-500">
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
                    <div className="relative z-10 w-20 h-20 bg-emerald-100/90 rounded-full flex items-center justify-center mb-3">
                        <div className="w-14 h-14 bg-[#10B981] rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 transform transition-transform hover:scale-105">
                            <Check size={32} className="text-white stroke-[3]" />
                        </div>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#1E1B4B] tracking-tight mb-2">
                        Order Requested Successfully!
                    </h1>

                    {/* Order ID Badge */}
                    <button
                        onClick={handleCopyOrderId}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F3E8FF] border border-[#E9D5FF] text-[#7C3AED] hover:bg-[#E9D5FF]/60 transition-all font-mono font-bold text-xs sm:text-sm tracking-wide shadow-2xs cursor-pointer active:scale-95"
                        title="Click to copy Order ID"
                    >
                        <FileText size={16} className="text-[#7C3AED]" />
                        <span>{displayOrderNumber}</span>
                    </button>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm text-slate-600 max-w-xs text-center mt-3 leading-relaxed font-medium">
                        Your request has been sent to the tailor.<br />
                        You’ll be notified once the tailor accepts your order.
                    </p>
                </div>

                {/* Green Notice Box */}
                <div className="w-full bg-[#ECFDF5] border border-[#A7F3D0] rounded-3xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-2xs text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#059669] shrink-0">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                                Tailor will respond within 30–60 minutes
                            </h4>
                            <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5">
                                We’ll notify you as soon as your order is accepted.
                            </p>
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] border border-purple-100 flex items-center justify-center relative shrink-0">
                        <Bell size={20} className="text-[#7C3AED]" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold border-2 border-white">
                            ✓
                        </div>
                    </div>
                </div>

                {/* What Happens Next Card */}
                <div className="w-full bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base text-left mb-5">
                        What happens next?
                    </h3>
                    <div className="relative flex items-start justify-between px-1">
                        {/* Connected dashed line */}
                        <div className="absolute top-5 left-8 right-8 border-t-2 border-dashed border-purple-200 z-0" />

                        {steps.map((step, idx) => (
                            <div key={idx} className="relative z-10 flex flex-col items-center text-center w-1/5">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7C3AED] shadow-2xs bg-white">
                                    {step.icon}
                                </div>
                                <div className="w-4 h-4 rounded-full bg-[#6D28D9] text-white text-[9px] font-bold flex items-center justify-center -mt-1.5 shadow-2xs">
                                    {idx + 1}
                                </div>
                                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 leading-tight mt-1.5 max-w-[65px]">
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Your Tailor Card */}
                <div className="w-full text-left">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-2 pl-1">
                        Your Tailor
                    </h3>
                    <div className="w-full bg-white rounded-3xl p-3.5 sm:p-4 shadow-xs border border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src={profileImage}
                                alt={shopName}
                                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full object-cover border-2 border-purple-100 shadow-2xs shrink-0"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop';
                                }}
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                                        {shopName}
                                    </h4>
                                    <BadgeCheck size={18} className="text-[#7C3AED] fill-[#7C3AED] shrink-0 stroke-white" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                    <span className="text-amber-500 font-bold">★ {rating}</span> ({totalReviews}) • {experience}+ Years Exp.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (tailorProfileId) navigate(`/user/tailor/${tailorProfileId}`);
                                else navigate('/user/tailors');
                            }}
                            className="px-4 py-2 text-xs font-bold text-[#7C3AED] border border-[#7C3AED] rounded-full hover:bg-purple-50 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                            View Profile
                        </button>
                    </div>
                </div>

                {/* Action Buttons Stack */}
                <div className="w-full space-y-3 pt-2">
                    {/* Track Order Status Button (Pill shape) */}
                    <Link
                        to={`/user/orders/${orderId}/track`}
                        style={{ backgroundColor: '#7C3AED', color: '#ffffff' }}
                        className="w-full py-4 px-6 bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white font-bold rounded-full shadow-lg shadow-purple-600/30 flex items-center justify-between text-base transition-all active:scale-[0.98] cursor-pointer"
                    >
                        <div className="flex items-center gap-2.5">
                            <PackageCheck size={20} className="text-white shrink-0" />
                            <span className="text-white font-bold">Track Order Status</span>
                        </div>
                        <ChevronRight size={20} className="text-white shrink-0" />
                    </Link>

                    {/* Back to Home Button (Pill shape) */}
                    <Link
                        to="/user"
                        className="w-full py-3.5 px-6 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold rounded-full flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] shadow-2xs"
                    >
                        <ShoppingBag size={18} className="text-slate-700 shrink-0" />
                        <span>Back to Home</span>
                    </Link>

                    {/* Share & Support Row (Pill shapes) */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={handleShare}
                            className="w-1/2 py-3 px-4 bg-white border border-slate-200 hover:bg-purple-50/60 active:bg-purple-100/50 text-[#7C3AED] font-bold rounded-full text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                            <Share2 size={16} />
                            <span>Share Order</span>
                        </button>

                        <Link
                            to="/user/support"
                            className="w-1/2 py-3 px-4 bg-white border border-slate-200 hover:bg-purple-50/60 active:bg-purple-100/50 text-[#7C3AED] font-bold rounded-full text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-2xs"
                        >
                            <MessageSquare size={16} />
                            <span>Chat with Support</span>
                        </Link>
                    </div>
                </div>

                {/* Footer Trust Badges */}
                <div className="pt-3 pb-1 text-xs text-slate-500 font-medium flex items-center justify-center gap-2 flex-wrap opacity-85">
                    <span className="flex items-center gap-1">
                        <ShieldCheck size={14} className="text-purple-600" />
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


