import React from 'react';
import { Check, ClipboardList, CheckCircle2 } from 'lucide-react';

const TapeMeasureIcon = ({ className = "w-5 h-5 text-white" }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        {/* Circular tape body */}
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 3.5v4" />
        <path d="M16.5 12h-4" />
        <path d="M12 20.5v-4" />
        <path d="M7.5 12h-4" />
    </svg>
);

const ProgressStepper = ({ currentStep = 'measuring', onStepClick }) => {
    // 4 stages definition
    const steps = [
        { id: 'arrived', label: 'Arrived', number: 1 },
        { id: 'measuring', label: 'Measuring', number: 2 },
        { id: 'confirm', label: 'Confirm', number: 3 },
        { id: 'complete', label: 'Complete', number: 4 },
    ];

    const getStepStatus = (stepId) => {
        const order = ['arrived', 'measuring', 'confirm', 'complete'];
        const currentIndex = order.indexOf(currentStep);
        const stepIndex = order.indexOf(stepId);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'upcoming';
    };

    return (
        <div className="w-full px-2 py-3 select-none">
            <div className="relative flex items-center justify-between">
                {/* Connecting lines in the background */}
                <div className="absolute top-[18px] left-[32px] right-[32px] h-[1.5px] bg-[#E9DDF5] -z-0">
                    <div 
                        className="h-full bg-[#6C2E9C] transition-all duration-300"
                        style={{
                            width: currentStep === 'arrived' ? '0%' :
                                   currentStep === 'measuring' ? '33.3%' :
                                   currentStep === 'confirm' ? '66.6%' : '100%'
                        }}
                    />
                </div>

                {/* Steps */}
                {steps.map((step) => {
                    const status = getStepStatus(step.id);
                    const isActive = status === 'active';
                    const isCompleted = status === 'completed';

                    return (
                        <div 
                            key={step.id} 
                            onClick={() => onStepClick && onStepClick(step.id)}
                            className={`flex flex-col items-center z-10 ${onStepClick ? 'cursor-pointer' : ''}`}
                        >
                            {/* Circle Indicator */}
                            {isActive ? (
                                <div className="relative flex items-center justify-center">
                                    {/* Outer soft lavender glow ring */}
                                    <div className="w-[42px] h-[42px] rounded-full bg-[#F3E8FF] flex items-center justify-center p-0.5 animate-pulse">
                                        <div className="w-9 h-9 rounded-full bg-[#581C87] flex items-center justify-center shadow-md shadow-[#581C87]/30">
                                            <TapeMeasureIcon className="w-4.5 h-4.5 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ) : isCompleted ? (
                                <div className="w-[34px] h-[34px] rounded-full bg-[#6C2E9C] flex items-center justify-center text-white shadow-sm my-1">
                                    <Check size={17} strokeWidth={3} />
                                </div>
                            ) : (
                                <div className="w-[34px] h-[34px] rounded-full bg-[#F5F2F9] border border-gray-200/80 flex items-center justify-center text-gray-400 my-1">
                                    {step.id === 'confirm' ? (
                                        <ClipboardList size={16} strokeWidth={1.8} />
                                    ) : (
                                        <CheckCircle2 size={16} strokeWidth={1.8} />
                                    )}
                                </div>
                            )}

                            {/* Label */}
                            <span 
                                className={`text-[11px] mt-1 tracking-tight transition-colors ${
                                    isActive 
                                        ? 'font-bold text-[#581C87]' 
                                        : isCompleted 
                                            ? 'font-medium text-gray-600' 
                                            : 'font-medium text-gray-400'
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgressStepper;
