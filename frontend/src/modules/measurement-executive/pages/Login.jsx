import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useMeasurementStore from '../store/measurementExecutiveStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading } = useMeasurementStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await login({ email, password });
            
            // Check if user is Measurement Executive
            if (res.data?.role !== 'measurement_executive') {
                toast.error('Unauthorized access. Only Measurement Executives can log in here.');
                useMeasurementStore.setState({ loading: false });
                return;
            }

            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.data));
            toast.success('Login successful!');
            navigate('/executive/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            <div className="mb-8">
                <h2 className="text-2xl font-black text-[#1e293b] mb-1">Welcome Executive!</h2>
                <p className="text-sm font-medium text-gray-400">
                    Login to continue
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    {/* Email Field */}
                    <div className="group">
                        <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#843D9B] focus-within:bg-white transition-all duration-300">
                            <Mail className="w-5 h-5 mr-3 text-gray-400 focus-within:text-[#843D9B] group-focus-within:text-[#843D9B]" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 outline-none w-full"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="group">
                        <div className="flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-[#F8F9FD] border-2 border-transparent focus-within:border-[#843D9B] focus-within:bg-white transition-all duration-300">
                            <Lock className="w-5 h-5 mr-3 text-gray-400 focus-within:text-[#843D9B] group-focus-within:text-[#843D9B]" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 font-medium text-sm placeholder:text-gray-400 outline-none w-full tracking-[0.2em]"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-[#843D9B]"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full h-14 rounded-full font-black text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                        loading ? 'bg-[#843D9B]/50' : 'bg-[#843D9B] hover:bg-[#E04D79] shadow-lg shadow-[#843D9B]/20'
                    }`}
                >
                    {loading ? 'Signing in...' : (
                        <>
                            Sign In <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400 font-medium">
                        Don't have an account?{' '}
                        <Link to="/executive/signup" className="font-bold text-[#843D9B] hover:text-[#E04D79] transition-colors">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </form>
        </motion.div>
    );
};

export default Login;
