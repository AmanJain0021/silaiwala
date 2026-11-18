/*
 * Modal primitives replacing the web's fixed-position overlays (framer-motion sheets/dialogs).
 * Android back closes the modal first (onRequestClose).
 *   <Sheet visible onClose>  bottom sheet sliding up (y: 100% -> 0)
 *   <Dialog visible onClose> centered card (scale/opacity)
 */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Animated, Pressable, View, KeyboardAvoidingView, Platform, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parse } from '../../lib/tw';

const H = Dimensions.get('window').height;

function useMounted(visible, anim, duration = 250) {
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  return mounted;
}

export function Sheet({ visible, onClose, children, className = 'bg-white rounded-t-[2rem]', backdropClassName = 'bg-black/60', style, avoidKeyboard = true, dismissable = true }) {
  const anim = useRef(new Animated.Value(0)).current;
  const mounted = useMounted(visible, anim, 300);
  const insets = useSafeAreaInsets();
  if (!mounted) return null;
  const bd = parse(backdropClassName).view.backgroundColor || 'rgba(0,0,0,0.6)';
  const sheet = parse(className).view;
  const Wrapper = avoidKeyboard ? KeyboardAvoidingView : View;
  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={() => dismissable && onClose?.()}>
      <Wrapper style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bd, opacity: anim }]}>
          <Pressable style={{ flex: 1 }} onPress={() => dismissable && onClose?.()} />
        </Animated.View>
        <Animated.View
          style={[{ maxHeight: H - insets.top, paddingBottom: insets.bottom, overflow: 'hidden' }, sheet, style, {
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [H, 0] }) }],
          }]}
        >
          {children}
        </Animated.View>
      </Wrapper>
    </Modal>
  );
}

export function Dialog({ visible, onClose, children, className = 'bg-white rounded-3xl w-full max-w-sm', backdropClassName = 'bg-black/60', containerClassName = 'p-4', dismissable = true }) {
  const anim = useRef(new Animated.Value(0)).current;
  const mounted = useMounted(visible, anim, 200);
  const insets = useSafeAreaInsets();
  if (!mounted) return null;
  const bd = parse(backdropClassName).view.backgroundColor || 'rgba(0,0,0,0.6)';
  const card = parse(className).view;
  const pad = parse(containerClassName).view;
  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={() => dismissable && onClose?.()}>
      <KeyboardAvoidingView style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top, paddingBottom: insets.bottom }, pad]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bd, opacity: anim }]}>
          <Pressable style={{ flex: 1 }} onPress={() => dismissable && onClose?.()} />
        </Animated.View>
        <Animated.View style={[{ maxHeight: '100%' }, card, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Full-screen overlay page (web: fixed inset-0 z-[100] bg-white). Back button closes it. */
export function FullScreenModal({ visible, onClose, children, className = 'bg-white', animation = 'slide' }) {
  const insets = useSafeAreaInsets();
  const bg = parse(className).view.backgroundColor || '#fff';
  return (
    <Modal visible={!!visible} onRequestClose={onClose} animationType={animation} statusBarTranslucent navigationBarTranslucent transparent={false}>
      <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>{children}</View>
    </Modal>
  );
}

/** Side drawer (web: fixed inset-y-0 right-0 translate-x-full -> 0). */
export function Drawer({ visible, onClose, children, side = 'right', className = 'bg-white w-full max-w-sm', backdropClassName = 'bg-black/50' }) {
  const anim = useRef(new Animated.Value(0)).current;
  const mounted = useMounted(visible, anim, 300);
  const insets = useSafeAreaInsets();
  if (!mounted) return null;
  const W = Dimensions.get('window').width;
  const bd = parse(backdropClassName).view.backgroundColor || 'rgba(0,0,0,0.5)';
  const panel = parse(className).view;
  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: side === 'right' ? 'row-reverse' : 'row' }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bd, opacity: anim }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[{ height: '100%', paddingTop: insets.top, paddingBottom: insets.bottom }, panel, {
          transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [side === 'right' ? W : -W, 0] }) }],
        }]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
