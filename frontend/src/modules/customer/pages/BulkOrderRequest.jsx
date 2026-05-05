import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    Users,
    Scissors,
    ClipboardList,
    CheckCircle2,
    Image as ImageIcon,
    Calendar,
    Phone,
    Mail,
    Info,
    Check,
    Clock
} from 'lucide-react';
import api from '../../../utils/api';

const steps = [
    { id: 1, title: 'Inquiry', icon: <Building2 /> },
    { id: 2, title: 'Details', icon: <Scissors /> },
    { id: 3, title: 'Finished', icon: <CheckCircle2 /> }
];

const BulkOrderRequest = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [formData, setFormData] = useState({
        organizationName: '',
        contactPerson: '',
        phoneNumber: '',
        email: '',
        address: '',
        city: '',
        pincode: '',
        orderType: 'corporate',
        serviceType: '',
        estimatedQuantity: 50,
        fabricPreference: 'platform-provided',
        measurementMethod: 'standard-sizes',
        sizeDistribution: { S: 10, M: 20, L: 20, XL: 0, XXL: 0 },
        expectedDeliveryDate: '',
        notes: '',
        measurementSheet: null
    });

    const [errors, setErrors] = useState({});

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.organizationName || formData.organizationName.length < 3) newErrors.organizationName = 'Min 3 chars';
        if (!formData.contactPerson || formData.contactPerson.length < 3) newErrors.contactPerson = 'Min 3 chars';
        if (!/^[0-9]{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Enter 10 digits';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
        if (!formData.address || formData.address.length < 10) newErrors.address = 'Detailed address req.';
        if (!formData.city || formData.city.length < 2) newErrors.city = 'Enter city';
        if (!/^[0-9]{6}$/.test(formData.pincode)) newErrors.pincode = 'Enter 6 digits';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};
        if (!formData.serviceType || formData.serviceType.length < 2) newErrors.serviceType = 'Specify product';
        if (formData.estimatedQuantity < 10) newErrors.estimatedQuantity = 'Min 10 units';
        if (!formData.expectedDeliveryDate) newErrors.expectedDeliveryDate = 'Select date';

        const today = new Date();
        const deliveryDate = new Date(formData.expectedDeliveryDate);
        if (deliveryDate <= today) newErrors.expectedDeliveryDate = 'Must be future date';

        if (formData.measurementMethod === 'custom-sheet' && !formData.measurementSheet) {
            newErrors.measurementSheet = 'Please upload sheet';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        setErrors({});
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadProgress(0);
        const interval = setInterval(() => {
            setUploadProgress(p => p >= 95 ? 95 : p + 5);
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
            setUploadProgress(100);
            setFormData({ ...formData, measurementSheet: file.name });
            setErrors({ ...errors, measurementSheet: null });
            setIsUploading(false);
        }, 1500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                location: {
                    address: formData.address,
                    city: formData.city,
                    pincode: formData.pincode
                }
            };
            const res = await api.post('/bulk-orders', payload);
            if (res.data.success) setCurrentStep(3);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit inquiry');
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
            <div className="relative group">
                <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.organizationName ? 'text-error' : 'text-[#2D2F6E]'}`} size={14} />
                <input
                    type="text"
                    placeholder="Organization / Company Name"
                    className={`w-full pl-10 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.organizationName ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                    value={formData.organizationName}
                    onChange={e => {
                        setFormData({ ...formData, organizationName: e.target.value });
                        if (errors.organizationName) setErrors({ ...errors, organizationName: null });
                    }}
                />
                {errors.organizationName && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.organizationName}</p>}
            </div>
            <div className="relative group">
                <Users className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.contactPerson ? 'text-error' : 'text-[#2D2F6E]'}`} size={14} />
                <input
                    type="text"
                    placeholder="Contact Liaison Person"
                    className={`w-full pl-10 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.contactPerson ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                    value={formData.contactPerson}
                    onChange={e => {
                        setFormData({ ...formData, contactPerson: e.target.value });
                        if (errors.contactPerson) setErrors({ ...errors, contactPerson: null });
                    }}
                />
                {errors.contactPerson && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.contactPerson}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.phoneNumber ? 'text-error' : 'text-[#2D2F6E]'}`} size={14} />
                    <input
                        type="tel"
                        placeholder="Connect Phone"
                        className={`w-full pl-9 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.phoneNumber ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                        value={formData.phoneNumber}
                        maxLength={10}
                        onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, phoneNumber: val });
                            if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: null });
                        }}
                    />
                    {errors.phoneNumber && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.phoneNumber}</p>}
                </div>
                <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-error' : 'text-[#2D2F6E]'}`} size={14} />
                    <input
                        type="email"
                        placeholder="Auth Email"
                        className={`w-full pl-10 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.email ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                        value={formData.email}
                        onChange={e => {
                            setFormData({ ...formData, email: e.target.value });
                            if (errors.email) setErrors({ ...errors, email: null });
                        }}
                    />
                    {errors.email && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.email}</p>}
                </div>
            </div>
            <div className="relative group">
                <ClipboardList className={`absolute left-3 top-3 transition-colors ${errors.address ? 'text-error' : 'text-[#2D2F6E]'}`} size={14} />
                <textarea
                    rows="2"
                    placeholder="Full Logistics Address"
                    className={`w-full pl-10 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none resize-none transition-all ${errors.address ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                    value={formData.address}
                    onChange={e => {
                        setFormData({ ...formData, address: e.target.value });
                        if (errors.address) setErrors({ ...errors, address: null });
                    }}
                />
                {errors.address && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.address}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                    <input
                        type="text"
                        placeholder="Service City"
                        className={`w-full px-4 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.city ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                        value={formData.city}
                        onChange={e => {
                            setFormData({ ...formData, city: e.target.value });
                            if (errors.city) setErrors({ ...errors, city: null });
                        }}
                    />
                    {errors.city && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.city}</p>}
                </div>
                <div className="flex flex-col">
                    <input
                        type="text"
                        placeholder="Pincode"
                        className={`w-full px-4 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.pincode ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                        value={formData.pincode}
                        maxLength={6}
                        onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, pincode: val });
                            if (errors.pincode) setErrors({ ...errors, pincode: null });
                        }}
                    />
                    {errors.pincode && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.pincode}</p>}
                </div>
            </div>
            <button
                onClick={handleNext}
                className="w-full py-4 bg-[#2D2F6E] text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100/50 transition-all hover:translate-y-[-2px] active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
            >
                Next: Order Details
                <Check size={14} strokeWidth={3} />
            </button>
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="grid grid-cols-4 gap-1.5 px-0.5">
                {['corporate', 'school', 'wholesale', 'other'].map(type => (
                    <button key={type} onClick={() => setFormData({ ...formData, orderType: type })} className={`py-2.5 rounded-xl border text-[8px] font-black uppercase transition-all shadow-sm ${formData.orderType === type ? 'bg-[#2D2F6E] text-white border-[#2D2F6E] shadow-indigo-100' : 'bg-white text-gray-400 border-gray-100 h-full flex items-center justify-center'}`}>{type}</button>
                ))}
            </div>

            <div className="space-y-3">
                <div className="relative">
                    <Scissors className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.serviceType ? 'text-error' : 'text-gray-300'}`} size={14} />
                    <input
                        type="text"
                        placeholder="Product Type (e.g. Uniforms, Shirts)"
                        className={`w-full pl-10 py-3 bg-gray-50/30 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.serviceType ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                        value={formData.serviceType}
                        onChange={e => {
                            setFormData({ ...formData, serviceType: e.target.value });
                            if (errors.serviceType) setErrors({ ...errors, serviceType: null });
                        }}
                    />
                    {errors.serviceType && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.serviceType}</p>}
                </div>

                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Users className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.estimatedQuantity ? 'text-error' : 'text-gray-300'}`} size={14} />
                        <input
                            type="number"
                            placeholder="Qty"
                            className={`w-full pl-10 py-3 bg-gray-50/30 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.estimatedQuantity ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                            value={formData.estimatedQuantity || ''}
                            onChange={e => {
                                setFormData({ ...formData, estimatedQuantity: parseInt(e.target.value) || 0 });
                                if (errors.estimatedQuantity) setErrors({ ...errors, estimatedQuantity: null });
                            }}
                        />
                        {errors.estimatedQuantity && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.estimatedQuantity}</p>}
                    </div>
                    <div className="relative flex-[1.5]">
                        <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.expectedDeliveryDate ? 'text-error' : 'text-gray-300'}`} size={14} />
                        <input
                            type="date"
                            className={`w-full pl-10 py-3 bg-gray-50/30 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.expectedDeliveryDate ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`}
                            value={formData.expectedDeliveryDate}
                            onChange={e => {
                                setFormData({ ...formData, expectedDeliveryDate: e.target.value });
                                if (errors.expectedDeliveryDate) setErrors({ ...errors, expectedDeliveryDate: null });
                            }}
                        />
                        {errors.expectedDeliveryDate && <p className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.expectedDeliveryDate}</p>}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest">Fabric Choice</p>
                    <Info size={10} className="text-gray-300" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setFormData({ ...formData, fabricPreference: 'platform-provided' })} className={`p-3 rounded-2xl border text-left transition-all ${formData.fabricPreference === 'platform-provided' ? 'border-[#2D2F6E] bg-[#2D2F6E]/5 ring-1 ring-[#2D2F6E]/20' : 'bg-white border-gray-100'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-tight ${formData.fabricPreference === 'platform-provided' ? 'text-[#2D2F6E]' : 'text-gray-900'}`}>Silaiwala Premium</p>
                        <p className="text-[8px] text-gray-400 font-medium leading-tight mt-0.5">We source high quality material</p>
                    </button>
                    <button onClick={() => setFormData({ ...formData, fabricPreference: 'customer-provided' })} className={`p-3 rounded-2xl border text-left transition-all ${formData.fabricPreference === 'customer-provided' ? 'border-[#2D2F6E] bg-[#2D2F6E]/5 ring-1 ring-[#2D2F6E]/20' : 'bg-white border-gray-100'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-tight ${formData.fabricPreference === 'customer-provided' ? 'text-[#2D2F6E]' : 'text-gray-900'}`}>Self-Provided</p>
                        <p className="text-[8px] text-gray-400 font-medium leading-tight mt-0.5">Send your material to us</p>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest px-1">Measurement Strategy</p>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { id: 'standard-sizes', label: 'Standard Sizing', desc: 'Breakdown of S, M, L, XL' },
                        { id: 'custom-sheet', label: 'Digital Measurement Sheet', desc: 'Upload your Excel/CSV data' },
                        { id: 'on-site-service', label: 'Professional Tailor Visit', desc: 'We take measurements on-site' }
                    ].map(opt => (
                        <button key={opt.id} onClick={() => setFormData({ ...formData, measurementMethod: opt.id })} className={`px-4 py-3 rounded-2xl border flex items-center justify-between transition-all ${formData.measurementMethod === opt.id ? 'border-[#2D2F6E] bg-[#2D2F6E]/5 ring-1 ring-[#2D2F6E]/20' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.measurementMethod === opt.id ? 'bg-[#2D2F6E] border-[#2D2F6E] text-white' : 'border-gray-200 text-transparent'}`}><Check size={10} strokeWidth={4} /></div>
                                <div className="text-left">
                                    <p className={`text-[10px] font-black uppercase tracking-tight ${formData.measurementMethod === opt.id ? 'text-[#2D2F6E]' : 'text-gray-800'}`}>{opt.label}</p>
                                    <p className="text-[8px] text-gray-400 font-medium">{opt.desc}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {formData.measurementMethod === 'standard-sizes' && (
                    <motion.div
                        key="sizes"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-indigo-50/30 p-4 rounded-[2rem] border border-indigo-100/50"
                    >
                        <p className="text-[9px] font-black text-[#2D2F6E] uppercase italic mb-3 text-center tracking-[0.2em]">Breakdown Required</p>
                        <div className="grid grid-cols-5 gap-2">
                            {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                <div key={size} className="text-center space-y-1.5">
                                    <p className="text-[10px] font-black text-gray-800">{size}</p>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full py-2 bg-white border border-gray-100 rounded-xl text-center text-[11px] font-black outline-none focus:border-[#2D2F6E] focus:ring-1 focus:ring-indigo-100"
                                        value={formData.sizeDistribution[size]}
                                        onChange={(e) => {
                                            const newVal = parseInt(e.target.value) || 0;
                                            const newSizes = { ...formData.sizeDistribution, [size]: newVal };
                                            const newTotal = Object.values(newSizes).reduce((a, b) => a + b, 0);
                                            setFormData({
                                                ...formData,
                                                sizeDistribution: newSizes,
                                                estimatedQuantity: newTotal
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
                {formData.measurementMethod === 'custom-sheet' && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-5 rounded-[2rem] border-2 border-dashed text-center space-y-3 relative overflow-hidden transition-all ${errors.measurementSheet ? 'bg-indigo-50 border-red-200' : formData.measurementSheet ? 'bg-green-50 border-green-200' : 'border-gray-200 bg-white'}`}
                    >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto ${formData.measurementSheet ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-300'}`}>
                            {formData.measurementSheet ? <Check size={20} /> : <ImageIcon size={20} />}
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase text-gray-900 tracking-tight">{formData.measurementSheet || 'Upload Digital Sheet'}</p>
                            <p className="text-[8px] text-gray-400 font-medium">CSV, Excel or PDF accepted</p>
                        </div>
                        <label className="inline-block px-6 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all hover:bg-black active:scale-95">
                            {isUploading ? <span className="flex items-center gap-2"><Clock size={10} className="animate-spin" /> {uploadProgress}%</span> : 'Browse Files'}
                            <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                        </label>
                        {errors.measurementSheet && <p className="text-[8px] text-error font-bold uppercase tracking-widest">{errors.measurementSheet}</p>}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex gap-3 pt-3">
                <button onClick={handleBack} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]">Back</button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isUploading}
                    className="flex-[2] py-4 bg-[#2D2F6E] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all hover:translate-y-[-2px] active:scale-[0.98] disabled:opacity-50"
                >
                    {isSubmitting ? 'Processing...' : 'Submit Final Inquiry'}
                </button>
            </div>
        </motion.div>
    );

    const renderStep3 = () => (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-100"><Check size={24} strokeWidth={4} /></div>
            <h2 className="text-lg font-black text-gray-900 mb-1">Submitted!</h2>
            <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest px-4">Expert review in progress. Quote ready in 24h.</p>
            <div className="space-y-2">
                <button onClick={() => navigate('/bulk-orders')} className="w-full py-3 bg-gray-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Track Inquiries</button>
                <button onClick={() => navigate('/')} className="w-full py-3 bg-white text-gray-400 rounded-xl font-black text-[9px] uppercase border border-gray-100">Home</button>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-8">
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-800"><ArrowLeft size={20} /></button>
                <div className="flex-1 leading-none"><h1 className="text-base font-black text-gray-900">Bulk Inquiry</h1><p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Wholesale & School</p></div>
            </div>
            <div className="max-w-xl mx-auto px-4 mt-4">
                <div className="flex items-center justify-between mb-6 px-1">
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center gap-1.5 relative">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${currentStep >= step.id ? 'bg-[#2D2F6E] text-white shadow-lg' : 'bg-white text-gray-200 border border-gray-50'}`}>
                                    {React.cloneElement(step.icon, { size: 14 })}
                                </div>
                                <span className={`text-[7px] font-black uppercase absolute -bottom-4 whitespace-nowrap ${currentStep >= step.id ? 'text-[#2D2F6E]' : 'text-gray-300'}`}>{step.title}</span>
                            </div>
                            {idx < steps.length - 1 && <div className={`flex-1 h-[1.5px] mx-1 rounded-full ${currentStep > step.id ? 'bg-[#2D2F6E]' : 'bg-gray-100'}`} />}
                        </React.Fragment>
                    ))}
                </div>
                <div className="bg-white rounded-[1.5rem] p-4 shadow-xl border border-white mt-8">
                    <AnimatePresence mode="wait">{currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : renderStep3()}</AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default BulkOrderRequest;
