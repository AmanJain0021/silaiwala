import React from 'react';
import { ShieldCheck, Truck, Zap } from 'lucide-react';

const WhyChooseUs = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white rounded-2xl shadow-sm border border-gray-100 my-4 transition-all duration-300">
            <div className="flex justify-between text-center">
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shadow-sm transition-transform group-hover:scale-110">
                        <ShieldCheck size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Verified</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-primary shadow-sm transition-transform group-hover:scale-110">
                        <Truck size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Free Pickup</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shadow-sm transition-transform group-hover:scale-110">
                        <Zap size={20} fill="currentColor" strokeWidth={0} />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Express</span>
                </div>
            </div>
        </div>
    );
};

export default WhyChooseUs;
