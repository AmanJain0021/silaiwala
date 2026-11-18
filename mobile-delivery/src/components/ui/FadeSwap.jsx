// Re-animates its children whenever `swapKey` changes (stand-in for AnimatePresence mode="wait" slide/fade).
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function FadeSwap({ swapKey, dx = 15, duration = 250, style, children }) {
  const v = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration, useNativeDriver: true }).start();
  }, [swapKey, v, duration]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [dx, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}
