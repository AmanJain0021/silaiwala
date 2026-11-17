// <Loader2 className="animate-spin" /> equivalent
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Loader2 } from 'lucide-react-native';
import { useTextStyle } from './primitives';
import { parse } from '../../lib/tw';

export default function Spin({ size: sizeProp, color: colorProp, icon: Icon = Loader2, style, className }) {
  const p = parse(className);
  const size = sizeProp ?? p.view.width ?? 24;
  const color = colorProp || p.text.color;
  const r = useRef(new Animated.Value(0)).current;
  const text = useTextStyle();
  useEffect(() => {
    const l = Animated.loop(Animated.timing(r, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }));
    l.start();
    return () => l.stop();
  }, [r]);
  return (
    <Animated.View style={[{ width: size, height: size, transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }, style]}>
      <Icon size={size} color={color || text.color || '#843D9B'} />
    </Animated.View>
  );
}
