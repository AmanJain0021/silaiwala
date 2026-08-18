import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTailorAuth } from '../context/AuthContext';
import { Phone, Lock, Eye, EyeOff, Scissors } from 'lucide-react';
import api from '../services/api';
import LocationSplashScreen from '../../../components/Common/LocationSplashScreen';

const TailorLogin = () => {
    const { login, isAuthenticated, user } = useTailorAuth();
    const navigate = useNavigate();
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [loggedInToken, setLoggedInToken] = useState(null);
    const { register, handleSubmit, watch, formState: { errors }, setError: setFormError, clearErrors } = useForm();
    const mobileNumber = watch('mobileNumber');

    useEffect(() => {
        if (isAuthenticated && user?.role === 'tailor' && !isLocating) {
            navigate('/partner', { replace: true });
        }
    }, [isAuthenticated, user, navigate, isLocating]);

    const handleSendOTP = async () => {
        if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
            setFormError('root', { type: 'manual', message: 'Enter a valid 10-digit number starting with 6-9' });
            return;
        }

        clearErrors('root');
        setSendingOtp(true);
        try {
            const checkRes = await api.post('/auth/check-user', { phoneNumber: mobileNumber });
            if (!checkRes.data.exists) {
                setFormError('root', { type: 'manual', message: 'First you registered & then login' });
                return;
            }

            await api.post('/auth/send-otp', { phoneNumber: mobileNumber });
            setOtpSent(true);
        } catch (error) {
            setFormError('root', {
                type: 'manual',
                message: error.response?.data?.message || 'Failed to send OTP'
            });
        } finally {
            setSendingOtp(false);
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        clearErrors('root');

        try {
            const payload = { email: data.mobileNumber, expectedRole: 'tailor' };
            if (loginMethod === 'password') {
                payload.password = data.password;
            } else {
                payload.otp = data.otp;
            }

            const response = await api.post('/auth/login', payload);

            if (response.data.success) {
                const { token, data: userData } = response.data;

                if (userData.role !== 'tailor') {
                    setFormError('root', { type: 'manual', message: 'This portal is only for registered tailors.' });
                    return;
                }

                login(userData, token);
                setLoggedInUser(userData);
                setLoggedInToken(token);
                setIsLocating(true);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setFormError('root', { type: 'manual', message: 'First you registered & then login' });
            } else {
                const message = error.response?.data?.message || "Invalid OTP or server error";
                setFormError('root', { type: 'manual', message });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocationComplete = () => {
        setIsLocating(false);
        navigate('/partner', { replace: true });
    };

    if (isLocating && loggedInUser) {
        return <LocationSplashScreen onComplete={handleLocationComplete} role={loggedInUser.role} token={loggedInToken} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2 sm:px-4"
        >
            {/* Top Squircle Card with Icon */}
            <div className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
                <Scissors className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6 w-full">
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    Partner Sign In
                </h1>
                <p className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[260px] mx-auto leading-relaxed">
                    {loginMethod === 'otp' && otpSent ? 'Enter the OTP sent to your number' : 'Welcome back! Login to your partner account'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
                {errors.root && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full mb-4 p-3 rounded-2xl bg-red-50 border border-red-100 text-xs font-bold text-red-600 flex items-center gap-2"
                    >
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                        {errors.root.message}
                    </motion.div>
                )}

                {/* Mobile Number Input Card */}
                <div className="w-full text-left">
                    <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                        Mobile Number
                    </label>
                    <div className={`w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border transition-all ${
                        errors.mobileNumber ? 'border-red-300 bg-red-50/50' : 'border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white'
                    }`}>
                        <div className="bg-white shadow-2xs rounded-xl px-3 py-2 text-xs font-bold text-[#0F172A] mr-2.5 select-none flex items-center justify-center shrink-0 border border-gray-100/80">
                            +91
                        </div>
                        <input
                            type="tel"
                            placeholder="Enter mobile number"
                            maxLength={10}
                            {...register('mobileNumber', {
                                required: 'Mobile number is required',
                                pattern: {
                                    value: /^[6-9]\d{9}$/,
                                    message: 'Invalid mobile number starting with 6-9'
                                },
                                onChange: (e) => {
                                    e.target.value = e.target.value.replace(/\D/g, '');
                                }
                            })}
                            disabled={otpSent || sendingOtp}
                            className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8] disabled:opacity-60"
                        />
                    </div>
                    {errors.mobileNumber && <p className="text-[11px] text-red-500 font-semibold mt-1 pl-1">{errors.mobileNumber.message}</p>}
                </div>

                {!otpSent && (
                    <div className="space-y-4 w-full">
                        {loginMethod === 'password' && (
                            <div className="w-full text-left">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-xs font-semibold text-[#0F172A]">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/partner/forgot-password')}
                                        className="text-xs text-[#843D9B] font-bold hover:underline cursor-pointer"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className={`w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border transition-all ${
                                    errors.password ? 'border-red-300 bg-red-50/50' : 'border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white'
                                }`}>
                                    <Lock size={18} className="text-[#94A3B8] shrink-0" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        {...register('password', {
                                            required: loginMethod === 'password' ? 'Password is required' : false,
                                        })}
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
                                {errors.password && <p className="text-[11px] text-red-500 font-semibold mt-1 pl-1">{errors.password.message}</p>}
                            </div>
                        )}

                        {/* Terms Checkbox */}
                        <div className="flex items-center gap-2 pt-1 px-0.5 text-left">
                            <input
                                id="partner-terms"
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="w-4 h-4 rounded-[5px] accent-[#843D9B] text-white cursor-pointer"
                            />
                            <label htmlFor="partner-terms" className="text-xs text-[#64748B] font-medium cursor-pointer select-none">
                                I agree with{' '}
                                <button type="button" onClick={() => window.open('/partner/legal/terms-and-conditions', '_blank')} className="text-[#843D9B] font-semibold hover:underline">
                                    Terms & Conditions
                                </button>
                                {' '} & {' '}
                                <button type="button" onClick={() => window.open('/partner/legal/privacy-policy', '_blank')} className="text-[#843D9B] font-semibold hover:underline">
                                    Privacy Policy
                                </button>
                            </label>
                        </div>

                        {loginMethod === 'password' && (
                            <div className="space-y-3 pt-1 w-full">
                                <button
                                    type="submit"
                                    disabled={isLoading || !agreedToTerms}
                                    className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center ${
                                        isLoading || !agreedToTerms
                                            ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none'
                                            : 'bg-[#843D9B] hover:bg-[#713286] text-white shadow-lg shadow-[#843D9B]/20'
                                    }`}
                                >
                                    {isLoading ? 'Logging in...' : 'Sign In'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setLoginMethod('otp'); clearErrors('root'); }}
                                    className="w-full text-xs font-bold text-[#843D9B] hover:underline transition-colors text-center cursor-pointer pt-1 block"
                                >
                                    Login with OTP instead
                                </button>
                            </div>
                        )}

                        {loginMethod === 'otp' && (
                            <div className="space-y-3 pt-1 w-full">
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={!mobileNumber || mobileNumber.length < 10 || sendingOtp || !agreedToTerms}
                                    className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center ${
                                        !mobileNumber || mobileNumber.length < 10 || sendingOtp || !agreedToTerms
                                            ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none'
                                            : 'bg-[#843D9B] hover:bg-[#713286] text-white shadow-lg shadow-[#843D9B]/20'
                                    }`}
                                >
                                    {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setLoginMethod('password'); clearErrors('root'); }}
                                    className="w-full text-xs font-bold text-[#843D9B] hover:underline transition-colors text-center cursor-pointer"
                                >
                                    Login with Password instead
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <AnimatePresence>
                    {loginMethod === 'otp' && otpSent && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 pt-2 w-full text-left"
                        >
                            {/* OTP Field Card */}
                            <div className="w-full text-left">
                                <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                                    OTP Code
                                </label>
                                <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                                    <Lock size={18} className="text-[#843D9B] shrink-0" />
                                    <input
                                        type={showOtp ? "text" : "password"}
                                        placeholder="Enter 6-digit OTP"
                                        maxLength={6}
                                        {...register('otp', {
                                            required: 'OTP is required',
                                        })}
                                        className="w-full text-xs sm:text-sm text-[#0F172A] font-bold tracking-widest bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8] placeholder:tracking-normal"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowOtp(!showOtp)}
                                        className="text-[#94A3B8] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer"
                                    >
                                        {showOtp ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                                <button 
                                    type="button" 
                                    onClick={() => { setLoginMethod('password'); setOtpSent(false); }} 
                                    className="text-[#64748B] hover:text-[#843D9B] font-medium"
                                >
                                    ← Back to Password
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setOtpSent(false)} 
                                    className="text-[#843D9B] font-bold hover:underline"
                                >
                                    Resend OTP?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !agreedToTerms}
                                className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${
                                    isLoading || !agreedToTerms 
                                        ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none' 
                                        : 'bg-[#843D9B] hover:bg-[#713286] text-white shadow-lg shadow-[#843D9B]/20'
                                }`}
                            >
                                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            {/* Footer - Register link matching mockup */}
            <div className="mt-6 text-center w-full">
                <p className="text-xs font-medium text-[#64748B]">
                    New to SewZella Tailor?{' '}
                    <Link 
                        to="/partner/signup"
                        className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer"
                    >
                        Register Now
                    </Link>
                </p>
            </div>
        </motion.div>
    );
};

export default TailorLogin;
