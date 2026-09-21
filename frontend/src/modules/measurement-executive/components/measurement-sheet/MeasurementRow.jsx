import React, { useState } from 'react';
import { Info } from 'lucide-react';

// Custom body measurement icons
const BodyPartIcon = ({ type, className = "w-4 h-4 text-[#6C2E9C]" }) => {
    switch (type) {
        case 'shoulder':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                    <path d="M4 18v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                    <circle cx="12" cy="7" r="3" />
                    <line x1="4" y1="14" x2="20" y2="14" strokeDasharray="2 2" />
                </svg>
            );
        case 'chest':
        case 'bust':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                    <path d="M6 6a6 6 0 0 1 12 0c0 4-3 8-6 10-3-2-6-6-6-10z" />
                    <line x1="4" y1="12" x2="20" y2="12" strokeDasharray="2 2" />
                </svg>
            );
        case 'waist':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                    <path d="M5 4c3 4 3 12 0 16h14c-3-4-3-12 0-16H5z" />
                    <line x1="7" y1="12" x2="17" y2="12" strokeDasharray="2 2" />
                </svg>
            );
        case 'hip':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                    <path d="M4 6h16c0 6-3 12-8 12S4 12 4 6z" />
                    <line x1="4" y1="13" x2="20" y2="13" strokeDasharray="2 2" />
                </svg>
            );
        case 'armhole':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                    <circle cx="12" cy="12" r="7" />
                    <path d="M12 5a7 7 0 0 1 7 7" strokeDasharray="2 2" />
                </svg>
            );
        case 'sleeveLength':
        case 'sleeve':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                    <path d="M6 4l6 14 6-4-6-14H6z" />
                    <line x1="6" y1="4" x2="12" y2="18" strokeDasharray="2 2" />
                </svg>
            );
        case 'kameezLength':
        case 'length':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                    <path d="M7 4h10v16H7z" />
                    <path d="M12 4v16" strokeDasharray="2 2" />
                    <path d="M10 20l2 2 2-2" />
                </svg>
            );
        case 'neckWidth':
        case 'neckDepth':
        case 'neck':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                    <path d="M8 4c0 4 2 8 4 8s4-4 4-8" />
                    <circle cx="12" cy="12" r="8" />
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
                    <circle cx="12" cy="12" r="8" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
            );
    }
};

const MeasurementRow = ({ 
    itemKey, 
    label, 
    value, 
    unit = 'in', 
    guideNumber,
    instruction,
    isHighlighted,
    onChange 
}) => {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <div 
            id={`m-row-${guideNumber || itemKey}`}
            className={`flex items-center justify-between py-2.5 px-3 rounded-2xl transition-all ${
                isHighlighted 
                    ? 'bg-purple-100/70 ring-2 ring-[#6C2E9C]/40' 
                    : 'hover:bg-purple-50/40'
            }`}
        >
            {/* Left: Icon + Label + Info */}
            <div className="flex items-center gap-2.5 min-w-0">
                {/* Purple circular icon badge */}
                <div className="w-8 h-8 rounded-full bg-[#F5EFFF] flex items-center justify-center flex-shrink-0 text-[#6C2E9C]">
                    <BodyPartIcon type={itemKey} className="w-4 h-4 text-[#6C2E9C]" />
                </div>

                {/* Name */}
                <div className="relative flex items-center gap-1.5 min-w-0">
                    <span className="text-[13px] font-medium text-gray-800 tracking-tight truncate">
                        {label}
                    </span>

                    {/* Guide Number pill if mapped */}
                    {guideNumber && (
                        <span className="w-4 h-4 rounded-full bg-[#581C87] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                            {guideNumber}
                        </span>
                    )}

                    {/* Small Info Button */}
                    <button
                        type="button"
                        onClick={() => setShowInfo(!showInfo)}
                        className="text-gray-400 hover:text-[#6C2E9C] transition-colors p-0.5 cursor-pointer flex-shrink-0"
                        title={instruction || "Measurement guide info"}
                    >
                        <Info size={13} strokeWidth={2} />
                    </button>

                    {/* Tooltip */}
                    {showInfo && (
                        <>
                            <div className="fixed inset-0 z-20" onClick={() => setShowInfo(false)} />
                            <div className="absolute left-0 top-7 w-48 p-2.5 bg-gray-900/95 text-white text-[11px] rounded-xl shadow-lg z-30 leading-snug animate-in fade-in zoom-in-95">
                                <p className="font-semibold text-purple-200 mb-0.5">{label}</p>
                                <p className="text-gray-300">{instruction || `Measure around the standard ${label.toLowerCase()} line snug against body.`}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Rounded Input Box */}
            <div className="flex items-center border border-gray-200/90 rounded-xl px-2.5 py-1.5 bg-white focus-within:border-[#6C2E9C] focus-within:ring-2 focus-within:ring-purple-100 transition-all w-28 flex-shrink-0">
                <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    value={value ?? ''}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    className="w-full text-right font-bold text-gray-900 text-sm focus:outline-none bg-transparent pr-1"
                />
                <span className="text-gray-400 text-xs font-semibold select-none flex-shrink-0">
                    {unit}
                </span>
            </div>
        </div>
    );
};

export default MeasurementRow;
