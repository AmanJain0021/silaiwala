// Port of modules/customer/components/BookingStepper.jsx
import React from 'react';
import { Check, Scissors, ShoppingBag, Ruler, CreditCard } from 'lucide-react-native';
import { Box, Txt, I } from '../ui/primitives';

const STEPS = [
  { id: 'service', label: 'Service', icon: Scissors },
  { id: 'fabric', label: 'Fabric', icon: ShoppingBag },
  { id: 'details', label: 'Details', icon: Ruler },
  { id: 'review', label: 'Review', icon: CreditCard },
];

const BookingStepper = ({ currentStepId }) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStepId);
  return (
    <Box className="w-full py-2.5 px-4 bg-white border-b border-gray-100 shadow-sm">
      <Box className="w-full max-w-md mx-auto relative flex justify-between items-center px-2">
        <Box className="absolute top-[14px] left-8 right-8 h-0.5 bg-gray-100 z-0">
          <Box className="h-full bg-primary shadow-sm" style={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%` }} />
        </Box>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = step.id === currentStepId;
          const on = isCompleted || isActive;
          return (
            <Box key={step.id} className="relative z-10 flex flex-col items-center gap-1.5">
              <Box className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shadow-sm ${on ? 'bg-[#843D9B] border-[#843D9B]' : 'bg-white border-gray-100'} ${isActive ? 'ring-4 ring-primary/10 scale-105' : ''}`}>
                <I icon={isCompleted ? Check : step.icon} size={14} color={on ? '#fff' : '#9ca3af'} />
              </Box>
              <Txt className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-primary' : 'text-gray-400'}`}>{step.label}</Txt>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default BookingStepper;
