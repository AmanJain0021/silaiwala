// <select> replacement: looks like the web field (className), opens a bottom sheet of options.
import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react-native';
import { Sheet } from './Sheet';
import { Box, Txt, Btn, I, Scroll } from './primitives';

/** options: [{ value, label, disabled? }] or strings */
export default function Select({ value, onChange, onValueChange, options = [], className = '', textClassName = '', placeholder = 'Select', title, disabled, trigger }) {
  const [open, setOpen] = useState(false);
  const emit = onChange || onValueChange; // onValueChange: react-hook-form binding from lib/rnForm
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) }));
  const current = opts.find((o) => String(o.value) === String(value));
  return (
    <>
      {trigger ? (
        <Btn disabled={disabled} onPress={() => setOpen(true)} className={className}>{trigger}</Btn>
      ) : (
        <Btn disabled={disabled} onPress={() => setOpen(true)} className={`flex flex-row items-center justify-between ${className}`}>
          <Txt className={`flex-1 text-left ${textClassName}`} numberOfLines={1}>{current ? current.label : placeholder}</Txt>
          <I icon={ChevronDown} size={14} color="#6b7280" />
        </Btn>
      )}
      <Sheet visible={open} onClose={() => setOpen(false)} className="bg-white rounded-t-3xl w-full">
        {!!title && <Txt className="text-sm font-black text-gray-900 px-5 pt-5 pb-2">{title}</Txt>}
        <Scroll style={{ maxHeight: 420 }} contentClassName="px-3 py-3">
          {opts.map((o) => {
            const sel = String(o.value) === String(value);
            return (
              <Btn key={String(o.value)} disabled={o.disabled} onPress={() => { emit?.(o.value); setOpen(false); }}
                className={`flex flex-row items-center justify-between px-4 py-3.5 rounded-xl ${sel ? 'bg-primary/5' : ''} ${o.disabled ? 'opacity-40' : ''}`}>
                <Txt className={`text-sm font-bold flex-1 text-left ${sel ? 'text-primary' : 'text-gray-800'}`}>{o.label}</Txt>
                {sel && <I icon={Check} size={16} color="#843D9B" />}
              </Btn>
            );
          })}
        </Scroll>
      </Sheet>
    </>
  );
}
