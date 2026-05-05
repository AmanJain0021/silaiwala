import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Scissors, 
  Award, 
  Sparkles,
  TrendingUp,
  Globe,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Asset Imports
import img1 from '../../../assets/aunty silai krti hui image.jpeg';
import img2 from '../../../assets/cc3b8d6c20aa7bdc7d77e233743d163e.jpg';
import img3 from '../../../assets/d8661a6b1236692414ed7d9acacb078f.jpg';
import img4 from '../../../assets/cad1195ef729df9e02620ee49c685027.jpg';

const PartnerLanding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      title: "Empower Your Craft",
      description: "Join SewZella and bring your tailoring skills to a global audience.",
      image: img1,
      icon: <Sparkles className="w-8 h-8" />,
      color: "#2D2F6E"
    },
    {
      title: "Manage with Ease",
      description: "Get a dedicated panel to manage orders, measurements, and customer requests.",
      image: img2,
      icon: <TrendingUp className="w-8 h-8" />,
      color: "#1B263B"
    },
    {
      title: "Global Visibility",
      description: "Showcase your portfolio and get discovered by thousands of customers.",
      image: img3,
      icon: <Globe className="w-8 h-8" />,
      color: "#2D2F6E"
    },
    {
      title: "Secure Earnings",
      description: "Enjoy transparent payouts and a secure platform for your business growth.",
      image: img4,
      icon: <Wallet className="w-8 h-8" />,
      color: "#1B263B"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/partner/login');
    }
  };

  const handleSkip = () => {
    navigate('/partner/login');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden font-sans">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 w-full flex gap-1 p-2 z-50">
        {steps.map((_, idx) => (
          <div 
            key={idx} 
            className="h-1 flex-1 rounded-full bg-gray-100 overflow-hidden"
          >
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: idx <= currentStep ? "100%" : "0%" }}
              className="h-full bg-[#2D2F6E]"
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            {/* Image Section */}
            <div className="relative h-[60vh] w-full overflow-hidden bg-gray-100">
              <motion.img 
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 5 }}
                src={steps[currentStep].image} 
                alt={steps[currentStep].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
              
              {/* Skip Button */}
              {currentStep < steps.length - 1 && (
                <button 
                  onClick={handleSkip}
                  className="absolute top-8 right-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-bold border border-white/30 shadow-sm"
                >
                  Skip
                </button>
              )}
              
              {/* Logo Overlay */}
              <div className="absolute top-8 left-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#1B263B] rounded-lg flex items-center justify-center overflow-hidden">
                        <img src="/sewzella_logo-removebg-preview.png" alt="S" className="w-6 h-6 object-contain" />
                    </div>
                    <span className="text-white font-black text-xl tracking-tight drop-shadow-md">SewZella</span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 bg-white px-8 pt-4 pb-12 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 rounded-3xl bg-[#2D2F6E]/10 text-[#2D2F6E] flex items-center justify-center mb-6 shadow-sm"
              >
                {steps[currentStep].icon}
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-black text-[#1B263B] mb-4 tracking-tight"
              >
                {steps[currentStep].title}
              </motion.h2>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 text-lg leading-relaxed max-w-xs"
              >
                {steps[currentStep].description}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="p-8 bg-white fixed bottom-0 left-0 w-full">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className={`w-full py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 shadow-2xl transition-all ${
              currentStep === steps.length - 1 
                ? "bg-[#1B263B] text-white shadow-[#1B263B]/30" 
                : "bg-[#2D2F6E] text-white shadow-[#2D2F6E]/30"
            }`}
          >
            {currentStep === steps.length - 1 ? (
              <>Start Partner Journey <ArrowRight className="w-6 h-6" /></>
            ) : (
              <>Continue <ArrowRight className="w-6 h-6" /></>
            )}
          </motion.button>
          
          {/* Step Indicators (Dots) */}
          <div className="flex justify-center gap-2 mt-8">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-8 bg-[#2D2F6E]" : "w-2 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerLanding;
