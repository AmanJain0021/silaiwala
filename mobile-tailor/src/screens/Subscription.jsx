// Port of modules/tailor/pages/Subscription.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import Razorpay from '../lib/razorpay';
import { RAZORPAY_KEY_ID } from '../lib/config';
import React, { useState, useEffect } from "react";
import { CreditCard, Zap, Calendar, ArrowUpCircle, AlertTriangle, Star } from "lucide-react-native";
import api from "../lib/api";
import toast from '../lib/toast';
import { Box, I, Txt, Btn, Scroll } from '../components/ui/primitives';
const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [tailorData, setTailorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubEnabled, setIsSubEnabled] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, tailorRes] = await Promise.all([api.get('/subscriptions'), api.get('/tailors/me')]);
        if (plansRes.data?.isEnabled === false) {
          setIsSubEnabled(false);
          setPlans([]);
        } else if (plansRes.data?.success) {
          setIsSubEnabled(true);
          setPlans(plansRes.data.data || []);
        }
        if (tailorRes.data.success) setTailorData(tailorRes.data.data);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        toast.error('Failed to load subscription plans');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const handleSubscribe = async planId => {
    const selectedPlan = plans.find(p => p._id === planId);
    if (!selectedPlan) return;
    if (selectedPlan.price > 0) {
      try {
        toast.loading('Initializing payment...');
        const rzpOrderRes = await api.post('/subscriptions/create-order', {
          planId
        });
        toast.dismiss();
        if (!rzpOrderRes.data.success) throw new Error('Failed to create payment order');
        const rzpOrder = rzpOrderRes.data.data;
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "SilaiWala",
          description: `Subscription: ${selectedPlan.name}`,
          order_id: rzpOrder.orderId,
          handler: async function (response) {
            try {
              toast.loading('Verifying payment...');
              const verifyRes = await api.post('/subscriptions/subscribe', {
                planId: planId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              if (verifyRes.data.success) {
                toast.dismiss();
                toast.success('Subscription plan activated!');
                const tailorRes = await api.get('/tailors/me');
                if (tailorRes.data.success) setTailorData(tailorRes.data.data);
              }
            } catch (err) {
              toast.dismiss();
              console.error('Payment verification failed:', err);
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: tailorData?.shopName || "Tailor",
            contact: tailorData?.user?.phone || ""
          },
          theme: {
            color: "#843D9B"
          }
        };
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error('Payment failed: ' + response.error.description);
        });
        rzp.open();
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.message || error.message || 'Failed to initialize payment');
      }
    } else {
      // Free plan
      try {
        toast.loading('Activating plan...');
        const res = await api.post('/subscriptions/subscribe', {
          planId
        });
        if (res.data.success) {
          toast.dismiss();
          toast.success('Subscription plan activated!');
          // Refresh tailor data to get updated activePlan
          const tailorRes = await api.get('/tailors/me');
          if (tailorRes.data.success) setTailorData(tailorRes.data.data);
        }
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.message || 'Failed to activate plan');
      }
    }
  };
  if (isLoading) {
    return <Box className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Spin size={48} className="text-[#843D9B]" />
            </Box>;
  }
  const activePlan = tailorData?.activePlan;
  const planExpiryDate = tailorData?.planExpiryDate ? new Date(tailorData.planExpiryDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Not Subscribed';
  return <Box className="space-y-4 animate-in fade-in duration-500 bg-gray-50/50 min-h-screen p-4 pb-20">

            {/* Current Plan Card */}
            {activePlan ? <Box className="bg-[#843D9B] p-7 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-[#843D9B]/20">
                    <Box className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                        <I icon={Zap} size={100} />
                    </Box>
                    <Box className="relative z-10">
                        <Box className="flex justify-between items-start mb-8">
                            <Box>
                                <Txt className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Active Plan</Txt>
                                <Txt className="text-[28px] font-black mt-3 tracking-tighter">{activePlan.name}</Txt>
                            </Box>
                            <I icon={ArrowUpCircle} size={36} className="text-white/50" />
                        </Box>
                        <Box className="grid grid-cols-2 gap-4 pt-5 border-t border-white/10">
                            <Box>
                                <Txt className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <I icon={Calendar} size={11} /> Expiry Date
                                </Txt>
                                <Txt className="text-sm font-black">{planExpiryDate}</Txt>
                            </Box>
                            <Box>
                                <Txt className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <I icon={CreditCard} size={11} /> Billing Cycle
                                </Txt>
                                <Txt className="text-sm font-black">{activePlan.billingCycle}</Txt>
                            </Box>
                        </Box>
                    </Box>
                </Box> : <Box className="bg-[#111111] border border-red-500/20 p-7 rounded-3xl text-white relative overflow-hidden">
                     <Box className="relative z-10 flex items-center gap-4">
                        <Box className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 shrink-0">
                            <I icon={AlertTriangle} size={24} />
                        </Box>
                        <Box>
                            <Txt className="text-[18px] font-black text-red-400">No Active Plan</Txt>
                            <Txt className="text-[10px] text-gray-400 font-medium mt-1">Please select a plan below to activate your shop profile.</Txt>
                        </Box>
                     </Box>
                </Box>}

            {/* Pricing Plans */}
            <Box className="space-y-4 pt-2">
                <Box className="flex items-center justify-between px-1">
                    <Txt className="text-[12px] font-black text-white/40 uppercase tracking-widest">Available Plans</Txt>
                </Box>

                {plans.map(plan => {
        const isCurrentPlan = activePlan?._id === plan._id;
        if (plan.theme === 'elite') {
          return <Box key={plan._id} className={`bg-gradient-to-b from-amber-500/20 to-[#111111] border ${isCurrentPlan ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-amber-500/30'} p-5 rounded-3xl relative overflow-hidden group hover:border-amber-500/50 transition-colors`}>
                                <Box className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <I icon={Star} size={64} fill="currentColor" className="text-amber-500" />
                                </Box>
                                <Box className="flex justify-between items-start mb-3 relative z-10">
                                    <Box>
                                        {plan.isPopular && <Txt className="bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 inline-block">Best Value</Txt>}
                                        <Txt className="text-[16px] font-black text-white">{plan.name}</Txt>
                                        <Txt className="text-[10px] text-amber-400 font-bold mt-0.5 tracking-wide">{plan.commissionRange}</Txt>
                                    </Box>
                                    <Box className="text-right">
                                        <Txt className="text-[16px] font-black text-white">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</Txt>
                                        <Txt className="text-[9px] text-amber-500/50 font-bold uppercase tracking-widest mt-1">{plan.billingCycle}</Txt>
                                    </Box>
                                </Box>
                                <Box className="bg-amber-500/5 rounded-2xl p-4 mt-4 relative z-10 border border-amber-500/10">
                                    <Txt className="text-[11px] text-amber-50 leading-relaxed font-medium">
                                        <Txt className="text-amber-500 font-bold uppercase tracking-wider text-[9px] block mb-1.5">Key Benefits</Txt>
                                        {plan.features.join(', ')}
                                    </Txt>
                                </Box>
                                <Btn onPress={() => handleSubscribe(plan._id)} disabled={isCurrentPlan} className={`w-full mt-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isCurrentPlan ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 cursor-not-allowed' : 'bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400'}`}>
                                    {isCurrentPlan ? 'Current Plan' : 'Upgrade Now'}
                                </Btn>
                            </Box>;
        }
        if (plan.theme === 'premium') {
          return <Box key={plan._id} className={`bg-gradient-to-b from-[#843D9B]/40 to-[#111111] border ${isCurrentPlan ? 'border-[#843D9B]' : 'border-[#843D9B]/50'} p-5 rounded-3xl relative overflow-hidden group`}>
                                <Box className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <I icon={Zap} size={64} />
                                </Box>
                                <Box className="flex justify-between items-start mb-3 relative z-10">
                                    <Box>
                                        {plan.isPopular && <Txt className="bg-[#843D9B] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 inline-block">Popular</Txt>}
                                        <Txt className="text-[16px] font-black text-white">{plan.name}</Txt>
                                        <Txt className="text-[10px] text-indigo-300 font-bold mt-0.5 tracking-wide">{plan.commissionRange}</Txt>
                                    </Box>
                                    <Box className="text-right">
                                        <Txt className="text-[16px] font-black text-white">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</Txt>
                                        <Txt className="text-[9px] text-indigo-200/50 font-bold uppercase tracking-widest mt-1">{plan.billingCycle}</Txt>
                                    </Box>
                                </Box>
                                <Box className="bg-[#1A1A1A]/50 rounded-2xl p-4 mt-4 relative z-10 border border-indigo-500/10">
                                    <Txt className="text-[11px] text-gray-200 leading-relaxed font-medium">
                                        <Txt className="text-indigo-400 font-bold uppercase tracking-wider text-[9px] block mb-1.5">Key Benefits</Txt>
                                        {plan.features.join(', ')}
                                    </Txt>
                                </Box>
                                <Btn onPress={() => handleSubscribe(plan._id)} disabled={isCurrentPlan} className={`w-full mt-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isCurrentPlan ? 'bg-[#843D9B]/50 text-indigo-200 cursor-not-allowed border border-[#843D9B]' : 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/25 hover:bg-[#383a85]'}`}>
                                    {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                                </Btn>
                            </Box>;
        }
        return <Box key={plan._id} className={`bg-[#111111] border ${isCurrentPlan ? 'border-gray-500' : 'border-[#1E1E1E]'} p-5 rounded-3xl relative overflow-hidden group hover:border-gray-700 transition-colors`}>
                            <Box className="flex justify-between items-start mb-3">
                                <Box>
                                    <Txt className="text-[16px] font-black text-white">{plan.name}</Txt>
                                    <Txt className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wide">{plan.commissionRange}</Txt>
                                </Box>
                                <Box className="text-right">
                                    <Txt className="text-[16px] font-black text-white">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</Txt>
                                    <Txt className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{plan.billingCycle}</Txt>
                                </Box>
                            </Box>
                            <Box className="bg-[#1A1A1A] rounded-2xl p-4 mt-4">
                                <Txt className="text-[11px] text-gray-300 leading-relaxed font-medium">
                                    <Txt className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block mb-1.5">Key Benefits</Txt>
                                    {plan.features.join(', ')}
                                </Txt>
                            </Box>
                            <Btn onPress={() => handleSubscribe(plan._id)} disabled={isCurrentPlan} className={`w-full mt-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isCurrentPlan ? 'bg-[#1A1A1A] text-gray-400 cursor-not-allowed' : 'bg-[#1A1A1A] hover:bg-gray-800 text-white'}`}>
                                {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                            </Btn>
                        </Box>;
      })}
            </Box>

            {/* Warning */}
            <Box className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl mt-6">
                <Box className="flex gap-3">
                    <Box className="h-9 w-9 flex items-center justify-center bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                        <I icon={AlertTriangle} size={18} />
                    </Box>
                    <Box>
                        <Txt className="text-xs font-black text-amber-400 uppercase">Warning</Txt>
                        <Txt className="text-[10px] text-white/30 font-bold mt-1 leading-relaxed">
                            If subscription expires, your shop will be hidden from customers and active orders may be reassigned.
                        </Txt>
                    </Box>
                </Box>
            </Box>
        </Box>;
};
export default Subscription;
