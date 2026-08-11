import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../../store/authStore';
import useBrandingStore from '../../../store/brandingStore';
import { validateEmail, validatePhone, validateName, validatePassword } from '../../../utils/validation';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, Gift, UserPlus, ShieldCheck, ChevronRight } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || '/user';
    const { signup, sendOTP, isLoading, isAuthenticated, user } = useAuthStore();
    const { appName, logos } = useBrandingStore();

    useEffect(() => {
        if (isAuthenticated && user?.role === 'customer') {
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, user, navigate, redirectTo]);

    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [step, setStep] = useState('info'); // 'info' or 'otp'
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem('customerSignupData');
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Error parsing saved signup data", e);
            }
        }
        return {
            name: '',
            email: '',
            phoneNumber: '',
            password: '',
            referralCode: '',
        };
    });

    useEffect(() => {
        localStorage.setItem('customerSignupData', JSON.stringify(formData));
    }, [formData]);

    const [error, setError] = useState('');

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'name') {
            value = value.replace(/[^a-zA-Z\s]/g, '');
        }
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
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        const nameErr = validateName(formData.name, "Full Name");
        if (nameErr) return setError(nameErr);

        const emailErr = validateEmail(formData.email);
        if (emailErr) return setError(emailErr);

        const phoneErr = validatePhone(formData.phoneNumber);
        if (phoneErr) return setError(phoneErr);

        if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
            return setError('Please enter a valid 10-digit mobile number starting with 6-9');
        }

        const passErr = validatePassword(formData.password);
        if (passErr) return setError(passErr);

        if (!agreedToTerms) {
            return setError('Please agree with Terms & Conditions');
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
            await signup({ 
                ...formData, 
                role: 'customer', 
                otp: fullOtp 
            });
            localStorage.removeItem('customerSignupData');
            navigate('/user', { replace: true });
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setError('');
            const user = await useAuthStore.getState().googleLogin(credentialResponse.credential);
            if (user?.role === 'customer') {
                navigate('/user', { replace: true });
            }
        } catch (err) {
            setError(err.message || 'Google Login failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2 sm:px-4"
        >
            {/* Top Navigation Back Arrow */}
            <div className="w-full flex justify-start mb-1">
                <button 
                    type="button" 
                    onClick={() => {
                        if (step === 'otp') {
                            setStep('info');
                        } else {
                            navigate('/user/login');
                        }
                    }} 
                    className="text-[#0F172A] hover:text-[#843D9B] transition-colors p-1 -ml-1 cursor-pointer"
                >
                    <ArrowLeft size={20} strokeWidth={2.2} />
                </button>
            </div>

            {/* Top Icon Badge matching reference image 2 & 3 */}
            <div className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto">
                {step === 'info' ? (
                    <UserPlus className="w-7 h-7 text-[#843D9B]" />
                ) : (
                    <ShieldCheck className="w-7 h-7 text-[#843D9B]" />
                )}
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-5 w-full">
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    {step === 'info' ? 'Create Account' : 'Verify Code'}
                </h1>
                {step === 'info' ? (
                    <p className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[250px] mx-auto leading-relaxed">
                        Create your account to get started with our amazing services
                    </p>
                ) : (
                    <div className="text-center">
                        <p className="text-xs sm:text-[13px] font-medium text-[#64748B] block mb-0.5">
                            Enter the 6-digit code sent to
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-[#843D9B] block">
                            +91 {formData.phoneNumber}
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mb-4 p-3 rounded-2xl bg-red-50 border border-red-100 text-xs font-bold text-red-600 flex items-center gap-2"
                >
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                    {error}
                </motion.div>
            )}

            <form onSubmit={step === 'info' ? handleSendOTP : handleSubmit} className="w-full space-y-3.5">
                {step === 'info' ? (
                    <>
                        {/* Full Name Input Field */}
                        <div className="w-full text-left">
                            <label className="text-xs font-semibold text-[#0F172A] block mb-1">Full Name</label>
                            <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                                <User size={18} className="text-[#94A3B8] shrink-0" />
                                <input
                                    name="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                                />
                            </div>
                        </div>

                        {/* Email Address Input Field */}
                        <div className="w-full text-left">
                            <label className="text-xs font-semibold text-[#0F172A] block mb-1">Email Address</label>
                            <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                                <Mail size={18} className="text-[#94A3B8] shrink-0" />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                                />
                            </div>
                        </div>

                        {/* Mobile Number Input Field */}
                        <div className="w-full text-left">
                            <label className="text-xs font-semibold text-[#0F172A] block mb-1">Mobile Number</label>
                            <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                                <div className="bg-white shadow-2xs rounded-xl px-3 py-2 text-xs font-bold text-[#0F172A] mr-2.5 select-none flex items-center justify-center shrink-0 border border-gray-100/80">
                                    +91
                                </div>
                                <input
                                    name="phoneNumber"
                                    type="tel"
                                    placeholder="9876543210"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    maxLength={10}
                                    required
                                    className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                                />
                            </div>
                        </div>

                        {/* Password Input Field */}
                        <div className="w-full text-left">
                            <label className="text-xs font-semibold text-[#0F172A] block mb-1">Password</label>
                            <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                                <Lock size={18} className="text-[#94A3B8] shrink-0" />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
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

                        {/* Referral Code (Optional) */}
                        <div className="w-full text-left">
                            <label className="text-xs font-semibold text-[#0F172A] block mb-1">Referral Code (Optional)</label>
                            <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                                <Gift size={18} className="text-[#843D9B] shrink-0" />
                                <input
                                    name="referralCode"
                                    placeholder="REF123"
                                    value={formData.referralCode}
                                    onChange={handleChange}
                                    className="w-full text-xs sm:text-sm text-[#843D9B] font-bold tracking-wider uppercase bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                                />
                            </div>
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-center gap-2 pt-1 px-0.5 text-left">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="w-4 h-4 rounded-[5px] accent-[#843D9B] text-white cursor-pointer"
                            />
                            <label htmlFor="terms" className="text-xs text-[#64748B] font-medium cursor-pointer select-none">
                                I agree with{' '}
                                <button 
                                    type="button" 
                                    onClick={() => navigate('/user/legal/terms-and-conditions')} 
                                    className="text-[#843D9B] font-semibold hover:underline"
                                >
                                    Terms
                                </button>
                                {' '} & {' '}
                                <button 
                                    type="button" 
                                    onClick={() => navigate('/user/legal/privacy-policy')} 
                                    className="text-[#843D9B] font-semibold hover:underline"
                                >
                                    Privacy Policy
                                </button>
                            </label>
                        </div>
                    </>
                ) : (
                    /* Verify Code OTP step */
                    <div className="space-y-6 py-2 w-full">
                        <div className="flex justify-between gap-2 px-1 my-4">
                            {otp.map((digit, index) => (
                                <div key={index} className="flex-1 max-w-[45px] aspect-square bg-[#F6F6F8] rounded-2xl border-2 border-gray-200 shadow-2xs text-center text-xl font-bold text-[#0F172A] focus-within:border-[#843D9B] focus-within:ring-2 focus-within:ring-[#843D9B]/15 transition-all overflow-hidden flex items-center justify-center">
                                    <input
                                        ref={(el) => (otpRefs.current[index] = el)}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-full h-full text-center text-xl font-bold text-[#0F172A] bg-transparent border-none outline-none focus:ring-0 p-0"
                                        inputMode="numeric"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="text-center space-y-1">
                            <button
                                type="button"
                                onClick={() => setStep('info')}
                                className="text-xs text-[#843D9B] font-bold hover:underline cursor-pointer"
                            >
                                ← Edit details
                            </button>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || (step === 'info' && !agreedToTerms)}
                    className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${
                        isLoading || (step === 'info' && !agreedToTerms)
                            ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none'
                            : 'bg-[#843D9B] hover:bg-[#713286] text-white shadow-lg shadow-[#843D9B]/20'
                    }`}
                >
                    {isLoading 
                        ? (step === 'info' ? 'Sending...' : 'Verifying...') 
                        : (step === 'info' ? 'Sign Up' : 'Verify & Complete')}
                </button>
            </form>

            {/* Footer - Sign In link */}
            <div className="mt-5 text-center w-full">
                <p className="text-xs font-medium text-[#64748B]">
                    Already have an account?{' '}
                    <button 
                        type="button"
                        onClick={() => navigate('/user/login')}
                        className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </motion.div>
    );
};

export default Signup;
