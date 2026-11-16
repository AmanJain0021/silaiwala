// Port of components/ui/Input.jsx — keeps the web API (onChange receives { target: { value } }).
import React from 'react';
import { Input as BaseInput } from './primitives';

const BASE = 'h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 placeholder:text-gray-400 shadow-sm';
const KB = { email: 'email-address', tel: 'phone-pad', number: 'numeric' };

const Input = React.forwardRef(({ className = '', type, onChange, value, disabled, ...props }, ref) => (
  <BaseInput
    ref={ref}
    className={`${BASE} ${disabled ? 'opacity-50' : ''} ${className}`}
    keyboardType={KB[type]}
    secureTextEntry={type === 'password'}
    editable={!disabled}
    value={value == null ? value : String(value)}
    onChangeText={(v) => onChange?.({ target: { value: v } })}
    {...props}
  />
));
Input.displayName = 'Input';
export { Input };
export default Input;
