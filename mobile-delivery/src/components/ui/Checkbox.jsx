// <input type="checkbox"> replacement: a 16px rounded box in the brand colour (web: accent-[#843D9B]).
import React from 'react';
import { Check } from 'lucide-react-native';
import { Btn, I } from './primitives';

export default function Checkbox({ checked, onChange, disabled, color = '#843D9B', size = 16, className = '' }) {
  return (
    <Btn
      onPress={() => onChange?.(!checked)}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked, disabled: !!disabled }}
      className={`items-center justify-center rounded-[5px] border ${className}`}
      style={{ width: size, height: size, backgroundColor: checked ? color : '#fff', borderColor: checked ? color : '#9ca3af' }}
    >
      {checked ? <I icon={Check} size={size - 4} strokeWidth={3} color="#fff" /> : null}
    </Btn>
  );
}
