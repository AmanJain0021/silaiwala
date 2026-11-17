// Port of modules/tailor/pages/PartnerLanding.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState, useEffect } from "react";
import { ArrowRight, Scissors, Award, Sparkles, TrendingUp, Globe, Wallet } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import { useTailorAuth } from "../context/tailor/AuthContext";
import useBrandingStore from "../store/brandingStore";
import { I, Box, Img, Btn, Txt, Scroll } from '../components/ui/primitives';
// Asset Imports
const img1 = require('../../assets/landing/aunty-silai.jpeg');
const img2 = require('../../assets/landing/cc3b8d6c20aa7bdc7d77e233743d163e.jpg');
const img3 = require('../../assets/landing/d8661a6b1236692414ed7d9acacb078f.jpg');
const img4 = require('../../assets/landing/cad1195ef729df9e02620ee49c685027.jpg');
const PartnerLanding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const {
    isAuthenticated,
    user
  } = useTailorAuth();
  const {
    appName,
    logos
  } = useBrandingStore();
  useEffect(() => {
    if (isAuthenticated && user?.role === 'tailor') {
      navigate('/partner', {
        replace: true
      });
    }
  }, [isAuthenticated, user, navigate]);
  const steps = [{
    title: "Empower Your Craft",
    description: `Join ${appName} and bring your tailoring skills to a global audience.`,
    image: img1,
    icon: <I icon={Sparkles} className="w-8 h-8" />,
    color: "#843D9B"
  }, {
    title: "Manage with Ease",
    description: "Get a dedicated panel to manage orders, measurements, and customer requests.",
    image: img2,
    icon: <I icon={TrendingUp} className="w-8 h-8" />,
    color: "#1B263B"
  }, {
    title: "Global Visibility",
    description: "Showcase your portfolio and get discovered by thousands of customers.",
    image: img3,
    icon: <I icon={Globe} className="w-8 h-8" />,
    color: "#843D9B"
  }, {
    title: "Secure Earnings",
    description: "Enjoy transparent payouts and a secure platform for your business growth.",
    image: img4,
    icon: <I icon={Wallet} className="w-8 h-8" />,
    color: "#1B263B"
  }];
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
  return <Screen className="bg-white"><Box className="flex-1 bg-white flex flex-col overflow-hidden font-sans">
      {/* Top Progress Bar */}
      <Box className="fixed top-0 left-0 w-full flex gap-1 p-2 z-50">
        {steps.map((_, idx) => <Box key={idx} className="h-1 flex-1 rounded-full bg-gray-100 overflow-hidden">
            <Box className="h-full bg-[#843D9B]" />
          </Box>)}
      </Box>

      {/* Main Content */}
      <Box className="flex-1 relative flex flex-col">
        <React.Fragment>
          <Box key={currentStep} className="flex-1 flex flex-col">
            {/* Image Section */}
            <Box className="relative h-[45vh] md:h-[55vh] w-full shrink-0 overflow-hidden bg-gray-100">
              <Img src={steps[currentStep].image} alt={steps[currentStep].title} className="w-full h-full object-cover" />
              <Box className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
              
              {/* Skip Button */}
              {currentStep < steps.length - 1 && <Btn onPress={handleSkip} className="absolute top-8 right-6 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-bold border border-white/30 shadow-sm">
                  Skip
                </Btn>}
              
              {/* Logo Overlay */}
              <Box className="absolute top-8 left-6">
                <Box className="flex items-center gap-2">
                    <Box className="w-8 h-8 bg-[#1B263B] rounded-lg flex items-center justify-center overflow-hidden">
                        <Img src={logos.tailor} alt={appName} className="w-6 h-6 object-contain" />
                    </Box>
                    <Txt className="text-white font-black text-xl tracking-tight drop-shadow-md">{appName}</Txt>
                </Box>
              </Box>
            </Box>

            {/* Content Section */}
            <Box className="flex-1 bg-white px-6 pt-6 pb-4 flex flex-col items-center text-center justify-center">
              <Box className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-[#843D9B]/10 text-[#843D9B] flex items-center justify-center mb-4 shadow-sm">
                {steps[currentStep].icon}
              </Box>

              <Txt className="text-3xl md:text-4xl font-black text-[#1B263B] mb-3 tracking-tight leading-tight">
                {steps[currentStep].title}
              </Txt>

              <Txt className="text-gray-500 text-lg leading-relaxed max-w-xs">
                {steps[currentStep].description}
              </Txt>
            </Box>
          </Box>
        </React.Fragment>

        {/* Navigation Buttons */}
        <Box className="px-6 pb-8 pt-4 bg-white w-full z-10 shrink-0">
          <Btn onPress={handleNext} className={`w-full py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 shadow-2xl transition-all ${currentStep === steps.length - 1 ? "bg-[#1B263B] text-white shadow-[#1B263B]/30" : "bg-[#843D9B] text-white shadow-[#843D9B]/30"}`}>
            {currentStep === steps.length - 1 ? <>Start Partner Journey <I icon={ArrowRight} className="w-6 h-6" /></> : <>Continue <I icon={ArrowRight} className="w-6 h-6" /></>}
          </Btn>
          
          {/* Step Indicators (Dots) */}
          <Box className="flex justify-center gap-2 mt-6">
            {steps.map((_, idx) => <Box key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? "w-8 bg-[#843D9B]" : "w-2 bg-gray-200"}`} />)}
          </Box>
        </Box>
      </Box>
    </Box></Screen>;
};
export default PartnerLanding;
