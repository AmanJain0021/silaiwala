import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/UIElements';
import { Step1Basic, Step2Business } from '../components/Registration/Steps1_2';
import { Step3Docs, Step4Portfolio } from '../components/Registration/Steps3_4';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useTailorAuth } from '../context/AuthContext';
import api from '../services/api';

const TailorRegistration = () => {
    const [step, setStep] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { login } = useTailorAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm({
        mode: 'onChange'
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleNext = async () => {
        let fieldsToValidate = [];
        switch (step) {
            case 1:
                fieldsToValidate = ['fullName', 'phone', 'email', 'password'];
                break;
            case 2:
                fieldsToValidate = ['shopName', 'address', 'city', 'pincode', 'serviceArea', 'experienceInYears', 'specializations'];
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
            nextStep();
        }
    };

    const [isLoading, setIsLoading] = useState(false);

    const uploadFile = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await api.post('/upload/public', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.data;
        } catch (error) {
            console.error('File upload failed:', error);
            return null;
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const [aadharFrontUrl, aadharBackUrl, panUrl, licenseUrl, portfolio1Url, portfolio2Url] = await Promise.all([
                uploadFile(data.aadharFront),
                uploadFile(data.aadharBack),
                uploadFile(data.panImage),
                uploadFile(data.licenseImage),
                uploadFile(data.portfolio1),
                uploadFile(data.portfolio2)
            ]);

            const documents = [
                { name: 'Aadhar Front', url: aadharFrontUrl, status: 'pending' },
                { name: 'Aadhar Back', url: aadharBackUrl, status: 'pending' },
                { name: 'PAN Card', url: panUrl, status: 'pending' },
                { name: 'Shop License', url: licenseUrl, status: 'pending' },
                { name: 'Portfolio 1', url: portfolio1Url, status: 'pending' },
                { name: 'Portfolio 2', url: portfolio2Url, status: 'pending' }
            ].filter(doc => doc.url);

            const payload = {
                name: data.fullName,
                email: data.email,
                phoneNumber: data.phone,
                password: data.password,
                role: 'tailor',
                shopName: data.shopName,
                experienceInYears: Number(data.experienceInYears),
                specializations: data.specializations.split(',').map(s => s.trim()).filter(s => s),
                documents,
                coordinates: [72.8777, 19.0760]
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
            case 2: return <Step2Business register={register} errors={errors} />;
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
                className="w-full flex flex-col items-center justify-center py-6 text-center"
            >
                <div className="h-20 w-20 bg-indigo-50 text-[#D86580] rounded-full flex items-center justify-center mb-5 shadow-xl shadow-indigo-900/10">
                    <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Application Sent!</h2>
                <p className="text-xs text-gray-500 mt-2 font-medium px-4">
                    Your details are under review. We will notify you once approved.
                </p>
                <button
                    onClick={() => navigate('/partner/under-review')}
                    className="mt-6 text-xs font-black bg-[#D86580] text-white px-8 py-3 rounded-full hover:bg-[#b8526a] transition-colors shadow-lg shadow-indigo-200"
                >
                    View Status
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {step > 1 && (
                        <button type="button" onClick={prevStep} className="p-1 -ml-1 text-gray-400 hover:text-[#D86580] transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                            {stepTitles[step - 1]}
                        </h2>
                        <p className="text-[9px] font-black text-[#D86580] uppercase tracking-[0.2em] mt-0.5">
                            Step {step} of 4
                        </p>
                    </div>
                </div>

                <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${i <= step ? 'bg-[#D86580]' : 'bg-indigo-50'}`} />
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>

                <div className="pt-2">
                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="w-full h-11 sm:h-12 rounded-full font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-lg bg-[#D86580] hover:bg-[#b8526a] text-white shadow-indigo-200"
                        >
                            <span className="flex items-center justify-center gap-2">
                                NEXT <span className="text-lg">›</span>
                            </span>
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-11 sm:h-12 rounded-full font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-lg ${isLoading ? 'bg-gray-300 text-gray-600' : 'bg-[#D86580] hover:bg-[#b8526a] text-white shadow-indigo-200'}`}
                        >
                            {isLoading ? 'Submitting...' : 'SUBMIT APPLICATION'}
                        </button>
                    )}
                </div>

                {/* Sign up link removed as it's in layout now, but keeping an empty div for spacing if needed or just remove it. */}
            </form>
        </motion.div>
    );
};

export default TailorRegistration;
