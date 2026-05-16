import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Step1Basic, Step2Business } from '../components/Registration/Steps1_2';
import { Step3Docs, Step4Portfolio } from '../components/Registration/Steps3_4';
import { ChevronLeft, CheckCircle2, ArrowRight } from 'lucide-react';
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
                    onClick={() => navigate('/partner/under-review')}
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                <div className="pt-4">
                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-lg bg-[#2D2F6F] hover:bg-[#1E1F4D] text-white shadow-purple-100 flex items-center justify-center gap-2"
                        >
                            NEXT <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 shadow-lg ${isLoading ? 'bg-gray-300 text-gray-600' : 'bg-[#2D2F6F] hover:bg-[#1E1F4D] text-white shadow-purple-100'}`}
                        >
                            {isLoading ? 'Submitting...' : 'SUBMIT APPLICATION'}
                        </button>
                    )}
                </div>
            </form>
        </motion.div>
    );
};

export default TailorRegistration;

