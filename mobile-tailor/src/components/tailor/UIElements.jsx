// Port of modules/tailor/components/UIElements.jsx (Button, Input) — same props and look as the web.
import React from 'react';
import { Box, Btn, Txt, Input as RNInput } from '../ui/primitives';
import Spin from '../ui/Spin';

export const Button = ({ children, onClick, onPress, variant = 'primary', className = '', disabled = false, loading = false }) => {
  const baseStyles = 'w-full py-4 px-6 rounded-full font-black flex items-center justify-center gap-2 disabled:opacity-50';
  const variants = {
    primary: 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/20',
    secondary: 'bg-white text-[#843D9B] border-2 border-[#843D9B]',
    outline: 'bg-transparent text-gray-400 border-2 border-gray-100',
    ghost: 'bg-transparent text-[#843D9B]',
  };
  return (
    <Btn onPress={onPress || onClick} disabled={disabled || loading} className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}>
      {loading ? <Spin size={20} /> : children}
    </Btn>
  );
};

const KEYBOARD = { email: 'email-address', tel: 'phone-pad', number: 'numeric', url: 'url' };

// Web <input> props → TextInput: type → keyboard/secure, onChange(e) → onChangeText.
export const Input = React.forwardRef(({ label, error, onChange, onChangeText, type, className = '', ...props }, ref) => {
  const handleChange = (v) => {
    if (onChangeText) onChangeText(v);
    if (onChange) onChange({ target: { value: v, name: props.name } });
  };
  return (
    <Box className="space-y-1.5 w-full">
      {label ? <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">{label}</Txt> : null}
      <RNInput
        ref={ref}
        {...props}
        value={props.value == null ? props.value : String(props.value)}
        onChangeText={handleChange}
        keyboardType={props.keyboardType || KEYBOARD[type] || 'default'}
        secureTextEntry={props.secureTextEntry ?? type === 'password'}
        autoCapitalize={props.autoCapitalize || (type === 'email' || type === 'password' ? 'none' : 'sentences')}
        className={`w-full px-4 py-3 bg-[#F8F9FD] border-2 rounded-2xl font-medium text-sm placeholder:text-gray-300 ${error ? 'border-red-300 bg-red-50/40' : 'border-transparent'} ${className}`}
      />
      {error ? <Txt className="text-[10px] text-red-500 font-bold pl-2">{error}</Txt> : null}
    </Box>
  );
});

Input.displayName = 'Input';
