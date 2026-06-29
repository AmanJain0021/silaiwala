import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, MapPin, CreditCard, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        address: '',
        aadharNumber: '',
        serviceRadius: 10,
    });
    const [showPassword, setShowPassword] = useState(false);
    const { register, loading } = useMeasurementStore();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Include dummy coordinates for now, or use Geolocation API
            const registerData = {
                ...formData,
                coordinates: [77.2090, 28.6139], // Default to Delhi (lng, lat)
                otp: '123456' // Bypass OTP for dev
            };
            
            await register(registerData);
            
            toast.success('Registration successful! Please wait for admin approval.');
            navigate('/executive/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full pb-10"
        >
            <div className="mb-8">
                <h2 className="text-2xl font-black text-[#1e293b] mb-1">Join the Team!</h2>
                <p className="text-sm font-medium text-gray-400">
                    Register as a Measurement Executive
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name Field */}
                    <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#843D9B] focus-within:bg-white transition-all duration-300">
                        <User className="w-5 h-5 mr-3 text-gray-400 focus-within:text-[#843D9B] group-focus-within:text-[#843D9B]" />
                        <input id="name" name="name" type="text" placeholder="Full Name" required value={formData.name} onChange={handleChange} className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 outline-none w-full" />
                    </div>

                    {/* Phone Number Field */}
                    <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#843D9B] focus-within:bg-white transition-all duration-300">
                        <Phone className="w-5 h-5 mr-3 text-gray-400 focus-within:text-[#843D9B] group-focus-within:text-[#843D9B]" />
                        <input id="phoneNumber" name="phoneNumber" type="tel" placeholder="Phone Number" required value={formData.phoneNumber} onChange={handleChange} className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 outline-none w-full" />
                    </div>
                </div>

                {/* Email Field */}
                <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#843D9B] focus-within:bg-white transition-all duration-300">
                    <Mail className="w-5 h-5 mr-3 text-gray-400 focus-within:text-[#843D9B] group-focus-within:text-[#843D9B]" />
                    <input id="email" name="email" type="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 outline-none w-full" />
                </div>

                {/* Password Field */}
                <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#843D9B] focus-within:bg-white transition-all duration-300">
                    <Lock className="w-5 h-5 mr-3 text-gray-400 focus-within:text-[#843D9B] group-focus-within:text-[#843D9B]" />
                    <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Password" required value={formData.password} onChange={handleChange} className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 outline-none w-full tracking-[0.2em]" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-[#843D9B]">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>

                {/* Address Field */}
                <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#843D9B] focus-within:bg-white transition-all duration-300">
                    <MapPin className="w-5 h-5 mr-3 text-gray-400 focus-within:text-[#843D9B] group-focus-within:text-[#843D9B]" />
                    <input id="address" name="address" type="text" placeholder="Full Address" required value={formData.address} onChange={handleChange} className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 outline-none w-full" />
                </div>

                {/* Aadhar Number Field */}
                <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#843D9B] focus-within:bg-white transition-all duration-300">
                    <CreditCard className="w-5 h-5 mr-3 text-gray-400 focus-within:text-[#843D9B] group-focus-within:text-[#843D9B]" />
                    <input id="aadharNumber" name="aadharNumber" type="text" placeholder="Aadhar Number" required value={formData.aadharNumber} onChange={handleChange} className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 outline-none w-full" />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full h-14 rounded-full font-black text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                            loading ? 'bg-[#843D9B]/50' : 'bg-[#843D9B] hover:bg-[#E04D79] shadow-lg shadow-[#843D9B]/20'
                        }`}
                    >
                        {loading ? 'Registering...' : (
                            <>
                                Register Account <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400 font-medium">
                        Already have an account?{' '}
                        <Link to="/executive/login" className="font-bold text-[#843D9B] hover:text-[#E04D79] transition-colors">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </form>
        </motion.div>
    );
};

export default Signup;
