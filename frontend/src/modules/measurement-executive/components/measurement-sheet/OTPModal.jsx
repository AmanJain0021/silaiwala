import React, { useState } from 'react';
import { X, KeyRound, CheckCircle2, RotateCw } from 'lucide-react';

const OTPModal = ({ isOpen, onClose, onVerify, onResend, verifying = false, resending = false }) => {
    const [otp, setOtp] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!otp.trim()) return;
        onVerify(otp.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 text-center">
                <div className="flex justify-end mb-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F3E8FF] text-[#581C87] flex items-center justify-center mb-3.5 shadow-sm">
                    <KeyRound size={26} strokeWidth={2.2} />
                </div>

                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Customer Confirmation</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Enter the 6-digit OTP sent to the customer's phone or app to sign-off on measurements.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div className="bg-[#FAF7FC] border-2 border-purple-200/80 rounded-2xl p-2.5 focus-within:border-[#581C87] focus-within:ring-4 focus-within:ring-purple-100 transition-all">
                        <input
                            type="text"
                            maxLength={6}
                            required
                            placeholder="• • • • • •"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-transparent border-0 text-center font-black text-2xl tracking-[0.4em] text-gray-900 focus:outline-none focus:ring-0"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={verifying || otp.length < 4}
                        className="w-full py-3.5 px-4 bg-[#581C87] hover:bg-[#4A154B] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-900/25 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98] cursor-pointer"
                    >
                        {verifying ? 'Verifying OTP...' : 'Verify & Confirm'}
                    </button>

                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={onResend}
                            disabled={resending}
                            className="text-xs font-bold text-[#581C87] hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <RotateCw size={12} className={resending ? 'animate-spin' : ''} />
                            <span>Resend OTP</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OTPModal;
