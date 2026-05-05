import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import useAuthStore from '../../../store/authStore';

const Signup = () => {
    const navigate = useNavigate();
    const signup = useAuthStore((state) => state.signup);
    const sendOTP = useAuthStore((state) => state.sendOTP);
    const isLoading = useAuthStore((state) => state.isLoading);

    const [step, setStep] = useState('info'); // 'info' or 'otp'
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        referralCode: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1].focus();
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await sendOTP(formData.phoneNumber);
            setStep('otp');
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please check your number.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const fullOtp = otp.join('');
        if (fullOtp.length !== 6) {
            setError('Please enter a 6-digit OTP');
            return;
        }
        try {
            await signup({ ...formData, role: 'customer', otp: fullOtp });
            navigate('/');
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
        >
            <div className="text-center mb-4 sm:mb-5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    Almost There!
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mt-1 px-4">
                    Complete your customer profile
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-2.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center gap-2"
                >
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    {error}
                </motion.div>
            )}

            <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={step === 'info' ? handleSendOTP : handleSubmit}
                className="space-y-4"
            >
                <div className="space-y-3">
                    {step === 'info' ? (
                        <>
                            <div className="bg-[#F8FAFC] rounded-2xl p-1 border border-slate-100 shadow-inner">
                                <Input
                                    name="name"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="bg-transparent border-none focus:ring-0 font-bold placeholder:text-gray-500 placeholder:font-medium"
                                />
                            </div>

                            <div className="bg-[#F8FAFC] rounded-2xl p-1 border border-slate-100 shadow-inner">
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="bg-transparent border-none focus:ring-0 font-bold placeholder:text-gray-500 placeholder:font-medium"
                                />
                            </div>

                            <div className="bg-[#F8FAFC] rounded-2xl p-1 border border-slate-100 shadow-inner">
                                <Input
                                    name="phoneNumber"
                                    placeholder="Phone Number"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    required
                                    className="bg-transparent border-none focus:ring-0 font-bold placeholder:text-slate-300 placeholder:font-medium"
                                />
                            </div>

                            <div className="bg-[#F7F8FC] rounded-2xl p-1 border border-pink-50 shadow-inner">
                                <Input
                                    name="referralCode"
                                    placeholder="Referral Code (Optional)"
                                    value={formData.referralCode}
                                    onChange={handleChange}
                                    className="bg-transparent border-none focus:ring-0 font-bold text-[#2D2F6E] placeholder:text-indigo-400 placeholder:font-medium uppercase tracking-wider"
                                />
                            </div>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="text-center py-2">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                    Verification Code Sent to
                                </p>
                                <p className="text-xs font-black text-[#2D2F6E] mt-1">
                                    {formData.phoneNumber}
                                </p>
                            </div>

                            <div className="flex justify-between gap-2 px-1">
                                {otp.map((digit, index) => (
                                    <div key={index} className="flex-1 max-w-[45px] aspect-square bg-[#F8FAFC] rounded-xl border-2 border-slate-100 shadow-inner overflow-hidden focus-within:border-[#2D2F6E] focus-within:ring-2 focus-within:ring-[#2D2F6E]/10 transition-all duration-200">
                                        <input
                                            ref={(el) => (otpRefs.current[index] = el)}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className="w-full h-full text-center text-xl font-black text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0"
                                            inputMode="numeric"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep('info')}
                                    className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#2D2F6E] transition-colors flex items-center justify-center gap-2 mx-auto"
                                >
                                    <span className="text-sm">←</span> Edit information
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full h-11 sm:h-12 rounded-full bg-[#2D2F6E] hover:bg-[#E04D79] text-white font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-lg shadow-[#2D2F6E]/10"
                        disabled={isLoading}
                    >
                        {isLoading ? (step === 'info' ? 'Sending...' : 'Verifying...') : (
                            <span className="flex items-center justify-center gap-2">
                                {step === 'info' ? 'GET STARTED' : 'VERIFY & JOIN'} <span className="text-lg">›</span>
                            </span>
                        )}
                    </Button>
                </div>
            </motion.form>
        </motion.div>
    );
};

export default Signup;
