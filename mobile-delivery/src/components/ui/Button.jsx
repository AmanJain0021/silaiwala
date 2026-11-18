// Port of components/ui/Button.jsx
import React from 'react';
import { Btn } from './primitives';

const base = 'inline-flex flex-row items-center justify-center rounded-md text-sm font-medium';
const variants = {
  primary: 'bg-[#843D9B] text-white shadow-sm',
  secondary: 'bg-indigo-50 text-[#843D9B]',
  outline: 'border border-[#843D9B]/20',
  ghost: '',
  link: 'text-[#843D9B] underline',
};
const sizes = { sm: 'h-9 px-3', md: 'h-10 px-4 py-2', lg: 'h-11 px-8', icon: 'h-10 w-10' };

const Button = React.forwardRef(({ className = '', variant = 'primary', size = 'md', children, onClick, onPress, disabled, ...props }, ref) => (
  <Btn ref={ref} disabled={disabled} onPress={onPress || onClick} className={`${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className}`} {...props}>
    {children}
  </Btn>
));
Button.displayName = 'Button';
export { Button };
export default Button;
