import React from 'react';
import { CreditCard, Zap, Calendar, ArrowUpCircle, AlertTriangle } from 'lucide-react';

const Subscription = () => {
    return (
        <div className="space-y-4 animate-in fade-in duration-500 bg-[#0A0A0A] min-h-screen p-4">

            {/* Current Plan Card */}
            <div className="bg-[#2D2F6E] p-7 rounded-3xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Zap size={100} />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Active Plan</span>
                            <h3 className="text-[28px] font-black mt-3 tracking-tighter">Premium Plus</h3>
                        </div>
                        <ArrowUpCircle size={36} className="text-white/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/10">
                        <div>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Calendar size={11} /> Expiry Date
                            </p>
                            <p className="text-sm font-black">20 March 2024</p>
                        </div>
                        <div>
                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                <CreditCard size={11} /> Next Payout
                            </p>
                            <p className="text-sm font-black">₹14,500</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Options */}
            <div className="space-y-3">
                <h4 className="text-[11px] font-black text-white/25 uppercase tracking-widest px-1">Upgrade Options</h4>
                <div className="bg-[#111111] border border-[#1E1E1E] p-4 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/10">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">Pro Elite Plan</p>
                            <p className="text-[10px] text-white/30 font-bold italic">0% Platform Fee + Priority Support</p>
                        </div>
                    </div>
                    <button className="text-[#2D2F6E] font-black text-[10px] uppercase tracking-widest bg-[#2D2F6E]/10 px-3 py-1.5 rounded-xl border border-[#2D2F6E]/20">
                        View
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
                <button className="w-full bg-[#2D2F6E] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#2D2F6E]/25 active:scale-95 transition-all">
                    Renew Subscription
                </button>
                <button className="w-full bg-[#111111] border border-[#1E1E1E] text-white/50 py-4 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all hover:border-[#2A2A2A]">
                    Transaction History
                </button>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl">
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
