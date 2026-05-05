import React from 'react';
import { cn } from '../../../../../utils/cn';

const MeasurementInput = ({ label, value, onChange, placeholder, min, max, error, className }) => {
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <label className="text-xs font-medium text-gray-700 ml-1">
                {label} <span className="text-gray-400 font-normal">(in)</span>
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
                        "w-full bg-white border rounded-xl px-3 py-2.5 text-sm outline-none transition-all placeholder:text-gray-300",
                        error
                            ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                            : "border-gray-200 focus:border-primary focus:ring-1 focus:ring-[#e6f4f1]"
                    )}
                />
            </div>
            {error && <span className="text-[10px] text-error ml-1">{error}</span>}
        </div>
    );
};

export default MeasurementInput;
