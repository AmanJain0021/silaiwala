// Port of measurement-forms/MeasurementInput.jsx
import React from 'react';
import { Box, Txt, Input } from '../../../ui/primitives';

const MeasurementInput = ({ label, value, onChange, placeholder, error, className = '' }) => (
  <Box className={`flex flex-col gap-1 ${className}`}>
    <Box className="ml-1 min-h-[2.6rem] flex flex-col justify-end pb-1.5">
      <Txt className="text-[9px] font-black text-[#843D9B] uppercase tracking-wider line-clamp-2 mb-0.5 leading-[1.1]">{label}</Txt>
      <Txt className="text-[8px] text-indigo-300 font-black lowercase tracking-widest">(in)</Txt>
    </Box>
    <Input keyboardType="decimal-pad" value={value ? String(value) : ''} onChangeText={onChange} placeholder={placeholder}
      className={`w-full bg-white border rounded-xl px-3 py-3 text-sm font-bold text-[#843D9B] shadow-sm placeholder:text-gray-300 ${error ? 'border-red-300' : 'border-gray-100'}`} />
    {!!error && <Txt className="text-[10px] text-red-500 ml-1">{error}</Txt>}
  </Box>
);

export default MeasurementInput;
