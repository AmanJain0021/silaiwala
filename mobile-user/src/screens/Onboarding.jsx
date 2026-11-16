// Port of modules/customer/pages/Onboarding.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { ArrowRight, Scissors, Ruler, Sparkles } from 'lucide-react-native';
import { useNavigate } from '../lib/nav';
import useBrandingStore from '../store/brandingStore';
import Screen from '../components/common/Screen';
import { Box, Txt, Btn, Img, I } from '../components/ui/primitives';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const appName = useBrandingStore((state) => state.appName);

  const steps = [
    { title: 'Handcrafted with Care', description: 'Experience the legacy of family tailoring and handmade precision.', image: '/F0221177-Man_sewing_suit_by_hand_in_family_tailor_business.jpg', icon: Sparkles },
    { title: 'Premium Tailoring', description: 'Experience the art of custom tailoring from the comfort of your home.', image: '/src/8e60854ad14bc34cafe59b8d14c4bc76.jpg', icon: Scissors },
    { title: 'Perfect Fit, Always', description: 'Our expert tailors ensure every stitch is made to your exact measurements.', image: '/47b2d585cfdbab4f494276a8665dea99.jpg', icon: Ruler },
    { title: 'Master Your Style', description: `Join ${appName} today and redefine your wardrobe with personalized style.`, image: '/src/aunty silai.jpg', icon: Scissors },
  ];

  // step transition: fade + slide (web AnimatePresence x: 50 -> 0)
  const anim = useRef(new Animated.Value(1)).current;
  const imgScale = useRef(new Animated.Value(1.1)).current;
  useEffect(() => {
    anim.setValue(0);
    imgScale.setValue(1.1);
    Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.timing(imgScale, { toValue: 1, duration: 5000, useNativeDriver: true }).start();
  }, [currentStep, anim, imgScale]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
    else navigate('/user/login');
  };
  const handleSkip = () => navigate('/user/login');
  const step = steps[currentStep];

  return (
    <Screen className="bg-white" top={false}>
      <Box className="flex-1 bg-white flex flex-col overflow-hidden font-sans relative">
        {/* Top Progress Bar */}
        <Box className="absolute top-0 left-0 w-full flex gap-1 p-2 z-50" style={{ paddingTop: 36 }}>
          {steps.map((_, idx) => (
            <Box key={idx} className="h-1 flex-1 rounded-full bg-gray-300/50 overflow-hidden">
              <Box className="h-full bg-[#843D9B]" style={{ width: idx <= currentStep ? '100%' : '0%' }} />
            </Box>
          ))}
        </Box>

        <Box className="flex-1 flex flex-col min-h-0">
          <Animated.View style={{ flex: 1, opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }}>
            {/* Image Section */}
            <Box className="relative h-[45%] shrink-0 w-full overflow-hidden bg-gray-100">
              <Animated.View style={{ flex: 1, transform: [{ scale: imgScale }] }}>
                <Img src={step.image} alt={step.title} className="w-full h-full object-cover" />
              </Animated.View>
              <Box className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              {currentStep < steps.length - 1 && (
                <Btn onPress={handleSkip} className="absolute top-12 right-4 px-4 py-1.5 bg-black/20 rounded-full text-white text-xs font-bold border border-white/30 shadow-sm z-10">
                  Skip
                </Btn>
              )}
            </Box>

            {/* Content Section */}
            <Box className="flex-1 bg-white px-5 py-4 flex flex-col items-center justify-center text-center min-h-0 z-10 relative">
              <Box className="w-12 h-12 rounded-2xl bg-[#843D9B]/10 flex items-center justify-center mb-4 shadow-sm shrink-0">
                <I icon={step.icon} size={24} color="#843D9B" />
              </Box>
              <Txt className="text-2xl font-bold text-[#1A1A1A] mb-2 tracking-tight">{step.title}</Txt>
              <Txt className="text-gray-500 text-sm leading-relaxed max-w-[280px]">{step.description}</Txt>
            </Box>
          </Animated.View>

          {/* Static Navigation Buttons */}
          <Box className="px-5 py-4 bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] border-t border-gray-50 z-20">
            <Btn onPress={handleNext} className="w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#843D9B]/20 bg-[#843D9B] text-white">
              {currentStep === steps.length - 1 ? (
                <>
                  <Txt>Get Started</Txt>
                  <I icon={Sparkles} size={20} />
                </>
              ) : (
                <>
                  <Txt>Continue</Txt>
                  <I icon={ArrowRight} size={20} />
                </>
              )}
            </Btn>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {steps.map((_, idx) => (
                <Box key={idx} className={`h-1.5 rounded-full ${idx === currentStep ? 'w-6 bg-[#843D9B]' : 'w-1.5 bg-gray-200'}`} />
              ))}
            </View>
          </Box>
        </Box>
      </Box>
    </Screen>
  );
};

export default Onboarding;
