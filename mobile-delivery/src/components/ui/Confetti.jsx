// canvas-confetti replacement: particles shot from the left/right edges (same colours, ~3 s).
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1'];

export default function Confetti({ count = 60, duration = 3000 }) {
  const { width: W, height: H } = Dimensions.get('window');
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => {
    const left = i % 2 === 0;
    return {
      left,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * (duration - 1200),
      dx: (left ? 1 : -1) * (W * (0.3 + Math.random() * 0.5)),
      peak: H * (0.15 + Math.random() * 0.3),
      fall: H * (0.25 + Math.random() * 0.35),
      rot: (Math.random() * 720 - 360),
      size: 6 + Math.random() * 5,
      v: new Animated.Value(0),
    };
  }), [count, duration, W, H]);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    particles.forEach((p) => {
      Animated.timing(p.v, { toValue: 1, duration: 1400, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  }, [particles]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: H * 0.5,
            left: p.left ? 0 : W - p.size,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              { translateY: p.v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, -p.peak, p.fall - p.peak] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
