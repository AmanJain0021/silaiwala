import Spin from '../components/ui/Spin';
import { ArrowLeft as FiArrowLeft, Eye as FiEye, EyeOff as FiEyeOff, Lock as FiLock } from 'lucide-react-native';
// Port of modules/delivery/pages/ResetPassword.jsx (converted with scripts/web2rn.js, then reviewed)
import { useState } from "react";
import {  useLocation, useNavigate, useSearchParams } from '../lib/nav';
import toast from '../lib/toast';
import { useDeliveryAuthStore } from "../store/deliveryStore";
import { Box, Txt, Input, Btn, Scroll, I } from '../components/ui/primitives';
const DeliveryResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    resetPassword,
    isLoading
  } = useDeliveryAuthStore();
  const email = location.state?.email || searchParams.get('email') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const handleSubmit = async e => {
    if (!email) {
      toast.error('Session expired. Please start forgot password again.');
      navigate('/delivery/forgot-password', {
        replace: true
      });
      return;
    }
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill both password fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      await resetPassword(email, formData.password, formData.confirmPassword);
      toast.success('Password reset successful. Please login.');
      navigate('/delivery/login', {
        replace: true
      });
    } catch {
      // Global API interceptor shows toast
    }
  };
  return <Box className="w-full max-w-sm mx-auto">
      <Box className="text-left mb-8">
        <Txt className="text-2xl font-black text-[#1A1A1A] tracking-tight">Reset Password</Txt>
        <Txt className="text-gray-500 font-medium mt-1">
          Set new password for <Txt className="font-bold text-[#4CAF50]">{email || 'your account'}</Txt>
        </Txt>
      </Box>

      <Box className="space-y-5">
        <Box className="relative group">
          <I icon={FiLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
          <Input value={formData.password} onChangeText={e => setFormData(prev => ({
          ...prev,
          password: e
        }))} placeholder="New Password" minLength={6} className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 shadow-sm" />
          <Btn onPress={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <I icon={FiEyeOff} size={18} /> : <I icon={FiEye} size={18} />}
          </Btn>
        </Box>

        <Box className="relative group">
          <I icon={FiLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
          <Input value={formData.confirmPassword} onChangeText={e => setFormData(prev => ({
          ...prev,
          confirmPassword: e
        }))} placeholder="Confirm Password" minLength={6} className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 shadow-sm" />
          <Btn onPress={() => setShowConfirmPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showConfirmPassword ? <I icon={FiEyeOff} size={18} /> : <I icon={FiEye} size={18} />}
          </Btn>
        </Box>

        <Btn onPress={handleSubmit} disabled={isLoading} className="w-full py-4 bg-[#4CAF50] hover:bg-[#43A047] text-white font-black rounded-xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2">
          {isLoading ? <Spin size={20} className="text-white/30" /> : 'Reset Password'}
        </Btn>
      </Box>

      <Box className="text-center pt-6">
        <Btn onPress={() => navigate("/delivery/login")} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#4CAF50] font-bold transition-colors">
          <I icon={FiArrowLeft} />
          Back to Login
        </Btn>
      </Box>
    </Box>;
};
export default DeliveryResetPassword;
