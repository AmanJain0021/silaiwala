import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiCheck, FiShield, FiFileText, FiTruck, FiMapPin, FiCamera, FiX } from 'react-icons/fi';
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
        profileImage: null,
        accountNumber: '',
        accountName: '',
        bankName: '',
        ifscCode: '',
        partnerRoles: ['delivery'],
    });
    const [error, setError] = useState('');
    const fileInputRefs = useRef({});
    const lastStepChangeRef = useRef(0);

    const handleChange = (e) => {
        setError('');
        const { name, value, files } = e.target;
        if (['drivingLicense', 'drivingLicenseBack', 'aadharCard', 'aadharCardBack', 'profileImage'].includes(name)) {
            setFormData((prev) => ({ ...prev, [name]: files?.[0] || null }));
            return;
        }
        if (name === 'aadharNumber') {
            const numericValue = value.replace(/\D/g, '');
            const formatted = numericValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
            setFormData((prev) => ({ ...prev, [name]: formatted }));
            return;
        }
        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, '');
            setFormData((prev) => ({ ...prev, [name]: numericValue }));
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleRoleToggle = (role) => {
        setFormData(prev => {
            const roles = prev.partnerRoles.includes(role)
                ? prev.partnerRoles.filter(r => r !== role)
                : [...prev.partnerRoles, role];
            if (roles.length === 0) return prev; // prevent unchecking both
            return { ...prev, partnerRoles: roles };
        });
    };

    const validateStep = (step) => {
        setError('');
        if (step === 1) {
            if (!formData.profileImage) {
                setError('Profile photo is required');
                return false;
            }
            if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.aadharNumber) {
                setError('All personal details are required');
                return false;
            }
            if (formData.name.trim().length < 3) {
                setError('Name must be at least 3 characters long');
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                setError('Enter a valid email address');
                return false;
            }
            if (!/^[6-9]\d{9}$/.test(formData.phone)) {
                setError('Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
                return false;
            }
            if (formData.password.length < 6 || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
                setError('Password must be at least 6 characters and contain a special character');
                return false;
            }
            if (!/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ''))) {
                setError('Enter a valid 12-digit Aadhaar Number');
                return false;
            }
        }
        if (step === 2) {
            if (!formData.drivingLicense || !formData.drivingLicenseBack || !formData.aadharCard || !formData.aadharCardBack) {
                setError('All front and back document images are required');
                return false;
            }
        }
        if (step === 3) {
             if (!formData.vehicleNumber || !formData.address) {
                setError('Vehicle details and residential address are required');
                return false;
            }
            if (formData.address.trim().length < 10) {
                setError('Please provide a complete residential address');
                return false;
            }
            if (!/^[A-Za-z]{2}\s?\d{1,2}\s?[A-Za-z]{0,3}\s?\d{1,4}$/.test(formData.vehicleNumber.replace(/-/g, ' '))) {
                setError('Enter a valid vehicle number (e.g. MH 12 AB 1234)');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setError('');
            lastStepChangeRef.current = Date.now();
            setCurrentStep((s) => Math.min(s + 1, 3));
        }
    };

    const prevStep = () => {
        setError('');
        lastStepChangeRef.current = Date.now();
        setCurrentStep((s) => Math.max(s - 1, 1));
    };

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
        
        // Prevent double-click from 'Continue' triggering an immediate submit
        if (Date.now() - lastStepChangeRef.current < 500) return;
        
        setError('');
        // If not on the last step, advance instead of submitting
        if (currentStep < 3) {
            nextStep();
            return;
        }
        if (!validateStep(3)) return;

        try {
            useAuthStore.setState({ isLoading: true });

            const filesToUpload = [
                { name: 'Profile Image', file: formData.profileImage, isProfile: true },
                { name: 'Driving License Front', file: formData.drivingLicense },
                { name: 'Driving License Back', file: formData.drivingLicenseBack },
                { name: 'Aadhar Front', file: formData.aadharCard },
                { name: 'Aadhar Back', file: formData.aadharCardBack }
            ].filter(item => item.file);

            const uploadedUrls = await uploadBulkFiles(filesToUpload);

            const documents = [];
            let profileImageUrl = null;

            filesToUpload.forEach((item, index) => {
                if (item.isProfile) {
                    profileImageUrl = uploadedUrls[index];
                } else if (uploadedUrls[index]) {
                    documents.push({
                        name: item.name,
                        url: uploadedUrls[index],
                        status: 'pending'
                    });
                }
            });

            const payloadData = {
                ...formData,
                phoneNumber: formData.phone,
                role: 'delivery',
                documents,
                ...(profileImageUrl && { profileImage: profileImageUrl })
            };
            
            // Clean up file objects from payload
            delete payloadData.drivingLicense;
            delete payloadData.drivingLicenseBack;
            delete payloadData.aadharCard;
            delete payloadData.aadharCardBack;
            delete payloadData.profileImage;

            if (profileImageUrl) {
                payloadData.profileImage = profileImageUrl;
            }

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
            onClick={() => !formData[name] && fileInputRefs.current[name]?.click()}
            className={`relative flex-1 flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                formData[name] 
                ? 'border-purple-200/50' 
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-[#843D9B] hover:bg-pink-50/50'
            }`}
        >
            <input
                ref={(el) => (fileInputRefs.current[name] = el)}
                type="file" name={name} accept="image/*" onChange={handleChange} className="hidden"
            />
            {formData[name] ? (
                <div className="relative w-full h-full group">
                    <img src={URL.createObjectURL(formData[name])} alt={label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRefs.current[name]?.click();
                            }}
                            className="bg-white text-[#843D9B] p-2 rounded-full hover:bg-gray-100 shadow-md"
                        >
                            <FiCamera size={16} />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({ ...prev, [name]: null }));
                                if (fileInputRefs.current[name]) {
                                    fileInputRefs.current[name].value = '';
                                }
                            }}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md"
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <FiCamera size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-center">{label}</span>
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
                                currentStep === step ? 'w-8 bg-[#843D9B]' : currentStep > step ? 'w-4 bg-green-200' : 'w-2 bg-gray-200'
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

            <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="space-y-2.5">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div 
                            key="step1" 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 10 }} 
                            className="space-y-2.5"
                        >
                            <div className="flex flex-col items-center justify-center mb-4">
                                <div 
                                    className="relative w-20 h-20 rounded-full border-2 border-dashed border-[#843D9B]/30 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#843D9B] hover:bg-pink-50/50 transition-all shadow-sm"
                                    onClick={() => fileInputRefs.current.profileImage?.click()}
                                >
                                    <input 
                                        type="file" 
                                        name="profileImage" 
                                        accept="image/*"
                                        ref={(el) => (fileInputRefs.current.profileImage = el)}
                                        onChange={handleChange}
                                        className="hidden" 
                                    />
                                    {formData.profileImage ? (
                                        <img src={URL.createObjectURL(formData.profileImage)} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <FiCamera className="text-[#843D9B]/60 group-hover:text-[#843D9B] mb-1" size={20} />
                                            <span className="text-[9px] font-bold text-[#843D9B]/60 uppercase">Photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-800 font-bold text-sm">+91</span>
                                <input name="phone" placeholder="Phone Number" value={formData.phone} maxLength={10} onChange={handleChange} className="w-full pl-16 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="password" type="password" placeholder="Create Password" value={formData.password} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="aadharNumber" placeholder="Aadhaar Number (e.g. 1234 5678 9012)" value={formData.aadharNumber} maxLength={14} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="space-y-2 mt-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Your Role(s)</p>
                                <div className="flex gap-3">
                                    <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.partnerRoles.includes('delivery') ? 'border-[#843D9B] bg-fuchsia-50' : 'border-gray-200 bg-gray-50'}`}>
                                        <input type="checkbox" className="hidden" checked={formData.partnerRoles.includes('delivery')} onChange={() => handleRoleToggle('delivery')} />
                                        <span className="text-xs font-bold text-gray-700 text-center">Delivery Partner</span>
                                    </label>
                                    <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.partnerRoles.includes('measurement') ? 'border-[#843D9B] bg-fuchsia-50' : 'border-gray-200 bg-gray-50'}`}>
                                        <input type="checkbox" className="hidden" checked={formData.partnerRoles.includes('measurement')} onChange={() => handleRoleToggle('measurement')} />
                                        <span className="text-xs font-bold text-gray-700 text-center">Measurement</span>
                                    </label>
                                </div>
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
                                <FiTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] outline-none transition-all font-bold text-gray-700 text-sm appearance-none">
                                    <option value="bike">Bike</option>
                                    <option value="scooter">Scooter</option>
                                    <option value="car">Car</option>
                                    <option value="cycle">Cycle</option>
                                </select>
                            </div>
                            <div className="relative group">
                                <FiFileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="vehicleNumber" placeholder="Vehicle No. (e.g., MH 12 AB 1234)" value={formData.vehicleNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-bold text-[#843D9B] text-sm" />
                            </div>
                            <div className="relative group">
                                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="address" placeholder="Residential Address" value={formData.address} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="accountName" placeholder="Account Holder Name (Optional)" value={formData.accountName} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="bankName" placeholder="Bank Name (Optional)" value={formData.bankName} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="accountNumber" placeholder="Bank Account Number (Optional)" value={formData.accountNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm" />
                            </div>
                            <div className="relative group">
                                <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                <input name="ifscCode" placeholder="IFSC Code (Optional)" value={formData.ifscCode} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#843D9B] focus:ring-1 focus:ring-[#843D9B] outline-none transition-all font-medium text-sm uppercase" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-4 flex gap-3">
                    {currentStep > 1 && (
                        <button 
                            type="button" 
                            onClick={prevStep} 
                            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all text-sm uppercase tracking-wider"
                        >
                            Back
                        </button>
                    )}
                    {currentStep < 3 ? (
                        <button 
                            type="button" 
                            onClick={nextStep} 
                            className="flex-[2] py-3 bg-[#843D9B] hover:bg-[#E04D79] text-white font-black rounded-full shadow-lg shadow-[#843D9B]/30 transition-all text-sm uppercase tracking-widest"
                        >
                            Continue
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="flex-[2] py-3 bg-[#843D9B] hover:bg-[#E04D79] text-white font-black rounded-full shadow-lg shadow-[#843D9B]/30 transition-all text-sm uppercase tracking-widest disabled:opacity-70"
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
