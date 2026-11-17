// Port of components/Common/LocationSplashScreen.jsx (customer path: locate, reverse geocode, save to locationStore)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentPosition } from '../../lib/location';
import { reverseGeocode } from '../../utils/reverseGeocode';
import useLocationStore from '../../store/locationStore';
import { Box, Txt, Btn, I } from '../ui/primitives';

const Dot = ({ delay }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(450 - delay),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] }} />;
};

const LocationSplashScreen = ({ onComplete }) => {
  const [status, setStatus] = useState('finding');
  const [errorMsg, setErrorMsg] = useState('');
  const isMounted = useRef(true);
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const getLocation = useCallback(async () => {
    try {
      const position = await getCurrentPosition({ timeout: 8000 });
      if (!isMounted.current) return;
      const { latitude, longitude } = position.coords;
      let address = 'Current Location';
      try {
        const geoResult = await reverseGeocode(latitude, longitude);
        if (geoResult?.formattedAddress) address = geoResult.formattedAddress;
      } catch (_) { /* keep default */ }
      useLocationStore.getState().setLocation(address, latitude, longitude);
      setStatus('success');
      setTimeout(() => { if (isMounted.current && onComplete) onComplete(); }, 500);
    } catch (err) {
      if (!isMounted.current) return;
      setStatus('error');
      setErrorMsg(err?.code === 'timeout' ? 'Location request timed out. Please check your location permissions.' : 'Location permission denied or unavailable.');
    }
  }, [onComplete]);

  useEffect(() => {
    isMounted.current = true;
    const timer = setTimeout(getLocation, 500);
    return () => { isMounted.current = false; clearTimeout(timer); };
  }, [getLocation]);

  const handleRetry = () => {
    setStatus('finding');
    setTimeout(getLocation, 500);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <Box className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#843D9B] to-[#1a1b41] overflow-hidden" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Box className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <Box className="absolute bottom-0 left-0 w-80 h-80 bg-[#E04D79]/10 rounded-full blur-3xl" />
        <Box className="relative z-10 flex flex-col items-center justify-center p-8 max-w-sm w-full text-center">
          {status === 'finding' && (
            <Box className="flex flex-col items-center">
              <Box className="relative mb-8">
                <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', opacity: pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0, 0.5] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.5, 1] }) }] }} />
                <Box className="w-20 h-20 bg-white/10 rounded-full border border-white/20 flex items-center justify-center relative z-10 shadow-2xl">
                  <I icon={Navigation} size={32} color="#fff" />
                </Box>
              </Box>
              <Txt className="text-2xl font-black text-white mb-2 tracking-tight">Locating You</Txt>
              <Txt className="text-indigo-200 text-sm font-medium mb-8">We need your location to find the best tailors and assign deliveries accurately.</Txt>
              <Box className="flex gap-2">
                <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
              </Box>
              <Btn onPress={() => onComplete && onComplete()} className="mt-8 text-white/50 text-xs font-bold underline">Skip & Continue</Btn>
            </Box>
          )}
          {status === 'success' && (
            <Box className="flex flex-col items-center">
              <Box className="w-20 h-20 bg-emerald-500/20 rounded-full border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <I icon={MapPin} size={36} color="#34d399" />
              </Box>
              <Txt className="text-2xl font-black text-white mb-2 tracking-tight">Location Saved</Txt>
              <Txt className="text-emerald-200 text-sm font-medium">Taking you to your dashboard...</Txt>
            </Box>
          )}
          {status === 'error' && (
            <Box className="flex flex-col items-center w-full bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl">
              <Box className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                <I icon={MapPin} size={28} color="#f87171" />
              </Box>
              <Txt className="text-xl font-black text-white mb-2 tracking-tight text-center">Enable Location Services</Txt>
              <Txt className="text-indigo-200 text-xs font-medium mb-6 leading-relaxed text-center">
                {errorMsg || "We cannot detect your location. Please turn on your device's GPS and allow location permissions."}
              </Txt>
              <Box className="w-full space-y-3">
                <Btn onPress={handleRetry} className="w-full py-3.5 bg-white text-[#843D9B] rounded-full font-black text-xs uppercase tracking-widest shadow-lg">I've Enabled It, Try Again</Btn>
                <Btn onPress={() => onComplete && onComplete()} className="w-full py-3.5 bg-transparent border border-white/20 text-white rounded-full font-black text-xs uppercase tracking-widest">Continue Without Location</Btn>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </View>
  );
};

export default LocationSplashScreen;
