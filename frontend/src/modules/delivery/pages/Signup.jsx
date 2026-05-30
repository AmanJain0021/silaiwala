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

    const uploadBulkFiles = async (filesArray) => {
        const data = new FormData();
        let hasFiles = false;
        
        filesArray.forEach(item => {
            if (item.file) {
                data.append('images', item.file);
                hasFiles = true;
            }
        });
        
        if (!hasFiles) return [];
        
        try {
            const { default: api } = await import('../../../utils/api');
            const res = await api.post('/upload/public/bulk', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.data || [];
        } catch (error) {
            console.error('Bulk file upload failed:', error);
            throw new Error('Failed to upload documents. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateStep(3)) return;

        try {
            useAuthStore.setState({ isLoading: true });

            const filesToUpload = [
                { name: 'Driving License Front', file: formData.drivingLicense },
                { name: 'Driving License Back', file: formData.drivingLicenseBack },
                { name: 'Aadhar Front', file: formData.aadharCard },
                { name: 'Aadhar Back', file: formData.aadharCardBack }
            ].filter(item => item.file);

            const uploadedUrls = await uploadBulkFiles(filesToUpload);

            const documents = filesToUpload.map((item, index) => ({
                name: item.name,
                url: uploadedUrls[index],
                status: 'pending'
            })).filter(doc => doc.url);

            const payloadData = {
                ...formData,
                phoneNumber: formData.phone,
                role: 'delivery',
                documents
            };
            
            // Clean up file objects from payload
            delete payloadData.drivingLicense;
            delete payloadData.drivingLicenseBack;
            delete payloadData.aadharCard;
            delete payloadData.aadharCardBack;

            // Note: The backend register function expects 'phoneNumber' or 'phone'
            await signup(payloadData);
            // If signup is successful, redirect to a "waiting for approval" or dashboard
            // Based on auth controller, new delivery partners are isActive: false
            navigate('/delivery'); 
        } catch (err) {
            setError(err.message || 'Signup failed');
            useAuthStore.setState({ isLoading: false });
        }
    };

    const DocUpload = ({ name, label }) => (
        <div
            onClick={() => fileInputRefs.current[name]?.click()}
            className={`flex-1 flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                formData[name] 
                ? 'bg-purple-50/50 border-purple-200/50 text-purple-600' 
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-[#2D2F6F] hover:bg-purple-50/50/30'
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
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <div className="text-left mb-4">
                <h2 className="text-lg md:text-xl font-black text-[#1A1A1A] tracking-tight whitespace-nowrap">Join the SewZella</h2>
                <p className="text-gray-500 text-[11px] md:text-xs font-bold mt-0.5 whitespace-nowrap">Become a delivery partner today</p>
                
                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3].map(step => (
                        <div 
                            key={step} 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                currentStep === step ? 'w-8 bg-[#2D2F6F]' : currentStep > step ? 'w-4 bg-green-200' : 'w-2 bg-gray-200'
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

            <form onSubmit={handleSubmit} className="space-y-2.5">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div 
                            key="step1" 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 10 }} 
                            className="space-y-2.5"
                        >
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2F6F]" />
                                <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#2D2F6F] focus:ring-1 focus:ring-[#2D2F6F] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2F6F]" />
                                <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#2D2F6F] focus:ring-1 focus:ring-[#2D2F6F] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2F6F]" />
                                <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#2D2F6F] focus:ring-1 focus:ring-[#2D2F6F] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2F6F]" />
                                <input name="password" type="password" placeholder="Create Password" value={formData.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#2D2F6F] focus:ring-1 focus:ring-[#2D2F6F] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2F6F]" />
                                <input name="aadharNumber" placeholder="Aadhaar Number" value={formData.aadharNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#2D2F6F] focus:ring-1 focus:ring-[#2D2F6F] outline-none transition-all font-medium text-sm" />
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
                            className="space-y-2.5"
                        >
                            <div className="relative group">
                                <FiTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2F6F]" />
                                <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#2D2F6F] outline-none transition-all font-bold text-gray-700 text-sm appearance-none">
                                    <option value="bike">Bike</option>
                                    <option value="scooter">Scooter</option>
                                    <option value="car">Car</option>
                                    <option value="cycle">Cycle</option>
                                </select>
                            </div>
                            <div className="relative group">
                                <FiFileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2F6F]" />
                                <input name="vehicleNumber" placeholder="Vehicle No. (e.g., MH 12 AB 1234)" value={formData.vehicleNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#2D2F6F] focus:ring-1 focus:ring-[#2D2F6F] outline-none transition-all font-bold text-[#2D2F6F] text-sm" />
                            </div>
                            <div className="relative group">
                                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2F6F]" />
                                <input name="address" placeholder="Residential Address" value={formData.address} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#2D2F6F] focus:ring-1 focus:ring-[#2D2F6F] outline-none transition-all font-medium text-sm" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-4 flex gap-3">
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
                            className="flex-[2] py-3 bg-[#2D2F6F] hover:bg-[#1E1F4D] text-white font-black rounded-xl shadow-lg shadow-purple-100/50 transition-all text-sm uppercase tracking-widest"
                        >
                            Continue
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="flex-[2] py-3 bg-[#2D2F6F] hover:bg-[#1E1F4D] text-white font-black rounded-xl shadow-lg shadow-purple-100/50 transition-all text-sm uppercase tracking-widest disabled:opacity-70"
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
