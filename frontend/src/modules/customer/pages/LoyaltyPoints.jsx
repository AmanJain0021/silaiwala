import React, { useEffect, useState } from 'react';
import { Star, ArrowLeft, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import useUserStore from '../../../store/userStore';

const LoyaltyPointsPage = () => {
    const navigate = useNavigate();
    const { fetchProfile, profile, isLoading } = useUserStore();
    const [settings, setSettings] = useState(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    useEffect(() => {
        fetchProfile();
        const fetchSettings = async () => {
            try {
                const res = await api.get('/cms/settings'); // Public settings endpoint
                // If there's no public settings endpoint, we can just use the user's points directly
                // For now, I'll try to fetch settings, but fallback if it fails
                if (res.data && res.data.data && res.data.data.loyaltyConfig) {
                    setSettings(res.data.data.loyaltyConfig);
                }
                setIsLoadingSettings(false);
            } catch (err) {
                if (err?.name === 'CanceledError' || err?.message === 'canceled' || err?.message?.includes('Cancelled')) {
                    console.log('Settings fetch canceled, ignoring...');
                    return;
                }
                console.error("Failed to fetch settings:", err);
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [fetchProfile]);

    if (isLoading || isLoadingSettings) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const points = profile?.loyaltyPoints || 0;
    const redemptionValue = settings?.redemptionValuePerPoint ?? settings?.redemptionValueInINR ?? 1;
    const totalValue = (points * redemptionValue).toFixed(2);

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-sm border-b border-gray-100">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-sm font-black uppercase tracking-widest text-gray-900">Loyalty Points</h1>
                    <p className="text-[10px] text-gray-500 font-bold">Your rewards summary</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-primary to-purple-800 rounded-3xl p-6 text-white shadow-lg shadow-purple-900/20 relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Star size={120} />
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">Available Points</p>
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-5xl font-black">{points}</span>
                            <span className="text-sm font-bold text-white/70 mb-1">pts</span>
                        </div>
                        
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                            <span className="text-xs font-bold">Estimated Value:</span>
                            <span className="text-sm font-black">₹{totalValue}</span>
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info size={16} className="text-primary" /> How it works
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-green-600 font-black text-xs">1</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Earn on every order</h4>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    You earn {settings?.pointsPer100Spent || 5} points for every ₹100 spent on completed orders.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-blue-600 font-black text-xs">2</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Use points for discounts</h4>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Apply your points during checkout to get discounts. 1 Point = ₹{redemptionValue}.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-red-600 font-black text-xs">3</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Cancellation Penalty</h4>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Cancelling a confirmed order will result in a deduction of {settings?.cancellationPenalty || 50} points from your balance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyPointsPage;
