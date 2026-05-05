import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import useAuthStore from '../../../store/authStore';
const Login = () => {
    const navigate = useNavigate();
    const { otpLogin, sendOTP, isLoading } = useAuthStore();

    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);

    const handleSendOtp = async () => {
        setError('');
        if (!mobileNumber || mobileNumber.length < 10) {
            setError('Please enter a valid mobile number');
            return;
        }

        setSendingOtp(true);
        try {
            await sendOTP(mobileNumber);
            setOtpSent(true);
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!mobileNumber || !otp) {
            setError('Please fill in all fields');
            return;
        }

        try {
            const user = await otpLogin(mobileNumber, otp);
            const redirectPath = {
                tailor: '/partner',
                delivery: '/delivery',
                admin: '/admin'
            }[user.role] || '/';
            navigate(redirectPath);
        } catch (err) {
            setError(err.message || 'Invalid OTP');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
        >
            <div className="text-center mb-4 sm:mb-5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Welcome Back!</h2>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mt-1">
                    {otpSent ? 'Enter code sent to mobile' : 'OTP will be sent for verification'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        {error}
                    </motion.div>
                )}

                <div className="space-y-3">
                    <div className="bg-[#F8FAFC] rounded-[1.2rem] sm:rounded-[1.5rem] p-1 border border-slate-50 shadow-inner group transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200">
                        <div className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 gap-2 sm:gap-3">
                            <span className="text-gray-800 font-bold text-sm">+91</span>
                            <div className="w-px h-6 bg-slate-200" />
                            <input
                                type="tel"
                                placeholder="Mobile Number"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                                maxLength={10}
                                required
                                disabled={otpSent || sendingOtp}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-black font-bold placeholder:text-gray-500 placeholder:font-medium tracking-wide outline-none"
                            />
                        </div>
                    </div>

                    {!otpSent && (
                        <Button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={!mobileNumber || mobileNumber.length < 10 || sendingOtp}
                            className={`w-full h-11 sm:h-12 rounded-full font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-md ${!mobileNumber || mobileNumber.length < 10 || sendingOtp
                                    ? 'bg-gray-200 text-gray-500'
                                    : 'bg-[#2D2F6E] hover:bg-[#E04D79] text-white shadow-[#2D2F6E]/20 hover:shadow-lg'
                                }`}
                        >
                            {sendingOtp ? 'Sending...' : (
                                <span className="flex items-center justify-center gap-2">
                                    CONTINUE <span className="text-lg">›</span>
                                </span>
                            )}
                        </Button>
                    )}
                </div>

                <AnimatePresence>
                    {otpSent && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden pt-2"
                        >
                            <div className="bg-[#F8FAFC] rounded-[1.2rem] sm:rounded-[1.5rem] p-1 border border-slate-50 shadow-inner group transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-200">
                                <div className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 gap-2 sm:gap-3">
                                    <input
                                        type="text"
                                        placeholder="Verification Code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        maxLength={6}
                                        required
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-black font-bold placeholder:text-gray-500 placeholder:font-medium tracking-[0.5em] text-center outline-none"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 sm:h-12 rounded-full bg-[#2D2F6E] hover:bg-[#E04D79] text-white font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-lg shadow-[#2D2F6E]/20"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verifying...' : (
                                    <span className="flex items-center justify-center gap-2">
                                        VERIFY & SIGN IN <span className="text-lg">›</span>
                                    </span>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setOtpSent(false)}
                                className="w-full text-[10px] font-black text-indigo-400 hover:text-indigo-500 uppercase tracking-widest transition-colors flex items-center justify-center gap-1 mt-2"
                            >
                                ← Change mobile number
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </motion.div>
    );
};

export default Login;
