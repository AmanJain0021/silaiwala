// Port of modules/customer/pages/PaymentMethods.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState } from "react";
import { ArrowLeft, CreditCard, Smartphone, Banknote, ShieldCheck, Plus } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import toast from '../lib/toast';
import BottomNav from "../components/customer/BottomNav";
import { Box, Btn, I, Txt, Scroll } from '../components/ui/primitives';
const PaymentMethods = () => {
  const navigate = useNavigate();
  const [methods] = useState([{
    id: 'upi',
    type: 'UPI',
    label: 'Pay via UPI',
    detail: 'Google Pay, PhonePe, Paytm & more at checkout',
    icon: Smartphone,
    color: 'text-emerald-600 bg-emerald-50'
  }, {
    id: 'card',
    type: 'Card',
    label: 'Credit / Debit Card',
    detail: 'Visa, Mastercard, RuPay — secured by Razorpay',
    icon: CreditCard,
    color: 'text-indigo-600 bg-indigo-50'
  }, {
    id: 'cod',
    type: 'COD',
    label: 'Cash on Delivery',
    detail: 'Pay remaining balance when your order is delivered',
    icon: Banknote,
    color: 'text-amber-600 bg-amber-50'
  }]);
  return <Screen className="bg-[#F8F9FB]" bottom={false} statusBg="bg-[#843D9B]" statusBar="light"><Box className="flex-1 bg-[#F8F9FB] font-sans">
            <Box className="sticky top-0 z-50 bg-[#843D9B] px-4 py-4 flex items-center gap-3 text-white shadow-md">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Txt className="text-sm font-black tracking-tight">Payment Methods</Txt>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-24">

            <Box className="max-w-lg mx-auto px-4 py-6 space-y-6">
                <Box className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-start gap-3">
                    <Box className="w-10 h-10 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center shrink-0">
                        <I icon={ShieldCheck} size={20} />
                    </Box>
                    <Box>
                        <Txt className="text-sm font-bold text-gray-900">Secure payments</Txt>
                        <Txt className="text-xs text-gray-500 mt-1 leading-relaxed">
                            All online payments are processed securely through Razorpay. You choose your preferred method at checkout.
                        </Txt>
                    </Box>
                </Box>

                <Box>
                    <Txt className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                        Available at checkout
                    </Txt>
                    <Box className="space-y-3">
                        {methods.map(m => {
            const Icon = m.icon;
            return <Box key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                                    <Box className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}>
                                        <I icon={Icon} size={20} />
                                    </Box>
                                    <Box className="flex-1 min-w-0">
                                        <Txt className="text-sm font-bold text-gray-900">{m.label}</Txt>
                                        <Txt className="text-[11px] text-gray-500 mt-0.5">{m.detail}</Txt>
                                    </Box>
                                </Box>;
          })}
                    </Box>
                </Box>

                <Box className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-2xl p-4">
                    <Txt className="text-xs text-[#843D9B] font-semibold leading-relaxed">
                        Saved cards & UPI IDs will be available soon. For now, select your payment method when you pay for an order.
                    </Txt>
                    <Btn onPress={() => toast.success('You can add payment details at checkout')} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#843D9B] cursor-pointer">
                        <I icon={Plus} size={14} /> Add method at checkout
                    </Btn>
                </Box>

                <Btn onPress={() => navigate('/user/wallet')} className="w-full py-3.5 rounded-xl bg-white border border-gray-200 text-sm font-bold text-gray-800 hover:border-[#843D9B]/30 transition-colors cursor-pointer">
                    View Wallet &amp; Refunds
                </Btn>
            </Box>

                        </Scroll>
<BottomNav />
        </Box></Screen>;
};
export default PaymentMethods;