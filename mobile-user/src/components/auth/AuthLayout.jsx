// Port of frontend/src/layouts/AuthLayout.jsx (customer variant: full-page clean layout + Skip)
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Screen from '../common/Screen';
import { Box, Btn, Txt, I, Scroll } from '../ui/primitives';

export default function AuthLayout({ children }) {
  const router = useRouter();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [anim]);
  return (
    <Screen className="bg-white">
      <Box className="flex-1 w-full bg-white relative font-['Plus_Jakarta_Sans',sans-serif]">
        <Box className="absolute top-4 right-4 z-[100]">
          <Btn
            onPress={() => router.replace('/user')}
            className="px-4 py-2 rounded-full bg-[#F4EFFF] text-[#843D9B] text-xs font-black flex items-center gap-1.5 shadow-md border border-[#E9DFFE]"
          >
            <Txt>Skip</Txt>
            <I icon={ChevronRight} size={16} strokeWidth={2.5} />
          </Btn>
        </Box>
        <Scroll className="flex-1" contentClassName="px-4 py-6 pt-5 pb-5" contentContainerStyle={{ flexGrow: 1 }}>
          <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}>
            <Box className="w-full max-w-[400px] mx-auto flex flex-col items-center py-4">{children}</Box>
          </Animated.View>
        </Scroll>
      </Box>
    </Screen>
  );
}
