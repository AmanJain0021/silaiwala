import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Step1Basic, Step2Business } from '../components/Registration/Steps1_2';
import { Step3Docs, Step4Portfolio } from '../components/Registration/Steps3_4';
import { ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTailorAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const TailorRegistration = () => {
    const [step, setStep] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const { login } = useTailorAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, watch, setValue, trigger, setError, formState: { errors } } = useForm({
        mode: 'onChange',
        shouldUnregister: false
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleNext = async () => {
        if (isValidating) return;
        setIsValidating(true);
        let fieldsToValidate = [];
        switch (step) {
            case 1:
                fieldsToValidate = ['fullName', 'phone', 'otp', 'email'];
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
        if (isStepValid) {
            if (step === 1) {
                setIsLoading(true);
                try {
                    const response = await api.post('/auth/check-user', { email: watch('email'), phoneNumber: watch('phone') });
                    if (response.data.exists) {
                        setError(response.data.field, { type: 'manual', message: response.data.message });
                        setIsValidating(false);
                        setIsLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error('Check user failed:', error);
                } finally {
                    setIsLoading(false);
                }
                
                // Process Profile Image upload for Step 1
                const uploadsSuccess = await processStepUploads(['profileImage']);
                if (!uploadsSuccess) {
                    setIsValidating(false);
                    return;
                }
            }

            if (step === 3) {
                // Process Document uploads for Step 3
                const uploadsSuccess = await processStepUploads(['aadharFront', 'aadharBack', 'panImage', 'licenseImage']);
                if (!uploadsSuccess) {
                    setIsValidating(false);
                    return;
                }
            }
            nextStep();
        }
        setIsValidating(false);
    };

    const [isLoading, setIsLoading] = useState(false);

    const uploadBulkFiles = async (filesArray) => {
        const formData = new FormData();
        let hasFiles = false;
        
        filesArray.forEach(item => {
            if (item.file instanceof File) {
                formData.append('images', item.file);
                hasFiles = true;
            }
        });
        
        if (!hasFiles) return [];
        
        try {
            formData.append('folder', 'tailor_registration');
            const res = await api.post('/upload/public/bulk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.data || [];
        } catch (error) {
            console.error('Bulk file upload failed:', error);
            return [];
        }
    };

    const processStepUploads = async (fields) => {
        const filesToUpload = [];
        fields.forEach(field => {
            const val = watch(field);
            if (val instanceof File) {
                filesToUpload.push({ field, file: val });
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
                setValue(f.field, urls[index], { shouldValidate: true });
            });
            return true;
        } catch (error) {
            toast.error('Image upload failed. Check your connection.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data) => {
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
            const documents = [
                { name: 'Aadhar Front', url: watch('aadharFront') },
                { name: 'Aadhar Back', url: watch('aadharBack') },
                { name: 'PAN Card', url: watch('panImage') },
                { name: 'Shop License', url: watch('licenseImage') },
                { name: 'Portfolio 1', url: watch('portfolio1') },
                { name: 'Portfolio 2', url: watch('portfolio2') }
            ].filter(doc => typeof doc.url === 'string' && doc.url.startsWith('http'));


            const payload = {
                name: data.fullName,
                email: data.email,
                phoneNumber: data.phone,
                otp: data.otp,
                role: 'tailor',
                shopName: data.shopName,
                experienceInYears: Number(data.experienceInYears),
                specializations: data.specializations.split(',').map(s => s.trim()).filter(s => s),
                documents,
                address: `${data.address}, ${data.city}, ${data.pincode}`,
                coordinates: [Number(data.longitude) || 72.8777, Number(data.latitude) || 19.0760],
                profileImage: watch('profileImage')
            };

            const response = await api.post('/auth/register', payload);

            if (response.data.success) {
                const { token, data: result } = response.data;
                setIsSubmitted(true);
                login(result.user, token);
            }
        } catch (error) {
            const message = error.response?.data?.message || "Registration failed. Try again.";
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <Step1Basic register={register} errors={errors} watch={watch} setValue={setValue} />;
            case 2: return <Step2Business register={register} errors={errors} setValue={setValue} />;
            case 3: return <Step3Docs register={register} errors={errors} watch={watch} setValue={setValue} />;
            case 4: return <Step4Portfolio register={register} errors={errors} watch={watch} setValue={setValue} />;
            default: return null;
        }
    };

    const stepTitles = [
        'Personal Information',
        'Business Details',
        'Upload Documents',
        'Portfolio & Scope'
    ];

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center justify-center py-10 text-center"
            >
                <div className="h-24 w-24 bg-purple-50 text-[#2D2F6F] rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-purple-900/5">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Application Sent!</h2>
                <p className="text-sm text-gray-500 mt-2 font-medium px-4">
                    Your details are under review. We will notify you once approved.
                </p>
                <button
                    onClick={() => navigate('/partner/verification')}
                    className="mt-8 font-black bg-[#2D2F6F] text-white px-10 py-4 rounded-2xl hover:bg-[#1E1F4D] transition-all shadow-lg shadow-purple-200"
                >
                    View Status
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                    {step > 1 && (
                        <button type="button" onClick={prevStep} className="p-2 -ml-2 text-gray-400 hover:text-[#2D2F6F] transition-colors bg-gray-50 rounded-xl shrink-0">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center justify-between w-full gap-2 overflow-hidden">
                        <h2 className="text-[17px] sm:text-xl font-bold text-slate-800 tracking-tight leading-tight truncate">
                            {stepTitles[step - 1]}
                        </h2>
                        <span className="text-[9px] sm:text-[10px] font-bold text-white bg-[#2D2F6F] px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                            Step {step}/4
                        </span>
                    </div>
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>

                <div className="pt-4 flex gap-3">
                    {step < 4 ? (
                        <>
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    disabled={isValidating}
                                    className="w-1/3 h-14 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-sm bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center gap-2"
                                >
                                    <ChevronLeft className="w-5 h-5" /> BACK
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={isValidating}
                                className={`flex-1 h-14 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${isValidating ? 'bg-gray-300 text-gray-500' : 'bg-[#2D2F6F] hover:bg-[#1E1F4D] text-white shadow-purple-100'}`}
                            >
                                {isValidating ? 'VALIDATING...' : 'NEXT'} <ArrowRight className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-3 w-full">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={isLoading}
                                className="w-1/3 h-14 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-sm bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" /> BACK
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                disabled={isLoading}
                                className={`flex-1 h-14 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-lg ${isLoading ? 'bg-gray-300 text-gray-600' : 'bg-[#2D2F6F] hover:bg-[#1E1F4D] text-white shadow-purple-100'}`}
                            >
                                {isLoading ? 'Submitting...' : 'SUBMIT APPLICATION'}
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </motion.div>
    );
};

export default TailorRegistration;

