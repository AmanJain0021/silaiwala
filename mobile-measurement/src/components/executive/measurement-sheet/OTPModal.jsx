// Port of modules/measurement-executive/components/measurement-sheet/OTPModal.jsx (converted with scripts/web2rn.js, then reviewed)
import { Dialog, Sheet } from '../../../components/ui/Sheet';
import React, { useState } from "react";
import { X, KeyRound, CheckCircle2, RotateCw } from "lucide-react-native";
import { Box, Btn, I, Txt, Input, Scroll } from '../../ui/primitives';
const OTPModal = ({
  isOpen,
  onClose,
  onVerify,
  onResend,
  verifying = false,
  resending = false
}) => {
  const [otp, setOtp] = useState('');
    const handleSubmit = e => {
    if (!otp.trim()) return;
    onVerify(otp.trim());
  };
  return <Dialog visible={!!(isOpen)} onClose={onClose} className={`w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100    text-center`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                <Box className="flex justify-end mb-1">
                    <Btn onPress={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer">
                        <I icon={X} size={16} />
                    </Btn>
                </Box>

                <Box className="w-14 h-14 mx-auto rounded-2xl bg-[#F3E8FF] text-[#581C87] flex items-center justify-center mb-3.5 shadow-sm">
                    <I icon={KeyRound} size={26} strokeWidth={2.2} />
                </Box>

                <Txt className="text-lg font-bold text-gray-900 tracking-tight">Customer Confirmation</Txt>
                <Txt className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Enter the 6-digit OTP sent to the customer's phone or app to sign-off on measurements.
                </Txt>

                <Box className="mt-5 space-y-4">
                    <Box className="bg-[#FAF7FC] border-2 border-purple-200/80 rounded-2xl p-2.5 focus-within:border-[#581C87] focus-within:ring-4 focus-within:ring-purple-100 transition-all">
                        <Input maxLength={6} placeholder="• • • • • •" keyboardType="number-pad" value={otp} onChangeText={e => setOtp(e.replace(/\D/g, ''))} className="w-full bg-transparent border-0 text-center font-black text-2xl tracking-[0.4em] text-gray-900 focus:outline-none focus:ring-0" autoFocus />
                    </Box>

                    <Btn onPress={handleSubmit} disabled={verifying || otp.length < 4} className="w-full py-3.5 px-4 bg-[#581C87] hover:bg-[#4A154B] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-900/25 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98] cursor-pointer">
                        {verifying ? 'Verifying OTP...' : 'Verify & Confirm'}
                    </Btn>

                    <Box className="pt-1">
                        <Btn onPress={onResend} disabled={resending} className="text-xs font-bold text-[#581C87] hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                            <I icon={RotateCw} size={12} className={resending ? 'animate-spin' : ''} />
                            <Txt>Resend OTP</Txt>
                        </Btn>
                    </Box>
                </Box>
            </Box>
</Dialog>;
};
export default OTPModal;
