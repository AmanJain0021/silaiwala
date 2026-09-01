import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import mannequinGraphic from '../../../assets/images/ChatGPT Image Aug 25, 2026, 12_08_10 PM.png';

const AIMeasurementCard = () => {
    const navigate = useNavigate();

    return (
        <div className="px-4 md:px-6 lg:px-8 mt-2 mb-3">
            <div className="bg-gradient-to-r from-[#F6EFFD] via-[#F1E4FA] to-[#EAD5F7] rounded-2xl sm:rounded-3xl border border-purple-100/80 p-3.5 sm:p-4 shadow-sm relative overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-300/30 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute left-1/2 top-0 w-20 h-20 bg-white/40 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between gap-3 relative z-10">
                    {/* Left text content */}
                    <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="text-gray-900 font-black text-xs sm:text-sm tracking-tight uppercase leading-none">
                                AI MEASUREMENT
                            </h3>
                            <span className="bg-pink-100 text-pink-600 text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                NEW
                            </span>
                        </div>
                        <p className="text-gray-600 text-[10px] sm:text-xs font-medium leading-tight mt-1 max-w-[200px] sm:max-w-xs">
                            Get accurate body measurements in 30 seconds. No measuring tape required!
                        </p>
                        <button 
                            onClick={() => toast('Coming soon!')}
                            className="mt-2.5 bg-[#843D9B] hover:bg-[#682498] text-white px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-md shadow-[#843D9B]/25 active:scale-95 transition-all uppercase tracking-wide cursor-pointer"
                        >
                            TRY NOW <ArrowRight size={11} />
                        </button>
                    </div>

                    {/* Right mannequin illustration & graphic using requested asset */}
                    <div className="relative shrink-0 flex items-center justify-center w-32 sm:w-40 h-32 sm:h-36 -my-2 -mr-1">
                        <img 
                            src={mannequinGraphic} 
                            alt="AI Measurement Mannequin" 
                            className="w-full h-full object-contain relative z-10 drop-shadow-md scale-125 translate-x-1"
                        />
                    </div>
                </div>

                {/* Bottom carousel pagination dots */}
                <div className="flex justify-center items-center gap-1 mt-2 relative z-10">
                    <div className="w-4 h-1 bg-[#843D9B] rounded-full shadow-sm" />
                    <div className="w-1 h-1 bg-purple-300 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default AIMeasurementCard;
