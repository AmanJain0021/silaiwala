import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../../store/authStore';
import { validatePhone } from '../../../utils/validation';
import api from '../../../utils/api';
import { Lock, KeyRound, Ruler, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MEForgotPassword = () => {
    const navigate = useNavigate();
    const { sendOTP, resetPassword, isLoading } = useAuthStore();
    
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [step, setStep] = useState('request'); // 'request', 'verify', or 'reset'
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setError('');
        
        const phoneErr = validatePhone(mobileNumber);
        if (phoneErr) return setError(phoneErr);
        
        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
            setError('Please enter a valid 10-digit mobile number starting with 6-9');
            return;
        }

        setSendingOtp(true);
        try {
            // Check if user exists before sending OTP
            const checkRes = await api.post('/auth/check-user', { phoneNumber: mobileNumber });
            if (!checkRes.data.exists) {
                setError('No account found with this mobile number.');
                setSendingOtp(false);
                return;
            }
            if (checkRes.data.role !== 'measurement_executive') {
                setError('This number is not registered as an Executive.');
                setSendingOtp(false);
                return;
            }

            await sendOTP(mobileNumber);
            toast.success('OTP sent successfully!');
            setStep('verify');
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (verifyingOtp) return;
        setError('');

        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }

        setVerifyingOtp(true);
        try {
            // Verify OTP using the existing endpoint
            await api.post('/auth/verify-otp', { phoneNumber: mobileNumber, otp });
            toast.success('OTP verified successfully!');
            setStep('reset');
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Invalid OTP';
            setError(msg);
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            await resetPassword(mobileNumber, otp, newPassword);
            toast.success('Password updated successfully!');
            navigate('/executive/login');
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2 sm:px-4"
        >
            <div className="w-full mb-4">
                <button 
                    onClick={() => navigate('/executive/login')} 
                    className="flex items-center text-xs font-bold text-[#843D9B] hover:underline cursor-pointer"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to Executive Login
                </button>
            </div>

            {/* Top Squircle Card */}
            <div className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
                {step === 'reset' ? (
                    <CheckCircle2 className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
                ) : (
                    <Ruler className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
                )}
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6 w-full">
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    {step === 'request' ? 'Executive Password Reset' : step === 'verify' ? 'Verify OTP' : 'Set New Password'}
                </h1>
                <p className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[280px] mx-auto leading-relaxed">
                    {step === 'request' 
                        ? 'Enter your registered mobile number to receive a verification code.' 
                        : step === 'verify' 
                        ? 'Enter the OTP sent to your mobile.'
                        : 'Create a new, strong password for your executive account.'}
                </p>
            </div>

            {error && (
                <div className="w-full mb-4 bg-red-50 text-red-500 text-xs font-medium p-3 rounded-xl border border-red-100 text-center">
                    {error}
                </div>
            )}

            {step === 'request' && (
                <form onSubmit={handleSendOtp} className="w-full space-y-4">
                    {/* Mobile Number Input */}
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                            Mobile Number
                        </label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <div className="bg-white shadow-2xs rounded-xl px-3 py-2 text-xs font-bold text-[#0F172A] mr-2.5 select-none flex items-center justify-center shrink-0 border border-gray-100/80">
                                +91
                            </div>
                            <input
                                type="tel"
                                placeholder="Enter mobile number"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                                maxLength={10}
                                required
                                disabled={sendingOtp}
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!mobileNumber || sendingOtp}
                        className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${
                            !mobileNumber || sendingOtp
                                ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none'
                                : 'bg-[#843D9B] hover:bg-[#713286] text-white shadow-lg shadow-[#843D9B]/20'
                        }`}
                    >
                        {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>
            )}

            {step === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="w-full space-y-4">
                    {/* OTP Input */}
                    <div className="space-y-1.5 text-left">
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-[#0F172A] block">
                                Enter 6-Digit OTP
                            </label>
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={sendingOtp || verifyingOtp}
                                className="text-xs font-semibold text-[#843D9B] hover:underline cursor-pointer disabled:opacity-50"
                            >
                                {sendingOtp ? 'Sending...' : 'Resend OTP'}
                            </button>
                        </div>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <KeyRound size={18} className="text-[#843D9B] shrink-0" />
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                required
                                disabled={verifyingOtp}
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8] tracking-widest font-mono"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!otp || otp.length !== 6 || verifyingOtp}
                        className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${
                            !otp || otp.length !== 6 || verifyingOtp
                                ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none'
                                : 'bg-[#843D9B] hover:bg-[#713286] text-white shadow-lg shadow-[#843D9B]/20'
                        }`}
                    >
                        {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    
                    <div className="text-center mt-3">
                         <button
                            type="button"
                            onClick={() => { setStep('request'); setOtp(''); setError(''); }}
                            className="text-xs font-medium text-gray-500 hover:text-[#843D9B] hover:underline"
                        >
                            Change Mobile Number
                        </button>
                    </div>
                </form>
            )}

            {step === 'reset' && (
                <form onSubmit={handleResetPassword} className="w-full space-y-4">
                    {/* New Password */}
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                            New Password
                        </label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <Lock size={18} className="text-[#94A3B8] shrink-0" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-[#94A3B8] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                            Confirm Password
                        </label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <Lock size={18} className="text-[#94A3B8] shrink-0" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="text-[#94A3B8] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!newPassword || !confirmPassword || isLoading}
                        className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${
                            !newPassword || !confirmPassword || isLoading
                                ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none'
                                : 'bg-[#843D9B] hover:bg-[#713286] text-white shadow-lg shadow-[#843D9B]/20'
                        }`}
                    >
                        {isLoading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>
            )}
        </motion.div>
    );
};

export default MEForgotPassword;
