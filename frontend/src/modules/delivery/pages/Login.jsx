import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPhone } from 'react-icons/fi';
import useAuthStore from '../../../store/authStore';

const DeliveryLogin = () => {
    const navigate = useNavigate();
    const { sendOTP, otpLogin, isLoading } = useAuthStore();

    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [error, setError] = useState('');

    const handleSendOTP = async () => {
        if (!mobileNumber || mobileNumber.length < 10) {
            setError('Enter a valid 10-digit mobile number');
            return;
        }

        setError('');
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
            setError('Please enter mobile number and OTP');
            return;
        }

        try {
            await otpLogin(mobileNumber, otp);
            navigate('/delivery');
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm mx-auto"
        >
            <div className="text-left mb-8">
                <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Welcome Partner!</h2>
                <p className="text-gray-500 font-medium mt-1">
                    {otpSent ? 'Enter the verification code sent to your mobile' : 'Login to start delivering with SEWZELLA'}
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center flex items-center justify-center gap-2"
                >
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Mobile Number Input */}
                <div className="space-y-1.5">
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-gray-200 pr-3">
                            <FiPhone size={16} className="text-green-500" />
                            <span className="text-gray-500 font-bold text-sm">+91</span>
                        </div>
                        <input
                            type="tel"
                            placeholder="Mobile Number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                            maxLength={10}
                            disabled={otpSent || sendingOtp}
                            className="w-full pl-24 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 shadow-sm disabled:opacity-60"
                        />
                    </div>
                </div>

                {!otpSent && (
                    <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={!mobileNumber || mobileNumber.length < 10 || sendingOtp}
                        className={`w-full py-4 rounded-xl font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                            !mobileNumber || mobileNumber.length < 10 || sendingOtp
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-[#4CAF50] hover:bg-[#43A047] text-white shadow-lg shadow-green-100'
                        }`}
                    >
                        {sendingOtp ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Send OTP'}
                    </button>
                )}

                <AnimatePresence>
                    {otpSent && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-5 overflow-hidden"
                        >
                            {/* OTP Input */}
                            <div className="space-y-1.5">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Enter OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        maxLength={6}
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-medium tracking-[0.5em] text-center shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Verify & Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-[#4CAF50] hover:bg-[#43A047] text-white font-black rounded-xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Verify & Login'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </motion.div>
    );
};

export default DeliveryLogin;
