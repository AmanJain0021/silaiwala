import React from 'react';
import { UserCheck, Award, Clock, ShieldCheck } from 'lucide-react';

const WhyChooseUs = () => {
    return (
        <div className="px-4 md:px-6 lg:px-8 py-4 mb-4">
            <div className="relative flex items-center justify-center mb-6 px-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-dashed border-gray-300"></div>
                </div>
                <div className="relative bg-[#F7F8FC] px-4">
                    <h2 className="text-[11px] sm:text-[13px] font-bold text-[#843D9B] uppercase tracking-[0.3em] whitespace-nowrap">Why Choose Sewzella?</h2>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center text-center gap-1">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <UserCheck size={24} className="text-[#F59E0B]" />
                    </div>
                    <span className="text-[9px] font-black text-gray-900 leading-tight">Expert Tailors</span>
                    <span className="text-[7px] text-gray-400 font-bold leading-tight">Professionals with years of experience</span>
                </div>
                
                <div className="flex flex-col items-center text-center gap-1">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Award size={24} className="text-[#EC4899]" />
                    </div>
                    <span className="text-[9px] font-black text-gray-900 leading-tight">Premium Quality</span>
                    <span className="text-[7px] text-gray-400 font-bold leading-tight">Finest fabrics & stitching quality</span>
                </div>
                
                <div className="flex flex-col items-center text-center gap-1">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Clock size={24} className="text-[#10B981]" />
                    </div>
                    <span className="text-[9px] font-black text-gray-900 leading-tight">On-time Delivery</span>
                    <span className="text-[7px] text-gray-400 font-bold leading-tight">Always on time, every time</span>
                </div>
                
                <div className="flex flex-col items-center text-center gap-1">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <ShieldCheck size={24} className="text-[#3B82F6]" />
                    </div>
                    <span className="text-[9px] font-black text-gray-900 leading-tight">Secure Payments</span>
                    <span className="text-[7px] text-gray-400 font-bold leading-tight">100% safe & secure payments</span>
                </div>
            </div>
        </div>
    );
};

export default WhyChooseUs;
