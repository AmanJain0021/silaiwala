import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiCheck, FiShield, FiFileText, FiTruck, FiMapPin, FiCamera, FiX, FiAlertCircle } from 'react-icons/fi';
import { Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import { validatePassword } from '../../../utils/validation';

const DeliverySignup = () => {
    const navigate = useNavigate();
    const signup = useAuthStore((state) => state.signup);
    const isLoading = useAuthStore((state) => state.isLoading);

    const [currentStep, setCurrentStep] = useState(() => {
        const savedStep = localStorage.getItem('deliverySignupStep');
        return savedStep ? parseInt(savedStep, 10) : 1;
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem('deliverySignupData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                return {
                    ...parsed,
                    drivingLicense: null,
                    drivingLicenseBack: null,
                    aadharCard: null,
                    aadharCardBack: null,
                    profileImage: null,
                };
            } catch (e) {
                console.error("Error parsing saved signup data", e);
            }
        }
        return {
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
        };
    });

    useEffect(() => {
        const dataToSave = { ...formData };
        delete dataToSave.drivingLicense;
        delete dataToSave.drivingLicenseBack;
        delete dataToSave.aadharCard;
        delete dataToSave.aadharCardBack;
        delete dataToSave.profileImage;
        localStorage.setItem('deliverySignupData', JSON.stringify(dataToSave));
    }, [formData]);

    useEffect(() => {
        localStorage.setItem('deliverySignupStep', currentStep.toString());
    }, [currentStep]);

    const [errors, setErrors] = useState({});
    const fileInputRefs = useRef({});
    const lastStepChangeRef = useRef(0);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setErrors((prev) => ({ ...prev, [name]: '' }));
        
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

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.profileImage) newErrors.profileImage = 'Profile photo is required';
            if (!formData.name || formData.name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters long';
            if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email address';
            if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Enter a valid 10-digit mobile number';
            
            const passErr = validatePassword(formData.password);
            if (passErr) newErrors.password = passErr;
            
            if (!formData.aadharNumber || !/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ''))) newErrors.aadharNumber = 'Enter a valid 12-digit Aadhaar Number';
        }
        if (step === 2) {
            if (!formData.drivingLicense) newErrors.drivingLicense = 'Required';
            if (!formData.drivingLicenseBack) newErrors.drivingLicenseBack = 'Required';
            if (!formData.aadharCard) newErrors.aadharCard = 'Required';
            if (!formData.aadharCardBack) newErrors.aadharCardBack = 'Required';
        }
        if (step === 3) {
             if (!formData.vehicleNumber || !/^[A-Za-z]{2}\s?\d{1,2}\s?[A-Za-z]{0,3}\s?\d{1,4}$/.test(formData.vehicleNumber.replace(/-/g, ' '))) {
                newErrors.vehicleNumber = 'Enter a valid vehicle number (e.g. MH 12 AB 1234)';
            }
            if (!formData.address || formData.address.trim().length < 10) {
                newErrors.address = 'Please provide a complete residential address';
            }
        }
        
        setErrors(newErrors);
        
        if (Object.keys(newErrors).length > 0) {
            // Check if errors exist in non-visible fields for step 2 summary
            if (step === 2) {
                const formError = 'Please upload all required documents';
                setErrors(prev => ({ ...prev, formError }));
            }
        }
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setErrors({});
            lastStepChangeRef.current = Date.now();
            setCurrentStep((s) => Math.min(s + 1, 3));
        }
    };

    const prevStep = () => {
        setErrors({});
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
            
            // On successful registration, clear localStorage data
            localStorage.removeItem('deliverySignupData');
            localStorage.removeItem('deliverySignupStep');
            
            // If signup is successful, redirect to a "waiting for approval" or dashboard
            // Based on auth controller, new delivery partners are isActive: false
            navigate('/delivery'); 
        } catch (err) {
            setErrors({ formError: err.message || 'Signup failed' });
            useAuthStore.setState({ isLoading: false });
        }
    };

    const DocUpload = ({ name, label }) => (
        <div
            onClick={() => !formData[name] && fileInputRefs.current[name]?.click()}
            className={`relative flex-1 flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                errors[name] 
                ? 'border-red-400 bg-red-50' 
                : formData[name] 
                ? 'border-purple-200/50' 
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-[#843D9B] hover:bg-pink-50/50'
            }`}
        >
            <input
                ref={(el) => (fileInputRefs.current[name] = el)}
                type="file" name={name} accept="image/*" onChange={handleChange} className="hidden"
            />
            {formData[name] ? (
                <div className="relative w-full h-full">
                    <img src={URL.createObjectURL(formData[name])} alt={label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity">
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRefs.current[name]?.click();
                            }}
                            className="bg-white text-[#843D9B] p-2 rounded-full hover:bg-gray-100 shadow-md active:scale-95 transition-transform"
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
                                setErrors(prev => ({ ...prev, [name]: 'Required' }));
                            }}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md active:scale-95 transition-transform"
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <FiCamera size={24} className={errors[name] ? 'text-red-400' : ''} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${errors[name] ? 'text-red-500' : ''}`}>{label}</span>
                </>
            )}
        </div>
    );

    const ErrorMsg = ({ name }) => (
        errors[name] ? (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 mt-1 ml-1 text-red-500">
                <FiAlertCircle size={10} />
                <span className="text-[10px] font-bold">{errors[name]}</span>
            </motion.div>
        ) : null
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

            {errors.formError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <FiAlertCircle size={16} />
                    <span>{errors.formError}</span>
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
                                    className={`relative w-20 h-20 rounded-full border-2 border-dashed bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm ${
                                        errors.profileImage ? 'border-red-400 bg-red-50' : 'border-[#843D9B]/30 hover:border-[#843D9B] hover:bg-pink-50/50'
                                    }`}
                                    onClick={() => !formData.profileImage && fileInputRefs.current.profileImage?.click()}
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
                                        <>
                                            <img src={URL.createObjectURL(formData.profileImage)} alt="Profile" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRefs.current.profileImage?.click(); }} className="bg-white text-[#843D9B] p-1.5 rounded-full shadow-md active:scale-95"><FiCamera size={12} /></button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, profileImage: null })); if(fileInputRefs.current.profileImage) fileInputRefs.current.profileImage.value = ''; }} className="bg-red-500 text-white p-1.5 rounded-full shadow-md active:scale-95"><FiX size={12} /></button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <FiCamera className={errors.profileImage ? 'text-red-400 mb-1' : 'text-[#843D9B]/60 group-hover:text-[#843D9B] mb-1'} size={20} />
                                            <span className={`text-[9px] font-bold uppercase ${errors.profileImage ? 'text-red-500' : 'text-[#843D9B]/60'}`}>Photo</span>
                                        </div>
                                    )}
                                </div>
                                <ErrorMsg name="profileImage" />
                            </div>
                            
                            <div>
                                <div className={`relative group bg-gray-50 border rounded-xl transition-all ${errors.name ? 'border-red-400' : 'border-gray-100 focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B]'}`}>
                                    <FiUser className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.name ? 'text-red-400' : 'text-[#843D9B]'}`} />
                                    <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-medium text-sm" />
                                </div>
                                <ErrorMsg name="name" />
                            </div>

                            <div>
                                <div className={`relative group bg-gray-50 border rounded-xl transition-all ${errors.email ? 'border-red-400' : 'border-gray-100 focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B]'}`}>
                                    <FiMail className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-[#843D9B]'}`} />
                                    <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-medium text-sm" />
                                </div>
                                <ErrorMsg name="email" />
                            </div>

                            <div>
                                <div className={`relative group bg-gray-50 border rounded-xl transition-all ${errors.phone ? 'border-red-400' : 'border-gray-100 focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B]'}`}>
                                    <FiPhone className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-[#843D9B]'}`} />
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-800 font-bold text-sm">+91</span>
                                    <input name="phone" placeholder="Phone Number" value={formData.phone} maxLength={10} onChange={handleChange} className="w-full pl-16 pr-4 py-3 bg-transparent border-none outline-none font-medium text-sm" />
                                </div>
                                <ErrorMsg name="phone" />
                            </div>

                            <div>
                                <div className={`relative group flex items-center bg-gray-50 border rounded-xl transition-all ${errors.password ? 'border-red-400' : 'border-gray-100 focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B]'}`}>
                                    <FiLock className={`absolute left-4 ${errors.password ? 'text-red-400' : 'text-[#843D9B]'}`} />
                                    <input 
                                        name="password" 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Create Password" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        className="w-full pl-12 pr-10 py-3 bg-transparent border-none outline-none font-medium text-sm" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 text-gray-400 hover:text-[#843D9B] focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <ErrorMsg name="password" />
                            </div>

                            <div>
                                <div className={`relative group bg-gray-50 border rounded-xl transition-all ${errors.aadharNumber ? 'border-red-400' : 'border-gray-100 focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B]'}`}>
                                    <FiShield className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.aadharNumber ? 'text-red-400' : 'text-[#843D9B]'}`} />
                                    <input name="aadharNumber" placeholder="Aadhaar Number (e.g. 1234 5678 9012)" value={formData.aadharNumber} maxLength={14} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-medium text-sm" />
                                </div>
                                <ErrorMsg name="aadharNumber" />
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
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Driving License { (errors.drivingLicense || errors.drivingLicenseBack) && <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full lowercase">required</span> }
                                </p>
                                <div className="flex gap-3">
                                    <DocUpload name="drivingLicense" label="Front" />
                                    <DocUpload name="drivingLicenseBack" label="Back" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    Aadhaar Card { (errors.aadharCard || errors.aadharCardBack) && <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full lowercase">required</span> }
                                </p>
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
                            <div>
                                <div className="relative group bg-gray-50 border border-gray-100 rounded-xl focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B] transition-all">
                                    <FiTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-[#843D9B]" />
                                    <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-bold text-gray-700 text-sm appearance-none">
                                        <option value="bike">Bike</option>
                                        <option value="scooter">Scooter</option>
                                        <option value="car">Car</option>
                                        <option value="cycle">Cycle</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className={`relative group bg-gray-50 border rounded-xl transition-all ${errors.vehicleNumber ? 'border-red-400' : 'border-gray-100 focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B]'}`}>
                                    <FiFileText className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.vehicleNumber ? 'text-red-400' : 'text-[#843D9B]'}`} />
                                    <input name="vehicleNumber" placeholder="Vehicle No. (e.g., MH 12 AB 1234)" value={formData.vehicleNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-bold text-[#843D9B] text-sm" />
                                </div>
                                <ErrorMsg name="vehicleNumber" />
                            </div>

                            <div>
                                <div className={`relative group bg-gray-50 border rounded-xl transition-all ${errors.address ? 'border-red-400' : 'border-gray-100 focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B]'}`}>
                                    <FiMapPin className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.address ? 'text-red-400' : 'text-[#843D9B]'}`} />
                                    <input name="address" placeholder="Residential Address" value={formData.address} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-medium text-sm" />
                                </div>
                                <ErrorMsg name="address" />
                            </div>

                            {/* Optional Fields */}
                            <div>
                                <div className="relative group bg-gray-50 border border-gray-100 rounded-xl focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B] transition-all">
                                    <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input name="accountName" placeholder="Account Holder Name (Optional)" value={formData.accountName} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-medium text-sm" />
                                </div>
                            </div>
                            <div>
                                <div className="relative group bg-gray-50 border border-gray-100 rounded-xl focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B] transition-all">
                                    <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input name="bankName" placeholder="Bank Name (Optional)" value={formData.bankName} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-medium text-sm" />
                                </div>
                            </div>
                            <div>
                                <div className="relative group bg-gray-50 border border-gray-100 rounded-xl focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B] transition-all">
                                    <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input name="accountNumber" placeholder="Bank Account Number (Optional)" value={formData.accountNumber} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-medium text-sm" />
                                </div>
                            </div>
                            <div>
                                <div className="relative group bg-gray-50 border border-gray-100 rounded-xl focus-within:border-[#843D9B] focus-within:ring-1 focus-within:ring-[#843D9B] transition-all">
                                    <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input name="ifscCode" placeholder="IFSC Code (Optional)" value={formData.ifscCode} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none font-medium text-sm uppercase" />
                                </div>
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
                            className="flex-[2] py-3 bg-[#843D9B] hover:bg-[#E04D79] text-white font-black rounded-full shadow-lg shadow-[#843D9B]/30 transition-all text-sm uppercase tracking-widest disabled:opacity-70 flex justify-center items-center"
                        >
                            {isLoading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : 'Register Now'}
                        </button>
                    )}
                </div>
            </form>

            <div className="mt-8 text-[10px] text-gray-400 font-medium text-center pb-4">
                By signing up, you agree to our <button onClick={() => navigate('/delivery/legal/terms-and-conditions')} className="text-[#843D9B] hover:underline mx-1">Terms & Conditions</button> and <button onClick={() => navigate('/delivery/legal/privacy-policy')} className="text-[#843D9B] hover:underline mx-1">Privacy Policy</button>.
            </div>
        </motion.div>
    );
};

export default DeliverySignup;
