import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Ruler } from 'lucide-react';
import { setToken, removeToken, getToken } from '../../../utils/auth';

const MELogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading } = useMeasurementStore();
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();
        const storedUserStr = localStorage.getItem('user');
        if (token && storedUserStr) {
            try {
                const storedUser = JSON.parse(storedUserStr);
                if (storedUser.role === 'measurement_executive' && storedUser.isActive === false) {
                    navigate('/executive/pending-approval', { replace: true });
                }
            } catch (e) {}
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await login({ email, password });
            
            // Check if user is Measurement Executive
            if (res.data?.role !== 'measurement_executive') {
                toast.error('Unauthorized access. Only Measurement Executives can log in here.');
                removeToken();
                localStorage.removeItem('user');
                useMeasurementStore.setState({ loading: false });
                return;
            }

            setToken(res.token, 'executive');
            localStorage.setItem('executive_user', JSON.stringify(res.data));
            localStorage.setItem('user', JSON.stringify(res.data));

            if (res.data?.isActive === false) {
                toast('Your account is pending for approval from Admin.', { icon: '⏳', duration: 5000 });
                navigate('/executive/pending-approval');
                return;
            }

            toast.success('Login successful!');
            navigate('/executive/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2 sm:px-4"
        >
            {/* Top Squircle Card with Icon */}
            <div className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
                <Ruler className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6 w-full">
                <h1 className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    Executive Sign In
                </h1>
                <p className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[280px] mx-auto leading-relaxed">
                    Welcome back! Sign in to your measurement executive portal
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Email Address Input Field */}
                <div className="w-full text-left">
                    <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                        Email Address
                    </label>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                        <Mail size={18} className="text-[#94A3B8] shrink-0" />
                        <input
                            type="email"
                            placeholder="you@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]"
                        />
                    </div>
                </div>

                {/* Password Input Field */}
                <div className="w-full text-left">
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-semibold text-[#0F172A]">
                            Password
                        </label>
                        <button
                            type="button"
                            onClick={() => navigate('/executive/forgot-password')}
                            className="text-xs text-[#843D9B] font-bold hover:underline cursor-pointer"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                        <Lock size={18} className="text-[#94A3B8] shrink-0" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${
                        loading
                            ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none'
                            : 'bg-[#843D9B] hover:bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'
                    }`}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            {/* Footer Navigation */}
            <div className="mt-6 text-center w-full">
                <p className="text-xs font-medium text-[#64748B]">
                    Don't have an account?{' '}
                    <Link 
                        to="/executive/signup"
                        className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer"
                    >
                        Sign Up
                    </Link>
                </p>
                <p className="mt-4 text-[10px] text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                    By logging in, you agree to our{' '}
                    <Link to="/executive/legal/terms-and-conditions" className="text-[#843D9B] hover:underline">Terms & Conditions</Link>{' '}
                    and{' '}
                    <Link to="/executive/legal/privacy-policy" className="text-[#843D9B] hover:underline">Privacy Policy</Link>.
                </p>
            </div>
        </motion.div>
    );
};

export default MELogin;
