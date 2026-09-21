import React from 'react';
import { ArrowRight } from 'lucide-react';

const SaveOutlineIcon = ({ className = "w-4 h-4 text-[#6C2E9C]" }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const BottomActions = ({ onSaveDraft, onSaveAndContinue, loading = false, saveDraftLoading = false }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 md:static bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] md:shadow-none md:border-0 md:p-0 md:bg-transparent">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
                {/* Left: Save Draft */}
                <button
                    type="button"
                    onClick={onSaveDraft}
                    disabled={saveDraftLoading || loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-[#581C87] text-[#581C87] hover:bg-purple-50/60 font-bold text-sm py-3.5 px-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-sm"
                >
                    <SaveOutlineIcon className="w-4.5 h-4.5 text-[#581C87]" />
                    <span>{saveDraftLoading ? 'Saving...' : 'Save Draft'}</span>
                </button>

                {/* Right: Save & Continue → */}
                <button
                    type="button"
                    onClick={onSaveAndContinue}
                    disabled={loading}
                    className="flex-[1.35] flex items-center justify-center gap-2 bg-[#4A154B] hover:bg-[#3B0F3C] text-white font-bold text-sm py-3.5 px-4 rounded-2xl shadow-lg shadow-[#4A154B]/25 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                    <span>{loading ? 'Processing...' : 'Save & Continue'}</span>
                    <ArrowRight size={18} strokeWidth={2.4} />
                </button>
            </div>
        </div>
    );
};

export default BottomActions;
