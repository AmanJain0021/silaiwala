// Port of modules/customer/pages/ReferEarn.jsx (converted with scripts/web2rn.js, then reviewed)
import * as Clipboard from 'expo-clipboard';
import Screen from '../components/common/Screen';
import React from "react";
import { ArrowLeft, Gift, Share2, Copy, CheckCircle2, Ticket } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import toast from '../lib/toast';
import { shareLink, webUrl } from '../lib/share';
import useUserStore from "../store/userStore";
import useBrandingStore from "../store/brandingStore";
import { Box, Btn, I, Txt, Scroll } from '../components/ui/primitives';
const ReferEarn = () => {
  const navigate = useNavigate();
  const {
    fetchReferralStats,
    referralStats
  } = useUserStore();
  const appName = useBrandingStore(state => state.appName);
  React.useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);
  const cfg = referralStats?.referralConfig || {};
  const referrerPts = cfg.referrerPointsOnFirstAdvance ?? 50;
  const refereePts = cfg.refereePointsOnFirstAdvance ?? 25;
  const referralCode = referralStats?.referralCode || 'GETTING_CODE...';
  const copyToClipboard = () => {
    if (referralStats?.referralCode) {
      Clipboard.setStringAsync(referralStats.referralCode);
      toast.success('Code copied!');
    }
  };
  return <Screen className="bg-white" statusBg="bg-primary" statusBar="light"><Box className="flex-1 bg-white font-sans text-gray-900">
            <Box className="sticky top-0 z-50 bg-primary text-white px-4 py-4 flex items-center gap-3">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Txt className="text-lg font-bold">Refer & Earn</Txt>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="bg-primary text-white px-6 pb-12 pt-6 rounded-b-[3rem] text-center">
                <Box className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
                    <I icon={Gift} size={80} className="text-yellow-400 drop-shadow-lg" />
                </Box>
                <Txt className="text-2xl font-black mb-2 uppercase tracking-tighter">Refer a Friend</Txt>
                <Txt className="text-white/80 text-sm font-medium">
                    Earn {referrerPts} loyalty points when your friend signs up with your code.
                    They get {refereePts} points welcome bonus (1 point = ₹1).
                </Txt>
            </Box>

            <Box className="max-w-md mx-auto px-6 -mt-8">
                <Box className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                    <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">Your Referral Code</Txt>
                    <Box className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                        <Txt className="flex-1 text-xl font-black text-primary tracking-widest text-center uppercase">{referralCode}</Txt>
                        <Btn onPress={copyToClipboard} className="p-3 bg-white rounded-xl shadow-sm text-primary hover:bg-gray-100 active:scale-90 transition-all">
                            <I icon={Copy} size={20} />
                        </Btn>
                    </Box>

                    <Btn onPress={() => shareLink({
          title: `Join ${appName}`,
          text: `Use my referral code ${referralCode} — get ${refereePts} loyalty points when you sign up!`,
          url: webUrl('/')
        })} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-900/10 mt-6 flex items-center justify-center gap-3 transition-all hover:bg-primary-dark active:scale-95">
                        <I icon={Share2} size={18} />
                        Share Invitation Link
                    </Btn>
                </Box>
            </Box>

            <Box className="px-8 py-10">
                <Txt className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 text-center">How it Works</Txt>
                <Box className="space-y-8">
                    <Box className="flex gap-6">
                        <Box className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                            <Txt className="font-black text-green-600">1</Txt>
                        </Box>
                        <Box>
                            <Txt className="font-bold text-sm mb-1">Invite Friends</Txt>
                            <Txt className="text-xs text-gray-500 leading-relaxed">Share your code on WhatsApp or social media.</Txt>
                        </Box>
                    </Box>
                    <Box className="flex gap-6">
                        <Box className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <Txt className="font-black text-primary">2</Txt>
                        </Box>
                        <Box>
                            <Txt className="font-bold text-sm mb-1">Friend signs up</Txt>
                            <Txt className="text-xs text-gray-500 leading-relaxed">
                                When they enter your code at signup, both of you get loyalty points instantly.
                            </Txt>
                        </Box>
                    </Box>
                    <Box className="flex gap-6">
                        <Box className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 border border-yellow-100">
                            <Txt className="font-black text-yellow-600">3</Txt>
                        </Box>
                        <Box>
                            <Txt className="font-bold text-sm mb-1">Get points</Txt>
                            <Txt className="text-xs text-gray-500 leading-relaxed">
                                You receive {referrerPts} points; your friend gets {refereePts} points in loyalty balance.
                            </Txt>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box className="px-6 mb-10">
                <Box className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 text-white overflow-hidden relative">
                    <Box className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <I icon={Ticket} size={80} />
                    </Box>
                    <Txt className="text-[10px] font-bold text-gray-400 uppercase mb-1">Referral points earned</Txt>
                    <Box className="flex items-baseline gap-1">
                        <Txt className="text-3xl font-black">{referralStats?.referralEarnings || 0}</Txt>
                        <Txt className="text-sm text-gray-300 font-bold">pts</Txt>
                        <Txt className="text-xs text-green-400 font-bold flex items-center gap-1 ml-2">
                            <I icon={CheckCircle2} size={12} /> Loyalty
                        </Txt>
                    </Box>
                    <Box className="mt-4 flex gap-4">
                        <Box className="flex-1">
                            <Txt className="text-[10px] text-gray-400">Total Referrals</Txt>
                            <Txt className="text-sm font-bold">{referralStats?.totalReferrals || 0} Friends</Txt>
                        </Box>
                        <Box className="w-px h-8 bg-white/10" />
                        <Box className="flex-1 text-right">
                            <Txt className="text-[10px] text-gray-400">Your balance</Txt>
                            <Txt className="text-sm font-bold">{referralStats?.loyaltyPoints ?? 0} pts</Txt>
                        </Box>
                    </Box>
                </Box>
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default ReferEarn;
