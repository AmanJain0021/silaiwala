import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import useAuthStore from '../../../store/authStore';
import { validateEmail, validatePhone, validateName } from '../../../utils/validation';

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
        let value = e.target.value;
        if (e.target.name === 'phoneNumber') {
            value = value.replace(/\D/g, '');
        }
        setFormData({ ...formData, [e.target.name]: value });
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

        // Name Validation
        const nameErr = validateName(formData.name, "Full Name");
        if (nameErr) return setError(nameErr);

        // Email Validation
        const emailErr = validateEmail(formData.email);
        if (emailErr) return setError(emailErr);

        // Phone Validation
        const phoneErr = validatePhone(formData.phoneNumber);
        if (phoneErr) return setError(phoneErr);

        // Extra check for indian numbers starting with 6-9
        if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
            return setError('Please enter a valid 10-digit mobile number starting with 6-9');
        }

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
            navigate('/user');
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
            <div className="text-left mb-3 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#2D2F6E] tracking-tight leading-tight">
                    Welcome to <br className="hidden md:block"/> Sewzella
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1 sm:mt-4 max-w-[250px]">
                    Please sign up to continue
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
                className="space-y-3 sm:space-y-5"
            >
                <div className="space-y-2.5 sm:space-y-4">
                    {step === 'info' ? (
                        <>
                            <div className="bg-[#F8FAFC] rounded-2xl p-1 border border-slate-100 shadow-inner">
                                <Input
                                    name="name"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="bg-transparent border-none focus:ring-0 font-bold placeholder:text-gray-500 placeholder:font-medium py-1.5 sm:py-2"
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
                                    className="bg-transparent border-none focus:ring-0 font-bold placeholder:text-gray-500 placeholder:font-medium py-1.5 sm:py-2"
                                />
                            </div>

                            <div className="bg-[#F8FAFC] rounded-2xl p-1 border border-slate-100 shadow-inner group focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200">
                                <div className="flex items-center px-3 sm:px-4 gap-2 sm:gap-3 h-full">
                                    <span className="text-gray-800 font-bold text-sm">+91</span>
                                    <div className="w-px h-6 bg-slate-200" />
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        placeholder="Phone Number"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        maxLength={10}
                                        required
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 font-bold placeholder:text-slate-300 placeholder:font-medium outline-none py-1.5 sm:py-2"
                                    />
                                </div>
                            </div>

                            <div className="bg-[#F7F8FC] rounded-2xl p-1 border border-pink-50 shadow-inner">
                                <Input
                                    name="referralCode"
                                    placeholder="Referral Code (Optional)"
                                    value={formData.referralCode}
                                    onChange={handleChange}
                                    className="bg-transparent border-none focus:ring-0 font-bold text-[#2D2F6E] placeholder:text-indigo-400 placeholder:font-medium uppercase tracking-wider py-1.5 sm:py-2"
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

                <div className="pt-1 sm:pt-2">
                    <Button
                        type="submit"
                        className="w-full h-10 sm:h-12 rounded-full bg-[#2D2F6E] hover:bg-[#E04D79] text-white font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-lg shadow-[#2D2F6E]/10"
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
            <div className="mt-3 sm:mt-8 text-center sm:text-left">
                <p className="text-xs sm:text-sm font-bold text-slate-400">
                    Already have an account?{' '}
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-[#2D2F6E] font-black hover:underline ml-1"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </motion.div>
    );
};

export default Signup;
