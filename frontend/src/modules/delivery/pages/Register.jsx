import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone, FiTruck, FiCamera, 
  FiChevronRight, FiChevronLeft, FiCheck, FiFileText, FiShield, FiCreditCard, FiTrash2 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDeliveryAuthStore } from '../store/deliveryStore';
import api from '../../../shared/utils/api';
import DeliveryLegalModal from '../components/DeliveryLegalModal';
import useBrandingStore from '../../../store/brandingStore';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: FiUser },
  { id: 2, title: 'Documents', icon: FiFileText },
  { id: 3, title: 'Vehicle & Bank', icon: FiTruck },
];

const DRAFT_KEY = 'delivery_signup_draft_v2';

const dataURLtoFile = (dataurl, filename) => {
  if (!dataurl || typeof dataurl !== 'string' || !dataurl.startsWith('data:')) return null;
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    console.error('Error converting base64 to file:', e);
    return null;
  }
};

const DeliveryRegister = () => {
  const navigate = useNavigate();
  const [legalModal, setLegalModal] = useState({ isOpen: false, type: 'terms' });
  const { register, sendRegistrationOtp, verifyRegistrationOtp, isLoading } = useDeliveryAuthStore();
  const { appName, logos } = useBrandingStore();
  const fileInputRefs = useRef({});

  // Restore draft state from localStorage on page refresh
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentStep: parsed.currentStep || 1,
          formData: parsed.formData || {},
          previews: parsed.previews || {},
          isPhoneVerified: parsed.isPhoneVerified || false
        };
      }
    } catch (e) {
      console.error("Error reading draft:", e);
    }
    return {
      currentStep: 1,
      formData: {},
      previews: {},
      isPhoneVerified: false
    };
  };

  const initialState = getInitialState();
  const [currentStep, setCurrentStep] = useState(initialState.currentStep);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    emergencyContact: '',
    aadharNumber: '',
    email: '',
    password: '',
    address: '',
    vehicleType: 'Bike (Motorcycle)',
    vehicleNumber: '',
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    ...initialState.formData
  });
  const [previews, setPreviews] = useState(initialState.previews || {});
  const [isPhoneVerified, setIsPhoneVerified] = useState(initialState.isPhoneVerified || false);

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [phoneOtp, setPhoneOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Save draft to localStorage to survive refreshes and network loss
  useEffect(() => {
    try {
      const draftPayload = {
        currentStep,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          emergencyContact: formData.emergencyContact,
          aadharNumber: formData.aadharNumber,
          address: formData.address,
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          bankName: formData.bankName,
          ifscCode: formData.ifscCode,
        },
        previews,
        isPhoneVerified
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload));
    } catch (e) {
      console.warn("Draft save failed:", e);
    }
  }, [formData, previews, currentStep, isPhoneVerified]);

  const checkUserExistsInBackend = async (emailVal, phoneVal) => {
    try {
      const payload = {};
      if (emailVal && emailVal.trim()) payload.email = emailVal.trim();
      if (phoneVal && phoneVal.trim()) payload.phoneNumber = phoneVal.trim();
      
      if (!payload.email && !payload.phoneNumber) return false;

      const res = await api.post('/auth/check-user', payload);
      if (res.data && res.data.exists) {
        const conflictField = res.data.field === 'email' ? 'email' : 'phone';
        const msg = res.data.message || (conflictField === 'email' ? 'A user with this email address already exists' : 'A user with this mobile number already exists');
        setFieldErrors(prev => ({
          ...prev,
          [conflictField]: msg
        }));
        toast.error(msg);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Check user API error:', err);
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));

    // File inputs with DataURL preview for network-loss persistence
    if (['drivingLicense', 'drivingLicenseBack', 'aadharCard', 'aadharCardBack', 'profileImage'].includes(name)) {
      const file = files?.[0] || null;
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Url = reader.result;
          setPreviews((prev) => ({ ...prev, [name]: base64Url }));
          setFormData((prev) => ({ ...prev, [name]: file }));
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    // 1. Full Name & Account Holder Name: ONLY letters and spaces
    if (name === 'name' || name === 'accountName') {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData((prev) => ({ ...prev, [name]: lettersOnly }));
      return;
    }

    // 2. Bank Account Number: ONLY numbers (digits)
    if (name === 'accountNumber') {
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }

    // 3. Aadhaar, Phone, Emergency Contact
    if (['aadharNumber', 'phone', 'emergencyContact'].includes(name)) {
      const numericValue = value.replace(/\D/g, '');
      if (name === 'aadharNumber') {
        const formatted = numericValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        setFormData((prev) => ({ ...prev, [name]: formatted }));
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      if (name === 'phone') {
        setIsPhoneVerified(false);
        setShowOtpField(false);
      }
      return;
    }

    // 4. IFSC Code: Uppercase Alphanumeric max 11 chars
    if (name === 'ifscCode') {
      const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    // 5. Vehicle Number: Uppercase Alphanumeric & spaces
    if (name === 'vehicleNumber') {
      const formatted = value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '');
      setFormData((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    setFieldErrors((prev) => ({ ...prev, phone: '', email: '' }));

    if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone)) {
      const msg = 'Enter a valid 10-digit mobile number starting with 6-9';
      setFieldErrors((prev) => ({ ...prev, phone: msg }));
      toast.error(msg);
      return;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      const msg = 'Enter a valid email address first';
      setFieldErrors((prev) => ({ ...prev, email: msg }));
      toast.error(msg);
      return;
    }

    setIsSendingOtp(true);
    try {
      const userExists = await checkUserExistsInBackend(formData.email, formData.phone);
      if (userExists) {
        setIsSendingOtp(false);
        return;
      }

      await sendRegistrationOtp(formData.phone, formData.email);
      setShowOtpField(true);
      toast.success('OTP sent successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await verifyRegistrationOtp(formData.phone, phoneOtp);
      setIsPhoneVerified(true);
      setShowOtpField(false);
      toast.success('Mobile number verified!');
    } catch (error) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const validateStep = (step) => {
    const errs = {};
    let isValid = true;

    switch (step) {
      case 1:
        if (!previews.profileImage && !formData.profileImage) {
          toast.error('Profile photo is required');
          isValid = false;
        }
        if (!formData.name.trim() || formData.name.trim().length < 3 || !/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
          errs.name = 'Full name must contain only letters (min 3 chars)';
          toast.error(errs.name);
          isValid = false;
        }
        if (!formData.email.trim()) {
          errs.email = 'Email address is required';
          toast.error(errs.email);
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
          errs.email = 'Enter a valid email address';
          toast.error(errs.email);
          isValid = false;
        }
        if (!formData.phone.trim()) {
          errs.phone = 'Mobile number is required';
          toast.error(errs.phone);
          isValid = false;
        } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
          errs.phone = 'Enter a valid 10-digit mobile number starting with 6-9';
          toast.error(errs.phone);
          isValid = false;
        } else if (!isPhoneVerified) {
          errs.phone = 'Please verify your mobile number with OTP first';
          toast.error(errs.phone);
          isValid = false;
        }
        if (!formData.emergencyContact || !/^[6-9]\d{9}$/.test(formData.emergencyContact)) {
          errs.emergencyContact = 'Enter a valid 10-digit emergency contact number';
          toast.error(errs.emergencyContact);
          isValid = false;
        } else if (formData.emergencyContact === formData.phone) {
          errs.emergencyContact = 'Emergency contact cannot be the same as your mobile number';
          toast.error(errs.emergencyContact);
          isValid = false;
        }
        if (!formData.aadharNumber.trim() || formData.aadharNumber.replace(/\s/g, '').length !== 12) {
          errs.aadharNumber = 'Aadhaar number must be exactly 12 digits';
          toast.error(errs.aadharNumber);
          isValid = false;
        }
        if (!formData.password || formData.password.length < 6) {
          errs.password = 'Password must be at least 6 characters long';
          toast.error(errs.password);
          isValid = false;
        }
        setFieldErrors((prev) => ({ ...prev, ...errs }));
        return isValid;

      case 2:
        if (!previews.aadharCard && !formData.aadharCard) { toast.error('Aadhaar Card (Front) photo is required'); return false; }
        if (!previews.aadharCardBack && !formData.aadharCardBack) { toast.error('Aadhaar Card (Back) photo is required'); return false; }
        
        // Driving License is required only if vehicle is NOT bicycle
        if (formData.vehicleType !== 'cycle') {
          if (!previews.drivingLicense && !formData.drivingLicense) { toast.error('Driving License (Front) photo is required for motorized vehicles'); return false; }
          if (!previews.drivingLicenseBack && !formData.drivingLicenseBack) { toast.error('Driving License (Back) photo is required for motorized vehicles'); return false; }
        }
        return true;

      case 3:
        if (formData.vehicleType !== 'cycle') {
          if (!formData.vehicleNumber.trim()) {
            errs.vehicleNumber = 'Vehicle registration number is required';
            toast.error(errs.vehicleNumber);
            isValid = false;
          } else if (!/^[A-Z]{2}\s?[0-9]{1,2}\s?[A-Z]{0,3}\s?[0-9]{4}$/.test(formData.vehicleNumber.replace(/-/g, ' ').trim())) {
            errs.vehicleNumber = 'Enter a valid vehicle number (e.g. MH 12 AB 1234)';
            toast.error(errs.vehicleNumber);
            isValid = false;
          }
        }
        if (!formData.address.trim() || formData.address.trim().length < 10) {
          errs.address = 'Please provide a complete residential address (min 10 chars)';
          toast.error(errs.address);
          isValid = false;
        }
        // Bank Details Validation
        if (!formData.accountName || formData.accountName.trim().length < 3 || !/^[a-zA-Z\s]+$/.test(formData.accountName.trim())) {
          errs.accountName = 'Account holder name must contain only letters (min 3 chars)';
          toast.error(errs.accountName);
          isValid = false;
        }
        if (!formData.accountNumber || !/^\d{9,18}$/.test(formData.accountNumber)) {
          errs.accountNumber = 'Bank account number must be between 9 and 18 digits';
          toast.error(errs.accountNumber);
          isValid = false;
        }
        if (!formData.bankName || formData.bankName.trim().length < 2) {
          errs.bankName = 'Bank name is required';
          toast.error(errs.bankName);
          isValid = false;
        }
        if (!formData.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.trim())) {
          errs.ifscCode = 'Enter a valid 11-character IFSC code (e.g. SBIN0001234)';
          toast.error(errs.ifscCode);
          isValid = false;
        }
        setFieldErrors((prev) => ({ ...prev, ...errs }));
        return isValid;

      default:
        return true;
    }
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 1) {
      const userExists = await checkUserExistsInBackend(formData.email, formData.phone);
      if (userExists) return;
    }

    setCurrentStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const uploadBulkFiles = async (filesArray) => {
    const data = new FormData();
    let hasFiles = false;
    
    for (const item of filesArray) {
      if (item.file instanceof File) {
        data.append('images', item.file);
        hasFiles = true;
      }
    }
    
    if (!hasFiles) return [];
    
    try {
      data.append('folder', 'delivery_registration');
      const res = await api.post('/upload/public/bulk', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return res.data?.data || [];
    } catch (error) {
      console.warn('Image upload failed during registration:', error);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 3) return;
    if (!validateStep(3)) return;
    try {
      const getFileObj = (key, filename) => {
        if (formData[key] instanceof File) return formData[key];
        if (previews[key] && typeof previews[key] === 'string') {
          return dataURLtoFile(previews[key], filename);
        }
        return null;
      };

      const filesToUpload = [
        { name: 'Profile Image', file: getFileObj('profileImage', 'profile.jpg'), isProfile: true },
        { name: 'Driving License Front', file: getFileObj('licenseFront', 'dl_front.jpg') || getFileObj('drivingLicense', 'dl_front.jpg') },
        { name: 'Driving License Back', file: getFileObj('licenseBack', 'dl_back.jpg') || getFileObj('drivingLicenseBack', 'dl_back.jpg') },
        { name: 'Aadhar Front', file: getFileObj('aadharFront', 'aadhar_front.jpg') || getFileObj('aadharCard', 'aadhar_front.jpg') },
        { name: 'Aadhar Back', file: getFileObj('aadharBack', 'aadhar_back.jpg') || getFileObj('aadharCardBack', 'aadhar_back.jpg') }
      ].filter(item => item.file instanceof File);

      let uploadedUrls = [];
      if (filesToUpload.length > 0) {
        uploadedUrls = await uploadBulkFiles(filesToUpload);
      }

      let profileImageUrl = null;
      const documents = [];
      filesToUpload.forEach((item, index) => {
        if (item.isProfile && uploadedUrls[index]) {
          profileImageUrl = uploadedUrls[index];
        } else if (uploadedUrls[index]) {
          documents.push({
            name: item.name,
            url: uploadedUrls[index],
            status: 'pending'
          });
        }
      });

      const payload = {
        name: (formData.name || '').trim(),
        email: (formData.email || '').trim().toLowerCase(),
        phone: (formData.phone || '').trim(),
        phoneNumber: (formData.phone || '').trim(),
        password: formData.password || '',
        otp: phoneOtp || '123456',
        role: 'delivery',
        emergencyContact: (formData.emergencyContact || '').trim(),
        aadharNumber: (formData.aadharNumber || '').replace(/\s/g, ''),
        address: (formData.address || '').trim(),
        vehicleType: (formData.vehicleType || 'bike').toLowerCase(),
        vehicleNumber: formData.vehicleType === 'cycle' ? 'BICYCLE' : (formData.vehicleNumber || '').trim(),
        accountName: (formData.accountHolderName || formData.accountName || '').trim(),
        accountNumber: (formData.accountNumber || '').trim(),
        bankName: (formData.bankName || '').trim(),
        ifscCode: (formData.ifscCode || '').trim().toUpperCase(),
        documents,
      };

      if (profileImageUrl && typeof profileImageUrl === 'string') {
        payload.profileImage = profileImageUrl;
      }

      const result = await register(payload);
      localStorage.removeItem(DRAFT_KEY); // Clear draft after successful submission
      toast.success(result.message || 'Registration submitted successfully!');
      navigate('/delivery/login', { replace: true });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMsg);

      const lowerMsg = errorMsg.toLowerCase();
      if (lowerMsg.includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: errorMsg }));
        setCurrentStep(1);
      } else if (lowerMsg.includes('phone') || lowerMsg.includes('mobile')) {
        setFieldErrors((prev) => ({ ...prev, phone: errorMsg }));
        setCurrentStep(1);
      } else if (lowerMsg.includes('aadhaar') || lowerMsg.includes('aadhar')) {
        setFieldErrors((prev) => ({ ...prev, aadharNumber: errorMsg }));
        setCurrentStep(1);
      } else if (lowerMsg.includes('vehicle')) {
        setFieldErrors((prev) => ({ ...prev, vehicleNumber: errorMsg }));
        setCurrentStep(3);
      } else if (lowerMsg.includes('address')) {
        setFieldErrors((prev) => ({ ...prev, address: errorMsg }));
        setCurrentStep(3);
      }
    }
  };

  const DocUploadCard = ({ name, label }) => (
    <div
      onClick={() => fileInputRefs.current[name]?.click()}
      className="relative cursor-pointer group"
    >
      <input
        ref={(el) => (fileInputRefs.current[name] = el)}
        type="file"
        name={name}
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      {previews[name] ? (
        <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-sm">
          <img src={previews[name]} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <FiCamera className="text-white" size={24} />
          </div>
          <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <FiCheck className="text-white" size={14} />
          </div>
        </div>
      ) : (
        <div className="w-full h-36 sm:h-40 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 group-hover:border-indigo-300 group-hover:bg-indigo-50/50 transition-all">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <FiCamera className="text-gray-400 group-hover:text-indigo-500" size={20} />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tap to Upload</span>
        </div>
      )}
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider text-center mt-2">{label}</p>
    </div>
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      e.preventDefault();
      if (currentStep < 3) {
        nextStep();
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-1 sm:px-2"
      >
        {/* Top Squircle Card with Icon */}
        <div className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
          <FiTruck className="w-6 h-6 text-[#843D9B]" />
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-5 w-full">
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
            Create Delivery Account
          </h1>
          <p className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[280px] mx-auto leading-relaxed">
            Register as a delivery partner with SewZella
          </p>
        </div>

        {/* Mobile Responsive Step Progress Bar */}
        <div className="w-full bg-[#F6F6F8] rounded-[18px] p-3 px-4 mb-5 flex items-center justify-between border border-gray-100">
          <div className="flex items-center gap-2 overflow-hidden">
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={prevStep} 
                className="p-1 -ml-1 text-[#64748B] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer"
              >
                <FiChevronLeft size={20} />
              </button>
            )}
            <span className="text-xs font-bold text-[#0F172A] truncate">
              {STEPS[currentStep - 1].title}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#843D9B] bg-[#F4EFFF] border border-[#E9DFFE] px-2.5 py-1 rounded-full shrink-0">
            Step {currentStep} of 3
          </span>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="w-full space-y-4">
          <AnimatePresence mode="wait">
            {/* STEP 1: Personal Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 w-full"
              >
                {/* Profile Photo Uploader */}
                <div className="flex flex-col items-center justify-center my-2">
                  <div 
                    className="relative w-20 h-20 rounded-full border-2 border-dashed border-[#843D9B]/40 bg-[#F4EFFF]/40 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#843D9B] transition-all shadow-2xs"
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
                    {previews.profileImage ? (
                      <img src={previews.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <FiCamera className="text-[#843D9B] mb-0.5" size={20} />
                        <span className="text-[9px] font-bold text-[#843D9B]">Upload</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-1.5">Profile Photo *</p>
                </div>

                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1 text-left">Full Name *</label>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                      <FiUser className="text-[#94A3B8] shrink-0" size={16} />
                      <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        placeholder="Enter full name" 
                        required 
                        className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                      />
                    </div>
                    {fieldErrors.name && <p className="text-[11px] text-red-500 font-semibold mt-1 text-left">{fieldErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1 text-left">Email Address *</label>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                      <FiMail className="text-[#94A3B8] shrink-0" size={16} />
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        onBlur={() => {
                          if (formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
                            checkUserExistsInBackend(formData.email, null);
                          }
                        }}
                        placeholder="you@email.com" 
                        required 
                        className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                      />
                    </div>
                    {fieldErrors.email && <p className="text-[11px] text-red-500 font-semibold mt-1 text-left">{fieldErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1 text-left">Mobile Number *</label>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                      <div className="bg-white shadow-2xs rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0F172A] mr-2 select-none flex items-center justify-center shrink-0 border border-gray-100/80">
                        +91
                      </div>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        onBlur={() => {
                          if (formData.phone && formData.phone.length === 10) {
                            checkUserExistsInBackend(null, formData.phone);
                          }
                        }}
                        placeholder="Mobile number" 
                        required 
                        maxLength={10} 
                        disabled={isPhoneVerified}
                        className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8] disabled:opacity-60" 
                      />
                      {isPhoneVerified ? (
                        <span className="text-emerald-600 font-bold text-xs shrink-0 pr-2">Verified ✓</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || !formData.phone || formData.phone.length !== 10}
                          className="text-xs font-bold text-[#843D9B] hover:underline shrink-0 pr-1 cursor-pointer disabled:opacity-40"
                        >
                          {isSendingOtp ? 'Sending...' : 'Verify'}
                        </button>
                      )}
                    </div>
                    {fieldErrors.phone && <p className="text-[11px] text-red-500 font-semibold mt-1 text-left">{fieldErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1 text-left">Emergency Contact *</label>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center p-1.5 px-2 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                      <div className="bg-white shadow-2xs rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0F172A] mr-2 select-none flex items-center justify-center shrink-0 border border-gray-100/80">
                        +91
                      </div>
                      <input 
                        type="tel" 
                        name="emergencyContact" 
                        value={formData.emergencyContact} 
                        onChange={handleChange} 
                        placeholder="Emergency number" 
                        required 
                        maxLength={10} 
                        className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                      />
                    </div>
                    {fieldErrors.emergencyContact && <p className="text-[11px] text-red-500 font-semibold mt-1 text-left">{fieldErrors.emergencyContact}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1 text-left">Aadhaar Number *</label>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                      <FiFileText className="text-[#94A3B8] shrink-0" size={16} />
                      <input 
                        type="text" 
                        name="aadharNumber" 
                        value={formData.aadharNumber} 
                        onChange={handleChange} 
                        placeholder="12-digit Aadhaar" 
                        maxLength={14} 
                        required 
                        className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                      />
                    </div>
                    {fieldErrors.aadharNumber && <p className="text-[11px] text-red-500 font-semibold mt-1 text-left">{fieldErrors.aadharNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1 text-left">Password *</label>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 gap-2.5 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                      <FiLock className="text-[#94A3B8] shrink-0" size={16} />
                      <input 
                        type={showPassword ? "text" : "password"}
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        placeholder="Create password" 
                        required 
                        className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#94A3B8] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer"
                      >
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-[11px] text-red-500 font-semibold mt-1 text-left">{fieldErrors.password}</p>}
                  </div>
                </div>

                {/* OTP Verification Box */}
                {showOtpField && !isPhoneVerified && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, y: -5 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    className="bg-[#F4EFFF] p-4 rounded-[18px] border border-[#E9DFFE] space-y-2 text-left"
                  >
                    <label className="block text-xs font-bold text-[#843D9B]">Enter 6-Digit OTP</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        placeholder="••••••"
                        maxLength={6}
                        className="flex-1 px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-center font-bold tracking-widest text-sm text-[#0F172A] focus:outline-none focus:border-[#843D9B]"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || !phoneOtp || phoneOtp.length !== 6}
                        className="px-5 py-2.5 bg-[#843D9B] text-white rounded-xl text-xs font-bold hover:bg-[#713286] disabled:opacity-40 transition-all shrink-0 cursor-pointer"
                      >
                        {isVerifyingOtp ? 'Verifying...' : 'Submit OTP'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Documents */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 w-full text-left"
              >
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-2">Driving License (Required) *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <DocUploadCard name="licenseFront" label="License Front" />
                    <DocUploadCard name="licenseBack" label="License Back" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-2">Aadhaar Card (Required) *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <DocUploadCard name="aadharFront" label="Aadhaar Front" />
                    <DocUploadCard name="aadharBack" label="Aadhaar Back" />
                  </div>
                </div>

                <div className="bg-[#FFF9E6] border border-[#FFEBAA] rounded-[16px] p-3 text-xs text-[#926000]">
                  <span className="font-bold">NOTE:</span> Upload clear photos. Blurry images will be rejected during verification.
                </div>
              </motion.div>
            )}

            {/* STEP 3: Vehicle & Bank */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 w-full text-left"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Vehicle Type *</label>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        required
                        className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0"
                      >
                        <option value="Bike (Motorcycle)">Bike (Motorcycle)</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Electric Scooter">Electric Scooter</option>
                        <option value="Bicycle">Bicycle</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Vehicle Registration Number *</label>
                    <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                      <input 
                        type="text" 
                        name="vehicleNumber" 
                        value={formData.vehicleNumber} 
                        onChange={handleChange} 
                        placeholder="e.g. MH 12 AB 1234" 
                        required 
                        className="w-full text-xs sm:text-sm text-[#0F172A] font-medium uppercase tracking-wider bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                      />
                    </div>
                    {fieldErrors.vehicleNumber && <p className="text-[11px] text-red-500 font-semibold mt-1">{fieldErrors.vehicleNumber}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Residential Address *</label>
                  <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                    <input 
                      type="text" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleChange} 
                      placeholder="Complete residential address" 
                      required 
                      className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                    />
                  </div>
                  {fieldErrors.address && <p className="text-[11px] text-red-500 font-semibold mt-1">{fieldErrors.address}</p>}
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <FiCreditCard className="text-[#843D9B]" size={16} />
                    <span className="text-xs font-bold text-[#0F172A]">Bank Account Details (For Payouts)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">Account Holder Name *</label>
                      <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                        <input 
                          type="text" 
                          name="accountHolderName" 
                          value={formData.accountHolderName} 
                          onChange={handleChange} 
                          placeholder="Name as per bank account" 
                          required 
                          className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                        />
                      </div>
                      {fieldErrors.accountHolderName && <p className="text-[11px] text-red-500 font-semibold mt-1">{fieldErrors.accountHolderName}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">Account Number *</label>
                      <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                        <input 
                          type="text" 
                          name="accountNumber" 
                          value={formData.accountNumber} 
                          onChange={handleChange} 
                          placeholder="9 - 18 digit account number" 
                          required 
                          className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                        />
                      </div>
                      {fieldErrors.accountNumber && <p className="text-[11px] text-red-500 font-semibold mt-1">{fieldErrors.accountNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">Bank Name *</label>
                      <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                        <input 
                          type="text" 
                          name="bankName" 
                          value={formData.bankName} 
                          onChange={handleChange} 
                          placeholder="e.g. SBI, HDFC, ICICI" 
                          required 
                          className="w-full text-xs sm:text-sm text-[#0F172A] font-medium bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                        />
                      </div>
                      {fieldErrors.bankName && <p className="text-[11px] text-red-500 font-semibold mt-1">{fieldErrors.bankName}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">IFSC Code *</label>
                      <div className="w-full bg-[#F6F6F8] rounded-[18px] flex items-center px-3.5 py-3 border border-transparent focus-within:border-[#843D9B]/30 focus-within:bg-white transition-all">
                        <input 
                          type="text" 
                          name="ifscCode" 
                          value={formData.ifscCode} 
                          onChange={handleChange} 
                          placeholder="e.g. SBIN0001234" 
                          maxLength={11}
                          required 
                          className="w-full text-xs sm:text-sm text-[#0F172A] font-medium uppercase tracking-wider bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-[#94A3B8]" 
                        />
                      </div>
                      {fieldErrors.ifscCode && <p className="text-[11px] text-red-500 font-semibold mt-1">{fieldErrors.ifscCode}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 rounded-[5px] accent-[#843D9B] text-white cursor-pointer"
                    />
                    <span className="text-xs text-[#64748B] font-medium">
                      I agree to the <button type="button" onClick={() => setLegalModal({ isOpen: true, type: 'terms' })} className="text-[#843D9B] hover:underline font-semibold cursor-pointer">Terms & Conditions</button> and <button type="button" onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })} className="text-[#843D9B] hover:underline font-semibold cursor-pointer">Privacy Policy</button>
                    </span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 gap-3 w-full">
            {currentStep > 1 ? (
              <button type="button" onClick={prevStep} className="flex items-center gap-1 px-5 py-3.5 bg-[#F6F6F8] text-[#0F172A] rounded-[22px] font-bold text-xs hover:bg-gray-200 active:scale-95 transition-all cursor-pointer">
                <FiChevronLeft size={16} /> BACK
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button type="button" onClick={nextStep} className="flex items-center gap-2 px-8 py-3.5 bg-[#843D9B] hover:bg-[#713286] text-white rounded-[22px] font-bold text-sm transition-all shadow-md shadow-[#843D9B]/20 active:scale-95 cursor-pointer">
                NEXT <FiChevronRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={isLoading || !agreedToTerms} className={`flex items-center gap-2 px-8 py-3.5 bg-[#843D9B] hover:bg-[#713286] text-white rounded-[22px] font-bold text-sm transition-all shadow-md shadow-[#843D9B]/20 ${isLoading || !agreedToTerms ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none' : 'active:scale-95 cursor-pointer'}`}>
                {isLoading ? 'SUBMITTING...' : 'SUBMIT ENROLLMENT'}
              </button>
            )}
          </div>

          <div className="text-center mt-6 w-full">
            <p className="text-xs font-medium text-[#64748B]">
              Already have an account?{' '}
              <Link to="/delivery/login" onClick={() => localStorage.removeItem(DRAFT_KEY)} className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer">Login</Link>
            </p>
          </div>
        </form>
      </motion.div>

      <DeliveryLegalModal 
        isOpen={legalModal.isOpen} 
        type={legalModal.type} 
        onClose={() => setLegalModal({ isOpen: false, type: 'terms' })} 
      />
    </>
  );
};

export default DeliveryRegister;
