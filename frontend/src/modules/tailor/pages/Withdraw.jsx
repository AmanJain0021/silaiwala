import React, { useState, useEffect } from 'react';
import { ArrowLeft, Delete, Loader2, ArrowUpRight, Check, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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

    const handleKeyPress = (key) => {
        if (amount === '0') {
            setAmount(key);
        } else if (amount.replace(/,/g, '').length < 6) {
            const newAmountStr = amount.replace(/,/g, '') + key;
            setAmount(parseInt(newAmountStr, 10).toLocaleString('en-IN'));
        }
    };

    const handleDelete = () => {
        const rawAmount = amount.replace(/,/g, '');
        if (rawAmount.length <= 1) setAmount('0');
        else setAmount(parseInt(rawAmount.slice(0, -1), 10).toLocaleString('en-IN'));
    };

    const handleWithdrawRequest = async () => {
        if (numAmount === 0 || numAmount > availableBalance) return;
        setIsSubmitting(true);
        try {
            const res = await api.post('/tailors/withdraw', { amount: numAmount });
            if (res.data.success) setStep(2);
        } catch (error) {
            alert(error.response?.data?.message || 'Withdrawal failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-full bg-[#0A0A0A] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2D2F6E]" />
            </div>
        );
    }

    /* ── SUCCESS SCREEN ─── */
    if (step === 2) {
        return (
            <div className="min-h-full bg-[#0A0A0A] flex items-center justify-center p-6 animate-in zoom-in duration-300">
                <div className="bg-[#111111] border border-[#1E1E1E] rounded-[2.5rem] p-10 w-full max-w-sm text-center flex flex-col items-center">
                    <div className="h-24 w-24 bg-[#2D2F6E] rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-[#2D2F6E]/40">
                        <Check size={40} strokeWidth={3} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Withdrawal Sent</h2>
                    <p className="text-white/40 font-medium text-sm mt-4 leading-relaxed">
                        ₹{amount} is on its way to your bank.<br />Expect it in 2–3 hours.
                    </p>
                    <button
                        onClick={() => navigate('/partner')}
                        className="mt-10 w-full bg-[#2D2F6E] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#2D2F6E]/30 active:scale-95 transition-all"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    /* ── MAIN SCREEN ─── */
    return (
        <div className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#2D2F6E] selection:text-white">

            {/* ── MOBILE HEADER ── */}
            <div className="md:hidden bg-white px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <button onClick={() => navigate(-1)} className="p-1.5 -ml-2 text-gray-400 hover:text-[#2D2F6E] transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-[17px] font-black text-[#2D2F6E] tracking-tight uppercase">Withdrawal</h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
                
                {/* ── DESKTOP TITLE ── */}
                <div className="hidden md:block mb-8 text-center">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Withdraw Funds</h2>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Instant payout to your registered account</p>
                </div>

                <div className="w-full max-w-lg bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden animate-in zoom-in-95 duration-500">
                    
                    {/* Amount Display Area */}
                    <div className="p-8 md:p-12 flex flex-col items-center text-center bg-[#1A1A1A] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <Wallet size={160} color="white" />
                        </div>
                        
                        {/* Balance Badge */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-2 rounded-xl mb-10 relative z-10">
                            <p className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px]">
                                Available: <span className="text-[#FDE5D2] ml-1">₹{availableBalance.toLocaleString('en-IN')}</span>
                            </p>
                        </div>

                        {/* Amount Input */}
                        <div className="relative flex flex-col items-center z-10">
                            <div className="flex items-baseline gap-3 text-white mb-2">
                                <span className="text-3xl font-black text-white/30 italic">₹</span>
                                <span className="text-7xl font-black tracking-tighter leading-none">{amount}</span>
                            </div>
                            
                            {numAmount > availableBalance ? (
                                <div className="bg-rose-500/20 border border-rose-500/20 text-rose-400 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest mt-4">
                                    ⚠ Insufficient Funds
                                </div>
                            ) : (
                                <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] mt-4 italic">Specify Payout Amount</p>
                            )}
                        </div>
                    </div>

                    {/* Interaction Area (Numpad) */}
                    <div className="p-10 pt-12 flex flex-col">
                        <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-12 max-w-sm mx-auto w-full">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleKeyPress(num.toString())}
                                    className="h-14 rounded-2xl text-2xl font-black text-gray-900 hover:bg-gray-50 active:scale-90 active:bg-gray-100 transition-all flex items-center justify-center border border-transparent hover:border-gray-100"
                                >
                                    {num}
                                </button>
                            ))}
                            <div />
                            <button
                                onClick={() => handleKeyPress('0')}
                                className="h-14 rounded-2xl text-2xl font-black text-gray-900 hover:bg-gray-50 active:scale-90 active:bg-gray-100 transition-all flex items-center justify-center border border-transparent hover:border-gray-100"
                            >
                                0
                            </button>
                            <button
                                onClick={handleDelete}
                                className="h-14 rounded-2xl active:scale-90 text-gray-300 hover:text-rose-500 transition-all flex items-center justify-center"
                            >
                                <Delete size={28} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <button
                                onClick={handleWithdrawRequest}
                                disabled={numAmount === 0 || numAmount > availableBalance || isSubmitting}
                                className="w-full bg-[#2D2F6E] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-[#2D2F6E]/30 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-4 hover:bg-[#1e1f4a]"
                            >
                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <ArrowUpRight size={20} strokeWidth={3} />}
                                {isSubmitting ? 'Processing Request...' : 'Confirm Withdrawal'}
                            </button>
                            
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-widest leading-relaxed">
                                    Bank transfer normally takes 60-120 minutes.<br />
                                    Security verification may apply to large amounts.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Withdraw;
