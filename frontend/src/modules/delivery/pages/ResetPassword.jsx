import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDeliveryAuthStore } from '../store/deliveryStore';

const DeliveryResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { resetPassword, isLoading } = useDeliveryAuthStore();

  const email = location.state?.email || searchParams.get('email') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Session expired. Please start forgot password again.');
      navigate('/delivery/forgot-password', { replace: true });
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
      navigate('/delivery/login', { replace: true });
    } catch {
      // Global API interceptor shows toast
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="text-left mb-8">
        <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Reset Password</h2>
        <p className="text-gray-500 font-medium mt-1">
          Set new password for <span className="font-bold text-[#4CAF50]">{email || 'your account'}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative group">
          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="New Password"
            required
            minLength={6}
            className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 shadow-sm"
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        <div className="relative group">
          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Confirm Password"
            required
            minLength={6}
            className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 shadow-sm"
          />
          <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-[#4CAF50] hover:bg-[#43A047] text-white font-black rounded-xl shadow-lg shadow-green-100 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : 'Reset Password'}
        </button>
      </form>

      <div className="text-center pt-6">
        <Link to="/delivery/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#4CAF50] font-bold transition-colors">
          <FiArrowLeft />
          Back to Login
        </Link>
      </div>
    </motion.div>
  );
};

export default DeliveryResetPassword;
