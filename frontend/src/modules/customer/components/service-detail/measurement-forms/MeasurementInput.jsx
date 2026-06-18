import React from 'react';
import { cn } from '../../../../../utils/cn';

const MeasurementInput = ({ label, value, onChange, placeholder, min, max, error, className }) => {
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <label className="text-[9px] font-black text-[#843D9B] uppercase tracking-wider ml-1 min-h-[2.6rem] flex flex-col justify-end pb-1.5 leading-[1.1]">
                <span className="line-clamp-2 mb-0.5">{label}</span>
                <span className="text-[8px] text-indigo-300 font-black lowercase tracking-widest">(in)</span>
            </label>
            <div className="relative">
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    className={cn(
                        "w-full bg-white border rounded-xl px-3 py-3 text-sm font-bold text-[#843D9B] outline-none transition-all placeholder:text-gray-300 shadow-sm",
                        error
                            ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                            : "border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/5"
                    )}
                />
            </div>
            {error && <span className="text-[10px] text-error ml-1">{error}</span>}
        </div>
    );
};

export default MeasurementInput;
