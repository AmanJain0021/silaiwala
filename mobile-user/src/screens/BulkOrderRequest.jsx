// Port of modules/customer/pages/BulkOrderRequest.jsx (converted with scripts/web2rn.js, then reviewed)
import { alert } from '../lib/alert';
import { pickDocument } from '../lib/files';
import { DateField } from '../components/ui/DateField';
import Screen from '../components/common/Screen';
import React, { useState } from "react";
import { useNavigate } from '../lib/nav';
import { ArrowLeft, Building2, Users, Scissors, ClipboardList, CheckCircle2, Image as ImageIcon, Calendar, Phone, Mail, Info, Check, Clock } from "lucide-react-native";
import api from "../lib/api";
import useBrandingStore from "../store/brandingStore";
import { I, Box, Input, Txt, Btn, Scroll } from '../components/ui/primitives';
const steps = [{
  id: 1,
  title: 'Inquiry',
  icon: <I icon={Building2} />
}, {
  id: 2,
  title: 'Details',
  icon: <I icon={Scissors} />
}, {
  id: 3,
  title: 'Finished',
  icon: <I icon={CheckCircle2} />
}];
const BulkOrderRequest = () => {
  const appName = useBrandingStore(state => state.appName);
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
    sizeDistribution: {
      S: 10,
      M: 20,
      L: 20,
      XL: 0,
      XXL: 0
    },
    expectedDeliveryDate: '',
    notes: '',
    measurementSheet: null
  });
  const [errors, setErrors] = useState({});
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.organizationName || formData.organizationName.length < 3) newErrors.organizationName = 'Min 3 chars';
    if (!formData.contactPerson || formData.contactPerson.length < 3) {
      newErrors.contactPerson = 'Min 3 chars';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.contactPerson)) {
      newErrors.contactPerson = 'Only alphabets allowed';
    }
    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Enter 10 digits';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.address || formData.address.length < 10) newErrors.address = 'Detailed address req.';
    if (!formData.city || formData.city.length < 2) {
      newErrors.city = 'Enter city';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.city)) {
      newErrors.city = 'Only alphabets allowed';
    }
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
  const handleFileChange = async () => {
    const file = await pickDocument({ type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'image/*'] });
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => p >= 95 ? 95 : p + 5);
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setFormData({
        ...formData,
        measurementSheet: file.name
      });
      setErrors({
        ...errors,
        measurementSheet: null
      });
      setIsUploading(false);
    }, 1500);
  };
  const handleSubmit = async e => {
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
  const renderStep1 = () => <Box className="space-y-3">
            <Box className="relative group">
                <I icon={Building2} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.organizationName ? 'text-error' : 'text-[#843D9B]'}`} size={14} />
                <Input placeholder="Organization / Company Name" className={`w-full pl-10 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.organizationName ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} value={formData.organizationName} onChangeText={e => {
        setFormData({
          ...formData,
          organizationName: e
        });
        if (errors.organizationName) setErrors({
          ...errors,
          organizationName: null
        });
      }} />
                {errors.organizationName && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.organizationName}</Txt>}
            </Box>
            <Box className="relative group">
                <I icon={Users} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.contactPerson ? 'text-error' : 'text-[#843D9B]'}`} size={14} />
                <Input placeholder="Contact Liaison Person" className={`w-full pl-10 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.contactPerson ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} value={formData.contactPerson} onChangeText={e => {
        setFormData({
          ...formData,
          contactPerson: e
        });
        if (errors.contactPerson) setErrors({
          ...errors,
          contactPerson: null
        });
      }} />
                {errors.contactPerson && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.contactPerson}</Txt>}
            </Box>
            <Box className="grid grid-cols-2 gap-3">
                <Box className="relative">
                    <I icon={Phone} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.phoneNumber ? 'text-error' : 'text-[#843D9B]'}`} size={14} />
                    <Input placeholder="Connect Phone" className={`w-full pl-9 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.phoneNumber ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} value={formData.phoneNumber} maxLength={10} onChangeText={e => {
          const val = e.replace(/\D/g, '');
          setFormData({
            ...formData,
            phoneNumber: val
          });
          if (errors.phoneNumber) setErrors({
            ...errors,
            phoneNumber: null
          });
        }} keyboardType="phone-pad" />
                    {errors.phoneNumber && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.phoneNumber}</Txt>}
                </Box>
                <Box className="relative">
                    <I icon={Mail} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-error' : 'text-[#843D9B]'}`} size={14} />
                    <Input placeholder="Auth Email" className={`w-full pl-10 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.email ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} value={formData.email} onChangeText={e => {
          setFormData({
            ...formData,
            email: e
          });
          if (errors.email) setErrors({
            ...errors,
            email: null
          });
        }} keyboardType="email-address" />
                    {errors.email && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.email}</Txt>}
                </Box>
            </Box>
            <Box className="relative group">
                <I icon={ClipboardList} className={`absolute left-3 top-3 transition-colors ${errors.address ? 'text-error' : 'text-[#843D9B]'}`} size={14} />
                <Input rows="2" placeholder="Full Logistics Address" className={`w-full pl-10 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none resize-none transition-all ${errors.address ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} value={formData.address} onChangeText={e => {
        setFormData({
          ...formData,
          address: e
        });
        if (errors.address) setErrors({
          ...errors,
          address: null
        });
      }} multiline />
                {errors.address && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.address}</Txt>}
            </Box>
            <Box className="grid grid-cols-2 gap-3">
                <Box className="flex flex-col">
                    <Input placeholder="Service City" className={`w-full px-4 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.city ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} value={formData.city} onChangeText={e => {
          setFormData({
            ...formData,
            city: e
          });
          if (errors.city) setErrors({
            ...errors,
            city: null
          });
        }} />
                    {errors.city && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.city}</Txt>}
                </Box>
                <Box className="flex flex-col">
                    <Input placeholder="Pincode" className={`w-full px-4 py-2.5 bg-gray-50/50 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.pincode ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} value={formData.pincode} maxLength={6} onChangeText={e => {
          const val = e.replace(/\D/g, '');
          setFormData({
            ...formData,
            pincode: val
          });
          if (errors.pincode) setErrors({
            ...errors,
            pincode: null
          });
        }} />
                    {errors.pincode && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.pincode}</Txt>}
                </Box>
            </Box>
            <Btn onPress={handleNext} className="w-full py-4 bg-[#843D9B] text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100/50 transition-all hover:translate-y-[-2px] active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
                Next: Order Details
                <I icon={Check} size={14} strokeWidth={3} />
            </Btn>
        </Box>;
  const renderStep2 = () => <Box className="space-y-4">
            <Box className="grid grid-cols-4 gap-1.5 px-0.5">
                {['corporate', 'school', 'wholesale', 'other'].map(type => <Btn key={type} onPress={() => setFormData({
        ...formData,
        orderType: type
      })} className={`py-2.5 rounded-xl border text-[8px] font-black uppercase transition-all shadow-sm ${formData.orderType === type ? 'bg-[#843D9B] text-white border-[#843D9B] shadow-indigo-100' : 'bg-white text-gray-400 border-gray-100 h-full flex items-center justify-center'}`}>{type}</Btn>)}
            </Box>

            <Box className="space-y-3">
                <Box className="relative">
                    <I icon={Scissors} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.serviceType ? 'text-error' : 'text-gray-300'}`} size={14} />
                    <Input placeholder="Product Type (e.g. Uniforms, Shirts)" className={`w-full pl-10 py-3 bg-gray-50/30 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.serviceType ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} value={formData.serviceType} onChangeText={e => {
          setFormData({
            ...formData,
            serviceType: e
          });
          if (errors.serviceType) setErrors({
            ...errors,
            serviceType: null
          });
        }} />
                    {errors.serviceType && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.serviceType}</Txt>}
                </Box>

                <Box className="flex gap-3">
                    <Box className="relative flex-1">
                        <I icon={Users} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.estimatedQuantity ? 'text-error' : 'text-gray-300'}`} size={14} />
                        <Input placeholder="Qty" className={`w-full pl-10 py-3 bg-gray-50/30 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.estimatedQuantity ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} value={formData.estimatedQuantity || ''} onChangeText={e => {
            setFormData({
              ...formData,
              estimatedQuantity: parseInt(e) || 0
            });
            if (errors.estimatedQuantity) setErrors({
              ...errors,
              estimatedQuantity: null
            });
          }} keyboardType="numeric" />
                        {errors.estimatedQuantity && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.estimatedQuantity}</Txt>}
                    </Box>
                    <Box className="relative flex-[1.5]">
                        <DateField className={`w-full pl-10 py-3 bg-gray-50/30 border rounded-xl text-[11px] font-black outline-none transition-all ${errors.expectedDeliveryDate ? 'border-red-200 bg-indigo-50/30' : 'border-gray-100'}`} textClassName="text-[11px] font-black text-gray-900" min={new Date(Date.now() + 864e5).toISOString().slice(0, 10)} value={formData.expectedDeliveryDate} onChange={e => {
            setFormData({
              ...formData,
              expectedDeliveryDate: e
            });
            if (errors.expectedDeliveryDate) setErrors({
              ...errors,
              expectedDeliveryDate: null
            });
          }} />
                        <I icon={Calendar} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.expectedDeliveryDate ? 'text-error' : 'text-gray-300'}`} size={14} />
                        {errors.expectedDeliveryDate && <Txt className="text-[8px] text-error font-bold uppercase mt-1 px-1 tracking-widest">{errors.expectedDeliveryDate}</Txt>}
                    </Box>
                </Box>
            </Box>

            <Box className="space-y-2">
                <Box className="flex items-center justify-between px-1">
                    <Txt className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest">Fabric Choice</Txt>
                    <I icon={Info} size={10} className="text-gray-300" />
                </Box>
                <Box className="grid grid-cols-2 gap-3">
                    <Btn onPress={() => setFormData({
          ...formData,
          fabricPreference: 'platform-provided'
        })} className={`p-3 rounded-2xl border text-left transition-all ${formData.fabricPreference === 'platform-provided' ? 'border-[#843D9B] bg-[#843D9B]/5 ring-1 ring-[#843D9B]/20' : 'bg-white border-gray-100'}`}>
                        <Txt className={`text-[10px] font-black uppercase tracking-tight ${formData.fabricPreference === 'platform-provided' ? 'text-[#843D9B]' : 'text-gray-900'}`}>{appName} Premium</Txt>
                        <Txt className="text-[8px] text-gray-400 font-medium leading-tight mt-0.5">We source high quality material</Txt>
                    </Btn>
                    <Btn onPress={() => setFormData({
          ...formData,
          fabricPreference: 'customer-provided'
        })} className={`p-3 rounded-2xl border text-left transition-all ${formData.fabricPreference === 'customer-provided' ? 'border-[#843D9B] bg-[#843D9B]/5 ring-1 ring-[#843D9B]/20' : 'bg-white border-gray-100'}`}>
                        <Txt className={`text-[10px] font-black uppercase tracking-tight ${formData.fabricPreference === 'customer-provided' ? 'text-[#843D9B]' : 'text-gray-900'}`}>Self-Provided</Txt>
                        <Txt className="text-[8px] text-gray-400 font-medium leading-tight mt-0.5">Send your material to us</Txt>
                    </Btn>
                </Box>
            </Box>

            <Box className="space-y-2">
                <Txt className="text-[9px] font-black text-gray-400 uppercase italic tracking-widest px-1">Measurement Strategy</Txt>
                <Box className="grid grid-cols-1 gap-2">
                    {[{
          id: 'standard-sizes',
          label: 'Standard Sizing',
          desc: 'Breakdown of S, M, L, XL'
        }, {
          id: 'custom-sheet',
          label: 'Digital Measurement Sheet',
          desc: 'Upload your Excel/CSV data'
        }, {
          id: 'on-site-service',
          label: 'Professional Tailor Visit',
          desc: 'We take measurements on-site'
        }].map(opt => <Btn key={opt.id} onPress={() => setFormData({
          ...formData,
          measurementMethod: opt.id
        })} className={`px-4 py-3 rounded-2xl border flex items-center justify-between transition-all ${formData.measurementMethod === opt.id ? 'border-[#843D9B] bg-[#843D9B]/5 ring-1 ring-[#843D9B]/20' : 'bg-white border-gray-100'}`}>
                            <Box className="flex items-center gap-4">
                                <Box className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${formData.measurementMethod === opt.id ? 'bg-[#843D9B] border-[#843D9B] text-white' : 'border-gray-200 text-transparent'}`}><I icon={Check} size={10} strokeWidth={4} /></Box>
                                <Box className="text-left">
                                    <Txt className={`text-[10px] font-black uppercase tracking-tight ${formData.measurementMethod === opt.id ? 'text-[#843D9B]' : 'text-gray-800'}`}>{opt.label}</Txt>
                                    <Txt className="text-[8px] text-gray-400 font-medium">{opt.desc}</Txt>
                                </Box>
                            </Box>
                        </Btn>)}
                </Box>
            </Box>

            <React.Fragment>
                {formData.measurementMethod === 'standard-sizes' && <Box key="sizes" className="bg-indigo-50/30 p-4 rounded-[2rem] border border-indigo-100/50">
                        <Txt className="text-[9px] font-black text-[#843D9B] uppercase italic mb-3 text-center tracking-[0.2em]">Breakdown Required</Txt>
                        <Box className="grid grid-cols-5 gap-2">
                            {['S', 'M', 'L', 'XL', 'XXL'].map(size => <Box key={size} className="text-center space-y-1.5">
                                    <Txt className="text-[10px] font-black text-gray-800">{size}</Txt>
                                    <Input className="w-full py-2 bg-white border border-gray-100 rounded-xl text-center text-[11px] font-black outline-none focus:border-[#843D9B] focus:ring-1 focus:ring-indigo-100" value={formData.sizeDistribution[size]} onChangeText={e => {
              const newVal = parseInt(e) || 0;
              const newSizes = {
                ...formData.sizeDistribution,
                [size]: newVal
              };
              const newTotal = Object.values(newSizes).reduce((a, b) => a + b, 0);
              setFormData({
                ...formData,
                sizeDistribution: newSizes,
                estimatedQuantity: newTotal
              });
            }} keyboardType="numeric" />
                                </Box>)}
                        </Box>
                    </Box>}
                {formData.measurementMethod === 'custom-sheet' && <Box key="upload" className={`p-5 rounded-[2rem] border-2 border-dashed text-center space-y-3 relative overflow-hidden transition-all ${errors.measurementSheet ? 'bg-indigo-50 border-red-200' : formData.measurementSheet ? 'bg-green-50 border-green-200' : 'border-gray-200 bg-white'}`}>
                        <Box className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto ${formData.measurementSheet ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-300'}`}>
                            {formData.measurementSheet ? <I icon={Check} size={20} /> : <I icon={ImageIcon} size={20} />}
                        </Box>
                        <Box>
                            <Txt className="text-[11px] font-black uppercase text-gray-900 tracking-tight">{formData.measurementSheet || 'Upload Digital Sheet'}</Txt>
                            <Txt className="text-[8px] text-gray-400 font-medium">CSV, Excel or PDF accepted</Txt>
                        </Box>
                        <Btn onPress={handleFileChange} disabled={isUploading} className="inline-block px-6 py-2 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase cursor-pointer transition-all hover:bg-black active:scale-95">
                            {isUploading ? <Txt className="flex items-center gap-2"><I icon={Clock} size={10} className="animate-spin" /> {uploadProgress}%</Txt> : 'Browse Files'}
                        </Btn>
                        {errors.measurementSheet && <Txt className="text-[8px] text-error font-bold uppercase tracking-widest">{errors.measurementSheet}</Txt>}
                    </Box>}
            </React.Fragment>

            <Box className="flex gap-3 pt-3">
                <Btn onPress={handleBack} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]">Back</Btn>
                <Btn onPress={handleSubmit} disabled={isSubmitting || isUploading} className="flex-[2] py-4 bg-[#843D9B] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all hover:translate-y-[-2px] active:scale-[0.98] disabled:opacity-50">
                    {isSubmitting ? 'Processing...' : 'Submit Final Inquiry'}
                </Btn>
            </Box>
        </Box>;
  const renderStep3 = () => <Box className="text-center py-6">
            <Box className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-100"><I icon={Check} size={24} strokeWidth={4} /></Box>
            <Txt className="text-lg font-black text-gray-900 mb-1">Submitted!</Txt>
            <Txt className="text-[10px] text-gray-500 mb-6 uppercase tracking-widest px-4">Expert review in progress. Quote ready in 24h.</Txt>
            <Box className="space-y-2">
                <Btn onPress={() => navigate('/user/bulk-orders')} className="w-full py-3 bg-gray-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Track Inquiries</Btn>
                <Btn onPress={() => navigate('/user')} className="w-full py-3 bg-white text-gray-400 rounded-xl font-black text-[9px] uppercase border border-gray-100">Home</Btn>
            </Box>
        </Box>;
  return <Screen className="bg-[#f8fafc]"><Box className="flex-1 bg-[#f8fafc]">
            <Box className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-4">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 text-gray-800"><I icon={ArrowLeft} size={20} /></Btn>
                <Box className="flex-1 leading-none"><Txt className="text-base font-black text-gray-900">Bulk Inquiry</Txt><Txt className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Wholesale & School</Txt></Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-8">
            <Box className="max-w-xl mx-auto px-4 mt-4">
                <Box className="flex items-center justify-between mb-6 px-1">
                    {steps.map((step, idx) => <React.Fragment key={step.id}>
                            <Box className="flex flex-col items-center gap-1.5 relative">
                                <Box className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${currentStep >= step.id ? 'bg-[#843D9B] text-white shadow-lg' : 'bg-white text-gray-200 border border-gray-50'}`}>
                                    {React.cloneElement(step.icon, {
                size: 14
              })}
                                </Box>
                                <Txt className={`text-[7px] font-black uppercase absolute -bottom-4 whitespace-nowrap ${currentStep >= step.id ? 'text-[#843D9B]' : 'text-gray-300'}`}>{step.title}</Txt>
                            </Box>
                            {idx < steps.length - 1 && <Box className={`flex-1 h-[1.5px] mx-1 rounded-full ${currentStep > step.id ? 'bg-[#843D9B]' : 'bg-gray-100'}`} />}
                        </React.Fragment>)}
                </Box>
                <Box className="bg-white rounded-[1.5rem] p-4 shadow-xl border border-white mt-8">
                    <React.Fragment>{currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : renderStep3()}</React.Fragment>
                </Box>
            </Box>
            </Scroll>
        </Box></Screen>;
};
export default BulkOrderRequest;
