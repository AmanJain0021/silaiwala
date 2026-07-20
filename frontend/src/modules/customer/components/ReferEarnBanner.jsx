import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReferEarnBanner = () => {
    const navigate = useNavigate();

    return (
        <div className="px-4 md:px-6 lg:px-8 py-2 mb-6 cursor-pointer" onClick={() => navigate('/user/refer')}>
            <div className="bg-[#843D9B] rounded-2xl p-4 pl-2 flex items-center shadow-sm relative overflow-hidden">
                {/* Gift Box Image */}
                <div className="w-20 h-20 shrink-0 relative z-10 mr-2 -my-2">
                    <img 
                        src="/assets/images/refer_earn_box.png" 
                        alt="Refer & Earn" 
                        className="w-full h-full object-contain mix-blend-screen"
                    />
                </div>

                {/* Text Content */}
                <div className="flex-1 relative z-10">
                    <h3 className="text-white font-black text-[13px] tracking-tight">Refer & Earn</h3>
                    <p className="text-white/90 text-[9px] font-bold mt-0.5 leading-tight pr-2">
                    Refer your friends — earn loyalty points when they pay their first advance
                    </p>
                </div>

                {/* CTA Button */}
                <button className="shrink-0 bg-white text-[#843D9B] px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-gray-50 transition-colors relative z-10 shadow-sm">
                    Refer Now <ArrowRight size={10} />
                </button>
                
                {/* Background Decoration */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -z-0 transform translate-x-1/2 -translate-y-1/2"></div>
            </div>
        </div>
    );
};

export default ReferEarnBanner;
