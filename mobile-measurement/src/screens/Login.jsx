// Port of modules/measurement-executive/pages/Login.jsx (converted with scripts/web2rn.js, then reviewed)
import storage from '../lib/storage';
import React, { useState, useEffect } from "react";
import {  useNavigate } from '../lib/nav';
import useMeasurementStore from "../store/measurementExecutiveStore";
import toast from '../lib/toast';
import { Mail, Lock, Eye, EyeOff, Ruler } from "lucide-react-native";
import { removeToken, getToken } from "../lib/auth";
import useAuthStore from "../store/authStore";
import { Box, I, Txt, Input, Btn, Scroll } from '../components/ui/primitives';
const MELogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    login,
    loading
  } = useMeasurementStore();
  const navigate = useNavigate();
  useEffect(() => {
    const token = getToken();
    const storedUserStr = storage.getItem('user');
    if (token && storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser.role === 'measurement_executive' && storedUser.isActive === false) {
          navigate('/executive/pending-approval', {
            replace: true
          });
        }
      } catch (e) {}
    }
  }, [navigate]);
  const handleSubmit = async e => {
    try {
      const res = await login({
        email,
        password
      });

      // Check if user is Measurement Executive
      if (res.data?.role !== 'measurement_executive') {
        toast.error('Unauthorized access. Only Measurement Executives can log in here.');
        removeToken();
        storage.removeItem('user');
        useMeasurementStore.setState({
          loading: false
        });
        return;
      }
      useAuthStore.getState().setSession(res.token, res.data);
      if (res.data?.isActive === false) {
        toast('Your account is pending for approval from Admin.', {
          icon: '⏳',
          duration: 5000
        });
        navigate('/executive/pending-approval', {
          replace: true
        });
        return;
      }
      toast.success('Login successful!');
      navigate('/executive/dashboard', {
        replace: true
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };
  return <Box className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2 sm:px-4">
            {/* Top Squircle Card with Icon */}
            <Box className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
                <I icon={Ruler} className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
            </Box>

            {/* Title & Subtitle */}
            <Box className="text-center mb-6 w-full">
                <Txt className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    Executive Sign In
                </Txt>
                <Txt className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[280px] mx-auto leading-relaxed">
                    Welcome back! Sign in to your measurement executive portal
                </Txt>
            </Box>

            <Box className="w-full space-y-4">
                {/* Email or Mobile Number Input Field */}
                <Box className="w-full text-left">
                    <Txt className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                        Email Address or Mobile Number
                    </Txt>
                    <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                        <I icon={Mail} size={18} className="text-[#94A3B8] shrink-0" />
                        <Input placeholder="you@example.com or 10-digit mobile" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={e => setEmail(e)} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" />
                    </Box>
                </Box>

                {/* Password Input Field */}
                <Box className="w-full text-left">
                    <Box className="flex justify-between items-center mb-1.5">
                        <Txt className="text-xs font-semibold text-[#0F172A]">
                            Password
                        </Txt>
                        <Btn onPress={() => navigate('/executive/forgot-password')} className="text-xs text-[#843D9B] font-bold hover:underline cursor-pointer">
                            Forgot password?
                        </Btn>
                    </Box>
                    <Box className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-4 py-3.5 gap-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                        <I icon={Lock} size={18} className="text-[#94A3B8] shrink-0" />
                        <Input placeholder="Enter your password" secureTextEntry={!showPassword} autoCapitalize="none" value={password} onChangeText={e => setPassword(e)} className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" />
                        <Btn onPress={() => setShowPassword(!showPassword)} className="text-[#94A3B8] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer">
                            {showPassword ? <I icon={EyeOff} size={18} /> : <I icon={Eye} size={18} />}
                        </Btn>
                    </Box>
                </Box>

                {/* Submit Button */}
                <Btn onPress={handleSubmit} disabled={loading} className={`w-full py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center mt-2 ${loading ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none' : 'bg-[#843D9B] hover:bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </Btn>
            </Box>

            {/* Footer Navigation */}
            <Box className="mt-6 text-center w-full">
                <Txt className="text-xs font-medium text-[#64748B]">
                    Don't have an account?{' '}
                    <Txt onPress={() => navigate("/executive/signup")} className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer">
                        Sign Up
                    </Txt>
                </Txt>
                <Txt className="mt-4 text-[10px] text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                    By logging in, you agree to our{' '}
                    <Txt onPress={() => navigate("/executive/legal/terms-and-conditions")} className="text-[#843D9B] hover:underline">Terms & Conditions</Txt>{' '}
                    and{' '}
                    <Txt onPress={() => navigate("/executive/legal/privacy-policy")} className="text-[#843D9B] hover:underline">Privacy Policy</Txt>.
                </Txt>
            </Box>
        </Box>;
};
export default MELogin;
