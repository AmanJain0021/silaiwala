import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Banknote, ShieldCheck, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import BottomNav from '../components/BottomNav';

const PaymentMethods = () => {
    const navigate = useNavigate();
    const [methods] = useState([
        {
            id: 'upi',
            type: 'UPI',
            label: 'Pay via UPI',
            detail: 'Google Pay, PhonePe, Paytm & more at checkout',
            icon: Smartphone,
            color: 'text-emerald-600 bg-emerald-50',
        },
        {
            id: 'card',
            type: 'Card',
            label: 'Credit / Debit Card',
            detail: 'Visa, Mastercard, RuPay — secured by Razorpay',
            icon: CreditCard,
            color: 'text-indigo-600 bg-indigo-50',
        },
        {
            id: 'cod',
            type: 'COD',
            label: 'Cash on Delivery',
            detail: 'Pay remaining balance when your order is delivered',
            icon: Banknote,
            color: 'text-amber-600 bg-amber-50',
        },
    ]);

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-24 font-sans">
            <div className="sticky top-0 z-50 bg-[#843D9B] px-4 py-4 flex items-center gap-3 text-white shadow-md">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-sm font-black tracking-tight">Payment Methods</h1>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Secure payments</h2>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            All online payments are processed securely through Razorpay. You choose your preferred method at checkout.
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                        Available at checkout
                    </h3>
                    <div className="space-y-3">
                        {methods.map((m) => {
                            const Icon = m.icon;
                            return (
                                <div
                                    key={m.id}
                                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4"
                                >
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900">{m.label}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">{m.detail}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-2xl p-4">
                    <p className="text-xs text-[#843D9B] font-semibold leading-relaxed">
                        Saved cards & UPI IDs will be available soon. For now, select your payment method when you pay for an order.
                    </p>
                    <button
                        type="button"
                        onClick={() => toast.success('You can add payment details at checkout')}
                        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#843D9B] cursor-pointer"
                    >
                        <Plus size={14} /> Add method at checkout
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/user/wallet')}
                    className="w-full py-3.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-800 hover:border-[#843D9B]/30 transition-colors cursor-pointer"
                >
                    View Wallet &amp; Refunds
                </button>
            </div>

            <BottomNav />
        </div>
    );
};

export default PaymentMethods;
