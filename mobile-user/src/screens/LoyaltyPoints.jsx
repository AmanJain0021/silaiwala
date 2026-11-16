// Port of modules/customer/pages/LoyaltyPoints.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useEffect, useState } from "react";
import { Star, ArrowLeft, Loader2, Info } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import useUserStore from "../store/userStore";
import { Box, Btn, I, Txt, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const LoyaltyPointsPage = () => {
  const navigate = useNavigate();
  const {
    fetchProfile,
    profile,
    isLoading
  } = useUserStore();
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
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 flex items-center justify-center">
                <Spin className="w-8 h-8 animate-spin text-primary" />
            </Box></Screen>;
  }
  const points = profile?.loyaltyPoints || 0;
  const redemptionValue = settings?.redemptionValuePerPoint ?? settings?.redemptionValueInINR ?? 1;
  const totalValue = (points * redemptionValue).toFixed(2);
  return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 md:pb-8 font-sans text-gray-900">
            {/* Header */}
            <Box className="bg-white px-4 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-sm border-b border-gray-100">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Box>
                    <Txt className="text-sm font-black uppercase tracking-widest text-gray-900">Loyalty Points</Txt>
                    <Txt className="text-[10px] text-gray-500 font-bold">Your rewards summary</Txt>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-24">

            <Box className="max-w-4xl mx-auto px-4 mt-6">
                {/* Balance Card */}
                <Box className="bg-gradient-to-br from-primary to-purple-800 rounded-3xl p-6 text-white shadow-lg shadow-purple-900/20 relative overflow-hidden mb-6">
                    <Box className="absolute top-0 right-0 p-8 opacity-10">
                        <I icon={Star} size={120} />
                    </Box>
                    
                    <Box className="relative z-10">
                        <Txt className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">Available Points</Txt>
                        <Box className="flex items-end gap-2 mb-4">
                            <Txt className="text-5xl font-black">{points}</Txt>
                            <Txt className="text-sm font-bold text-white/70 mb-1">pts</Txt>
                        </Box>
                        
                        <Box className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                            <Txt className="text-xs font-bold">Estimated Value:</Txt>
                            <Txt className="text-sm font-black">₹{totalValue}</Txt>
                        </Box>
                    </Box>
                </Box>

                {/* How it works */}
                <Box className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
                    <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <I icon={Info} size={16} className="text-primary" /> How it works
                    </Txt>
                    
                    <Box className="space-y-4">
                        <Box className="flex gap-3 items-start">
                            <Box className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                                <Txt className="text-green-600 font-black text-xs">1</Txt>
                            </Box>
                            <Box>
                                <Txt className="text-sm font-bold text-gray-900">Earn on every order</Txt>
                                <Txt className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    You earn {settings?.pointsPer100Spent || 5} points for every ₹100 spent on completed orders.
                                </Txt>
                            </Box>
                        </Box>
                        
                        <Box className="flex gap-3 items-start">
                            <Box className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                <Txt className="text-blue-600 font-black text-xs">2</Txt>
                            </Box>
                            <Box>
                                <Txt className="text-sm font-bold text-gray-900">Use points for discounts</Txt>
                                <Txt className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Apply your points during checkout to get discounts. 1 Point = ₹{redemptionValue}.
                                </Txt>
                            </Box>
                        </Box>

                        <Box className="flex gap-3 items-start">
                            <Box className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                                <Txt className="text-red-600 font-black text-xs">3</Txt>
                            </Box>
                            <Box>
                                <Txt className="text-sm font-bold text-gray-900">Cancellation Penalty</Txt>
                                <Txt className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Cancelling a confirmed order will result in a deduction of {settings?.cancellationPenalty || 50} points from your balance.
                                </Txt>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default LoyaltyPointsPage;