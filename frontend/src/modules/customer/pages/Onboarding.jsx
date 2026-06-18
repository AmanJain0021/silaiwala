import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, Scissors, Ruler, Truck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Asset Imports
import img_8e608 from '../../../assets/8e60854ad14bc34cafe59b8d14c4bc76.jpg';
import img_aunty from '../../../assets/aunty silai.jpg';
import img_tools from '../../../assets/Tools and Professions777.jpeg';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: "Handcrafted with Care",
      description: "Experience the legacy of family tailoring and handmade precision.",
      image: "/F0221177-Man_sewing_suit_by_hand_in_family_tailor_business.jpg",
      icon: <Sparkles className="w-8 h-8" />,
      color: "#843D9B"
    },
    {
      title: "Premium Tailoring",
      description: "Experience the art of custom tailoring from the comfort of your home.",
      image: img_8e608,
      icon: <Scissors className="w-8 h-8" />,
      color: "#843D9B"
    },
    {
      title: "Perfect Fit, Always",
      description: "Our expert tailors ensure every stitch is made to your exact measurements.",
      image: "/47b2d585cfdbab4f494276a8665dea99.jpg",
      icon: <Ruler className="w-8 h-8" />,
      color: "#843D9B"
    },
    {
      title: "Master Your Style",
      description: "Join SewZella today and redefine your wardrobe with personalized style.",
      image: img_aunty,
      icon: <Scissors className="w-8 h-8" />,
      color: "#1B263B"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/user/login');
    }
  };

  const handleSkip = () => {
    navigate('/user/login');
  };

  return (
    <div className="h-[100dvh] bg-white flex flex-col overflow-hidden font-sans relative">
      {/* Top Progress Bar */}
      <div className="absolute top-0 left-0 w-full flex gap-1 p-2 z-50">
        {steps.map((_, idx) => (
          <div 
            key={idx} 
            className="h-1 flex-1 rounded-full bg-gray-300/50 overflow-hidden backdrop-blur-sm"
          >
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: idx <= currentStep ? "100%" : "0%" }}
              className="h-full bg-[#843D9B]"
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Image Section */}
            <div className="relative h-[45%] lg:h-[50%] shrink-0 w-full overflow-hidden bg-gray-100">
              <motion.img 
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 5 }}
                src={steps[currentStep].image} 
                alt={steps[currentStep].title}
                className="w-full h-full object-cover"
                onError={(e) => {
                    console.error("Image load failed:", steps[currentStep].image);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              
              {/* Skip Button */}
              {currentStep < steps.length - 1 && (
                <button 
                  onClick={handleSkip}
                  className="absolute top-8 right-4 px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30 shadow-sm z-10"
                >
                  Skip
                </button>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 bg-white px-5 py-4 flex flex-col items-center justify-center text-center min-h-0 z-10 relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-12 h-12 rounded-2xl bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center mb-4 shadow-sm shrink-0"
              >
                {/* Clone the icon element to override its size classes safely without mutating the original object */}
                {React.cloneElement(steps[currentStep].icon, { className: "w-6 h-6" })}
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2 tracking-tight"
              >
                {steps[currentStep].title}
              </motion.h2>

              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 text-sm md:text-base leading-relaxed max-w-[280px]"
              >
                {steps[currentStep].description}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Static Navigation Buttons */}
        <div className="px-5 py-4 bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] border-t border-gray-50 z-20">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#843D9B]/20 transition-all bg-[#843D9B] text-white"
          >
            {currentStep === steps.length - 1 ? (
              <>Get Started <Sparkles className="w-5 h-5" /></>
            ) : (
              <>Continue <ArrowRight className="w-5 h-5" /></>
            )}
          </motion.button>
          
          {/* Step Indicators (Dots) */}
          <div className="flex justify-center gap-1.5 mt-4">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-6 bg-[#843D9B]" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
