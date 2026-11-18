// Page container: safe-area handling (status bar / gesture bar) + page background.
import React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { parse } from '../../lib/tw';
import { Box } from '../ui/primitives';

/**
 * <Screen className="bg-[#F7F8FC]" bottom={false}>…</Screen>
 * top/bottom: apply the safe-area inset as padding (bottom is off when a BottomNav is shown).
 */
export default function Screen({ className = 'bg-white', children, top = true, bottom = true, statusBar = 'dark', keyboard = true, style, statusBg }) {
  const insets = useSafeAreaInsets();
  const bg = parse(className).view.backgroundColor || '#ffffff';
  const content = (
    <Box className={`flex-1 ${className}`} style={[{ paddingTop: top ? insets.top : 0, paddingBottom: bottom ? insets.bottom : 0 }, style]}>
      {children}
    </Box>
  );
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style={statusBar} />
      {statusBg ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: parse(statusBg).view.backgroundColor, zIndex: 10 }} /> : null}
      {keyboard ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : content}
    </View>
  );
}
