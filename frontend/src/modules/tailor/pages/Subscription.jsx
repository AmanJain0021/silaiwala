import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, Calendar, ArrowUpCircle, AlertTriangle, Star } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Subscription = () => {
    const [plans, setPlans] = useState([]);
    const [tailorData, setTailorData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, tailorRes] = await Promise.all([
                    api.get('/subscriptions'),
                    api.get('/tailors/me')
                ]);
                
                if (plansRes.data.success) setPlans(plansRes.data.data);
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

    const handleSubscribe = async (planId) => {
        try {
            toast.loading('Activating plan...');
            const res = await api.post('/subscriptions/subscribe', { planId });
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
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const activePlan = tailorData?.activePlan;
    const planExpiryDate = tailorData?.planExpiryDate ? new Date(tailorData.planExpiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not Subscribed';

    return (
        <div className="space-y-4 animate-in fade-in duration-500 bg-[#0A0A0A] min-h-screen p-4 pb-20">

            {/* Current Plan Card */}
            {activePlan ? (
                <div className="bg-[#2D2F6E] p-7 rounded-3xl text-white relative overflow-hidden shadow-xl shadow-[#2D2F6E]/20">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                        <Zap size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Active Plan</span>
                                <h3 className="text-[28px] font-black mt-3 tracking-tighter">{activePlan.name}</h3>
                            </div>
                            <ArrowUpCircle size={36} className="text-white/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/10">
                            <div>
                                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Calendar size={11} /> Expiry Date
                                </p>
                                <p className="text-sm font-black">{planExpiryDate}</p>
                            </div>
                            <div>
                                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <CreditCard size={11} /> Billing Cycle
                                </p>
                                <p className="text-sm font-black">{activePlan.billingCycle}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-[#111111] border border-red-500/20 p-7 rounded-3xl text-white relative overflow-hidden">
                     <div className="relative z-10 flex items-center gap-4">
                        <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-[18px] font-black text-red-400">No Active Plan</h3>
                            <p className="text-[10px] text-gray-400 font-medium mt-1">Please select a plan below to activate your shop profile.</p>
                        </div>
                     </div>
                </div>
            )}

            {/* Pricing Plans */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[12px] font-black text-white/40 uppercase tracking-widest">Available Plans</h4>
                </div>

                {plans.map((plan) => {
                    const isCurrentPlan = activePlan?._id === plan._id;

                    if (plan.theme === 'elite') {
                        return (
                            <div key={plan._id} className={`bg-gradient-to-b from-amber-500/20 to-[#111111] border ${isCurrentPlan ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-amber-500/30'} p-5 rounded-3xl relative overflow-hidden group hover:border-amber-500/50 transition-colors`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Star size={64} fill="currentColor" className="text-amber-500" />
                                </div>
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div>
                                        {plan.isPopular && <span className="bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 inline-block">Best Value</span>}
                                        <p className="text-[16px] font-black text-white">{plan.name}</p>
                                        <p className="text-[10px] text-amber-400 font-bold mt-0.5 tracking-wide">{plan.commissionRange}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[16px] font-black text-white">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</p>
                                        <p className="text-[9px] text-amber-500/50 font-bold uppercase tracking-widest mt-1">{plan.billingCycle}</p>
                                    </div>
                                </div>
                                <div className="bg-amber-500/5 rounded-2xl p-4 mt-4 relative z-10 border border-amber-500/10">
                                    <p className="text-[11px] text-amber-50 leading-relaxed font-medium">
                                        <span className="text-amber-500 font-bold uppercase tracking-wider text-[9px] block mb-1.5">Key Benefits</span>
                                        {plan.features.join(', ')}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleSubscribe(plan._id)}
                                    disabled={isCurrentPlan}
                                    className={`w-full mt-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isCurrentPlan ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 cursor-not-allowed' : 'bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400'}`}>
                                    {isCurrentPlan ? 'Current Plan' : 'Upgrade Now'}
                                </button>
                            </div>
                        );
                    }

                    if (plan.theme === 'premium') {
                        return (
                            <div key={plan._id} className={`bg-gradient-to-b from-[#2D2F6E]/40 to-[#111111] border ${isCurrentPlan ? 'border-[#2D2F6E]' : 'border-[#2D2F6E]/50'} p-5 rounded-3xl relative overflow-hidden group`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Zap size={64} />
                                </div>
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div>
                                        {plan.isPopular && <span className="bg-[#2D2F6E] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 inline-block">Popular</span>}
                                        <p className="text-[16px] font-black text-white">{plan.name}</p>
                                        <p className="text-[10px] text-indigo-300 font-bold mt-0.5 tracking-wide">{plan.commissionRange}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[16px] font-black text-white">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</p>
                                        <p className="text-[9px] text-indigo-200/50 font-bold uppercase tracking-widest mt-1">{plan.billingCycle}</p>
                                    </div>
                                </div>
                                <div className="bg-[#1A1A1A]/50 rounded-2xl p-4 mt-4 relative z-10 border border-indigo-500/10">
                                    <p className="text-[11px] text-gray-200 leading-relaxed font-medium">
                                        <span className="text-indigo-400 font-bold uppercase tracking-wider text-[9px] block mb-1.5">Key Benefits</span>
                                        {plan.features.join(', ')}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleSubscribe(plan._id)}
                                    disabled={isCurrentPlan}
                                    className={`w-full mt-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isCurrentPlan ? 'bg-[#2D2F6E]/50 text-indigo-200 cursor-not-allowed border border-[#2D2F6E]' : 'bg-[#2D2F6E] text-white shadow-lg shadow-[#2D2F6E]/25 hover:bg-[#383a85]'}`}>
                                    {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div key={plan._id} className={`bg-[#111111] border ${isCurrentPlan ? 'border-gray-500' : 'border-[#1E1E1E]'} p-5 rounded-3xl relative overflow-hidden group hover:border-gray-700 transition-colors`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-[16px] font-black text-white">{plan.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wide">{plan.commissionRange}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[16px] font-black text-white">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{plan.billingCycle}</p>
                                </div>
                            </div>
                            <div className="bg-[#1A1A1A] rounded-2xl p-4 mt-4">
                                <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] block mb-1.5">Key Benefits</span>
                                    {plan.features.join(', ')}
                                </p>
                            </div>
                            <button 
                                onClick={() => handleSubscribe(plan._id)}
                                disabled={isCurrentPlan}
                                className={`w-full mt-4 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${isCurrentPlan ? 'bg-[#1A1A1A] text-gray-400 cursor-not-allowed' : 'bg-[#1A1A1A] hover:bg-gray-800 text-white'}`}>
                                {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl mt-6">
                <div className="flex gap-3">
                    <div className="h-9 w-9 flex items-center justify-center bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-amber-400 uppercase">Warning</p>
                        <p className="text-[10px] text-white/30 font-bold mt-1 leading-relaxed">
                            If subscription expires, your shop will be hidden from customers and active orders may be reassigned.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;
