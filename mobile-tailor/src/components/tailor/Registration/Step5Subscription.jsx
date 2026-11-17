// Port of modules/tailor/components/Registration/Step5Subscription.jsx (converted with scripts/web2rn.js, then reviewed)
import Svg, { Path } from 'react-native-svg';
import React from "react";
import { Check } from "lucide-react-native";
import { Box, Txt, Btn, I, Scroll } from '../../ui/primitives';
export const Step5Subscription = ({
  register,
  watch,
  setValue
}) => {
  const selectedPlan = watch('plan') || 'basic';
  const plans = [{
    id: 'basic',
    name: 'Starter',
    price: '₹499',
    features: ['Unlimited Orders', 'Basic Layout', 'Standard Support'],
    color: 'from-gray-100 to-gray-200 text-gray-800'
  }, {
    id: 'premium',
    name: 'Premium',
    price: '₹999',
    features: ['Priority Search', 'Portfolio Badge', 'Advanced Analytics'],
    popular: true,
    color: 'from-primary to-primary-dark text-white'
  }, {
    id: 'pro',
    name: 'Pro Elite',
    price: '₹1,999',
    features: ['0% Commission', 'dedicated Manager', 'Featured Listing'],
    color: 'from-amber-100 to-amber-200 text-amber-900'
  }];
  return <Box className="space-y-8 animate-in slide-in-from-right duration-300 pb-10">
            <Box className="text-center mb-6">
                <Txt className="text-xl font-bold text-gray-900">Choose Your Plan</Txt>
                <Txt className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Select a plan to start receiving orders</Txt>
            </Box>

            <Box className="space-y-4">
                {plans.map(plan => <Btn key={plan.id} onPress={() => setValue('plan', plan.id)} className={`block ${`relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer group ${selectedPlan === plan.id ? 'border-primary bg-gray-50/50 shadow-xl scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}`}`}>
                        {plan.popular && <Txt className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2 border-white shadow-md">
                                Most Popular
                            </Txt>}

                        <Box className="flex justify-between items-start mb-4">
                            <Box>
                                <Txt className="text-lg font-black tracking-tight">{plan.name}</Txt>
                                <Box className="flex items-baseline gap-1 mt-1">
                                    <Txt className="text-2xl font-black">{plan.price}</Txt>
                                    <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">/ Month</Txt>
                                </Box>
                            </Box>
                            <Box className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedPlan === plan.id ? 'border-primary bg-primary text-white' : 'border-gray-200'}`}>
                                {selectedPlan === plan.id && <I icon={Check} size={14} strokeWidth={4} />}
                            </Box>
                        </Box>

                        <Box className="space-y-3">
                            {plan.features.map((feature, idx) => <Box key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                    <Box className={`h-1.5 w-1.5 rounded-full ${selectedPlan === plan.id ? 'bg-primary' : 'bg-gray-300'}`}></Box>
                                    {feature}
                                </Box>)}
                        </Box>
                    </Btn>)}
            </Box>

            <Box className="p-6 bg-[#f0f9f6] rounded-3xl border border-[#d4e9e2] mt-6">
                <Box className="flex gap-3">
                    <Box className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary">
                        <Svg width={24} height={24} viewBox="0 0 24 24"><Path fill="#843D9B" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z" /></Svg>
                    </Box>
                    <Box>
                        <Txt className="text-xs font-black text-primary uppercase tracking-[0.1em]">Refund Policy</Txt>
                        <Txt className="text-[10px] text-green-700 font-bold mt-1 leading-relaxed">Cancel anytime. 7-day money back guarantee if not approved by admin.</Txt>
                    </Box>
                </Box>
            </Box>
        </Box>;
};
