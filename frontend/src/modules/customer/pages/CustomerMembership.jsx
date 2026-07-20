import React, { useEffect, useState } from 'react';
import { ArrowLeft, Crown, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../utils/api';
import useUserStore from '../../../store/userStore';

const CustomerMembership = () => {
    const navigate = useNavigate();
    const { fetchProfile, profile } = useUserStore();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [redeemingId, setRedeemingId] = useState(null);

    useEffect(() => {
        fetchProfile();
        const load = async () => {
            try {
                const res = await api.get('/subscriptions?audience=customer');
                if (res.data?.success) setPlans(res.data.data || []);
            } catch (e) {
                if (e?.name !== 'CanceledError') toast.error('Could not load membership plans');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [fetchProfile]);

    const points = profile?.loyaltyPoints || 0;

    const handleRedeem = async (planId) => {
        setRedeemingId(planId);
        try {
            const res = await api.post('/subscriptions/redeem-with-points', { planId });
            if (res.data?.success) {
                toast.success(res.data.message || 'Plan activated!');
                await fetchProfile();
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Redemption failed');
        } finally {
            setRedeemingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
            <div className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-sm border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-sm font-black uppercase tracking-widest">Membership</h1>
                    <p className="text-[10px] text-gray-500 font-bold">Redeem with loyalty points</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 mt-6">
                <div className="bg-primary text-white rounded-2xl p-5 mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-white/70">Your points</p>
                        <p className="text-3xl font-black">{points}</p>
                    </div>
                    <Sparkles className="opacity-40" size={40} />
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : plans.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-12">No membership plans available yet.</p>
                ) : (
                    <div className="space-y-4">
                        {plans.map((plan) => {
                            const cost = plan.pointsPrice || 0;
                            const canRedeem = points >= cost && cost > 0;
                            return (
                                <div key={plan._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                            <Crown size={22} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-gray-900">{plan.name}</h3>
                                            {plan.description && (
                                                <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                                            )}
                                            <p className="text-sm font-bold text-primary mt-2">
                                                {cost} points · {plan.durationDays || 30} days
                                            </p>
                                            {plan.features?.length > 0 && (
                                                <ul className="mt-3 space-y-1">
                                                    {plan.features.slice(0, 4).map((f, i) => (
                                                        <li key={i} className="text-[11px] text-gray-600">• {f}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={!canRedeem || redeemingId === plan._id}
                                        onClick={() => handleRedeem(plan._id)}
                                        className="w-full mt-4 py-3 rounded-xl font-bold text-sm bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {redeemingId === plan._id ? 'Activating…' : canRedeem ? 'Redeem with points' : 'Not enough points'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerMembership;
