import React from 'react';
import { motion } from 'framer-motion';
import { Check, Scissors, ShoppingBag, Ruler, CreditCard } from 'lucide-react';
import { cn } from '../../../utils/cn';

const STEPS = [
    { id: 'service', label: 'Service', icon: Scissors },
    { id: 'fabric', label: 'Fabric', icon: ShoppingBag },
    { id: 'details', label: 'Details', icon: Ruler },
    { id: 'review', label: 'Review', icon: CreditCard },
];

const BookingStepper = ({ currentStepId }) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStepId);

    return (
        <div className="w-full py-3 px-4 bg-white border-b border-gray-100 shadow-sm">
            <div className="max-w-md mx-auto relative flex justify-between items-center px-2">
                {/* Connecting Lines */}
                <div className="absolute top-[14px] left-8 right-8 h-0.5 bg-gray-100 z-0">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                        className="h-full bg-primary transition-all duration-500 shadow-sm"
                    />
                </div>

                {/* Step Circles */}
                {STEPS.map((index_val, index) => {
                    const step = STEPS[index];
                    const isCompleted = index < currentIndex;
                    const isActive = step.id === currentStepId;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isCompleted || isActive ? '#2D2F6E' : '#ffffff',
                                    borderColor: isCompleted || isActive ? '#2D2F6E' : '#f3f4f6',
                                    scale: isActive ? 1.05 : 1,
                                }}
                                className={cn(
                                    "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm",
                                    isActive ? "ring-4 ring-primary/10" : ""
                                )}
                            >
                                {isCompleted ? (
                                    <Check size={14} className="text-white" />
                                ) : (
                                    <Icon size={14} className={cn(
                                        isActive ? "text-white" : "text-gray-400"
                                    )} />
                                )}
                            </motion.div>
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-tighter transition-colors",
                                isActive ? "text-primary" : "text-gray-400"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BookingStepper;
