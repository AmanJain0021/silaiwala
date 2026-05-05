import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiCheck, FiShield, FiFileText, FiTruck, FiMapPin, FiCamera } from 'react-icons/fi';
import useAuthStore from '../../../store/authStore';

const DeliverySignup = () => {
    const navigate = useNavigate();
    const signup = useAuthStore((state) => state.signup);
    const isLoading = useAuthStore((state) => state.isLoading);

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', 
        email: '', 
        phone: '', 
        password: '',
        emergencyContact: '', 
        aadharNumber: '',
        vehicleType: 'bike', 
        vehicleNumber: '', 
        address: '',
        drivingLicense: null, 
        drivingLicenseBack: null,
        aadharCard: null, 
        aadharCardBack: null,
    });
    const [error, setError] = useState('');
    const fileInputRefs = useRef({});

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (['drivingLicense', 'drivingLicenseBack', 'aadharCard', 'aadharCardBack'].includes(name)) {
            setFormData((prev) => ({ ...prev, [name]: files?.[0] || null }));
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const validateStep = (step) => {
        setError('');
        if (step === 1) {
            if (!formData.name || !formData.email || !formData.phone || !formData.password) {
                setError('All personal details including password are required');
                return false;
            }
            if (formData.phone.length < 10) {
                setError('Enter a valid mobile number');
                return false;
            }
        }
        if (step === 2) {
            if (!formData.drivingLicense || !formData.aadharCard) {
                setError('Primary documents (License & Aadhaar) are required');
                return false;
            }
        }
        if (step === 3) {
             if (!formData.vehicleNumber || !formData.address) {
                setError('Vehicle details and address are required');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) setCurrentStep((s) => Math.min(s + 1, 3));
    };

    const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateStep(3)) return;

        try {
            // Note: The backend register function expects 'phoneNumber' or 'phone'
            await signup({
                ...formData,
                phoneNumber: formData.phone,
                role: 'delivery'
            });
            // If signup is successful, redirect to a "waiting for approval" or dashboard
            // Based on auth controller, new delivery partners are isActive: false
            navigate('/delivery'); 
        } catch (err) {
            setError(err.message || 'Signup failed');
        }
    };

    const DocUpload = ({ name, label }) => (
        <div
            onClick={() => fileInputRefs.current[name]?.click()}
            className={`flex-1 flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                formData[name] 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-[#4CAF50] hover:bg-green-50/30'
            }`}
        >
            <input
                ref={(el) => (fileInputRefs.current[name] = el)}
                type="file" name={name} accept="image/*" onChange={handleChange} className="hidden"
            />
            {formData[name] ? (
                <>
                    <FiCheck size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Uploaded</span>
                </>
            ) : (
                <>
                    <FiCamera size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                </>
            )}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm mx-auto"
        >
            <div className="text-left mb-6">
                <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight">Join the Fleet</h2>
                <p className="text-gray-500 font-medium mt-1">Become a delivery partner today</p>
                
                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mt-4">
                    {[1, 2, 3].map(step => (
                        <div 
                            key={step} 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                currentStep === step ? 'w-8 bg-[#4CAF50]' : currentStep > step ? 'w-4 bg-green-200' : 'w-2 bg-gray-200'
                            }`} 
                        />
                    ))}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div 
                            key="step1" 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 10 }} 
                            className="space-y-3"
                        >
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                <input name="password" type="password" placeholder="Create Password" value={formData.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                <input name="aadharNumber" placeholder="Aadhaar Number" value={formData.aadharNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-sm" />
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div 
                            key="step2" 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 10 }} 
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Driving License</p>
                                <div className="flex gap-3">
                                    <DocUpload name="drivingLicense" label="Front" />
                                    <DocUpload name="drivingLicenseBack" label="Back" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Aadhaar Card</p>
                                <div className="flex gap-3">
                                    <DocUpload name="aadharCard" label="Front" />
                                    <DocUpload name="aadharCardBack" label="Back" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div 
                            key="step3" 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 10 }} 
                            className="space-y-3"
                        >
                            <div className="relative group">
                                <FiTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#4CAF50] outline-none transition-all font-bold text-gray-700 text-sm appearance-none">
                                    <option value="bike">Bike</option>
                                    <option value="scooter">Scooter</option>
                                    <option value="car">Car</option>
                                    <option value="cycle">Cycle</option>
                                </select>
                            </div>
                            <div className="relative group">
                                <FiFileText className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                <input name="vehicleNumber" placeholder="Vehicle No. (e.g., MH 12 AB 1234)" value={formData.vehicleNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-bold text-[#4CAF50] text-sm" />
                            </div>
                            <div className="relative group">
                                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                <input name="address" placeholder="Residential Address" value={formData.address} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium text-sm" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-6 flex gap-3">
                    {currentStep > 1 && (
                        <button 
                            type="button" 
                            onClick={prevStep} 
                            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-sm uppercase tracking-wider"
                        >
                            Back
                        </button>
                    )}
                    {currentStep < 3 ? (
                        <button 
                            type="button" 
                            onClick={nextStep} 
                            className="flex-[2] py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white font-black rounded-xl shadow-lg shadow-green-100 transition-all text-sm uppercase tracking-widest"
                        >
                            Continue
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="flex-[2] py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white font-black rounded-xl shadow-lg shadow-green-100 transition-all text-sm uppercase tracking-widest disabled:opacity-70"
                        >
                            {isLoading ? 'Processing...' : 'Register Now'}
                        </button>
                    )}
                </div>
            </form>
        </motion.div>
    );
};

export default DeliverySignup;
