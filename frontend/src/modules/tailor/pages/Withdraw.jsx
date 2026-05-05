import React, { useState, useEffect } from 'react';
import { ArrowLeft, Delete, Loader2, ArrowUpRight, Check } from 'lucide-react';
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
        <div className="min-h-full bg-[#0A0A0A] flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="px-5 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#0A0A0A] border-b border-[#1C1C1C]">
                <button onClick={() => navigate(-1)} className="h-10 w-10 bg-[#161616] border border-[#2A2A2A] rounded-2xl flex items-center justify-center text-white/40 transition-colors hover:text-white">
                    <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <h1 className="text-[16px] font-black text-white tracking-tight uppercase">Withdrawal</h1>
                <div className="w-10" />
            </div>

            {/* Amount Display */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                {/* Balance Badge */}
                <div className="bg-[#111111] border border-[#1E1E1E] px-5 py-2.5 rounded-full mb-8">
                    <p className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">
                        Available: <span className="text-[#2D2F6E] ml-1">₹{availableBalance.toLocaleString('en-IN')}</span>
                    </p>
                </div>

                {/* Amount */}
                <div className="flex items-center text-white relative mb-2">
                    <span className="text-3xl font-black text-white/20 absolute -left-10 italic">₹</span>
                    <span className="text-[68px] font-black tracking-tighter leading-none">{amount}</span>
                </div>

                {numAmount > availableBalance ? (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-4">
                        ⚠ Insufficient Balance
                    </div>
                ) : (
                    <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em] mt-4 italic">Specify amount to transfer</p>
                )}
            </div>

            {/* Numpad */}
            <div className="bg-[#111111] border-t border-[#1C1C1C] rounded-t-[2.5rem] px-8 py-10">
                <div className="grid grid-cols-3 gap-x-8 gap-y-5 mb-10 max-w-[300px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleKeyPress(num.toString())}
                            className="h-14 rounded-2xl text-2xl font-black text-white active:scale-90 active:bg-white/10 hover:text-[#2D2F6E] transition-all flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                    <div />
                    <button
                        onClick={() => handleKeyPress('0')}
                        className="h-14 rounded-2xl text-2xl font-black text-white active:scale-90 active:bg-white/10 hover:text-[#2D2F6E] transition-all flex items-center justify-center"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="h-14 rounded-2xl active:scale-90 active:bg-white/5 transition-all flex items-center justify-center text-white/20 hover:text-red-400"
                    >
                        <Delete size={28} strokeWidth={2} />
                    </button>
                </div>

                <div className="max-w-[300px] mx-auto pb-2">
                    <button
                        onClick={handleWithdrawRequest}
                        disabled={numAmount === 0 || numAmount > availableBalance || isSubmitting}
                        className="w-full bg-[#2D2F6E] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-[#2D2F6E]/30 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ArrowUpRight size={18} strokeWidth={3} />}
                        {isSubmitting ? 'Verifying...' : 'Initiate Instant Payout'}
                    </button>
                    <p className="text-center text-[9px] font-black text-white/15 mt-5 uppercase tracking-widest leading-relaxed">
                        Funds credited to your verified UPI/Bank<br />within 60–120 minutes.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Withdraw;
