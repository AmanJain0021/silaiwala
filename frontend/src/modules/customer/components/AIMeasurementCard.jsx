import React from 'react';
import { ArrowRight } from 'lucide-react';

const AIMeasurementCard = () => {
    return (
        <div className="px-4 md:px-6 lg:px-8 mt-2 mb-4">
            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 relative overflow-hidden">
                {/* Image / Icon Area */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-purple-50 rounded-2xl p-1.5 sm:p-2 flex items-center justify-center relative z-10">
                    <img 
                        src="/assets/images/ai_measurement_icon.png" 
                        alt="AI Measurement" 
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full shadow-sm text-[7px] sm:text-[8px] font-black text-[#843D9B] px-1 sm:px-1.5 py-0.5 border border-purple-100 uppercase">
                        AI
                    </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 relative z-10 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                        <h3 className="text-[#843D9B] font-black text-xs sm:text-sm tracking-tight uppercase leading-none">AI Measurement</h3>
                        <span className="bg-pink-100 text-pink-600 text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5 sm:mt-0">New</span>
                    </div>
                    <p className="text-gray-500 text-[9px] sm:text-[10px] font-medium leading-tight pr-1">
                        Get accurate body measurements in 30 seconds. No measuring tape required!
                    </p>
                </div>

                {/* CTA */}
                <button className="shrink-0 bg-[#843D9B] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black flex items-center gap-1 hover:bg-[#68166d] transition-colors relative z-10 uppercase">
                    Try Now <ArrowRight size={10} className="sm:w-3 sm:h-3" />
                </button>

                {/* Background Decoration */}
                <div className="absolute right-0 top-0 w-24 sm:w-32 h-24 sm:h-32 bg-purple-50/50 rounded-full blur-2xl -z-0 transform translate-x-1/2 -translate-y-1/2"></div>
            </div>
        </div>
    );
};

export default AIMeasurementCard;
