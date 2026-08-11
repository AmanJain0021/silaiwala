import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../../store/authStore';
import useBrandingStore from '../../../store/brandingStore';
import { validatePhone } from '../../../utils/validation';
import LocationSplashScreen from '../../../components/Common/LocationSplashScreen';
import api from '../../../utils/api';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeft, Lock, Eye, EyeOff, KeyRound, User, Wifi, Battery, ChevronRight } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rawFrom = location.state?.from;
    const redirectTo = (rawFrom && !rawFrom.includes('/login') && !rawFrom.includes('/register') && !rawFrom.includes('/signup')) ? rawFrom : '/user';
    const { otpLogin, sendOTP, isLoading, logout, isAuthenticated, user } = useAuthStore();
    const { appName, logos } = useBrandingStore();

    useEffect(() => {
        if (isAuthenticated && user?.role === 'customer') {
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, user, navigate, redirectTo]);

    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSendOtp = async () => {
        setError('');
        
        const phoneErr = validatePhone(mobileNumber);
        if (phoneErr) return setError(phoneErr);
        
        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
            setError('Please enter a valid 10-digit mobile number starting with 6-9');
            return;
        }

        setSendingOtp(true);
        try {
            const checkRes = await api.post('/auth/check-user', { phoneNumber: mobileNumber });
            if (!checkRes.data.exists) {
                setError('First you must register, then login');
                setSendingOtp(false);
                return;
            }

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
        if (sendingOtp || isLoading) return;
        setError('');

        if (loginMethod === 'password') {
            if (!mobileNumber || !password) {
                setError('Please fill in all fields');
                return;
            }
            try {
                const user = await useAuthStore.getState().login(mobileNumber, password, 'customer');
                
                if (user?.role !== 'customer') {
                    logout();
                    setError('This login is for customers only.');
                    return;
                }

                setLoggedInUser(user);
                setIsLocating(true);
            } catch (err) {
                setError(err.message || 'Invalid credentials');
            }
            return;
        }

        // OTP Flow
        if (!otpSent) {
            handleSendOtp();
            return;
        }

        if (!mobileNumber || !otp) {
            setError('Please fill in all fields');
            return;
        }

        try {
            const user = await otpLogin(mobileNumber, otp, 'customer');
            
            if (user?.role !== 'customer') {
                logout();
                setError('This login is for customers only.');
                return;
            }

            setLoggedInUser(user);
            setIsLocating(true);
        } catch (err) {
            setError(err.message || 'Invalid OTP');
        }
    };

    const handleLocationComplete = () => {
        setIsLocating(false);
        navigate(redirectTo, { replace: true });
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setError('');
            const user = await useAuthStore.getState().googleLogin(credentialResponse.credential);
            
            if (user?.role !== 'customer') {
                useAuthStore.getState().logout();
                const portalHint = {
                    tailor: 'Partner',
                    delivery: 'Delivery',
                    admin: 'Admin',
                    measurement_executive: 'Executive'
                }[user?.role] || 'appropriate';
                setError(`This login is for customers only. Please use the ${portalHint} portal.`);
                return;
            }

            setLoggedInUser(user);
            setIsLocating(true);
        } catch (err) {
            if (err.message.includes('create an account first')) {
                setError('Account not found. Please create an account first.');
            } else {
                setError(err.message || 'Google Login failed');
            }
        }
    };

    const handleGoogleError = () => {
        setError('Google Login Failed');
    };

    if (isLocating && loggedInUser) {
        return <LocationSplashScreen onComplete={handleLocationComplete} role={loggedInUser.role} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2 sm:px-4"
        >
            {/* Top Squircle Card with Icon matching image */}
            <div className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
                <User className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
            </div>

            {/* Title & Subtitle matching image */}
            <div className="text-center mb-6 w-full">
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    Sign In
                </h1>
                <p className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[250px] mx-auto leading-relaxed">
                    Welcome back! Please sign in to your account
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Mobile Number Input Card matching mockup */}
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
                            disabled={otpSent || sendingOtp}
                            className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                        />
                        {otpSent && (
                            <button
                                type="button"
                                onClick={() => { setOtpSent(false); setOtp(''); }}
                                className="text-xs font-bold text-[#843D9B] hover:underline shrink-0 pr-2"
                            >
                                Change
                            </button>
                        )}
                    </div>
                </div>

                {/* Password Mode Input Card matching mockup */}
                {loginMethod === 'password' && (
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                            Password
                        </label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <Lock size={18} className="text-[#94A3B8] shrink-0" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('otp'); setOtpSent(false); setError(''); }}
                                className="text-xs font-bold text-[#843D9B] hover:underline cursor-pointer"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>
                )}

                {/* OTP Mode Input Card (when OTP sent) */}
                {loginMethod === 'otp' && otpSent && (
                    <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                            Enter 6-Digit OTP
                        </label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <KeyRound size={18} className="text-[#843D9B] shrink-0" />
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                required
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8] tracking-widest font-mono"
                            />
                        </div>
                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={sendingOtp}
                                className="text-xs font-semibold text-[#843D9B] hover:underline cursor-pointer disabled:opacity-50"
                            >
                                {sendingOtp ? 'Sending...' : 'Resend OTP'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Submit Button matching mockup */}
                <button
                    type="submit"
                    disabled={
                        !mobileNumber || 
                        (loginMethod === 'password' && !password) || 
                        (loginMethod === 'otp' && otpSent && !otp) || 
                        isLoading || 
                        sendingOtp
                    }
                    className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${
                        !mobileNumber || 
                        (loginMethod === 'password' && !password) || 
                        (loginMethod === 'otp' && otpSent && !otp) || 
                        isLoading || 
                        sendingOtp
                            ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none'
                            : 'bg-[#843D9B] hover:bg-[#713286] text-white shadow-lg shadow-[#843D9B]/20'
                    }`}
                >
                    {isLoading
                        ? 'Logging in...'
                        : sendingOtp
                        ? 'Sending OTP...'
                        : loginMethod === 'otp' && !otpSent
                        ? 'Send OTP'
                        : loginMethod === 'otp' && otpSent
                        ? 'Verify & Login'
                        : 'Sign In'}
                </button>

                {/* Switch between Password & OTP option */}
                <div className="text-center pt-1">
                    {loginMethod === 'password' ? (
                        <button
                            type="button"
                            onClick={() => { setLoginMethod('otp'); setOtpSent(false); setError(''); }}
                            className="text-xs font-semibold text-[#843D9B] hover:underline cursor-pointer"
                        >
                            Login with OTP instead
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { setLoginMethod('password'); setOtpSent(false); setError(''); }}
                            className="text-xs font-semibold text-[#843D9B] hover:underline cursor-pointer"
                        >
                            Login with Password instead
                        </button>
                    )}
                </div>

                {/* Divider and Google Login matching mockup */}
                {!otpSent && (
                    <div className="space-y-4 pt-1 w-full">
                        <div className="relative flex items-center justify-center my-3 w-full">
                            <div className="w-full border-t border-gray-200/80"></div>
                            <span className="shrink-0 mx-3 text-[#94A3B8] text-xs font-medium bg-white px-2">or continue with</span>
                            <div className="w-full border-t border-gray-200/80"></div>
                        </div>

                        <div className="flex justify-center w-full min-h-[46px]">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                shape="pill"
                                theme="outline"
                                size="large"
                            />
                        </div>
                    </div>
                )}
            </form>

            {/* Footer Sign Up Link matching mockup */}
            <div className="mt-5 text-center w-full">
                <p className="text-xs font-medium text-[#64748B]">
                    Don't have an account?{' '}
                    <button 
                        type="button"
                        onClick={() => navigate('/user/register')}
                        className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer"
                    >
                        Sign Up
                    </button>
                </p>
                <p className="mt-3 text-[10px] text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                    By logging in, you agree to our{' '}
                    <button onClick={() => navigate('/user/legal/terms-and-conditions')} className="text-[#843D9B] hover:underline">Terms & Conditions</button>{' '}
                    and{' '}
                    <button onClick={() => navigate('/user/legal/privacy-policy')} className="text-[#843D9B] hover:underline">Privacy Policy</button>.
                </p>
            </div>
        </motion.div>
    );
};

export default Login;


