import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, MapPin, CreditCard, Eye, EyeOff, Ruler } from 'lucide-react';

const Signup = () => {
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem('execSignupData');
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error("Error parsing saved exec data", e);
            }
        }
        return {
            name: '',
            email: '',
            phoneNumber: '',
            password: '',
            address: '',
            aadharNumber: '',
            serviceRadius: 10,
        };
    });

    useEffect(() => {
        localStorage.setItem('execSignupData', JSON.stringify(formData));
    }, [formData]);
    const [showPassword, setShowPassword] = useState(false);
    const { register, loading } = useMeasurementStore();
    const navigate = useNavigate();

    const handleChange = (e) => {
        let { name, value } = e.target;
        
        if (name === 'name') {
            value = value.replace(/[^a-zA-Z\s]/g, '');
        }
        
        if (name === 'phoneNumber') {
            value = value.replace(/\D/g, '');
        }

        if (name === 'aadharNumber') {
            const numericValue = value.replace(/\D/g, '');
            value = numericValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const registerData = {
                ...formData,
                coordinates: [77.2090, 28.6139], // Default coordinates (lng, lat)
                otp: '123456'
            };
            
            await register(registerData);
            
            localStorage.removeItem('execSignupData');
            toast.success('Registration successful! Please wait for admin approval.');
            navigate('/executive/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-1 sm:px-2"
        >
            {/* Top Squircle Card with Icon */}
            <div className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
                <Ruler className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-5 w-full">
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    Create Executive Account
                </h1>
                <p className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[280px] mx-auto leading-relaxed">
                    Register as a certified measurement executive
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-3.5">
                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                    {/* Full Name */}
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1">Full Name *</label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <User size={16} className="text-[#94A3B8] shrink-0" />
                            <input
                                name="name"
                                type="text"
                                placeholder="Enter full name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1">Mobile Number *</label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <div className="bg-white shadow-2xs rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0F172A] mr-2 select-none flex items-center justify-center shrink-0 border border-gray-100/80">
                                +91
                            </div>
                            <input
                                name="phoneNumber"
                                type="tel"
                                placeholder="10-digit number"
                                maxLength={10}
                                required
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                            />
                        </div>
                    </div>

                    {/* Email Address */}
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1">Email Address *</label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <Mail size={16} className="text-[#94A3B8] shrink-0" />
                            <input
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1">Password *</label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <Lock size={16} className="text-[#94A3B8] shrink-0" />
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-[#94A3B8] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1">Full Address *</label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <MapPin size={16} className="text-[#94A3B8] shrink-0" />
                            <input
                                name="address"
                                type="text"
                                placeholder="Complete residential address"
                                required
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                            />
                        </div>
                    </div>

                    {/* Aadhaar Number */}
                    <div className="w-full text-left">
                        <label className="text-xs font-semibold text-[#0F172A] block mb-1">Aadhaar Number *</label>
                        <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                            <CreditCard size={16} className="text-[#94A3B8] shrink-0" />
                            <input
                                name="aadharNumber"
                                type="text"
                                placeholder="12-digit Aadhaar number"
                                maxLength={14}
                                required
                                value={formData.aadharNumber}
                                onChange={handleChange}
                                className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                            />
                        </div>
                    </div>
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-center gap-2 pt-2 text-left select-none">
                    <input
                        id="exec-terms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-4 h-4 rounded-[5px] accent-[#843D9B] text-white cursor-pointer"
                    />
                    <label htmlFor="exec-terms" className="text-xs text-[#64748B] font-medium cursor-pointer">
                        I agree to the{' '}
                        <button type="button" onClick={() => navigate('/executive/legal/terms-and-conditions')} className="text-[#843D9B] font-semibold hover:underline">
                            Terms & Conditions
                        </button>
                        {' '} & {' '}
                        <button type="button" onClick={() => navigate('/executive/legal/privacy-policy')} className="text-[#843D9B] font-semibold hover:underline">
                            Privacy Policy
                        </button>
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !agreedToTerms}
                    className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${
                        loading || !agreedToTerms
                            ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none'
                            : 'bg-[#843D9B] hover:bg-[#713286] text-white shadow-lg shadow-[#843D9B]/20'
                    }`}
                >
                    {loading ? 'Registering...' : 'Create Account'}
                </button>
            </form>

            {/* Footer Navigation */}
            <div className="mt-6 text-center w-full">
                <p className="text-xs font-medium text-[#64748B]">
                    Already have an account?{' '}
                    <Link
                        to="/executive/login"
                        className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </motion.div>
    );
};

export default Signup;
