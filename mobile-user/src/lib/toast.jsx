/*
 * react-hot-toast compatible API (toast(), toast.success/error/loading/dismiss/promise)
 * rendering the web's CustomToastCard. Like the web, only one toast is visible
 * at a time and identical toasts within 3 s are de-duplicated (toastNotifier.jsx).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { create } from 'zustand';
import { Box, Txt, Btn, I } from '../components/ui/primitives';

const useToastStore = create((set) => ({ current: null, set: (current) => set({ current }) }));
const recent = new Map();
let counter = 0;
let timer = null;

const keyOf = (message, opts) => {
  if (opts?.id) return String(opts.id);
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object' && !React.isValidElement(message)) return message.title || message.message || '';
  return '';
};

function show(type, message, opts = {}) {
  const key = keyOf(message, opts);
  const now = Date.now();
  const cur = useToastStore.getState().current;
  if (key && recent.has(key) && now - recent.get(key) < 3000 && type !== 'loading' && !(cur && cur.type === 'loading' && cur.id === opts.id)) {
    return opts.id || key;
  }
  if (key) recent.set(key, now);
  const id = opts.id || `t${++counter}`;
  const duration = opts.duration ?? (type === 'error' ? 4000 : type === 'loading' ? Infinity : 3000);
  useToastStore.getState().set({ id, type, message, icon: opts.icon, ts: now });
  clearTimeout(timer);
  if (duration !== Infinity) timer = setTimeout(() => dismiss(id), duration);
  return id;
}

function dismiss(id) {
  const cur = useToastStore.getState().current;
  if (!cur) return;
  if (id === undefined || cur.id === id) {
    clearTimeout(timer);
    useToastStore.getState().set(null);
  }
}

const toast = (message, opts) => show('blank', message, opts);
toast.success = (message, opts) => show('success', message, opts);
toast.error = (message, opts) => show('error', message, opts);
toast.loading = (message, opts) => show('loading', message, opts);
toast.custom = (message, opts) => show('blank', message, opts);
toast.dismiss = dismiss;
toast.remove = dismiss;
toast.promise = async (promise, msgs = {}, opts = {}) => {
  const id = show('loading', msgs.loading || 'Loading...', opts);
  try {
    const res = await promise;
    show('success', typeof msgs.success === 'function' ? msgs.success(res) : msgs.success, { ...opts, id });
    return res;
  } catch (e) {
    show('error', typeof msgs.error === 'function' ? msgs.error(e) : msgs.error, { ...opts, id });
    throw e;
  }
};

function splitMessage(message, isError) {
  let title = '';
  let body = '';
  if (message && typeof message === 'object' && !React.isValidElement(message)) {
    title = message.title || (isError ? 'Error' : 'Successful');
    body = message.body || message.message || '';
  } else if (typeof message === 'string') {
    if (message.includes('\n')) {
      const parts = message.split('\n');
      title = parts[0];
      body = parts.slice(1).join(' ');
    } else if (message.length < 32 && !message.endsWith('.')) {
      title = message;
    } else {
      title = isError ? 'Error' : 'Action Successful';
      body = message;
    }
  } else {
    title = isError ? 'Error' : 'Successful';
  }
  return { title, body };
}

export function Toaster() {
  const current = useToastStore((s) => s.current);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(current);

  useEffect(() => {
    if (current) {
      setShown(current);
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else if (shown) {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setShown(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (!shown) return null;
  const isError = shown.type === 'error';
  const { title, body } = splitMessage(shown.message, isError);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, zIndex: 99999, alignItems: 'flex-end' }}>
      <Animated.View style={{ opacity: anim, transform: [{ translateY }, { scale }], width: '100%', maxWidth: 420 }}>
        <Box
          className={`relative overflow-hidden bg-white rounded-[20px] shadow-2xl shadow-[#843D9B]/15 border border-[#E9DFFE] flex items-center p-3.5 gap-3.5 w-full border-l-[6px] my-1 font-['Plus_Jakarta_Sans',sans-serif] ${isError ? 'border-l-rose-500' : 'border-l-[#843D9B]'}`}
          style={{ elevation: 8 }}
        >
          <Box className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isError ? 'bg-rose-100' : 'bg-[#F4EFFF]'}`}>
            {shown.type === 'loading' ? (
              <Spinner />
            ) : isError ? (
              <Txt className="font-extrabold text-xl leading-none text-rose-600 font-sans">!</Txt>
            ) : shown.icon && typeof shown.icon === 'string' ? (
              <Txt className="text-lg">{shown.icon}</Txt>
            ) : (
              <Box className="w-6 h-6 rounded-full bg-[#843D9B] flex items-center justify-center">
                <I icon={Check} size={14} strokeWidth={3} color="#fff" />
              </Box>
            )}
          </Box>
          <Box className="flex-1 min-w-0 pr-1">
            <Txt className="font-bold text-sm text-[#0F172A] tracking-tight leading-snug">{title}</Txt>
            {body ? <Txt className="text-xs font-medium text-[#64748B] mt-0.5 leading-snug">{body}</Txt> : null}
          </Box>
          <Btn onPress={() => dismiss(shown.id)} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 -mr-1" accessibilityLabel="Close notification">
            <I icon={X} size={16} strokeWidth={2.2} color="#94A3B8" />
          </Btn>
        </Box>
      </Animated.View>
    </View>
  );
}

function Spinner() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 800, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [rot]);
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#843D9B', borderTopColor: 'transparent', transform: [{ rotate }] }} />;
}

export default toast;
