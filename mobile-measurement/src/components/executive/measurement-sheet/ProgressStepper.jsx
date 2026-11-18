// Port of modules/measurement-executive/components/measurement-sheet/ProgressStepper.jsx (converted with scripts/web2rn.js, then reviewed)
import { Circle, Path, default as Svg } from 'react-native-svg';
import React from "react";
import { Check, ClipboardList, CheckCircle2 } from "lucide-react-native";
import { Box, Btn, I, Txt, Scroll } from '../../ui/primitives';
const TapeMeasureIcon = ({ size = 16, color = "#6C2E9C" }) => <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Circular tape body */}
        <Circle cx="12" cy="12" r="8.5" />
        <Circle cx="12" cy="12" r="4.5" />
        <Path d="M12 3.5v4" />
        <Path d="M16.5 12h-4" />
        <Path d="M12 20.5v-4" />
        <Path d="M7.5 12h-4" />
    </Svg>;
const ProgressStepper = ({
  currentStep = 'measuring',
  onStepClick
}) => {
  // 4 stages definition
  const steps = [{
    id: 'arrived',
    label: 'Arrived',
    number: 1
  }, {
    id: 'measuring',
    label: 'Measuring',
    number: 2
  }, {
    id: 'confirm',
    label: 'Confirm',
    number: 3
  }, {
    id: 'complete',
    label: 'Complete',
    number: 4
  }];
  const getStepStatus = stepId => {
    const order = ['arrived', 'measuring', 'confirm', 'complete'];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepId);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };
  return <Box className="w-full px-2 py-3 select-none">
            <Box className="relative flex items-center justify-between">
                {/* Connecting lines in the background */}
                <Box className="absolute top-[18px] left-[32px] right-[32px] h-[1.5px] bg-[#E9DDF5] -z-0">
                    <Box className="h-full bg-[#6C2E9C] transition-all duration-300" style={{
          width: currentStep === 'arrived' ? '0%' : currentStep === 'measuring' ? '33.3%' : currentStep === 'confirm' ? '66.6%' : '100%'
        }} />
                </Box>

                {/* Steps */}
                {steps.map(step => {
        const status = getStepStatus(step.id);
        const isActive = status === 'active';
        const isCompleted = status === 'completed';
        return <Btn key={step.id} onPress={() => onStepClick && onStepClick(step.id)} className={`block ${`flex flex-col items-center z-10 ${onStepClick ? 'cursor-pointer' : ''}`}`}>
                            {/* Circle Indicator */}
                            {isActive ? <Box className="relative flex items-center justify-center">
                                    {/* Outer soft lavender glow ring */}
                                    <Box className="w-[42px] h-[42px] rounded-full bg-[#F3E8FF] flex items-center justify-center p-0.5 animate-pulse">
                                        <Box className="w-9 h-9 rounded-full bg-[#581C87] flex items-center justify-center shadow-md shadow-[#581C87]/30">
                                            <I icon={TapeMeasureIcon} className="w-4.5 h-4.5 text-white" />
                                        </Box>
                                    </Box>
                                </Box> : isCompleted ? <Box className="w-[34px] h-[34px] rounded-full bg-[#6C2E9C] flex items-center justify-center text-white shadow-sm my-1">
                                    <I icon={Check} size={17} strokeWidth={3} />
                                </Box> : <Box className="w-[34px] h-[34px] rounded-full bg-[#F5F2F9] border border-gray-200/80 flex items-center justify-center text-gray-400 my-1">
                                    {step.id === 'confirm' ? <I icon={ClipboardList} size={16} strokeWidth={1.8} /> : <I icon={CheckCircle2} size={16} strokeWidth={1.8} />}
                                </Box>}

                            {/* Label */}
                            <Txt className={`text-[11px] mt-1 tracking-tight transition-colors ${isActive ? 'font-bold text-[#581C87]' : isCompleted ? 'font-medium text-gray-600' : 'font-medium text-gray-400'}`}>
                                {step.label}
                            </Txt>
                        </Btn>;
      })}
            </Box>
        </Box>;
};
export default ProgressStepper;
