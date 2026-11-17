// Port of modules/tailor/pages/Registration.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import storage from '../lib/storage';
import Checkbox from '../components/ui/Checkbox';
import { isPickedFile } from '../lib/files';
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate,  } from '../lib/nav';
import { Step1Basic, Step2Business } from "../components/tailor/Registration/Steps1_2";
import { Step3Docs, Step4Portfolio } from "../components/tailor/Registration/Steps3_4";
import { ChevronLeft, CheckCircle2, ArrowRight, UserPlus } from "lucide-react-native";
import { useTailorAuth } from "../context/tailor/AuthContext";
import api from "../lib/api";
import toast from '../lib/toast';
import { compressImage } from "../utils/imageCompression";
import { Box, I, Txt, Btn, Input, Scroll } from '../components/ui/primitives';
const TailorRegistration = () => {
  const [step, setStep] = useState(() => {
    const savedStep = storage.getItem('tailorSignupStep');
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  useEffect(() => {
    storage.setItem('tailorSignupStep', step);
  }, [step]);
  const [isValidating, setIsValidating] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const {
    login
  } = useTailorAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    setError,
    clearErrors,
    formState: {
      errors
    }
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    defaultValues: (() => {
      const savedData = storage.getItem('tailorSignupData');
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (e) {
          console.error("Error parsing saved tailor data", e);
        }
      }
      return {};
    })()
  });
  const formValues = watch();
  useEffect(() => {
    const valuesToSave = {
      ...formValues
    };
    // Exclude File objects before saving to localStorage
    ['profileImage', 'aadharFront', 'aadharBack', 'panImage', 'licenseImage', 'portfolio1', 'portfolio2'].forEach(key => {
      if (isPickedFile(valuesToSave[key])) {
        delete valuesToSave[key];
      }
    });
    storage.setItem('tailorSignupData', JSON.stringify(valuesToSave));
  }, [formValues]);
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);
  const handleNext = async () => {
    if (isValidating) return;
    setIsValidating(true);
    let fieldsToValidate = [];
    switch (step) {
      case 1:
        fieldsToValidate = ['fullName', 'phone', 'email', 'password'];
        break;
      case 2:
        fieldsToValidate = ['shopName', 'address', 'city', 'pincode', 'experienceInYears', 'specializations'];
        break;
      case 3:
        fieldsToValidate = ['aadharNumber', 'panNumber'];
        break;
      case 4:
        fieldsToValidate = ['portfolio1', 'portfolio2', 'workingDays', 'workingHours'];
        break;
      default:
        fieldsToValidate = [];
    }
    const isStepValid = await trigger(fieldsToValidate);
    if (!isStepValid) {
      setIsValidating(false);
      return;
    }
    if (step === 1) {
      // Check phone verification status
      if (!watch('isPhoneVerified')) {
        if (!watch('otp') || watch('otp').length < 6) {
          setError('phone', {
            type: 'manual',
            message: 'Please send and verify OTP'
          });
          setError('otp', {
            type: 'manual',
            message: 'OTP is required'
          });
          toast.error("Please verify your mobile number by sending OTP first.");
          setIsValidating(false);
          return;
        }
        setIsLoading(true);
        try {
          const otpResponse = await api.post('/auth/verify-otp', {
            phone: watch('phone'),
            otp: watch('otp')
          });
          if (!otpResponse.data.success) {
            setError('otp', {
              type: 'manual',
              message: 'Invalid OTP'
            });
            setIsValidating(false);
            setIsLoading(false);
            return;
          }
          setValue('isPhoneVerified', true);
        } catch (error) {
          console.error('OTP Validation failed:', error);
          const errMsg = error.response?.data?.message || 'Invalid OTP';
          setError('otp', {
            type: 'manual',
            message: errMsg
          });
          setIsValidating(false);
          setIsLoading(false);
          return;
        }
      }
      setIsLoading(true);
      try {
        const response = await api.post('/auth/check-user', {
          email: watch('email'),
          phoneNumber: watch('phone')
        });
        if (response.data.exists) {
          const fieldName = response.data.field || (response.data.message?.includes('email') ? 'email' : 'phone');
          setError(fieldName, {
            type: 'manual',
            message: response.data.message
          });
          setIsValidating(false);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Check user failed:', error);
        toast.error(error.response?.data?.message || 'Validation failed');
        setIsValidating(false);
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }

      // Process Profile Image upload for Step 1 if user selected a file
      if (isPickedFile(watch('profileImage'))) {
        const uploadsSuccess = await processStepUploads(['profileImage']);
        if (!uploadsSuccess) {
          setIsValidating(false);
          return;
        }
      }
    }
    if (step === 2) {
      const addr = watch('address');
      if (!addr || addr.trim().length < 5) {
        setError('address', {
          type: 'manual',
          message: 'Shop address must be at least 5 characters'
        });
        toast.error("Please enter a valid shop address.");
        setIsValidating(false);
        return;
      }
    }
    if (step === 3) {
      let hasDocError = false;
      if (!watch('aadharFront')) {
        setError('aadharFront', {
          type: 'manual',
          message: 'Aadhaar Card (Front) photo is required'
        });
        hasDocError = true;
      }
      if (!watch('aadharBack')) {
        setError('aadharBack', {
          type: 'manual',
          message: 'Aadhaar Card (Back) photo is required'
        });
        hasDocError = true;
      }
      if (!watch('panImage')) {
        setError('panImage', {
          type: 'manual',
          message: 'PAN Card photo is required'
        });
        hasDocError = true;
      }
      if (hasDocError) {
        toast.error("Please upload all required document photos.");
        setIsValidating(false);
        return;
      }

      // Process Document uploads for Step 3
      const uploadsSuccess = await processStepUploads(['aadharFront', 'aadharBack', 'panImage', 'licenseImage']);
      if (!uploadsSuccess) {
        setIsValidating(false);
        return;
      }
    }
    nextStep();
    setIsValidating(false);
  };
  const [isLoading, setIsLoading] = useState(false);
  const uploadBulkFiles = async filesArray => {
    const formData = new FormData();
    let hasFiles = false;
    for (const item of filesArray) {
      if (isPickedFile(item.file)) {
        const compressedFile = await compressImage(item.file);
        formData.append('images', compressedFile);
        hasFiles = true;
      }
    }
    if (!hasFiles) return [];
    try {
      formData.append('folder', 'tailor_registration');
      const res = await api.post('/upload/public/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data.data || [];
    } catch (error) {
      console.error('Bulk file upload failed:', error);
      return [];
    }
  };
  const processStepUploads = async fields => {
    const filesToUpload = [];
    fields.forEach(field => {
      const val = watch(field);
      if (isPickedFile(val)) {
        filesToUpload.push({
          field,
          file: val
        });
      }
    });
    if (filesToUpload.length === 0) return true;
    setIsLoading(true);
    try {
      const urls = await uploadBulkFiles(filesToUpload);
      if (urls.length !== filesToUpload.length) {
        toast.error("Some images failed to upload. Please try again.");
        return false;
      }
      filesToUpload.forEach((f, index) => {
        setValue(f.field, urls[index], {
          shouldValidate: true
        });
      });
      return true;
    } catch (error) {
      toast.error('Image upload failed. Check your connection.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const onSubmit = async data => {
    if (step !== 4) return; // Guard to prevent accidental submission from earlier steps

    // Final sanity check to prevent race conditions from bypassing validation
    if (!data.workingDays || !data.workingHours) {
      trigger(['workingDays', 'workingHours']);
      return;
    }
    setIsLoading(true);
    try {
      // Upload step 4 portfolio files if not already uploaded
      const uploadsSuccess = await processStepUploads(['portfolio1', 'portfolio2']);
      if (!uploadsSuccess) {
        setIsLoading(false);
        return;
      }

      // At this point, ALL images across all steps should be string URLs in the form state
      const documents = [{
        name: 'Aadhar Front',
        url: watch('aadharFront')
      }, {
        name: 'Aadhar Back',
        url: watch('aadharBack')
      }, {
        name: 'PAN Card',
        url: watch('panImage')
      }, {
        name: 'Shop License',
        url: watch('licenseImage')
      }, {
        name: 'Portfolio 1',
        url: watch('portfolio1')
      }, {
        name: 'Portfolio 2',
        url: watch('portfolio2')
      }].filter(doc => typeof doc.url === 'string' && doc.url.trim().length > 0);
      const payload = {
        name: data.fullName,
        email: data.email,
        phoneNumber: data.phone,
        otp: data.otp,
        password: data.password,
        role: 'tailor',
        shopName: data.shopName,
        experienceInYears: Number(data.experienceInYears),
        specializations: typeof data.specializations === 'string' ? data.specializations.split(',').map(s => s.trim()).filter(s => s) : Array.isArray(data.specializations) ? data.specializations : [],
        documents,
        address: `${data.address}, ${data.city}, ${data.pincode}`,
        coordinates: [Number(data.longitude) || 72.8777, Number(data.latitude) || 19.0760],
        profileImage: watch('profileImage')
      };
      const response = await api.post('/auth/register', payload);
      if (response.data.success) {
        const {
          token,
          data: result
        } = response.data;
        storage.removeItem('tailorSignupData');
        storage.removeItem('tailorSignupStep');
        setIsSubmitted(true);
        login(result.user ? {
          ...result.user,
          profile: result.profile
        } : result, token);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed. Try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };
  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Basic register={register} errors={errors} watch={watch} setValue={setValue} setError={setError} clearErrors={clearErrors} />;
      case 2:
        return <Step2Business register={register} errors={errors} setValue={setValue} clearErrors={clearErrors} watch={watch} />;
      case 3:
        return <Step3Docs register={register} errors={errors} watch={watch} setValue={setValue} clearErrors={clearErrors} />;
      case 4:
        return <Step4Portfolio register={register} errors={errors} watch={watch} setValue={setValue} clearErrors={clearErrors} />;
      default:
        return null;
    }
  };
  const stepTitles = ['Personal Information', 'Business Details', 'Upload Documents', 'Portfolio & Scope'];
  if (isSubmitted) {
    return <Box className="w-full flex flex-col items-center justify-center py-10 text-center">
                <Box className="h-24 w-24 bg-pink-50 text-[#843D9B] rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-purple-900/5">
                    <I icon={CheckCircle2} size={48} strokeWidth={2.5} />
                </Box>
                <Txt className="text-2xl font-black text-slate-800 tracking-tight">Application Sent!</Txt>
                <Txt className="text-sm text-gray-500 mt-2 font-medium px-4">
                    Your details are under review. We will notify you once approved.
                </Txt>
                <Btn onPress={() => navigate('/partner/verification')} className="mt-8 font-black bg-[#843D9B] text-white px-10 py-4 rounded-full hover:bg-[#E04D79] transition-all shadow-lg shadow-[#843D9B]/20">
                    View Status
                </Btn>
            </Box>;
  }
  return <Box className="w-full flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif] px-2 sm:px-4">
            {/* Top Squircle Card with Icon */}
            <Box className="w-16 h-16 rounded-[22px] bg-[#F4EFFF] border border-[#E9DFFE] flex items-center justify-center shadow-2xs mb-4 shrink-0 mx-auto mt-2">
                <I icon={UserPlus} className="w-6 h-6 text-[#843D9B]" strokeWidth={2.2} />
            </Box>

            {/* Title & Subtitle */}
            <Box className="text-center mb-5 w-full">
                <Txt className="text-2xl sm:text-[26px] font-bold text-[#0F172A] tracking-tight mb-1">
                    Create Partner Account
                </Txt>
                <Txt className="text-xs sm:text-[13px] font-medium text-[#64748B] max-w-[280px] mx-auto leading-relaxed">
                    Register as a certified tailor partner with SewZella
                </Txt>
            </Box>

            {/* Step Progress Header */}
            <Box className="w-full bg-[#F6F6F8] rounded-[18px] p-3 px-4 mb-5 flex items-center justify-between border border-gray-100">
                <Box className="flex items-center gap-2 overflow-hidden">
                    {step > 1 && <Btn onPress={prevStep} className="p-1 -ml-1 text-[#64748B] hover:text-[#843D9B] transition-colors shrink-0 cursor-pointer">
                            <I icon={ChevronLeft} size={20} />
                        </Btn>}
                    <Txt className="text-xs font-bold text-[#0F172A] truncate">
                        {stepTitles[step - 1]}
                    </Txt>
                </Box>
                <Txt className="text-[10px] font-bold text-[#843D9B] bg-[#F4EFFF] border border-[#E9DFFE] px-2.5 py-1 rounded-full shrink-0">
                    Step {step} of 4
                </Txt>
            </Box>

            <Box className="w-full space-y-5">
                <React.Fragment>
                    <Box key={step} className="space-y-4 w-full">
                        {renderStep()}
                    </Box>
                </React.Fragment>

                <Box className="pt-3 flex gap-3 w-full">
                    {step < 4 ? <>
                            {step > 1 && <Btn onPress={prevStep} disabled={isValidating} className="w-1/3 py-3.5 rounded-[22px] font-bold text-xs tracking-wider uppercase transition-all bg-[#F6F6F8] text-[#0F172A] hover:bg-gray-200 flex items-center justify-center gap-1 cursor-pointer">
                                    <I icon={ChevronLeft} className="w-4 h-4" /> BACK
                                </Btn>}
                            <Btn onPress={handleNext} disabled={isValidating} className={`flex-1 py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center flex items-center justify-center gap-2 ${isValidating ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none' : 'bg-[#843D9B] hover:bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`}>
                                {isValidating ? 'VALIDATING...' : 'NEXT'} <I icon={ArrowRight} className="w-4 h-4" />
                            </Btn>
                        </> : <Box className="flex flex-col gap-3 w-full">
                            <Box className="pt-1 px-0.5 text-left">
                                <Txt className="flex items-center gap-2 cursor-pointer select-none">
                                    <Checkbox checked={agreedToTerms} onChange={setAgreedToTerms} />
                                    <Txt className="text-xs text-[#64748B] font-medium">
                                        I agree with{' '}
                                        <Btn onPress={() => navigate('/partner/legal/terms-and-conditions')} className="text-[#843D9B] font-semibold hover:underline">
                                            Terms & Conditions
                                        </Btn>
                                        {' '} & {' '}
                                        <Btn onPress={() => navigate('/partner/legal/privacy-policy')} className="text-[#843D9B] font-semibold hover:underline">
                                            Privacy Policy
                                        </Btn>
                                    </Txt>
                                </Txt>
                            </Box>
                            <Box className="flex gap-3 w-full pt-1">
                                <Btn onPress={prevStep} disabled={isLoading} className="w-1/3 py-3.5 rounded-[22px] font-bold text-xs tracking-wider uppercase transition-all bg-[#F6F6F8] text-[#0F172A] hover:bg-gray-200 flex items-center justify-center gap-1 cursor-pointer">
                                    <I icon={ChevronLeft} className="w-4 h-4" /> BACK
                                </Btn>
                                <Btn onPress={handleSubmit(onSubmit)} disabled={isLoading || !agreedToTerms} className={`flex-1 py-3.5 sm:py-4 rounded-[22px] font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer text-center ${isLoading || !agreedToTerms ? 'bg-[#E2D9F3] text-white cursor-not-allowed shadow-none' : 'bg-[#843D9B] hover:bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20'}`}>
                                    {isLoading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
                                </Btn>
                            </Box>
                        </Box>}
                </Box>
            </Box>

            {/* Footer Navigation */}
            <Box className="mt-6 text-center w-full">
                <Txt className="text-xs font-medium text-[#64748B]">
                    Already have an account?{' '}
                    <Btn onPress={() => navigate("/partner/login")} className="text-[#843D9B] font-bold hover:underline ml-1 cursor-pointer">
                        Sign In
                    </Btn>
                </Txt>
            </Box>
        </Box>;
};
export default TailorRegistration;
