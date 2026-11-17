// Port of modules/tailor/pages/Withdraw.jsx (converted with scripts/web2rn.js, then reviewed)
import { alert } from '../lib/alert';
import React, { useState, useEffect } from "react";
import { ArrowLeft, Delete, Loader2, ArrowUpRight, Check, Wallet } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import { Box, I, Txt, Btn, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const Withdraw = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('0');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await api.get('/tailors/me');
        if (res.data.success) setAvailableBalance(res.data.data.walletBalance || 0);
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBalance();
  }, []);
  const numAmount = parseInt(amount.replace(/,/g, '') || '0', 10);
  const handleKeyPress = key => {
    if (amount === '0') {
      setAmount(key);
    } else if (amount.replace(/,/g, '').length < 6) {
      const newAmountStr = amount.replace(/,/g, '') + key;
      setAmount(parseInt(newAmountStr, 10).toLocaleString('en-IN'));
    }
  };
  const handleDelete = () => {
    const rawAmount = amount.replace(/,/g, '');
    if (rawAmount.length <= 1) setAmount('0');else setAmount(parseInt(rawAmount.slice(0, -1), 10).toLocaleString('en-IN'));
  };
  const handleWithdrawRequest = async () => {
    if (numAmount === 0 || numAmount > availableBalance) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/tailors/withdraw', {
        amount: numAmount
      });
      if (res.data.success) setStep(2);
    } catch (error) {
      alert(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) {
    return <Box className="min-h-full bg-gray-50 flex items-center justify-center">
                <Spin size={40} className="text-[#843D9B]" />
            </Box>;
  }

  /* ── SUCCESS SCREEN ─── */
  if (step === 2) {
    return <Box className="min-h-full bg-gray-50 flex items-center justify-center p-6 animate-in zoom-in duration-300">
                <Box className="bg-white border border-gray-100 rounded-[2.5rem] p-10 w-full max-w-sm text-center flex flex-col items-center shadow-xl">
                    <Box className="h-24 w-24 bg-[#843D9B] rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-[#843D9B]/40">
                        <I icon={Check} size={40} strokeWidth={3} className="text-white" />
                    </Box>
                    <Txt className="text-2xl font-black text-gray-900 tracking-tight">Withdrawal Sent</Txt>
                    <Txt className="text-gray-500 font-medium text-sm mt-4 leading-relaxed">
                        Your payout request of ₹{numAmount.toLocaleString('en-IN')} has been submitted.
                    </Txt>
                    <Btn onPress={() => navigate('/partner/earnings')} className="mt-10 w-full bg-[#843D9B] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#843D9B]/30 active:scale-95 transition-all">
                        Return to Earnings
                    </Btn>
                </Box>
            </Box>;
  }

  /* ── MAIN SCREEN ─── */
  return <Box className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#843D9B] selection:text-white">

            {/* ── MOBILE HEADER ── */}
            <Box className="md:hidden bg-white px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <Btn onPress={() => navigate(-1)} className="p-1.5 -ml-2 text-gray-400 hover:text-[#843D9B] transition-colors">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Txt className="text-[17px] font-black text-[#843D9B] tracking-tight uppercase">Withdrawal</Txt>
                <Box className="w-10" />
            </Box>

            <Box className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                
                {/* ── DESKTOP TITLE ── */}
                <Box className="hidden md:block mb-8 text-center">
                    <Txt className="text-3xl font-black text-gray-900 tracking-tight">Withdraw Funds</Txt>
                    <Txt className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Instant payout to your registered account</Txt>
                </Box>

                <Box className="w-full max-w-lg bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden animate-in zoom-in-95 duration-500">
                    
                    {/* Amount Display Area */}
                    <Box className="p-8 md:p-12 flex flex-col items-center text-center bg-gradient-to-br from-[#843D9B] via-[#6B2F7E] to-[#512261] relative overflow-hidden group">
                        <Box className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <I icon={Wallet} size={160} color="white" />
                        </Box>
                        
                        {/* Balance Badge */}
                        <Box className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-2 rounded-xl mb-10 relative z-10">
                            <Txt className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px]">
                                Available: <Txt className="text-[#FDE5D2] ml-1">₹{availableBalance.toLocaleString('en-IN')}</Txt>
                            </Txt>
                        </Box>

                        {/* Amount Input */}
                        <Box className="relative flex flex-col items-center z-10">
                            <Box className="flex items-baseline gap-3 text-white mb-2">
                                <Txt className="text-3xl font-black text-white/30 italic">₹</Txt>
                                <Txt className="text-7xl font-black tracking-tighter leading-none">{amount}</Txt>
                            </Box>
                            
                            {numAmount > availableBalance ? <Box className="bg-rose-500/20 border border-rose-500/20 text-rose-400 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest mt-4">
                                    ⚠ Insufficient Funds
                                </Box> : <Txt className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] mt-4 italic">Specify Payout Amount</Txt>}
                        </Box>
                    </Box>

                    {/* Interaction Area (Numpad) */}
                    <Box className="p-10 pt-12 flex flex-col">
                        <Box className="grid grid-cols-3 gap-x-8 gap-y-6 mb-12 max-w-sm mx-auto w-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => <Btn key={num} onPress={() => handleKeyPress(num.toString())} className="h-14 rounded-2xl text-2xl font-black text-gray-900 hover:bg-gray-50 active:scale-90 active:bg-gray-100 transition-all flex items-center justify-center border border-transparent hover:border-gray-100">
                                    {num}
                                </Btn>)}
                            <Box />
                            <Btn onPress={() => handleKeyPress('0')} className="h-14 rounded-2xl text-2xl font-black text-gray-900 hover:bg-gray-50 active:scale-90 active:bg-gray-100 transition-all flex items-center justify-center border border-transparent hover:border-gray-100">
                                0
                            </Btn>
                            <Btn onPress={handleDelete} className="h-14 rounded-2xl active:scale-90 text-gray-300 hover:text-rose-500 transition-all flex items-center justify-center">
                                <I icon={Delete} size={28} strokeWidth={2.5} />
                            </Btn>
                        </Box>

                        <Box className="space-y-6">
                            <Btn onPress={handleWithdrawRequest} disabled={numAmount === 0 || numAmount > availableBalance || isSubmitting} className="w-full bg-[#843D9B] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-[#843D9B]/30 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-4 hover:bg-[#4E2460]">
                                {isSubmitting ? <Spin size={20} className="animate-spin" /> : <I icon={ArrowUpRight} size={20} strokeWidth={3} />}
                                {isSubmitting ? 'Processing Request...' : 'Confirm Withdrawal'}
                            </Btn>
                            
                            <Box className="flex flex-col items-center gap-2">
                                <Txt className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest leading-relaxed">
                                    Bank transfer normally takes 60-120 minutes.

                                    Security verification may apply to large amounts.
                                </Txt>
                            </Box>
                        </Box>
                    </Box>

                </Box>
            </Box>
        </Box>;
};
export default Withdraw;