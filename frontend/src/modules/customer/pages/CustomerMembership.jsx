import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Crown, Loader2, Sparkles, CheckCircle2, ShieldCheck, Truck, Percent, Zap, CreditCard, Coins, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../utils/api';
import useUserStore from '../../../store/userStore';

const CustomerMembership = () => {
    const navigate = useNavigate();
    const { fetchProfile, profile } = useUserStore();
    const [plans, setPlans] = useState([]);
    const [membership, setMembership] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSystemEnabled, setIsSystemEnabled] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const loadMembershipData = useCallback(async () => {
        try {
            setLoading(true);
            const [plansRes, myMemRes] = await Promise.all([
                api.get('/subscriptions?audience=customer'),
                api.get('/subscriptions/my-membership')
            ]);

            if (plansRes.data?.isEnabled === false || myMemRes.data?.isEnabled === false) {
                setIsSystemEnabled(false);
                setPlans([]);
            } else {
                setIsSystemEnabled(true);
                if (plansRes.data?.success) {
                    setPlans(plansRes.data.data || []);
                }
                if (myMemRes.data?.success) {
                    setMembership(myMemRes.data.data);
                }
            }
        } catch (e) {
            if (e?.name !== 'CanceledError') {
                console.error('Error loading membership:', e);
                toast.error('Could not load membership plans');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
        loadMembershipData();
    }, [fetchProfile, loadMembershipData]);

    const points = membership?.loyaltyPoints ?? profile?.loyaltyPoints ?? 0;
    const activePlan = membership?.activePlan;
    const daysRemaining = membership?.daysRemaining ?? 0;
    const isExpired = membership?.isExpired ?? true;

    // Load Razorpay script dynamically if not present
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // 1. Redeem with Loyalty Points
    const handleRedeemPoints = async (plan) => {
        setActionLoadingId(`points-${plan._id}`);
        try {
            const res = await api.post('/subscriptions/redeem-with-points', { planId: plan._id });
            if (res.data?.success) {
                toast.success(res.data.message || `${plan.name} activated successfully!`);
                await Promise.all([fetchProfile(), loadMembershipData()]);
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Redemption failed. Check your points balance.');
        } finally {
            setActionLoadingId(null);
        }
    };

    // 2. Buy with Cash/UPI (Razorpay)
    const handleBuyWithCash = async (plan) => {
        setActionLoadingId(`cash-${plan._id}`);
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                toast.error('Razorpay SDK failed to load. Please check your internet.');
                setActionLoadingId(null);
                return;
            }

            toast.loading('Initiating payment...');
            const orderRes = await api.post('/subscriptions/create-customer-order', { planId: plan._id });
            toast.dismiss();

            if (!orderRes.data?.success) {
                toast.error(orderRes.data?.message || 'Failed to initiate payment');
                setActionLoadingId(null);
                return;
            }

            const { orderId, amount, currency, key } = orderRes.data.data;

            const options = {
                key: key || 'rzp_test_placeholder',
                amount: amount,
                currency: currency || 'INR',
                name: 'SewZella Club',
                description: `${plan.name} Membership (${plan.durationDays || 30} days)`,
                order_id: orderId,
                handler: async function (response) {
                    try {
                        toast.loading('Activating membership...');
                        const verifyRes = await api.post('/subscriptions/subscribe-customer', {
                            planId: plan._id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        toast.dismiss();
                        if (verifyRes.data?.success) {
                            toast.success(verifyRes.data.message || `${plan.name} activated! Enjoy VIP perks.`);
                            await Promise.all([fetchProfile(), loadMembershipData()]);
                        }
                    } catch (err) {
                        toast.dismiss();
                        toast.error(err.response?.data?.message || 'Payment verification failed');
                    }
                },
                prefill: {
                    name: profile?.name || 'Valued Member',
                    contact: profile?.phoneNumber || '',
                    email: profile?.email || '',
                },
                theme: { color: '#843D9B' },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                toast.error('Payment failed: ' + (resp.error?.description || 'Cancelled'));
            });
            rzp.open();
        } catch (e) {
            toast.dismiss();
            toast.error(e.response?.data?.message || 'Failed to initialize payment');
        } finally {
            setActionLoadingId(null);
        }
    };

    const getPlanCardStyle = (plan) => {
        const theme = (plan.theme || '').toLowerCase();
        if (theme === 'diamond' || plan.name?.toLowerCase().includes('diamond')) {
            return {
                border: 'border-purple-300 shadow-purple-100',
                badge: 'bg-purple-900 text-white',
                accent: 'text-purple-700',
                btnBg: 'bg-gradient-to-r from-purple-700 to-indigo-800 text-white',
            };
        }
        if (theme === 'gold' || plan.name?.toLowerCase().includes('gold')) {
            return {
                border: 'border-amber-300 shadow-amber-100',
                badge: 'bg-amber-500 text-white',
                accent: 'text-amber-700',
                btnBg: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white',
            };
        }
        return {
            border: 'border-gray-200 shadow-gray-100',
            badge: 'bg-gray-700 text-white',
            accent: 'text-gray-800',
            btnBg: 'bg-gradient-to-r from-gray-800 to-gray-900 text-white',
        };
    };

    if (!loading && !isSystemEnabled) {
        return (
            <div className="min-h-screen bg-[#F8F9FD] flex flex-col font-sans text-gray-900">
                <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm border-b border-gray-100">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-wider text-gray-900">Membership</h1>
                        <p className="text-[10px] text-gray-500 font-semibold">SewZella Club</p>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto">
                    <div className="w-16 h-16 rounded-3xl bg-purple-50 text-[#843D9B] flex items-center justify-center mb-4 border border-purple-100 shadow-sm">
                        <Crown size={32} />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 mb-1">Customer Membership is Currently Closed</h2>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                        Memberships are currently disabled by the administrator. All users enjoy our standard doorstep tailoring and support!
                    </p>
                    <button
                        onClick={() => navigate('/user/profile')}
                        className="px-6 py-2.5 bg-[#843D9B] text-white text-xs font-black rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition-all"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FD] pb-24 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-all">
                        <ArrowLeft size={20} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-wider text-gray-900">SewZella Club</h1>
                        <p className="text-[10px] text-gray-500 font-semibold">VIP Privileges & Savings</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full">
                    <Coins size={14} className="text-[#843D9B]" />
                    <span className="text-[11px] font-black text-[#843D9B]">{points} pts</span>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 mt-4 space-y-4">
                {/* Active Membership Banner (if active) */}
                {!isExpired && activePlan ? (
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#2D124D] via-[#4A154B] to-[#7B1FA2] text-white rounded-3xl p-5 shadow-xl border border-purple-400/30">
                        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-amber-400/20 border border-amber-300/40 rounded-xl text-amber-300">
                                        <Crown size={20} />
                                    </span>
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-300/30">
                                            ACTIVE MEMBERSHIP
                                        </span>
                                        <h2 className="text-xl font-black mt-0.5 tracking-tight">{activePlan.name}</h2>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-black">
                                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 grid grid-cols-3 gap-2 text-center my-3">
                                <div className="p-1">
                                    <Truck size={16} className="mx-auto text-amber-300 mb-1" />
                                    <p className="text-[9px] font-bold text-gray-200 uppercase tracking-tight">Delivery</p>
                                    <p className="text-[11px] font-black">{activePlan.freeDelivery ? 'FREE' : 'Standard'}</p>
                                </div>
                                <div className="p-1 border-x border-white/10">
                                    <Percent size={16} className="mx-auto text-amber-300 mb-1" />
                                    <p className="text-[9px] font-bold text-gray-200 uppercase tracking-tight">Discount</p>
                                    <p className="text-[11px] font-black">{activePlan.discountPercentage ? `${activePlan.discountPercentage}% OFF` : 'Standard'}</p>
                                </div>
                                <div className="p-1">
                                    <Zap size={16} className="mx-auto text-amber-300 mb-1" />
                                    <p className="text-[9px] font-bold text-gray-200 uppercase tracking-tight">Support</p>
                                    <p className="text-[11px] font-black">{activePlan.prioritySupport ? 'Priority VIP' : 'Normal'}</p>
                                </div>
                            </div>

                            <p className="text-[10px] text-gray-300 font-medium flex items-center justify-between pt-1">
                                <span>Expires: {new Date(membership.planExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span className="text-emerald-300 font-bold">● Active & Protected</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Inactive Club Welcome Card */
                    <div className="bg-gradient-to-r from-[#6b2a80] to-[#843D9B] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full mb-2">
                                    <Sparkles size={11} /> Exclusive Club
                                </span>
                                <h2 className="text-xl font-black tracking-tight leading-snug">SewZella VIP Membership</h2>
                                <p className="text-xs text-purple-100 font-medium mt-1 max-w-xs">
                                    Unlock zero delivery fees, instant discounts on stitching orders, and express priority matching.
                                </p>
                            </div>
                            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl text-amber-300 shrink-0">
                                <Crown size={32} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Points Card */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                            <Coins size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Loyalty Points Available</p>
                            <h3 className="text-lg font-black text-gray-900">{points} Points</h3>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/user/rewards')}
                        className="text-[11px] font-black text-[#843D9B] hover:underline flex items-center gap-0.5"
                    >
                        History <ChevronRight size={14} />
                    </button>
                </div>

                {/* Plans Header */}
                <div className="pt-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Choose Your Plan</h3>
                    <p className="text-xs text-gray-500 font-medium">Pay with UPI / Card or Redeem instantly with loyalty points</p>
                </div>

                {/* Plans List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="animate-spin text-[#843D9B] mb-2" size={32} />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loading Plans...</p>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                        <p className="text-sm text-gray-500 font-bold">No membership plans available at the moment.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {plans.map((plan) => {
                            const isCurrent = !isExpired && activePlan?._id === plan._id;
                            const pointsCost = plan.pointsPrice || 0;
                            const hasEnoughPoints = points >= pointsCost && pointsCost > 0;
                            const cardStyle = getPlanCardStyle(plan);

                            return (
                                <div
                                    key={plan._id}
                                    className={`bg-white rounded-3xl p-5 border-2 shadow-sm transition-all relative ${
                                        isCurrent ? 'border-[#843D9B] ring-2 ring-[#843D9B]/10 shadow-md' : cardStyle.border
                                    }`}
                                >
                                    {plan.isPopular && (
                                        <span className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                            Most Popular
                                        </span>
                                    )}

                                    {/* Plan Title & Pricing */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-black text-gray-900">{plan.name}</h3>
                                                {isCurrent && (
                                                    <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                        Current Plan
                                                    </span>
                                                )}
                                            </div>
                                            {plan.description && (
                                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">{plan.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-lg font-black text-[#843D9B]">
                                                ₹{plan.price || 0}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400">
                                                {plan.durationDays || 30} days
                                            </span>
                                        </div>
                                    </div>

                                    {/* Highlights Badge Bar */}
                                    <div className="flex flex-wrap gap-1.5 mb-3.5">
                                        {plan.freeDelivery && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg">
                                                <Truck size={12} /> Free Delivery
                                            </span>
                                        )}
                                        {plan.discountPercentage > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-purple-50 text-[#843D9B] border border-purple-200/60 rounded-lg">
                                                <Percent size={12} /> {plan.discountPercentage}% Stitching Off
                                            </span>
                                        )}
                                        {plan.prioritySupport && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg">
                                                <Zap size={12} /> Priority Support
                                            </span>
                                        )}
                                    </div>

                                    {/* Features List */}
                                    {plan.features?.length > 0 && (
                                        <div className="bg-gray-50/80 rounded-2xl p-3 mb-4 space-y-1.5 border border-gray-100">
                                            {plan.features.map((feat, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-[11px] font-semibold text-gray-700">
                                                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {isCurrent ? (
                                        <div className="w-full py-2.5 text-center text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl">
                                            Active · Renews on {new Date(membership.planExpiryDate).toLocaleDateString()}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                            {/* Buy Cash */}
                                            {plan.price > 0 && (
                                                <button
                                                    type="button"
                                                    disabled={actionLoadingId !== null}
                                                    onClick={() => handleBuyWithCash(plan)}
                                                    className="w-full py-2.5 px-3 rounded-xl font-black text-xs bg-gradient-to-r from-[#6b2a80] to-[#843D9B] text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {actionLoadingId === `cash-${plan._id}` ? (
                                                        <>
                                                            <Loader2 size={14} className="animate-spin" /> Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard size={14} /> Buy for ₹{plan.price}
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Redeem Points */}
                                            {pointsCost > 0 && (
                                                <button
                                                    type="button"
                                                    disabled={!hasEnoughPoints || actionLoadingId !== null}
                                                    onClick={() => handleRedeemPoints(plan)}
                                                    className={`w-full py-2.5 px-3 rounded-xl font-black text-xs border transition-all flex items-center justify-center gap-1.5 ${
                                                        hasEnoughPoints
                                                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-[0.98]'
                                                            : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {actionLoadingId === `points-${plan._id}` ? (
                                                        <>
                                                            <Loader2 size={14} className="animate-spin" /> Activating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Coins size={14} /> {hasEnoughPoints ? `Redeem ${pointsCost} pts` : `Need ${pointsCost} pts`}
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Assurance Footer */}
                <div className="pt-4 pb-8 text-center text-gray-400 text-[10px] space-y-1">
                    <p className="flex items-center justify-center gap-1 font-bold">
                        <ShieldCheck size={13} className="text-[#843D9B]" /> 100% Satisfaction Guaranteed with SewZella VIP Protection
                    </p>
                    <p>Cancel or upgrade anytime. Perks automatically apply at checkout.</p>
                </div>
            </div>
        </div>
    );
};

export default CustomerMembership;
