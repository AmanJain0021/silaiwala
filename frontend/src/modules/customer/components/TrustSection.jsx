import React from 'react';
import { ShieldCheck, Star, Truck } from 'lucide-react';

const TrustSection = () => {
    return (
        <div className="px-4 md:px-6 lg:px-8 py-2 mb-4">
            <div className="flex gap-2">
                <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-[#843D9B] flex items-center justify-center shrink-0">
                        <ShieldCheck size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-900 leading-tight">500+</p>
                        <p className="text-[8px] text-gray-500 font-bold leading-tight">Verified Tailors</p>
                    </div>
                </div>
                
                <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-[#843D9B] flex items-center justify-center shrink-0">
                        <Star size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-900 leading-tight">10,000+</p>
                        <p className="text-[8px] text-gray-500 font-bold leading-tight">Orders Completed</p>
                    </div>
                </div>

                <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-[#843D9B] flex items-center justify-center shrink-0">
                        <Truck size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-900 leading-tight">Doorstep</p>
                        <p className="text-[8px] text-gray-500 font-bold leading-tight">Pickup & Delivery</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrustSection;
